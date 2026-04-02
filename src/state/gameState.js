import songs from '../data/songs.json';
import { createSongPicker } from '../songs/songPicker.js';
import { isPlacementCorrect } from './gameLogic.js';

export const PHASES = {
  LISTENING: 'LISTENING',
  PLACING: 'PLACING',
  HITSTER_WINDOW: 'HITSTER_WINDOW',
  REVEAL: 'REVEAL',
  TOKEN_CHALLENGE: 'TOKEN_CHALLENGE',
  GAME_OVER: 'GAME_OVER',
};

export function createInitialState({ players, winThreshold, hitsterTimer, seed }) {
  // We need to draw 1 anchor per player + 1 currentSong
  const picker = createSongPicker(songs, seed, 0);

  // players is an array of { id, name } objects
  const playerObjects = players.map((p) => {
    const anchor = picker.draw();
    return {
      id: p.id,
      name: p.name,
      tokens: 2,
      timeline: [anchor],
    };
  });

  const currentSong = picker.draw();

  return {
    phase: PHASES.LISTENING,
    players: playerObjects,
    currentPlayerIndex: 0,
    currentSong,
    placement: null,
    hitster: null,
    revealResult: null,
    winner: null,
    winThreshold,
    hitsterTimer,
    seed,
    drawIndex: picker.drawIndex(),
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'START_PLACING': {
      return { ...state, phase: PHASES.PLACING };
    }

    case 'LOCK_PLACEMENT': {
      return {
        ...state,
        phase: PHASES.HITSTER_WINDOW,
        placement: { playerId: action.playerId, insertIndex: action.insertIndex },
      };
    }

    case 'CLAIM_HITSTER': {
      const { playerId } = action;
      const currentPlayerId = state.players[state.currentPlayerIndex].id;

      // Reject if already claimed
      if (state.hitster !== null) return state;
      // Reject if current player
      if (playerId === currentPlayerId) return state;
      // Reject if player has 0 tokens
      const claimingPlayer = state.players.find(p => p.id === playerId);
      if (!claimingPlayer || claimingPlayer.tokens <= 0) return state;

      const updatedPlayers = state.players.map(p =>
        p.id === playerId ? { ...p, tokens: p.tokens - 1 } : p
      );

      return {
        ...state,
        players: updatedPlayers,
        hitster: { playerId, insertIndex: null },
      };
    }

    case 'LOCK_HITSTER_PLACEMENT': {
      const { playerId, insertIndex } = action;
      if (!state.hitster || state.hitster.playerId !== playerId) return state;
      return {
        ...state,
        hitster: { ...state.hitster, insertIndex },
      };
    }

    case 'SKIP_TURN': {
      const { playerId } = action;
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (currentPlayer.id !== playerId) return state;
      if (currentPlayer.tokens <= 0) return state;

      const updatedPlayers = state.players.map(p =>
        p.id === playerId ? { ...p, tokens: p.tokens - 1 } : p
      );

      const picker = createSongPicker(songs, state.seed, state.drawIndex);
      const nextSong = picker.draw();
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

      return {
        ...state,
        phase: nextSong ? PHASES.LISTENING : PHASES.GAME_OVER,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        currentSong: nextSong,
        placement: null,
        hitster: null,
        revealResult: null,
        drawIndex: picker.drawIndex(),
      };
    }

    case 'REVEAL': {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const { currentSong, placement, hitster } = state;

      // Evaluate current player placement against their own timeline
      const playerCorrect = placement
        ? isPlacementCorrect(currentPlayer.timeline, placement.insertIndex, currentSong.y)
        : false;

      // Evaluate hitster placement against current player's timeline (before modification)
      const hitsterCorrect = hitster && hitster.insertIndex !== null
        ? isPlacementCorrect(currentPlayer.timeline, hitster.insertIndex, currentSong.y)
        : false;

      let updatedPlayers = state.players;

      if (playerCorrect) {
        // Add song to current player's timeline at the specified insertIndex
        updatedPlayers = updatedPlayers.map(p => {
          if (p.id !== currentPlayer.id) return p;
          const newTimeline = [...p.timeline];
          newTimeline.splice(placement.insertIndex, 0, currentSong);
          return { ...p, timeline: newTimeline };
        });
      } else if (hitsterCorrect) {
        // Add song to hitster's timeline sorted by year
        const hitterId = hitster.playerId;
        updatedPlayers = updatedPlayers.map(p => {
          if (p.id !== hitterId) return p;
          const newTimeline = [...p.timeline, currentSong].sort((a, b) => a.y - b.y);
          return { ...p, timeline: newTimeline };
        });
      }

      // Check for winner: timeline.length >= winThreshold + 1 (the +1 is for the anchor)
      let winner = null;
      for (const p of updatedPlayers) {
        if (p.timeline.length >= state.winThreshold + 1) {
          winner = p.id;
          break;
        }
      }

      return {
        ...state,
        phase: PHASES.REVEAL,
        players: updatedPlayers,
        revealResult: { playerCorrect, hitsterCorrect },
        winner,
      };
    }

    case 'AWARD_TOKEN': {
      const { grant } = action;
      let updatedPlayers = state.players;
      if (grant) {
        const currentPlayerId = state.players[state.currentPlayerIndex].id;
        updatedPlayers = state.players.map(p =>
          p.id === currentPlayerId ? { ...p, tokens: p.tokens + 1 } : p
        );
      }
      return {
        ...state,
        phase: PHASES.TOKEN_CHALLENGE,
        players: updatedPlayers,
      };
    }

    case 'NEXT_TURN': {
      const picker = createSongPicker(songs, state.seed, state.drawIndex);
      const nextSong = picker.draw();
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

      return {
        ...state,
        phase: nextSong ? PHASES.LISTENING : PHASES.GAME_OVER,
        currentPlayerIndex: nextPlayerIndex,
        currentSong: nextSong,
        placement: null,
        hitster: null,
        revealResult: null,
        drawIndex: picker.drawIndex(),
      };
    }

    default:
      return state;
  }
}
