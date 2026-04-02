import { describe, it, expect } from 'vitest';
import { isPlacementCorrect } from '../src/state/gameLogic.js';

describe('isPlacementCorrect', () => {
  const timeline = [
    { y: 1970 },
    { y: 1985 },
    { y: 2000 },
  ];

  it('correct between two songs in order', () => {
    // insert between index 0 (1970) and index 1 (1985)
    expect(isPlacementCorrect(timeline, 1, 1980)).toBe(true);
  });

  it('correct at start before all songs', () => {
    expect(isPlacementCorrect(timeline, 0, 1960)).toBe(true);
  });

  it('correct at end after all songs', () => {
    expect(isPlacementCorrect(timeline, 3, 2010)).toBe(true);
  });

  it('wrong when violates order with left neighbor', () => {
    // insert at index 2 (between 1985 and 2000) but year is before left neighbor
    expect(isPlacementCorrect(timeline, 2, 1980)).toBe(false);
  });

  it('wrong when violates order with right neighbor', () => {
    // insert at index 1 (between 1970 and 1985) but year is after right neighbor
    expect(isPlacementCorrect(timeline, 1, 1990)).toBe(false);
  });

  it('correct when year equals left neighbor (same year is valid)', () => {
    expect(isPlacementCorrect(timeline, 1, 1970)).toBe(true);
  });

  it('correct when year equals right neighbor (same year is valid)', () => {
    expect(isPlacementCorrect(timeline, 1, 1985)).toBe(true);
  });

  it('correct with empty timeline at index 0', () => {
    expect(isPlacementCorrect([], 0, 1999)).toBe(true);
  });
});
