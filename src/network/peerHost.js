import Peer from 'peerjs';
import { codeTopeerId } from '../utils/gameCode.js';
import { HOST_MSG, PLAYER_MSG, createMessage, parseMessage } from './protocol.js';

export function createPeerHost(gameCode, { onPlayerJoin, onPlayerAction, onError, onOpen }) {
  const peerId = codeTopeerId(gameCode);
  let peer = null;
  const connections = new Map(); // peerId → conn
  let destroyed = false;
  let latestState = null; // Cache latest state to send to reconnecting players

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
              // Replace old connection if player reconnects
              const oldConn = connections.get(conn.peer);
              if (oldConn && oldConn !== conn) {
                console.log('[Host] player reconnected:', conn.peer, msg.name);
                try { oldConn.close(); } catch (e) { /* ignore */ }
              }
              connections.set(conn.peer, conn);
              onPlayerJoin(conn.peer, msg.name);

              // Send latest state to reconnecting player immediately
              if (latestState) {
                console.log('[Host] sending current state to reconnected player');
                try {
                  conn.send(createMessage(HOST_MSG.STATE_UPDATE, { state: latestState }));
                } catch (e) {
                  console.error('[Host] failed to send state to reconnected player:', e);
                }
              }
            } else {
              onPlayerAction(conn.peer, msg);
            }
          } catch (e) {
            console.error('[Host] parse error:', e);
          }
        });
      });

      conn.on('close', () => {
        console.log('[Host] connection closed:', conn.peer, '(player may reconnect)');
        // Don't delete — player may reconnect with same peer ID
      });

      conn.on('error', (err) => {
        console.error('[Host] conn error:', conn.peer, err);
      });
    });

    peer.on('error', (err) => {
      console.error('[Host] peer error:', err.type, err.message);
      if (err.type === 'unavailable-id') {
        console.log('[Host] peer ID taken, retrying...');
        peer.destroy();
        if (!destroyed) setTimeout(setup, 1000);
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
      latestState = state; // Cache for reconnecting players
      const msg = createMessage(HOST_MSG.STATE_UPDATE, { state });
      let sent = 0;
      for (const [id, conn] of connections.entries()) {
        try {
          if (conn.open) {
            conn.send(msg);
            sent++;
          }
        } catch (e) {
          console.error('[Host] broadcast error:', id, e);
        }
      }
      console.log('[Host] broadcast to', sent, '/', connections.size, 'players, phase:', state.phase);
    },
    sendTo(playerId, type, payload) {
      const conn = connections.get(playerId);
      if (conn?.open) conn.send(createMessage(type, payload));
    },
    getConnectedPlayerIds() {
      return [...connections.keys()].filter(id => {
        const conn = connections.get(id);
        return conn && conn.open;
      });
    },
    destroy() {
      destroyed = true;
      if (peer) peer.destroy();
    },
  };
}
