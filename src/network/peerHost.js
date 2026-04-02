import Peer from 'peerjs';
import { codeTopeerId } from '../utils/gameCode.js';
import { HOST_MSG, PLAYER_MSG, createMessage, parseMessage } from './protocol.js';

export function createPeerHost(gameCode, { onPlayerJoin, onPlayerAction, onError }) {
  const peerId = codeTopeerId(gameCode);
  const peer = new Peer(peerId);
  const connections = new Map();

  peer.on('open', () => {
    console.log('Host peer open:', peerId);
  });

  peer.on('connection', (conn) => {
    conn.on('open', () => {
      conn.on('data', (raw) => {
        const msg = parseMessage(raw);
        if (msg.type === PLAYER_MSG.JOIN) {
          const playerId = conn.peer;
          connections.set(playerId, conn);
          onPlayerJoin(playerId, msg.name);
        } else {
          onPlayerAction(conn.peer, msg);
        }
      });
    });

    conn.on('close', () => {
      connections.delete(conn.peer);
    });

    conn.on('error', (err) => {
      onError(conn.peer, err);
    });
  });

  peer.on('error', (err) => {
    console.error('Host peer error:', err);
    onError(null, err);
  });

  return {
    broadcast(state) {
      const msg = createMessage(HOST_MSG.STATE_UPDATE, { state });
      for (const conn of connections.values()) {
        if (conn.open) conn.send(msg);
      }
    },
    sendTo(playerId, type, payload) {
      const conn = connections.get(playerId);
      if (conn && conn.open) {
        conn.send(createMessage(type, payload));
      }
    },
    getConnectedPlayerIds() {
      return [...connections.keys()];
    },
    destroy() {
      peer.destroy();
    },
  };
}
