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
  const { initialState, networkRef, isHost, spotifyToken, actionHandlerRef, stateUpdateRef } = gameData;

  // HOST: useReducer for authoritative state
  // PLAYER: useState that gets replaced by host broadcasts
  const [hostState, hostDispatch] = useReducer(gameReducer, initialState);
  const [playerState, setPlayerState] = useState(initialState);

  const state = isHost ? hostState : playerState;

  // Local UI state
  const [placementIndex, setPlacementIndex] = useState(null);
  const [spotifyReady, setSpotifyReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Drop zone refs for drag-and-drop
  const dropZoneRefs = useRef([]);

  // Determine identity
  const myId = isHost ? 'host' : networkRef.current?.getPlayerId();
  const currentPlayer = state.players[state.currentPlayerIndex];
  const currentPlayerName = currentPlayer?.name ?? '';
  const isMyTurn = currentPlayer?.id === myId;
  const myPlayerIndex = state.players.findIndex((p) => p.id === myId);
  const myPlayer = myPlayerIndex >= 0 ? state.players[myPlayerIndex] : null;

  // --- HOST: wire up action handler from lobby's peerHost ---
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

  // --- HOST: broadcast state and save on every change ---
  useEffect(() => {
    if (!isHost) return;
    // Strip song answer (t, a, y) from currentSong before reveal phase
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

  // --- PLAYER: wire up state update ref so lobby's peerPlayer updates us ---
  useEffect(() => {
    if (isHost || !stateUpdateRef) return;
    stateUpdateRef.current = setPlayerState;
    return () => {
      stateUpdateRef.current = null;
    };
  }, [isHost, stateUpdateRef]);

  // --- HOST: init Spotify ---
  useEffect(() => {
    if (!isHost || !spotifyToken) return;
    initSpotifyPlayer(spotifyToken.accessToken, {
      onReady: () => setSpotifyReady(true),
      onError: (msg) => console.error('Spotify error:', msg),
    });
  }, [isHost, spotifyToken]);

  // --- HOST: auto-advance from HITSTER_WINDOW to REVEAL when timer expires ---
  useEffect(() => {
    if (!isHost || state.phase !== PHASES.HITSTER_WINDOW) return;
    const timer = setTimeout(() => {
      hostDispatch({ type: 'REVEAL' });
    }, (state.hitsterTimer ?? 15) * 1000);
    return () => clearTimeout(timer);
  }, [isHost, state.phase, state.hitsterTimer]);

  // --- Stop song on phase change away from LISTENING ---
  useEffect(() => {
    if (isHost && state.phase !== PHASES.LISTENING && isPlaying) {
      stopSong().catch(() => {});
      setIsPlaying(false);
    }
  }, [isHost, state.phase, isPlaying]);

  // --- Drag and drop ---
  const handleDrop = useCallback(
    (index) => {
      setPlacementIndex(index);
    },
    []
  );

  const { isDragging, dragPos, activeDropZone, handlers } = useDragToTimeline(dropZoneRefs, handleDrop);

  // --- Which timeline to show ---
  const timelinePlayer = currentPlayer;
  const timelineSongs = timelinePlayer ? timelinePlayer.timeline : [];

  // --- Can drag logic ---
  const isHitster = state.hitster && state.hitster.playerId === myId;
  const hitsterNeedsPlacement = isHitster && state.hitster.insertIndex === null;
  const canDrag =
    ((isMyTurn && (state.phase === PHASES.LISTENING || state.phase === PHASES.PLACING) && placementIndex === null) ||
      (hitsterNeedsPlacement && state.phase === PHASES.HITSTER_WINDOW)) &&
    !isDragging;

  // --- Can hitster logic ---
  const canHitster =
    state.phase === PHASES.HITSTER_WINDOW &&
    !isMyTurn &&
    state.hitster === null &&
    myPlayer &&
    myPlayer.tokens > 0;

  // --- Playback controls ---
  const handlePlay = async () => {
    if (!spotifyReady || !state.currentSong) return;
    try {
      await playSong(spotifyToken.accessToken, state.currentSong.sid);
      setIsPlaying(true);
      hostDispatch({ type: 'START_PLACING' });
    } catch (err) {
      console.error('Play error:', err);
    }
  };

  const handlePause = async () => {
    try {
      await pauseSong();
      setIsPlaying(false);
    } catch (err) {
      console.error('Pause error:', err);
    }
  };

  const handleResume = async () => {
    try {
      await resumeSong();
      setIsPlaying(true);
    } catch (err) {
      console.error('Resume error:', err);
    }
  };

  // --- Lock in placement ---
  const handleLockIn = () => {
    if (placementIndex === null) return;
    if (isHost) {
      hostDispatch({ type: 'LOCK_PLACEMENT', playerId: myId, insertIndex: placementIndex });
    } else {
      networkRef.current?.send(PLAYER_MSG.LOCK_PLACEMENT, { insertIndex: placementIndex });
    }
    setPlacementIndex(null);
  };

  // --- Hitster claim ---
  const handleHitsterClaim = () => {
    if (isHost) {
      hostDispatch({ type: 'CLAIM_HITSTER', playerId: myId });
    } else {
      networkRef.current?.send(PLAYER_MSG.CLAIM_HITSTER, {});
    }
  };

  // --- Hitster lock in ---
  const handleHitsterLockIn = () => {
    if (placementIndex === null) return;
    if (isHost) {
      hostDispatch({ type: 'LOCK_HITSTER_PLACEMENT', playerId: myId, insertIndex: placementIndex });
    } else {
      networkRef.current?.send(PLAYER_MSG.LOCK_HITSTER_PLACEMENT, { insertIndex: placementIndex });
    }
    setPlacementIndex(null);
  };

  // --- Skip turn ---
  const handleSkipTurn = () => {
    if (isHost) {
      hostDispatch({ type: 'SKIP_TURN', playerId: myId });
    } else {
      networkRef.current?.send(PLAYER_MSG.SKIP_TURN, {});
    }
  };

  // --- Host: reveal answer ---
  const handleReveal = () => {
    hostDispatch({ type: 'REVEAL' });
  };

  // --- Host: award token ---
  const handleAwardToken = (grant) => {
    hostDispatch({ type: 'AWARD_TOKEN', grant });
  };

  // --- Host: next turn ---
  const handleNextTurn = () => {
    hostDispatch({ type: 'NEXT_TURN' });
    setIsPlaying(false);
  };

  // --- Host: keep playing after winner ---
  const handleKeepPlaying = () => {
    hostDispatch({ type: 'NEXT_TURN' });
    setIsPlaying(false);
  };

  // --- Build reveal result for RevealResult component ---
  const revealResultData =
    state.phase === PHASES.REVEAL && state.revealResult && state.currentSong
      ? {
          song: state.currentSong,
          playerCorrect: state.revealResult.playerCorrect,
          hitsterCorrect: state.revealResult.hitsterCorrect,
        }
      : null;

  // --- Show drop zones when dragging ---
  const showDropZones = canDrag || isDragging || placementIndex !== null;

  // --- Game Over screen ---
  if (state.winner && state.phase === PHASES.REVEAL) {
    const winnerPlayer = state.players.find((p) => p.id === state.winner);
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-[#0a0a1a] to-[#12122e] text-[#f0f0f0] overflow-hidden">
        <GameOver
          winnerName={winnerPlayer?.name ?? state.winner}
          onContinue={isHost ? handleKeepPlaying : undefined}
        />
        {revealResultData && <RevealResult revealResult={revealResultData} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a0a1a] to-[#12122e] text-[#f0f0f0] overflow-hidden">
      {/* Phase indicator */}
      <PhaseIndicator
        phase={state.phase}
        currentPlayerName={currentPlayerName}
        isMyTurn={isMyTurn}
      />

      {/* Player list */}
      <PlayerList players={state.players} currentPlayerIndex={state.currentPlayerIndex} />

      {/* Playback controls (host only, LISTENING phase) */}
      {isHost && (state.phase === PHASES.LISTENING || state.phase === PHASES.PLACING) && (
        <PlaybackControls
          onPlay={handlePlay}
          onPause={handlePause}
          onResume={handleResume}
          isPlaying={isPlaying}
        />
      )}

      {/* Draggable mystery card */}
      {(canDrag || isDragging) && (
        <DraggableMysteryCard
          isDragging={isDragging}
          dragPos={dragPos}
          handlers={handlers}
        />
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-2">
        <Timeline
          songs={timelineSongs}
          showDropZones={showDropZones}
          activeDropZone={activeDropZone}
          dropZoneRefs={dropZoneRefs}
          revealedSong={
            revealResultData
              ? {
                  id: state.currentSong.id,
                  result: state.revealResult.playerCorrect ? 'correct' : 'wrong',
                }
              : undefined
          }
        />
      </div>

      {/* Lock in button (current player placing) */}
      {placementIndex !== null && !isDragging && isMyTurn && !hitsterNeedsPlacement && (
        <div className="flex justify-center py-2 px-4 gap-2.5 shrink-0">
          <Button variant="primary" onClick={handleLockIn} className="!max-w-[200px]">
            Lock In
          </Button>
        </div>
      )}

      {/* Hitster lock in button */}
      {placementIndex !== null && !isDragging && hitsterNeedsPlacement && (
        <div className="flex justify-center py-2 px-4 gap-2.5 shrink-0">
          <Button variant="primary" onClick={handleHitsterLockIn} className="!max-w-[200px]">
            Lock In (Hitster)
          </Button>
        </div>
      )}

      {/* Hitster button (non-current players, HITSTER_WINDOW phase) */}
      {canHitster && (
        <div className="flex justify-center py-2 px-4 gap-2.5 shrink-0">
          <HitsterButton
            timerSeconds={state.hitsterTimer}
            canHitster={canHitster}
            onClaim={handleHitsterClaim}
            disabled={false}
          />
        </div>
      )}

      {/* Skip turn button (current player, LISTENING phase, has tokens) */}
      {isMyTurn && state.phase === PHASES.LISTENING && myPlayer && myPlayer.tokens > 0 && (
        <div className="flex justify-center py-2 px-4 gap-2.5 shrink-0">
          <Button variant="ghost" onClick={handleSkipTurn} className="!max-w-[200px]">
            Skip Turn (-1 token)
          </Button>
        </div>
      )}

      {/* Host: Reveal Answer button (HITSTER_WINDOW phase) */}
      {isHost && state.phase === PHASES.HITSTER_WINDOW && (
        <div className="flex justify-center py-2 px-4 gap-2.5 shrink-0">
          <Button variant="primary" onClick={handleReveal} className="!max-w-[200px]">
            Reveal Answer
          </Button>
        </div>
      )}

      {/* Reveal result */}
      {state.phase === PHASES.REVEAL && revealResultData && (
        <RevealResult revealResult={revealResultData} />
      )}

      {/* Host: Token challenge (REVEAL phase) */}
      {isHost && state.phase === PHASES.REVEAL && (
        <TokenChallenge
          playerName={currentPlayerName}
          onAward={handleAwardToken}
        />
      )}

      {/* Host: Next Turn button (TOKEN_CHALLENGE phase) */}
      {isHost && state.phase === PHASES.TOKEN_CHALLENGE && (
        <div className="flex justify-center py-2 px-4 gap-2.5 shrink-0">
          <Button variant="primary" onClick={handleNextTurn} className="!max-w-[200px]">
            Next Turn
          </Button>
        </div>
      )}
    </div>
  );
}
