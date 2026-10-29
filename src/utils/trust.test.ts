/**
 * @jest-environment node
 */
import { createHash } from 'crypto';
import { isCodeTrusted, sha256, trustCode } from './trust';

describe('sha256', () => {
  const reference = (input: string) => createHash('sha256').update(input, 'utf8').digest('hex');

  it.each([
    ['empty', ''],
    ['abc', 'abc'],
    ['unicode', 'héllo € 😀 世界'],
    // 55/56/63/64/65 bytes straddle the padding boundaries of a 64-byte block
    ['55 bytes', 'a'.repeat(55)],
    ['56 bytes', 'a'.repeat(56)],
    ['63 bytes', 'a'.repeat(63)],
    ['64 bytes', 'a'.repeat(64)],
    ['65 bytes', 'a'.repeat(65)],
    ['long', 'export default function App() { return null; }\n'.repeat(500)],
  ])('matches node crypto for %s', (_label, input) => {
    expect(sha256(input)).toBe(reference(input));
  });

  it('matches the published test vector for "abc"', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('code trust (no localStorage available)', () => {
  it('remembers an approval for the page lifetime, per exact code', () => {
    const approved = sha256('export default () => null;');
    const edited = sha256('export default () => null; // edited');

    expect(isCodeTrusted(approved)).toBe(false);
    trustCode(approved);
    expect(isCodeTrusted(approved)).toBe(true);
    expect(isCodeTrusted(edited)).toBe(false);
  });
});
