import Peer from 'peerjs';
import { codeTopeerId } from '../utils/gameCode.js';
import { PLAYER_MSG, createMessage, parseMessage } from './protocol.js';

export function createPeerPlayer(gameCode, playerName, { onFirstState, onError, onConnected }) {
  const peer = new Peer();
  let hostConn = null;
  let playerId = null;
  let destroyed = false;
  let stateHandler = null;
  let firstStateFired = false;
  let reconnectTimer = null;
  const hostPeerId = codeTopeerId(gameCode);

  function handleStateUpdate(state) {
    if (!firstStateFired) {
      firstStateFired = true;
      console.log('[Player] first state received, starting game');
      onFirstState(state);
    } else if (stateHandler) {
      stateHandler(state);
    } else {
      console.warn('[Player] state update but no handler yet');
    }
  }

  function wireConnection(conn) {
    hostConn = conn;

    conn.on('open', () => {
      console.log('[Player] connected to host, sending JOIN');
      conn.send(createMessage(PLAYER_MSG.JOIN, { name: playerName }));
      if (onConnected) onConnected();
    });

    conn.on('data', (raw) => {
      try {
        const msg = parseMessage(raw);
        if (msg.type === 'STATE_UPDATE') {
          handleStateUpdate(msg.state);
        }
      } catch (e) {
        console.error('[Player] parse error:', e);
      }
    });

    conn.on('close', () => {
      console.log('[Player] connection closed, will retry...');
      if (!destroyed) scheduleReconnect();
    });

    conn.on('error', (err) => {
      console.error('[Player] connection error:', err);
      if (!destroyed) scheduleReconnect();
    });
  }

  function connectToHost() {
    if (destroyed || !peer.open) return;
    console.log('[Player] connecting to', hostPeerId);
    const conn = peer.connect(hostPeerId, { reliable: true });
    wireConnection(conn);
  }

  function scheduleReconnect() {
    if (destroyed || reconnectTimer) return;
    console.log('[Player] reconnecting in 2s...');
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectToHost();
    }, 2000);
  }

  peer.on('open', (id) => {
    playerId = id;
    console.log('[Player] peer open:', id);
    connectToHost();
  });

  peer.on('error', (err) => {
    console.error('[Player] peer error:', err.type, err.message);
    if (err.type === 'peer-unavailable') {
      // Host not found — might not be ready yet, retry a few times
      if (!firstStateFired && !destroyed) {
        scheduleReconnect();
      } else if (!firstStateFired) {
        onError(new Error('Game not found. Check the code and try again.'));
      }
    } else {
      onError(err);
    }
  });

  peer.on('disconnected', () => {
    if (!destroyed) {
      console.log('[Player] reconnecting to signaling...');
      peer.reconnect();
    }
  });

  return {
    send(type, payload = {}) {
      if (hostConn && hostConn.open) {
        hostConn.send(createMessage(type, payload));
      } else {
        console.warn('[Player] cannot send, connection not open');
      }
    },
    getPlayerId() {
      return playerId;
    },
    setOnStateUpdate(fn) {
      stateHandler = fn;
    },
    destroy() {
      destroyed = true;
      clearTimeout(reconnectTimer);
      peer.destroy();
    },
  };
}
