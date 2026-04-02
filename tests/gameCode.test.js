import { describe, it, expect } from 'vitest';
import { generateGameCode, codeTopeerId, peerIdToCode } from '../src/utils/gameCode.js';

describe('generateGameCode', () => {
  it('returns a 4-digit numeric string', () => {
    const code = generateGameCode();
    expect(code).toMatch(/^\d{4}$/);
    const num = Number(code);
    expect(num).toBeGreaterThanOrEqual(1000);
    expect(num).toBeLessThanOrEqual(9999);
  });

  it('generates different codes on successive calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateGameCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('codeTopeerId / peerIdToCode', () => {
  it('roundtrips correctly', () => {
    const code = generateGameCode();
    const peerId = codeTopeerId(code);
    expect(peerId).toBe('hitster-' + code);
    expect(peerIdToCode(peerId)).toBe(code);
  });

  it('handles arbitrary codes', () => {
    const code = '1234';
    expect(peerIdToCode(codeTopeerId(code))).toBe(code);
  });
});
