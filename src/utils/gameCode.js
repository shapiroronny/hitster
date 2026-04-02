const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/1/I to avoid confusion
const PREFIX = 'hitster-';

export function generateGameCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function codeTopeerId(code) {
  return PREFIX + code;
}

export function peerIdToCode(peerId) {
  return peerId.slice(PREFIX.length);
}
