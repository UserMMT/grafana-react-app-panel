const TOKEN_KEY_PREFIX = 'grafana-react-app-panel:token:';

/**
 * Validates a backend base URL and returns it normalized (no query, hash or
 * trailing slash; the path is kept), or null when it is blank or unsafe.
 * Only https is accepted, plus plain http for loopback hosts (local dev):
 * the API token must never travel over cleartext to a remote host.
 */
export function normalizeBaseUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? '').trim();
  if (!value) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const allowedProtocol = url.protocol === 'https:' || (url.protocol === 'http:' && loopback);
  if (!allowedProtocol || url.username || url.password) {
    return null;
  }

  return url.origin + url.pathname.replace(/\/+$/, '');
}

export function originOf(baseUrl: string): string {
  return new URL(baseUrl).origin;
}

/**
 * The API token lives in localStorage on THIS page's origin (wherever Grafana
 * is served from), under a key scoped to the backend origin it was entered
 * for. A token entered for https://api.example.com is never looked up, and so
 * never sent, for any other origin: a dashboard whose panel options point
 * somewhere else just asks the viewer for a new token for that origin.
 *
 * Security note: pasted panel code runs in the page itself (see
 * DynamicComponentRenderer), so it can read this storage. The token is kept
 * out of panel options so it isn't written into exported dashboard JSON, but
 * treat it as a dev/trial setup, not something to hand a wide Grafana viewer
 * audience.
 */
function tokenKey(baseUrl: string): string {
  return TOKEN_KEY_PREFIX + originOf(baseUrl);
}

export function getAuthToken(baseUrl: string | null): string | null {
  if (!baseUrl) {
    return null;
  }
  try {
    return localStorage.getItem(tokenKey(baseUrl));
  } catch {
    return null;
  }
}

export function setAuthToken(baseUrl: string, token: string) {
  try {
    localStorage.setItem(tokenKey(baseUrl), token);
  } catch {
    /* ignore */
  }
}

export function hasAuthToken(baseUrl: string | null): boolean {
  return !!getAuthToken(baseUrl);
}

function describeBackendFailure(queryName: string, body: any): string {
  const detail = [body?.message, body?.error, body?.Message, body?.Error].find(
    (candidate) => typeof candidate === 'string' && candidate.trim()
  );
  return detail ? `Query '${queryName}' failed: ${detail}` : `Query '${queryName}' failed: backend reported no success`;
}

/**
 * Generic API client for backend SQL queries. Talks to a backend exposing
 * `POST {baseUrl}/CustomData/getWithFilter?Request=<queryName>` (there is no
 * Grafana backend component: plugin.json declares none).
 *
 * One instance per panel, bound to that panel's API Base URL. There is
 * deliberately no default URL: the base URL must be configured explicitly.
 */
export class BackendQueryClient {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  baseUrl: string | null;

  constructor(baseUrl?: string | null) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
  }

  setBaseUrl(url: string | null | undefined) {
    const next = normalizeBaseUrl(url);
    if (next !== this.baseUrl) {
      this.baseUrl = next;
      this.cache.clear();
    }
  }

  /**
   * Execute a named SQL query with parameters
   * @param queryName - Query identifier (e.g., 'TRESO_GET_DATE_TFJ_PREC')
   * @param params - Query parameters {DateArrete: '2024-01-15'}
   * @param cacheTime - Cache duration in ms (0 = no cache)
   */
  async executeQuery<T = any>(
    queryName: string,
    params: Record<string, any> = {},
    cacheTime: number = 0
  ): Promise<T[]> {
    const baseUrl = this.baseUrl;
    if (!baseUrl) {
      throw new Error('API Base URL is not configured (it must be an https:// URL) - set it in the panel options.');
    }

    const cacheKey = this.getCacheKey(queryName, params);

    if (cacheTime > 0) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        return cached.data as T[];
      }
    }

    const token = getAuthToken(baseUrl);
    if (!token) {
      throw new Error(`No API token stored for ${originOf(baseUrl)} - paste one in the token prompt shown in the panel.`);
    }

    // The .NET endpoint expects an array of {name, value, type}, not the
    // {DateArrete: '...'} object useBackendQuery's callers pass.
    const paramArray = Object.entries(params).map(([name, value]) => ({
      name,
      value,
      type: 'string',
    }));

    try {
      const res = await fetch(`${baseUrl}/CustomData/getWithFilter?Request=${encodeURIComponent(queryName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paramArray),
        // The bearer token is the credential: never attach Grafana's cookies, and
        // never follow a redirect to another host with the request.
        credentials: 'omit',
        redirect: 'error',
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const body = await res.json();
      if (!body?.success) {
        throw new Error(describeBackendFailure(queryName, body));
      }
      const data: T[] = body.data?.data ?? [];

      if (cacheTime > 0) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      console.error(`Query '${queryName}' failed:`, error);
      throw error;
    }
  }

  /**
   * Clear cache for a specific query or all queries
   */
  clearCache(queryName?: string) {
    if (queryName) {
      for (const [key] of this.cache) {
        if (key.startsWith(`${queryName}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  private getCacheKey(queryName: string, params: Record<string, any>): string {
    return `${queryName}:${JSON.stringify(params)}`;
  }
}

/**
 * A BackendQueryClient whose no-argument constructor targets `baseUrl`. This is
 * what panel code gets as `BackendQueryClient` from 'app-panel/api', so
 * `new BackendQueryClient()` in pasted code talks to the panel's own API Base URL.
 */
export function withDefaultBaseUrl(baseUrl: string | null | undefined): typeof BackendQueryClient {
  return class extends BackendQueryClient {
    constructor(url: string | null | undefined = baseUrl) {
      super(url);
    }
  };
}
