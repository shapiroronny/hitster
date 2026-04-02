import { describe, it, expect } from 'vitest';
import { createInitialState, gameReducer, PHASES } from '../src/state/gameState.js';

const TEST_SEED = 42;
const TEST_PLAYERS = ['Alice', 'Bob'];
const TEST_WIN_THRESHOLD = 5;
const TEST_HITSTER_TIMER = 30;

function makeState(overrides = {}) {
  const state = createInitialState({
    players: TEST_PLAYERS,
    winThreshold: TEST_WIN_THRESHOLD,
    hitsterTimer: TEST_HITSTER_TIMER,
    seed: TEST_SEED,
  });
  return { ...state, ...overrides };
}

describe('createInitialState', () => {
  it('creates state with correct phase and settings', () => {
    const state = makeState();
    expect(state.phase).toBe(PHASES.LISTENING);
    expect(state.winThreshold).toBe(TEST_WIN_THRESHOLD);
    expect(state.hitsterTimer).toBe(TEST_HITSTER_TIMER);
    expect(state.seed).toBe(TEST_SEED);
    expect(state.currentPlayerIndex).toBe(0);
  });

  it('creates the correct number of players', () => {
    const state = makeState();
    expect(state.players).toHaveLength(2);
  });

  it('each player starts with 2 tokens', () => {
    const state = makeState();
    for (const player of state.players) {
      expect(player.tokens).toBe(2);
    }
  });

  it('each player starts with 1 anchor song on timeline', () => {
    const state = makeState();
    for (const player of state.players) {
      expect(player.timeline).toHaveLength(1);
    }
  });

  it('currentSong is defined', () => {
    const state = makeState();
    expect(state.currentSong).toBeDefined();
    expect(state.currentSong).not.toBeNull();
  });

  it('players have correct ids', () => {
    const state = makeState();
    expect(state.players[0].id).toBe('Alice');
    expect(state.players[1].id).toBe('Bob');
  });
});

describe('gameReducer - LOCK_PLACEMENT', () => {
  it('transitions to HITSTER_WINDOW and records placement', () => {
    const state = makeState({ phase: PHASES.LISTENING });
    const nextState = gameReducer(state, {
      type: 'LOCK_PLACEMENT',
      playerId: state.players[0].id,
      insertIndex: 0,
    });
    expect(nextState.phase).toBe(PHASES.HITSTER_WINDOW);
    expect(nextState.placement).toEqual({ playerId: state.players[0].id, insertIndex: 0 });
  });
});

describe('gameReducer - CLAIM_HITSTER', () => {
  it('records hitster and costs a token', () => {
    const currentPlayer = { id: 'Alice', tokens: 2, timeline: [{ y: 1970 }] };
    const otherPlayer = { id: 'Bob', tokens: 2, timeline: [{ y: 1980 }] };
    const state = {
      ...makeState(),
      phase: PHASES.HITSTER_WINDOW,
      players: [currentPlayer, otherPlayer],
      currentPlayerIndex: 0,
      hitster: null,
    };

    const nextState = gameReducer(state, {
      type: 'CLAIM_HITSTER',
      playerId: 'Bob',
    });

    expect(nextState.hitster).toEqual({ playerId: 'Bob', insertIndex: null });
    const bob = nextState.players.find(p => p.id === 'Bob');
    expect(bob.tokens).toBe(1);
  });

  it('rejected if already claimed', () => {
    const state = {
      ...makeState(),
      phase: PHASES.HITSTER_WINDOW,
      currentPlayerIndex: 0,
      hitster: { playerId: 'Bob', insertIndex: null },
    };
    state.players[0].tokens = 2;
    state.players[1].tokens = 2;

    const nextState = gameReducer(state, {
      type: 'CLAIM_HITSTER',
      playerId: 'Bob',
    });

    // Should not change state (hitster already claimed)
    expect(nextState.hitster).toEqual({ playerId: 'Bob', insertIndex: null });
    const bob = nextState.players.find(p => p.id === 'Bob');
    // Token should NOT be deducted again
    expect(bob.tokens).toBe(2);
  });

  it('rejected if player is current player', () => {
    const state = {
      ...makeState(),
      phase: PHASES.HITSTER_WINDOW,
      currentPlayerIndex: 0,
      hitster: null,
    };
    const currentPlayerId = state.players[0].id;

    const nextState = gameReducer(state, {
      type: 'CLAIM_HITSTER',
      playerId: currentPlayerId,
    });

    expect(nextState.hitster).toBeNull();
  });

  it('rejected if player has 0 tokens', () => {
    const state = {
      ...makeState(),
      phase: PHASES.HITSTER_WINDOW,
      currentPlayerIndex: 0,
      hitster: null,
    };
    // Give Bob 0 tokens
    state.players[1] = { ...state.players[1], tokens: 0 };
    const bobId = state.players[1].id;

    const nextState = gameReducer(state, {
      type: 'CLAIM_HITSTER',
      playerId: bobId,
    });

    expect(nextState.hitster).toBeNull();
  });
});

describe('gameReducer - SKIP_TURN', () => {
  it('costs token and advances turn', () => {
    const state = {
      ...makeState(),
      phase: PHASES.HITSTER_WINDOW,
      currentPlayerIndex: 0,
    };
    const aliceId = state.players[0].id;
    const initialTokens = state.players[0].tokens;

    const nextState = gameReducer(state, {
      type: 'SKIP_TURN',
      playerId: aliceId,
    });

    const alice = nextState.players.find(p => p.id === aliceId);
    expect(alice.tokens).toBe(initialTokens - 1);
    expect(nextState.currentPlayerIndex).toBe(1);
    expect(nextState.phase).toBe(PHASES.LISTENING);
    expect(nextState.currentSong).toBeDefined();
  });
});

describe('gameReducer - REVEAL', () => {
  it('correct placement adds song to current player timeline', () => {
    // Alice has timeline: [{ y: 1980 }], she places a 1990 song after it (index 1)
    const song = { id: 'test', t: 'Test Song', a: 'Test Artist', y: 1990 };
    const state = {
      ...makeState(),
      phase: PHASES.PLACING,
      currentPlayerIndex: 0,
      currentSong: song,
      placement: { playerId: 'Alice', insertIndex: 1 },
      hitster: null,
    };
    state.players[0] = { ...state.players[0], id: 'Alice', timeline: [{ y: 1980 }] };
    state.players[1] = { ...state.players[1], id: 'Bob', timeline: [{ y: 1975 }] };

    const nextState = gameReducer(state, { type: 'REVEAL' });

    expect(nextState.phase).toBe(PHASES.REVEAL);
    expect(nextState.revealResult.playerCorrect).toBe(true);
    const alice = nextState.players.find(p => p.id === 'Alice');
    expect(alice.timeline).toHaveLength(2);
    expect(alice.timeline[1]).toMatchObject({ y: 1990 });
  });

  it('wrong placement does not add song to current player timeline', () => {
    // Alice places a 1960 song at index 1 (after 1980), which is wrong
    const song = { id: 'test', t: 'Test Song', a: 'Test Artist', y: 1960 };
    const state = {
      ...makeState(),
      phase: PHASES.PLACING,
      currentPlayerIndex: 0,
      currentSong: song,
      placement: { playerId: 'Alice', insertIndex: 1 },
      hitster: null,
    };
    state.players[0] = { ...state.players[0], id: 'Alice', timeline: [{ y: 1980 }] };
    state.players[1] = { ...state.players[1], id: 'Bob', timeline: [{ y: 1975 }] };

    const nextState = gameReducer(state, { type: 'REVEAL' });

    expect(nextState.phase).toBe(PHASES.REVEAL);
    expect(nextState.revealResult.playerCorrect).toBe(false);
    const alice = nextState.players.find(p => p.id === 'Alice');
    expect(alice.timeline).toHaveLength(1);
  });

  it('hitster correct placement adds song to hitster timeline', () => {
    const song = { id: 'test', t: 'Test Song', a: 'Test Artist', y: 1990 };
    const state = {
      ...makeState(),
      phase: PHASES.PLACING,
      currentPlayerIndex: 0,
      currentSong: song,
      // Alice places wrong (year 1960 at index 1 after 1980)
      placement: { playerId: 'Alice', insertIndex: 1 },
      hitster: { playerId: 'Bob', insertIndex: 1 },
    };
    state.players[0] = { ...state.players[0], id: 'Alice', timeline: [{ y: 1980 }] };
    state.players[1] = { ...state.players[1], id: 'Bob', timeline: [{ y: 1975 }] };
    // Override to make Alice wrong and Bob's hitster guess correct
    // Alice places 1960 after 1980 = wrong
    state.currentSong = { id: 'test', t: 'Test Song', a: 'Test Artist', y: 1960 };
    state.placement = { playerId: 'Alice', insertIndex: 1 }; // wrong: 1960 > 1980 fails
    state.hitster = { playerId: 'Bob', insertIndex: 0 }; // correct: 1960 at index 0 (before 1980)

    const nextState = gameReducer(state, { type: 'REVEAL' });

    expect(nextState.revealResult.playerCorrect).toBe(false);
    expect(nextState.revealResult.hitsterCorrect).toBe(true);
    const bob = nextState.players.find(p => p.id === 'Bob');
    expect(bob.timeline).toHaveLength(2);
  });
});

describe('gameReducer - AWARD_TOKEN', () => {
  it('gives current player +1 token when grant=true', () => {
    const state = {
      ...makeState(),
      phase: PHASES.REVEAL,
      currentPlayerIndex: 0,
    };
    const initialTokens = state.players[0].tokens;

    const nextState = gameReducer(state, { type: 'AWARD_TOKEN', grant: true });

    expect(nextState.phase).toBe(PHASES.TOKEN_CHALLENGE);
    const currentPlayer = nextState.players[0];
    expect(currentPlayer.tokens).toBe(initialTokens + 1);
  });

  it('does not give token when grant=false', () => {
    const state = {
      ...makeState(),
      phase: PHASES.REVEAL,
      currentPlayerIndex: 0,
    };
    const initialTokens = state.players[0].tokens;

    const nextState = gameReducer(state, { type: 'AWARD_TOKEN', grant: false });

    expect(nextState.phase).toBe(PHASES.TOKEN_CHALLENGE);
    const currentPlayer = nextState.players[0];
    expect(currentPlayer.tokens).toBe(initialTokens);
  });
});

describe('gameReducer - NEXT_TURN', () => {
  it('advances to next player and draws new song', () => {
    const state = {
      ...makeState(),
      phase: PHASES.TOKEN_CHALLENGE,
      currentPlayerIndex: 0,
    };

    const nextState = gameReducer(state, { type: 'NEXT_TURN' });

    expect(nextState.currentPlayerIndex).toBe(1);
    expect(nextState.phase).toBe(PHASES.LISTENING);
    expect(nextState.currentSong).toBeDefined();
    expect(nextState.placement).toBeNull();
    expect(nextState.hitster).toBeNull();
    expect(nextState.revealResult).toBeNull();
  });

  it('wraps player index back to 0', () => {
    const state = {
      ...makeState(),
      phase: PHASES.TOKEN_CHALLENGE,
      currentPlayerIndex: 1,
    };

    const nextState = gameReducer(state, { type: 'NEXT_TURN' });

    expect(nextState.currentPlayerIndex).toBe(0);
  });
});

describe('gameReducer - LOCK_HITSTER_PLACEMENT', () => {
  it('sets the hitster insertIndex', () => {
    const state = {
      ...makeState(),
      phase: PHASES.HITSTER_WINDOW,
      hitster: { playerId: 'Bob', insertIndex: null },
    };

    const nextState = gameReducer(state, {
      type: 'LOCK_HITSTER_PLACEMENT',
      playerId: 'Bob',
      insertIndex: 2,
    });

    expect(nextState.hitster).toEqual({ playerId: 'Bob', insertIndex: 2 });
  });
});
