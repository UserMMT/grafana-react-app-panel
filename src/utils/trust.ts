/**
 * Per-browser record of which exact panel code the viewer agreed to run.
 *
 * Panel code is stored in the dashboard JSON and executes with the viewer's
 * own Grafana privileges (see DynamicComponentRenderer). Without this, an
 * editor could change a panel and have it silently run as whoever opens the
 * dashboard next. The approval is keyed by a SHA-256 of the code, so any edit
 * asks again.
 */
const KEY_PREFIX = 'grafana-react-app-panel:trusted:';

// Used when localStorage is unavailable (private mode, blocked storage) so an
// author's own save still counts for the rest of the page's lifetime.
const trustedThisSession = new Set<string>();

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

const PRIMES = (() => {
  const primes: number[] = [];
  for (let candidate = 2; primes.length < 64; candidate++) {
    if (primes.every((p) => candidate % p !== 0)) {
      primes.push(candidate);
    }
  }
  return primes;
})();
const fractionBits = (value: number) => Math.floor((value - Math.floor(value)) * 2 ** 32);
const INITIAL_HASH = PRIMES.slice(0, 8).map((p) => fractionBits(Math.sqrt(p)));
const ROUND_CONSTANTS = PRIMES.map((p) => fractionBits(Math.cbrt(p)));

/** Synchronous SHA-256 (hex) of a string's UTF-8 bytes; crypto.subtle is missing on plain-http Grafana. */
export function sha256(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor((bytes.length * 8) / 2 ** 32));
  view.setUint32(padded.length - 4, (bytes.length * 8) >>> 0);

  const state = new Uint32Array(INITIAL_HASH);
  const w = new Uint32Array(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = w[i - 16] + s0 + w[i - 7] + s1;
    }

    let [a, b, c, d, e, f, g, h] = state;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + ROUND_CONSTANTS[i] + w[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, h].forEach((value, i) => {
      state[i] += value;
    });
  }

  return Array.from(state, (word) => word.toString(16).padStart(8, '0')).join('');
}

export function isCodeTrusted(codeHash: string): boolean {
  if (trustedThisSession.has(codeHash)) {
    return true;
  }
  try {
    return localStorage.getItem(KEY_PREFIX + codeHash) === '1';
  } catch {
    return false;
  }
}

export function trustCode(codeHash: string) {
  trustedThisSession.add(codeHash);
  try {
    localStorage.setItem(KEY_PREFIX + codeHash, '1');
  } catch {
    /* kept in memory only */
  }
}
