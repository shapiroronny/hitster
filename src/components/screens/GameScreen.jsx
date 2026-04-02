import React, { useReducer, useState, useEffect, useRef, useCallback } from 'react';
import { PHASES, gameReducer } from '../../state/gameState.js';
import { PLAYER_MSG } from '../../network/protocol.js';
import { initSpotifyPlayer, playSong, pauseSong, resumeSong, stopSong } from '../../spotify/player.js';
import { saveGameState } from '../../persistence/storage.js';
import { useDragToTimeline } from '../../hooks/useDragToTimeline.js';
import PhaseIndicator from '../game/PhaseIndicator.jsx';
import PlayerList from '../game/PlayerList.jsx';
import { Timeline } from '../game/Timeline.jsx';
import { DraggableMysteryCard } from '../game/DraggableMysteryCard.jsx';
import PlaybackControls from '../game/PlaybackControls.jsx';
import HitsterButton from '../game/HitsterButton.jsx';
import TokenChallenge from '../game/TokenChallenge.jsx';
import RevealResult from '../game/RevealResult.jsx';
import GameOver from './GameOver.jsx';
import Button from '../shared/Button.jsx';

export default function GameScreen({ gameData }) {
  const { initialState, networkRef, isHost, spotifyToken, actionHandlerRef, stateUpdateRef, gameCode, playerId: passedPlayerId } = gameData;

  const [hostState, hostDispatch] = useReducer(gameReducer, initialState);
  const [playerState, setPlayerState] = useState(initialState);
  const state = isHost ? hostState : playerState;

  const [placementIndex, setPlacementIndex] = useState(null);
  const [spotifyReady, setSpotifyReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const dropZoneRefs = useRef([]);

  // Identity — use passed playerId (stable) instead of getPlayerId() (async)
  const myId = isHost ? 'host' : (passedPlayerId || networkRef.current?.getPlayerId());
  const currentPlayer = state.players[state.currentPlayerIndex];
  const currentPlayerName = currentPlayer?.name ?? '';
  const isMyTurn = currentPlayer?.id === myId;
  const myPlayerIndex = state.players.findIndex((p) => p.id === myId);
  const myPlayer = myPlayerIndex >= 0 ? state.players[myPlayerIndex] : null;
  const hasSpotify = spotifyReady && spotifyToken;

  // --- HOST: wire up action handler ---
  useEffect(() => {
    if (!isHost || !actionHandlerRef) return;
    actionHandlerRef.current = (playerId, msg) => {
      switch (msg.type) {
        case PLAYER_MSG.LOCK_PLACEMENT:
          hostDispatch({ type: 'LOCK_PLACEMENT', playerId, insertIndex: msg.insertIndex });
          break;
        case PLAYER_MSG.CLAIM_HITSTER:
          hostDispatch({ type: 'CLAIM_HITSTER', playerId });
          break;
        case PLAYER_MSG.LOCK_HITSTER_PLACEMENT:
          hostDispatch({ type: 'LOCK_HITSTER_PLACEMENT', playerId, insertIndex: msg.insertIndex });
          break;
        case PLAYER_MSG.SKIP_TURN:
          hostDispatch({ type: 'SKIP_TURN', playerId });
          break;
        default:
          break;
      }
    };
  }, [isHost, actionHandlerRef]);

  // --- HOST: broadcast + save ---
  useEffect(() => {
    if (!isHost) return;
    const stateToSend = hostState.phase !== PHASES.REVEAL && hostState.phase !== PHASES.TOKEN_CHALLENGE
      ? {
          ...hostState,
          currentSong: hostState.currentSong
            ? { id: hostState.currentSong.id, sid: hostState.currentSong.sid }
            : null,
        }
      : hostState;
    networkRef.current?.broadcast(stateToSend);
    saveGameState(hostState);
  }, [isHost, hostState, networkRef]);

  // --- PLAYER: wire up state updates ---
  useEffect(() => {
    if (isHost || !stateUpdateRef) return;
    stateUpdateRef.current = setPlayerState;
    return () => { stateUpdateRef.current = null; };
  }, [isHost, stateUpdateRef]);

  // --- HOST: init Spotify ---
  useEffect(() => {
    if (!isHost || !spotifyToken) return;
    initSpotifyPlayer(spotifyToken.accessToken, {
      onReady: () => setSpotifyReady(true),
      onError: (msg) => console.error('Spotify error:', msg),
    });
  }, [isHost, spotifyToken]);

  // --- HOST: auto-reveal after hitster timer ---
  useEffect(() => {
    if (!isHost || state.phase !== PHASES.HITSTER_WINDOW) return;
    const timer = setTimeout(() => {
      hostDispatch({ type: 'REVEAL' });
    }, (state.hitsterTimer ?? 15) * 1000);
    return () => clearTimeout(timer);
  }, [isHost, state.phase, state.hitsterTimer]);

  // --- Drag and drop ---
  const handleDrop = useCallback((index) => {
    setPlacementIndex(index);
  }, []);
  const { isDragging, dragPos, activeDropZone, handlers } = useDragToTimeline(dropZoneRefs, handleDrop);

  // --- Timeline ---
  const timelineSongs = currentPlayer ? currentPlayer.timeline : [];

  // --- Can drag (allow re-drag even after placement to change position) ---
  const isHitster = state.hitster && state.hitster.playerId === myId;
  const hitsterNeedsPlacement = isHitster && state.hitster.insertIndex === null;
  const canDrag =
    ((isMyTurn && (state.phase === PHASES.LISTENING || state.phase === PHASES.PLACING)) ||
      (hitsterNeedsPlacement && state.phase === PHASES.HITSTER_WINDOW)) &&
    !isDragging;

  // --- Can hitster ---
  // Non-current players can hitster during HITSTER_WINDOW if no one claimed yet and they have tokens
  const canHitster =
    state.phase === PHASES.HITSTER_WINDOW &&
    !isMyTurn &&
    state.hitster === null &&
    myPlayer &&
    myPlayer.tokens > 0;

  // --- Spotify play/pause toggle ---
  const handlePlayToggle = async () => {
    if (!hasSpotify) return;
    if (isPlaying) {
      try { await pauseSong(); setIsPlaying(false); } catch (e) { console.error(e); }
    } else {
      try {
        if (state.currentSong) {
          await playSong(spotifyToken.accessToken, state.currentSong.sid);
        } else {
          await resumeSong();
        }
        setIsPlaying(true);
      } catch (e) { console.error(e); }
    }
  };

  // --- Host: start turn (play song or advance to placing) ---
  const handleStartTurn = async () => {
    if (!state.currentSong) return;
    if (hasSpotify) {
      try {
        await playSong(spotifyToken.accessToken, state.currentSong.sid);
        setIsPlaying(true);
      } catch (e) { console.error(e); }
    }
    hostDispatch({ type: 'START_PLACING' });
  };

  // --- Lock in ---
  const handleLockIn = () => {
    if (placementIndex === null) return;
    if (isHost) {
      hostDispatch({ type: 'LOCK_PLACEMENT', playerId: myId, insertIndex: placementIndex });
    } else {
      networkRef.current?.send(PLAYER_MSG.LOCK_PLACEMENT, { insertIndex: placementIndex });
    }
    setPlacementIndex(null);
  };

  const handleHitsterClaim = () => {
    if (isHost) {
      hostDispatch({ type: 'CLAIM_HITSTER', playerId: myId });
    } else {
      networkRef.current?.send(PLAYER_MSG.CLAIM_HITSTER, {});
    }
  };

  const handleHitsterLockIn = () => {
    if (placementIndex === null) return;
    if (isHost) {
      hostDispatch({ type: 'LOCK_HITSTER_PLACEMENT', playerId: myId, insertIndex: placementIndex });
    } else {
      networkRef.current?.send(PLAYER_MSG.LOCK_HITSTER_PLACEMENT, { insertIndex: placementIndex });
    }
    setPlacementIndex(null);
  };

  const handleSkipTurn = () => {
    if (isHost) {
      hostDispatch({ type: 'SKIP_TURN', playerId: myId });
    } else {
      networkRef.current?.send(PLAYER_MSG.SKIP_TURN, {});
    }
  };

  const handleReveal = () => {
    if (hasSpotify && isPlaying) { stopSong().catch(() => {}); setIsPlaying(false); }
    hostDispatch({ type: 'REVEAL' });
  };

  const handleAwardToken = (grant) => { hostDispatch({ type: 'AWARD_TOKEN', grant }); };

  const handleNextTurn = () => {
    if (hasSpotify && isPlaying) { stopSong().catch(() => {}); }
    setIsPlaying(false);
    hostDispatch({ type: 'NEXT_TURN' });
  };

  // --- Reveal result data ---
  const revealResultData =
    state.phase === PHASES.REVEAL && state.revealResult && state.currentSong
      ? { song: state.currentSong, playerCorrect: state.revealResult.playerCorrect, hitsterCorrect: state.revealResult.hitsterCorrect }
      : null;

  const showDropZones = canDrag || isDragging || placementIndex !== null;

  // --- Game Over ---
  if (state.winner && state.phase === PHASES.REVEAL) {
    const winnerPlayer = state.players.find((p) => p.id === state.winner);
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-[#0a0a1a] to-[#12122e] text-[#f0f0f0] overflow-hidden">
        <GameOver winnerName={winnerPlayer?.name ?? state.winner} onContinue={isHost ? handleNextTurn : undefined} />
        {revealResultData && <RevealResult revealResult={revealResultData} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a0a1a] to-[#12122e] text-[#f0f0f0] overflow-hidden">
      {/* Header: phase + game code */}
      <div className="flex items-center shrink-0">
        <div className="flex-1">
          <PhaseIndicator phase={state.phase} currentPlayerName={currentPlayerName} isMyTurn={isMyTurn} />
        </div>
        {gameCode && (
          <div className="px-3 py-1 text-xs font-mono text-white/40 bg-white/5 border-b border-white/10 shrink-0">
            {gameCode}
          </div>
        )}
      </div>

      {/* Player list */}
      <PlayerList players={state.players} currentPlayerIndex={state.currentPlayerIndex} />

      {/* Host: Start Turn button (LISTENING phase) */}
      {isHost && state.phase === PHASES.LISTENING && (
        <div className="flex justify-center py-2 px-4 shrink-0">
          <Button variant="primary" onClick={handleStartTurn} className="!max-w-[220px]">
            {hasSpotify ? '▶ Play Song' : 'Next Song'}
          </Button>
        </div>
      )}

      {/* Host: Spotify play/pause toggle — always visible when Spotify connected and past LISTENING */}
      {isHost && hasSpotify && state.phase !== PHASES.LISTENING && state.phase !== PHASES.GAME_OVER && (
        <PlaybackControls onToggle={handlePlayToggle} isPlaying={isPlaying} />
      )}

      {/* Floating mystery card — only when nothing placed yet. Once placed, drag from timeline. */}
      {isDragging && (
        <DraggableMysteryCard isDragging dragPos={dragPos} handlers={{}} />
      )}
      {canDrag && !isDragging && placementIndex === null && (
        <DraggableMysteryCard isDragging={false} dragPos={dragPos} handlers={handlers} />
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-2">
        <Timeline
          songs={timelineSongs}
          showDropZones={showDropZones}
          activeDropZone={activeDropZone}
          dropZoneRefs={dropZoneRefs}
          placedIndex={placementIndex}
          isDragging={isDragging}
          dragHandlers={handlers}
          revealedSong={revealResultData ? { id: state.currentSong.id, result: state.revealResult.playerCorrect ? 'correct' : 'wrong' } : undefined}
        />
      </div>

      {/* Lock in button */}
      {placementIndex !== null && !isDragging && isMyTurn && !hitsterNeedsPlacement && (
        <div className="flex justify-center py-2 px-4 shrink-0">
          <Button variant="primary" onClick={handleLockIn} className="!max-w-[200px]">
            Lock In
          </Button>
        </div>
      )}

      {/* Hitster lock in */}
      {placementIndex !== null && !isDragging && hitsterNeedsPlacement && (
        <div className="flex justify-center py-2 px-4 shrink-0">
          <Button variant="primary" onClick={handleHitsterLockIn} className="!max-w-[200px]">
            Lock In (Hitster)
          </Button>
        </div>
      )}

      {/* Hitster button — non-current players during HITSTER_WINDOW */}
      {canHitster && (
        <div className="flex justify-center py-2 px-4 shrink-0">
          <HitsterButton
            timerSeconds={state.hitsterTimer}
            canHitster={canHitster}
            onClaim={handleHitsterClaim}
            disabled={false}
          />
        </div>
      )}

      {/* Skip turn */}
      {isMyTurn && state.phase === PHASES.LISTENING && myPlayer && myPlayer.tokens > 0 && (
        <div className="flex justify-center py-2 px-4 shrink-0">
          <Button variant="ghost" onClick={handleSkipTurn} className="!max-w-[200px]">
            Skip Turn (-1 token)
          </Button>
        </div>
      )}

      {/* Host: Reveal Answer (HITSTER_WINDOW) */}
      {isHost && state.phase === PHASES.HITSTER_WINDOW && (
        <div className="flex justify-center py-2 px-4 shrink-0">
          <Button variant="primary" onClick={handleReveal} className="!max-w-[200px]">
            Reveal Answer
          </Button>
        </div>
      )}

      {/* Reveal result */}
      {state.phase === PHASES.REVEAL && revealResultData && (
        <RevealResult revealResult={revealResultData} />
      )}

      {/* Token challenge (REVEAL phase) */}
      {isHost && state.phase === PHASES.REVEAL && (
        <TokenChallenge playerName={currentPlayerName} onAward={handleAwardToken} />
      )}

      {/* Next Turn (after TOKEN_CHALLENGE) */}
      {isHost && state.phase === PHASES.TOKEN_CHALLENGE && (
        <div className="flex justify-center py-2 px-4 shrink-0">
          <Button variant="primary" onClick={handleNextTurn} className="!max-w-[200px]">
            Next Turn
          </Button>
        </div>
      )}
    </div>
  );
}
