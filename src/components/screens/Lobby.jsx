import React, { useState, useEffect, useRef } from 'react';
import Button from '../shared/Button.jsx';
import { generateGameCode } from '../../utils/gameCode.js';
import { createPeerHost } from '../../network/peerHost.js';
import { createPeerPlayer } from '../../network/peerPlayer.js';
import { createInitialState } from '../../state/gameState.js';
import { startSpotifyAuth, handleSpotifyCallback } from '../../spotify/auth.js';

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: '100vh',
  background: '#0f3460',
  padding: '24px',
  boxSizing: 'border-box',
  color: '#eee',
};

const headingStyle = {
  fontSize: '1.8rem',
  fontWeight: 800,
  color: '#e63946',
  margin: '0 0 24px 0',
};

const inputStyle = {
  fontSize: '1.1rem',
  padding: '14px 16px',
  borderRadius: '10px',
  border: '2px solid #457b9d',
  background: '#16213e',
  color: '#eee',
  width: '100%',
  maxWidth: '320px',
  boxSizing: 'border-box',
  outline: 'none',
};

const sectionStyle = {
  width: '100%',
  maxWidth: '380px',
  marginBottom: '24px',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.9rem',
  color: '#a8dadc',
  marginBottom: '8px',
  fontWeight: 600,
};

const gameCodeStyle = {
  fontSize: '2.5rem',
  fontWeight: 800,
  letterSpacing: '0.2em',
  color: '#e63946',
  background: '#16213e',
  borderRadius: '12px',
  padding: '16px 24px',
  textAlign: 'center',
  margin: '0 0 24px 0',
  wordBreak: 'break-all',
};

const playerListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  width: '100%',
};

const playerItemStyle = {
  padding: '10px 14px',
  background: '#16213e',
  borderRadius: '8px',
  marginBottom: '8px',
  fontSize: '1rem',
  color: '#eee',
};

const settingsRowStyle = {
  display: 'flex',
  gap: '16px',
  width: '100%',
  maxWidth: '320px',
};

const settingsFieldStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const smallInputStyle = {
  ...inputStyle,
  maxWidth: '100%',
  padding: '10px 12px',
};

const statusStyle = {
  fontSize: '0.9rem',
  color: '#a8dadc',
  margin: '8px 0 0 0',
};

function HostLobby({ spotifyClientId, onGameStart }) {
  const [name, setName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [gameCode] = useState(() => generateGameCode());
  const [players, setPlayers] = useState([]);
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [winThreshold, setWinThreshold] = useState(10);
  const [hitsterTimer, setHitsterTimer] = useState(15);
  const networkRef = useRef(null);
  const actionHandlerRef = useRef(null);

  // Catch Spotify OAuth callback on page load
  useEffect(() => {
    if (!spotifyClientId) return;
    const redirectUri = window.location.origin + window.location.pathname;
    handleSpotifyCallback(spotifyClientId, redirectUri)
      .then((token) => {
        if (token) setSpotifyToken(token);
      })
      .catch((err) => {
        console.error('Spotify callback error:', err);
      });
  }, [spotifyClientId]);

  // Create peer host once name is confirmed
  useEffect(() => {
    if (!nameConfirmed) return;

    const host = createPeerHost(gameCode, {
      onPlayerJoin(playerId, playerName) {
        setPlayers((prev) => {
          if (prev.some((p) => p.id === playerId)) return prev;
          return [...prev, { id: playerId, name: playerName }];
        });
      },
      onPlayerAction(playerId, msg) {
        if (actionHandlerRef.current) {
          actionHandlerRef.current(playerId, msg);
        }
      },
      onError(_peerId, err) {
        console.error('Host peer error:', err);
      },
    });

    networkRef.current = host;

    return () => {
      host.destroy();
    };
  }, [nameConfirmed, gameCode]);

  function handleConfirmName() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setNameConfirmed(true);
  }

  function handleConnectSpotify() {
    if (!spotifyClientId) return;
    const redirectUri = window.location.origin + window.location.pathname;
    startSpotifyAuth(spotifyClientId, redirectUri);
  }

  function handleStartGame() {
    const hostPlayer = { id: 'host', name: name.trim() };
    const allPlayers = [hostPlayer, ...players];
    const seed = Date.now();

    const initialState = createInitialState({
      players: allPlayers.map((p) => p.id),
      winThreshold: Number(winThreshold),
      hitsterTimer: Number(hitsterTimer),
      seed,
    });

    // Broadcast state to all connected players
    if (networkRef.current) {
      networkRef.current.broadcast(initialState);
    }

    onGameStart({
      initialState,
      networkRef,
      isHost: true,
      spotifyToken,
      actionHandlerRef,
    });
  }

  const canStart = nameConfirmed && players.length >= 1 && spotifyToken !== null;

  if (!nameConfirmed) {
    return (
      <div style={containerStyle}>
        <h1 style={headingStyle}>Host a Game</h1>
        <div style={sectionStyle}>
          <label style={labelStyle} htmlFor="host-name">Your display name</label>
          <input
            id="host-name"
            style={inputStyle}
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmName()}
            autoFocus
          />
        </div>
        <Button
          variant="primary"
          disabled={!name.trim()}
          onClick={handleConfirmName}
        >
          Continue
        </Button>
      </div>
    );
  }

  const allDisplayedPlayers = [{ id: 'host', name: name.trim() + ' (you)' }, ...players];

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>Host a Game</h1>

      <div style={sectionStyle}>
        <div style={labelStyle}>Game Code</div>
        <div style={gameCodeStyle}>{gameCode}</div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Spotify</div>
        {spotifyToken ? (
          <p style={{ ...statusStyle, color: '#57cc99' }}>Spotify connected</p>
        ) : (
          <>
            <Button variant="secondary" onClick={handleConnectSpotify} disabled={!spotifyClientId}>
              Connect Spotify
            </Button>
            {!spotifyClientId && (
              <p style={statusStyle}>No Spotify client ID configured.</p>
            )}
          </>
        )}
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Game Settings</div>
        <div style={settingsRowStyle}>
          <div style={settingsFieldStyle}>
            <label style={{ ...labelStyle, margin: 0 }} htmlFor="win-threshold">
              Win at (songs)
            </label>
            <input
              id="win-threshold"
              style={smallInputStyle}
              type="number"
              min={3}
              max={30}
              value={winThreshold}
              onChange={(e) => setWinThreshold(e.target.value)}
            />
          </div>
          <div style={settingsFieldStyle}>
            <label style={{ ...labelStyle, margin: 0 }} htmlFor="hitster-timer">
              Hitster timer (s)
            </label>
            <input
              id="hitster-timer"
              style={smallInputStyle}
              type="number"
              min={5}
              max={60}
              value={hitsterTimer}
              onChange={(e) => setHitsterTimer(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Players ({allDisplayedPlayers.length})</div>
        <ul style={playerListStyle}>
          {allDisplayedPlayers.map((p) => (
            <li key={p.id} style={playerItemStyle}>
              {p.name}
            </li>
          ))}
        </ul>
        {players.length === 0 && (
          <p style={statusStyle}>Waiting for players to join...</p>
        )}
      </div>

      <Button
        variant="primary"
        disabled={!canStart}
        onClick={handleStartGame}
        style={{ marginTop: '8px' }}
      >
        Start Game
      </Button>
      {!canStart && (
        <p style={statusStyle}>
          {!spotifyToken && 'Connect Spotify. '}
          {players.length < 1 && 'Need at least 1 other player.'}
        </p>
      )}
    </div>
  );
}

function PlayerLobby({ onGameStart }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const networkRef = useRef(null);
  const stateUpdateRef = useRef(null);
  const gameStartedRef = useRef(false);

  function handleJoin() {
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedName || !trimmedCode) return;

    setError(null);

    const player = createPeerPlayer(trimmedCode, trimmedName, {
      onStateUpdate(state) {
        if (!gameStartedRef.current) {
          gameStartedRef.current = true;
          onGameStart({
            initialState: state,
            networkRef,
            isHost: false,
            spotifyToken: null,
            stateUpdateRef,
          });
        } else if (stateUpdateRef.current) {
          stateUpdateRef.current(state);
        }
      },
      onError(err) {
        console.error('Player peer error:', err);
        setError(err.message || 'Connection error');
        setJoined(false);
      },
    });

    networkRef.current = player;
    setJoined(true);
  }

  if (joined) {
    return (
      <div style={containerStyle}>
        <h1 style={headingStyle}>Join a Game</h1>
        <p style={{ fontSize: '1.1rem', color: '#a8dadc', textAlign: 'center' }}>
          Waiting for host to start...
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>Join a Game</h1>

      <div style={sectionStyle}>
        <label style={labelStyle} htmlFor="player-name">Your display name</label>
        <input
          id="player-name"
          style={inputStyle}
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle} htmlFor="game-code">Game code</label>
        <input
          id="game-code"
          style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.15em' }}
          type="text"
          placeholder="XXXXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          maxLength={6}
        />
      </div>

      {error && (
        <p style={{ ...statusStyle, color: '#e63946', marginBottom: '12px' }}>{error}</p>
      )}

      <Button
        variant="secondary"
        disabled={!name.trim() || !code.trim()}
        onClick={handleJoin}
      >
        Join
      </Button>
    </div>
  );
}

export default function Lobby({ role, spotifyClientId, onGameStart }) {
  if (role === 'host') {
    return <HostLobby spotifyClientId={spotifyClientId} onGameStart={onGameStart} />;
  }
  return <PlayerLobby onGameStart={onGameStart} />;
}
