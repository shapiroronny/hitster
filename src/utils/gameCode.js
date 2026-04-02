const PREFIX = 'hitster-';

export function generateGameCode() {
  // 4-digit numeric code (1000-9999)
  return String(1000 + Math.floor(Math.random() * 9000));
}

export function codeTopeerId(code) {
  return PREFIX + code;
}

export function peerIdToCode(peerId) {
  return peerId.slice(PREFIX.length);
}
