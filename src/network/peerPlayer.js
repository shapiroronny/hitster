import Peer from 'peerjs';
import { codeTopeerId } from '../utils/gameCode.js';
import { PLAYER_MSG, createMessage, parseMessage } from './protocol.js';

export function createPeerPlayer(gameCode, playerName, { onStateUpdate, onError }) {
  const peer = new Peer();
  let hostConn = null;
  let playerId = null;

  peer.on('open', (id) => {
    playerId = id;
    const hostPeerId = codeTopeerId(gameCode);
    hostConn = peer.connect(hostPeerId, { reliable: true });

    hostConn.on('open', () => {
      hostConn.send(createMessage(PLAYER_MSG.JOIN, { name: playerName }));
    });

    hostConn.on('data', (raw) => {
      const msg = parseMessage(raw);
      if (msg.type === 'STATE_UPDATE') {
        onStateUpdate(msg.state);
      }
    });

    hostConn.on('close', () => {
      onError(new Error('Disconnected from host'));
    });

    hostConn.on('error', (err) => {
      onError(err);
    });
  });

  peer.on('error', (err) => {
    onError(err);
  });

  return {
    send(type, payload = {}) {
      if (hostConn && hostConn.open) {
        hostConn.send(createMessage(type, payload));
      }
    },
    getPlayerId() {
      return playerId;
    },
    destroy() {
      peer.destroy();
    },
  };
}
