import Peer from 'peerjs';
import { codeTopeerId } from '../utils/gameCode.js';
import { PLAYER_MSG, createMessage, parseMessage } from './protocol.js';

export function createPeerPlayer(gameCode, playerName, { onFirstState, onError, onConnected }) {
  const peer = new Peer();
  let hostConn = null;
  let playerId = null;
  let destroyed = false;
  let stateHandler = null; // Set by GameScreen after mount
  let firstStateFired = false;
  const hostPeerId = codeTopeerId(gameCode);

  function handleStateUpdate(state) {
    if (!firstStateFired) {
      firstStateFired = true;
      console.log('[Player] first state received, starting game');
      onFirstState(state);
    } else if (stateHandler) {
      stateHandler(state);
    } else {
      console.warn('[Player] state update received but no handler set yet');
    }
  }

  peer.on('open', (id) => {
    playerId = id;
    console.log('[Player] peer open:', id, '→ connecting to', hostPeerId);
    hostConn = peer.connect(hostPeerId, { reliable: true });

    hostConn.on('open', () => {
      console.log('[Player] connected to host, sending JOIN');
      hostConn.send(createMessage(PLAYER_MSG.JOIN, { name: playerName }));
      if (onConnected) onConnected();
    });

    hostConn.on('data', (raw) => {
      try {
        const msg = parseMessage(raw);
        if (msg.type === 'STATE_UPDATE') {
          handleStateUpdate(msg.state);
        }
      } catch (e) {
        console.error('[Player] parse error:', e);
      }
    });

    hostConn.on('close', () => {
      console.log('[Player] connection closed');
      if (!destroyed) onError(new Error('Disconnected from host'));
    });

    hostConn.on('error', (err) => {
      console.error('[Player] connection error:', err);
      onError(err);
    });
  });

  peer.on('error', (err) => {
    console.error('[Player] peer error:', err.type, err.message);
    if (err.type === 'peer-unavailable') {
      onError(new Error('Game not found. Check the code and try again.'));
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
    // Called by GameScreen to receive ongoing state updates
    setOnStateUpdate(fn) {
      stateHandler = fn;
    },
    destroy() {
      destroyed = true;
      peer.destroy();
    },
  };
}
