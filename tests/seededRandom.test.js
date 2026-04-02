import { describe, it, expect } from 'vitest';
import { createRng, shuffle } from '../src/utils/seededRandom.js';

describe('createRng', () => {
  it('produces a deterministic sequence for the same seed', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);
    const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];
    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = createRng(1);
    const rng2 = createRng(2);
    const seq1 = [rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2()];
    expect(seq1).not.toEqual(seq2);
  });

  it('returns values between 0 and 1', () => {
    const rng = createRng(99);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe('shuffle', () => {
  it('returns all original elements', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const rng = createRng(7);
    const result = shuffle(original, rng);
    expect(result).toHaveLength(original.length);
    expect([...result].sort((a, b) => a - b)).toEqual([...original].sort((a, b) => a - b));
  });

  it('does not mutate the original array', () => {
    const original = [10, 20, 30, 40, 50];
    const frozen = [...original];
    const rng = createRng(13);
    shuffle(original, rng);
    expect(original).toEqual(frozen);
  });

  it('produces deterministic output for the same seed', () => {
    const arr = ['a', 'b', 'c', 'd', 'e', 'f'];
    const result1 = shuffle(arr, createRng(55));
    const result2 = shuffle(arr, createRng(55));
    expect(result1).toEqual(result2);
  });
});
