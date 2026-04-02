export function isPlacementCorrect(timeline, insertIndex, year) {
  const leftYear = insertIndex > 0 ? timeline[insertIndex - 1].y : -Infinity;
  const rightYear = insertIndex < timeline.length ? timeline[insertIndex].y : Infinity;
  return year >= leftYear && year <= rightYear;
}
