import { describe, it, expect } from 'vitest';
import { generateGameCode, codeTopeerId, peerIdToCode } from '../src/utils/gameCode.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const VALID_CODE_RE = new RegExp(`^[${CHARS}]{6}$`);

describe('generateGameCode', () => {
  it('returns a 6-character string using only valid characters', () => {
    const code = generateGameCode();
    expect(code).toHaveLength(6);
    expect(VALID_CODE_RE.test(code)).toBe(true);
  });

  it('generates different codes on successive calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateGameCode()));
    // With 32^6 possibilities, 20 calls should almost certainly yield > 1 unique code
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
    const code = 'ABC123';
    expect(peerIdToCode(codeTopeerId(code))).toBe(code);
  });
});
