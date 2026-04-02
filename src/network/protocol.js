// Host → Player messages
export const HOST_MSG = {
  STATE_UPDATE: 'STATE_UPDATE',
  GAME_STARTED: 'GAME_STARTED',
  PLAYER_JOINED: 'PLAYER_JOINED',
  ERROR: 'ERROR',
};

// Player → Host messages
export const PLAYER_MSG = {
  JOIN: 'JOIN',
  LOCK_PLACEMENT: 'LOCK_PLACEMENT',
  CLAIM_HITSTER: 'CLAIM_HITSTER',
  LOCK_HITSTER_PLACEMENT: 'LOCK_HITSTER_PLACEMENT',
  SKIP_TURN: 'SKIP_TURN',
};

export function createMessage(type, payload = {}) {
  return JSON.stringify({ type, ...payload });
}

export function parseMessage(data) {
  return JSON.parse(data);
}
