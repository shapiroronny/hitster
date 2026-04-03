import React, { useState, useEffect, useRef } from 'react';
import Button from '../shared/Button.jsx';
import { generateGameCode } from '../../utils/gameCode.js';
import { createPeerHost } from '../../network/peerHost.js';
import { createPeerPlayer } from '../../network/peerPlayer.js';
import { createInitialState } from '../../state/gameState.js';
import { startSpotifyAuth, getOrRefreshToken, loadLobbyState, saveLobbyState } from '../../spotify/auth.js';

function HostLobby({ spotifyClientId, onGameStart, practice }) {
  // Restore lobby state after OAuth redirect
  const restored = React.useMemo(() => loadLobbyState(), []);

  const [name, setName] = useState(restored?.name || '');
  const [nameConfirmed, setNameConfirmed] = useState(!!restored?.name);
  const [gameCode] = useState(() => restored?.gameCode || generateGameCode());
  const [players, setPlayers] = useState([]);
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [winThreshold, setWinThreshold] = useState(restored?.winThreshold || 10);
  const [hitsterTimer, setHitsterTimer] = useState(restored?.hitsterTimer || 15);
  const networkRef = useRef(null);
  const actionHandlerRef = useRef(null);

  // On mount: try to get Spotify token (cached, refreshed, or from OAuth callback)
  useEffect(() => {
    if (!spotifyClientId) return;
    const redirectUri = window.location.origin + window.location.pathname;
    getOrRefreshToken(spotifyClientId, redirectUri)
      .then((token) => {
        if (token) setSpotifyToken(token);
      })
      .catch((err) => {
        console.error('Spotify auth error:', err);
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

    // DO NOT destroy on unmount — the peer must survive the Lobby→GameScreen transition.
    // GameScreen uses the same networkRef to broadcast state updates.
    // Cleanup happens when the browser tab closes or a new game starts.
  }, [nameConfirmed, gameCode]);

  function handleConfirmName() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setNameConfirmed(true);
  }

  function handleConnectSpotify() {
    if (!spotifyClientId) return;
    const redirectUri = window.location.origin + window.location.pathname;
    // Save lobby state so it survives the OAuth redirect
    startSpotifyAuth(spotifyClientId, redirectUri, {
      name: name.trim(),
      gameCode,
      winThreshold,
      hitsterTimer,
    });
  }

  function handleStartGame() {
    const hostPlayer = { id: 'host', name: name.trim() };
    const allPlayers = practice
      ? [hostPlayer, { id: 'p2', name: 'Player 2' }]
      : [hostPlayer, ...players];
    const seed = Date.now();

    const initialState = createInitialState({
      players: allPlayers,
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
      gameCode,
    });
  }

  const canStart = nameConfirmed && (practice || players.length >= 1) && spotifyToken !== null;

  if (!nameConfirmed) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-[#0f3460] p-6 text-[#eee]">
        <h1 className="text-3xl font-extrabold text-[#e63946] mb-6">Host a Game</h1>
        <div className="w-full max-w-[380px] mb-6">
          <label className="block text-sm text-[#a8dadc] mb-2 font-semibold" htmlFor="host-name">Your display name</label>
          <input
            id="host-name"
            className="text-lg py-3.5 px-4 rounded-[10px] border-2 border-[#457b9d] bg-[#16213e] text-[#eee] w-full max-w-xs outline-none"
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
    <div className="flex flex-col items-center min-h-screen bg-[#0f3460] p-6 text-[#eee]">
      <h1 className="text-3xl font-extrabold text-[#e63946] mb-6">Host a Game</h1>

      <div className="w-full max-w-[380px] mb-6">
        <div className="block text-sm text-[#a8dadc] mb-2 font-semibold">Game Code</div>
        <div className="text-4xl font-extrabold tracking-[0.2em] text-[#e63946] bg-[#16213e] rounded-xl py-4 px-6 text-center mb-6 break-all">
          {gameCode}
        </div>
      </div>

      <div className="w-full max-w-[380px] mb-6">
        <div className="block text-sm text-[#a8dadc] mb-2 font-semibold">Spotify</div>
        {spotifyToken ? (
          <p className="text-sm text-[#57cc99] mt-2">Spotify connected</p>
        ) : (
          <>
            <Button variant="secondary" onClick={handleConnectSpotify} disabled={!spotifyClientId}>
              Connect Spotify
            </Button>
            {!spotifyClientId && (
              <p className="text-sm text-[#a8dadc] mt-2">No Spotify client ID configured.</p>
            )}
          </>
        )}
      </div>

      <div className="w-full max-w-[380px] mb-6">
        <div className="block text-sm text-[#a8dadc] mb-2 font-semibold">Game Settings</div>
        <div className="flex gap-4 w-full max-w-xs">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm text-[#a8dadc] font-semibold" htmlFor="win-threshold">
              Win at (songs)
            </label>
            <input
              id="win-threshold"
              className="text-lg py-2.5 px-3 rounded-[10px] border-2 border-[#457b9d] bg-[#16213e] text-[#eee] w-full outline-none"
              type="number"
              min={3}
              max={30}
              value={winThreshold}
              onChange={(e) => setWinThreshold(e.target.value)}
            />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm text-[#a8dadc] font-semibold" htmlFor="hitster-timer">
              Hitster timer (s)
            </label>
            <input
              id="hitster-timer"
              className="text-lg py-2.5 px-3 rounded-[10px] border-2 border-[#457b9d] bg-[#16213e] text-[#eee] w-full outline-none"
              type="number"
              min={5}
              max={60}
              value={hitsterTimer}
              onChange={(e) => setHitsterTimer(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="w-full max-w-[380px] mb-6">
        <div className="block text-sm text-[#a8dadc] mb-2 font-semibold">Players ({allDisplayedPlayers.length})</div>
        <ul className="list-none p-0 m-0 w-full">
          {allDisplayedPlayers.map((p) => (
            <li key={p.id} className="py-2.5 px-3.5 bg-[#16213e] rounded-lg mb-2 text-base text-[#eee]">
              {p.name}
            </li>
          ))}
        </ul>
        {players.length === 0 && (
          <p className="text-sm text-[#a8dadc] mt-2">Waiting for players to join...</p>
        )}
      </div>

      <Button
        variant="primary"
        disabled={!canStart}
        onClick={handleStartGame}
        className="mt-2"
      >
        Start Game
      </Button>
      {!canStart && (
        <p className="text-sm text-[#a8dadc] mt-2">
          {!spotifyToken && 'Connect Spotify. '}
          {!practice && players.length < 1 && 'Need at least 1 other player.'}
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

  function handleJoin() {
    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    if (!trimmedName || !trimmedCode) return;

    setError(null);

    const player = createPeerPlayer(trimmedCode, trimmedName, {
      onFirstState(state) {
        const myPeerId = player.getPlayerId();
        onGameStart({
          initialState: state,
          networkRef,
          isHost: false,
          spotifyToken: null,
          playerId: myPeerId,
        });
      },
      onConnected() {
        console.log('[PlayerLobby] connected to host');
      },
      onError(err) {
        console.error('Player peer error:', err);
        setError(err.message || 'Connection error');
      },
    });

    networkRef.current = player;
    setJoined(true);
  }

  if (joined) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-[#0f3460] p-6 text-[#eee]">
        <h1 className="text-3xl font-extrabold text-[#e63946] mb-6">Join a Game</h1>
        <p className="text-lg text-[#a8dadc] text-center">
          Waiting for host to start...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0f3460] p-6 text-[#eee]">
      <h1 className="text-3xl font-extrabold text-[#e63946] mb-6">Join a Game</h1>

      <div className="w-full max-w-[380px] mb-6">
        <label className="block text-sm text-[#a8dadc] mb-2 font-semibold" htmlFor="player-name">Your display name</label>
        <input
          id="player-name"
          className="text-lg py-3.5 px-4 rounded-[10px] border-2 border-[#457b9d] bg-[#16213e] text-[#eee] w-full max-w-xs outline-none"
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="w-full max-w-[380px] mb-6">
        <label className="block text-sm text-[#a8dadc] mb-2 font-semibold" htmlFor="game-code">Game code</label>
        <input
          id="game-code"
          className="text-2xl py-3.5 px-4 rounded-[10px] border-2 border-[#457b9d] bg-[#16213e] text-[#eee] w-full max-w-xs outline-none tracking-[0.3em] text-center"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          maxLength={4}
        />
      </div>

      {error && (
        <p className="text-sm text-[#e63946] mb-3">{error}</p>
      )}

      <Button
        variant="secondary"
        disabled={!name.trim() || code.length !== 4}
        onClick={handleJoin}
      >
        Join
      </Button>
    </div>
  );
}

export default function Lobby({ role, spotifyClientId, onGameStart, practice }) {
  if (role === 'host') {
    return <HostLobby spotifyClientId={spotifyClientId} onGameStart={onGameStart} practice={practice} />;
  }
  return <PlayerLobby onGameStart={onGameStart} />;
}
