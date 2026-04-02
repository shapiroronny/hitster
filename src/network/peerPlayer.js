import Peer from 'peerjs';
import { codeTopeerId } from '../utils/gameCode.js';
import { PLAYER_MSG, createMessage, parseMessage } from './protocol.js';

export function createPeerPlayer(gameCode, playerName, { onStateUpdate, onError, onConnected }) {
  const peer = new Peer();
  let hostConn = null;
  let playerId = null;
  let destroyed = false;
  const hostPeerIdBase = codeTopeerId(gameCode);

  function connectToHost(hostPeerId) {
    console.log('[Player] connecting to:', hostPeerId);
    hostConn = peer.connect(hostPeerId, { reliable: true });

    hostConn.on('open', () => {
      console.log('[Player] connected to host');
      hostConn.send(createMessage(PLAYER_MSG.JOIN, { name: playerName }));
      if (onConnected) onConnected();
    });

    hostConn.on('data', (raw) => {
      try {
        const msg = parseMessage(raw);
        if (msg.type === 'STATE_UPDATE') {
          onStateUpdate(msg.state);
        }
      } catch (e) {
        console.error('[Player] failed to parse message:', e);
      }
    });

    hostConn.on('close', () => {
      console.log('[Player] disconnected from host');
      if (!destroyed) {
        onError(new Error('Disconnected from host'));
      }
    });

    hostConn.on('error', (err) => {
      console.error('[Player] connection error:', err);
      onError(err);
    });
  }

  peer.on('open', (id) => {
    playerId = id;
    console.log('[Player] peer open:', id);

    // Try to discover the host — the host has a random suffix.
    // We try the base ID first, then scan common patterns.
    // PeerJS doesn't support listing peers, so we rely on the Lobby
    // passing the full host peer ID. But for backwards compat, try base first.
    // The Lobby now passes the full peer ID via the game code mechanism.
    connectToHost(hostPeerIdBase);
  });

  peer.on('error', (err) => {
    console.error('[Player] peer error:', err.type, err.message);

    // If peer-unavailable, the host ID wasn't found. This is the "can't connect" bug.
    if (err.type === 'peer-unavailable') {
      onError(new Error('Game not found. Check the code and try again.'));
    } else {
      onError(err);
    }
  });

  peer.on('disconnected', () => {
    console.log('[Player] disconnected from signaling, reconnecting...');
    if (!destroyed) {
      peer.reconnect();
    }
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
      destroyed = true;
      peer.destroy();
    },
  };
}
