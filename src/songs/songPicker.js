import { createRng, shuffle } from '../utils/seededRandom.js';

export function createSongPicker(songs, seed, startIndex = 0) {
  const rng = createRng(seed);
  const shuffled = shuffle(songs, rng);
  let index = startIndex;

  return {
    draw() {
      if (index >= shuffled.length) return null;
      return shuffled[index++];
    },
    remaining() {
      return shuffled.length - index;
    },
    drawIndex() {
      return index;
    },
  };
}
