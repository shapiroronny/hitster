import { describe, it, expect } from 'vitest';
import { createSongPicker } from '../src/songs/songPicker.js';

const fakeSongs = [
  { id: 'f001', t: 'Song A', a: 'Artist 1', y: 1970, sid: 'sid1' },
  { id: 'f002', t: 'Song B', a: 'Artist 2', y: 1980, sid: 'sid2' },
  { id: 'f003', t: 'Song C', a: 'Artist 3', y: 1990, sid: 'sid3' },
  { id: 'f004', t: 'Song D', a: 'Artist 4', y: 2000, sid: 'sid4' },
  { id: 'f005', t: 'Song E', a: 'Artist 5', y: 2010, sid: 'sid5' },
];

describe('createSongPicker', () => {
  it('draws all 5 songs without repeating', () => {
    const picker = createSongPicker(fakeSongs, 42);
    const drawn = [];
    for (let i = 0; i < 5; i++) {
      drawn.push(picker.draw());
    }
    const ids = drawn.map((s) => s.id);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
  });

  it('returns null when draw pile is exhausted', () => {
    const picker = createSongPicker(fakeSongs, 42);
    for (let i = 0; i < 5; i++) picker.draw();
    expect(picker.draw()).toBeNull();
  });

  it('reports remaining count correctly', () => {
    const picker = createSongPicker(fakeSongs, 42);
    expect(picker.remaining()).toBe(5);
    picker.draw();
    expect(picker.remaining()).toBe(4);
    picker.draw();
    picker.draw();
    expect(picker.remaining()).toBe(2);
    picker.draw();
    picker.draw();
    expect(picker.remaining()).toBe(0);
  });

  it('produces the same sequence for the same seed', () => {
    const picker1 = createSongPicker(fakeSongs, 99);
    const picker2 = createSongPicker(fakeSongs, 99);
    const seq1 = [picker1.draw(), picker1.draw(), picker1.draw()].map((s) => s.id);
    const seq2 = [picker2.draw(), picker2.draw(), picker2.draw()].map((s) => s.id);
    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const picker1 = createSongPicker(fakeSongs, 1);
    const picker2 = createSongPicker(fakeSongs, 2);
    const seq1 = [picker1.draw(), picker1.draw(), picker1.draw()].map((s) => s.id);
    const seq2 = [picker2.draw(), picker2.draw(), picker2.draw()].map((s) => s.id);
    expect(seq1).not.toEqual(seq2);
  });

  it('can restore from a drawIndex (resume mid-deck)', () => {
    const seed = 77;
    const picker1 = createSongPicker(fakeSongs, seed);
    picker1.draw();
    picker1.draw();
    const savedIndex = picker1.drawIndex();
    expect(savedIndex).toBe(2);

    const picker2 = createSongPicker(fakeSongs, seed, savedIndex);
    expect(picker2.remaining()).toBe(3);

    const nextFromPicker1 = picker1.draw();
    const nextFromPicker2 = picker2.draw();
    expect(nextFromPicker2.id).toBe(nextFromPicker1.id);

    const afterFromPicker1 = picker1.draw();
    const afterFromPicker2 = picker2.draw();
    expect(afterFromPicker2.id).toBe(afterFromPicker1.id);
  });
});
