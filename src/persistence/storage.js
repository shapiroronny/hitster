const STORAGE_KEY = 'hitster-game-state';

export function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game state:', e);
  }
}

export function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to load game state:', e);
    return null;
  }
}

export function clearGameState() {
  localStorage.removeItem(STORAGE_KEY);
}
