import Peer from 'peerjs';
import { codeTopeerId } from '../utils/gameCode.js';
import { HOST_MSG, PLAYER_MSG, createMessage, parseMessage } from './protocol.js';

export function createPeerHost(gameCode, { onPlayerJoin, onPlayerAction, onError, onOpen }) {
  const peerId = codeTopeerId(gameCode);
  let peer = null;
  const connections = new Map();
  let destroyed = false;

  function setup() {
    peer = new Peer(peerId);

    peer.on('open', () => {
      console.log('[Host] peer open:', peerId);
      if (onOpen) onOpen();
    });

    peer.on('connection', (conn) => {
      console.log('[Host] incoming connection from:', conn.peer);

      conn.on('open', () => {
        console.log('[Host] connection open:', conn.peer);

        conn.on('data', (raw) => {
          try {
            const msg = parseMessage(raw);
            if (msg.type === PLAYER_MSG.JOIN) {
              connections.set(conn.peer, conn);
              onPlayerJoin(conn.peer, msg.name);
            } else {
              onPlayerAction(conn.peer, msg);
            }
          } catch (e) {
            console.error('[Host] parse error:', e);
          }
        });
      });

      conn.on('close', () => {
        console.log('[Host] connection closed:', conn.peer);
        connections.delete(conn.peer);
      });

      conn.on('error', (err) => {
        console.error('[Host] conn error:', conn.peer, err);
      });
    });

    peer.on('error', (err) => {
      console.error('[Host] peer error:', err.type, err.message);
      if (err.type === 'unavailable-id') {
        // Stale peer ID — destroy and retry after short delay
        console.log('[Host] peer ID taken, retrying...');
        peer.destroy();
        if (!destroyed) {
          setTimeout(setup, 1000);
        }
      } else {
        onError(null, err);
      }
    });

    peer.on('disconnected', () => {
      if (!destroyed) {
        console.log('[Host] reconnecting to signaling...');
        peer.reconnect();
      }
    });
  }

  setup();

  return {
    broadcast(state) {
      const msg = createMessage(HOST_MSG.STATE_UPDATE, { state });
      for (const [id, conn] of connections.entries()) {
        try {
          if (conn.open) conn.send(msg);
        } catch (e) {
          console.error('[Host] broadcast error:', id, e);
        }
      }
    },
    sendTo(playerId, type, payload) {
      const conn = connections.get(playerId);
      if (conn?.open) conn.send(createMessage(type, payload));
    },
    getConnectedPlayerIds() {
      return [...connections.keys()];
    },
    destroy() {
      destroyed = true;
      if (peer) peer.destroy();
    },
  };
}
