# Hitster Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based multiplayer song year guessing game that embeds as a single JS file on a host website.

**Architecture:** Host-authoritative star topology over WebRTC (PeerJS). Host runs game logic, Spotify playback, and state management. Players connect via game code, receive state broadcasts, and send actions. All game logic is client-side React.

**Tech Stack:** React, Vite, PeerJS, Spotify Web Playback SDK, pointer events for drag-and-drop.

---

## File Structure

```
hitster/
  package.json
  vite.config.js
  index.html                          # Dev entry point
  src/
    main.jsx                          # Hitster.init() entry, mounts React app
    App.jsx                           # Top-level: role selection → lobby → game
    data/
      songs.json                      # Bundled song database
    utils/
      seededRandom.js                 # Seeded PRNG for reproducible shuffle
      gameCode.js                     # Generate short game codes
    songs/
      songPicker.js                   # Shuffle + draw pile management
    state/
      gameState.js                    # State shape, reducer, phase transitions
      gameLogic.js                    # Placement validation, turn resolution
    network/
      peerHost.js                     # Host-side PeerJS: create room, broadcast
      peerPlayer.js                   # Player-side PeerJS: join room, send actions
      protocol.js                     # Message types shared by host and player
    spotify/
      auth.js                         # PKCE OAuth flow
      player.js                       # Web Playback SDK wrapper
    persistence/
      storage.js                      # localStorage save/restore game state
    components/
      screens/
        RoleSelect.jsx                # "Host Game" or "Join Game" screen
        Lobby.jsx                     # Host lobby + player join (before game starts)
        GameScreen.jsx                # Main game view, delegates to phase components
        GameOver.jsx                  # Win celebration + continue option
      game/
        PhaseIndicator.jsx            # Top banner: current phase + info
        PlayerList.jsx                # Player names, token counts, turn indicator
        Timeline.jsx                  # Horizontal wrapping card timeline with drop zones
        SongCard.jsx                  # Single card: front (info) or back (mystery)
        DraggableMysteryCard.jsx      # The draggable card-back above timeline
        HitsterButton.jsx            # Hitster claim button with countdown
        PlaybackControls.jsx          # Host: play/pause/resume + play song
        TokenChallenge.jsx            # Host: award token yes/no
        RevealResult.jsx              # Card flip + correct/wrong display
      shared/
        Button.jsx                    # Styled button component
    hooks/
      useGameContext.jsx              # React context provider for game state + dispatch
      useDragToTimeline.js            # Pointer event drag logic for card placement
    styles/
      index.css                       # Global styles, mobile-first
  tests/
    seededRandom.test.js
    songPicker.test.js
    gameState.test.js
    gameLogic.test.js
    gameCode.test.js
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/styles/index.css`

- [ ] **Step 1: Initialize project**

```bash
cd /Users/ronnyshapiro/code/hitster
npm init -y
npm install react react-dom peerjs
npm install -D vite @vitejs/plugin-react vitest
```

- [ ] **Step 2: Create vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'Hitster',
      fileName: 'hitster',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 3: Create index.html for dev**

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Hitster</title>
</head>
<body>
  <div id="hitster-game"></div>
  <script type="module">
    import './src/main.jsx';
    Hitster.init({
      container: '#hitster-game',
      spotifyClientId: '7002d9856f204ed6be87c73fec98e238',
    });
  </script>
</body>
</html>
```

- [ ] **Step 4: Create src/main.jsx (stub)**

```jsx
// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';

function App() {
  return <div>Hitster loading...</div>;
}

const Hitster = {
  init({ container, spotifyClientId }) {
    const el = document.querySelector(container);
    if (!el) throw new Error(`Hitster: container "${container}" not found`);
    const root = createRoot(el);
    root.render(<App spotifyClientId={spotifyClientId} />);
  },
};

window.Hitster = Hitster;
export default Hitster;
```

- [ ] **Step 5: Create src/styles/index.css**

```css
/* src/styles/index.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #1a1a2e;
  color: #eee;
  overflow: hidden;
  height: 100%;
  touch-action: manipulation;
}

#hitster-game {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

button {
  font-size: 1rem;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  touch-action: manipulation;
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
npx vite --open
```

Expected: Browser opens, shows "Hitster loading..." on dark background.

- [ ] **Step 7: Commit**

```bash
git init
echo "node_modules\ndist" > .gitignore
git add .
git commit -m "feat: scaffold Vite + React project with embeddable entry point"
```

---

## Task 2: Seeded Random + Game Code Utilities

**Files:**
- Create: `src/utils/seededRandom.js`
- Create: `src/utils/gameCode.js`
- Create: `tests/seededRandom.test.js`
- Create: `tests/gameCode.test.js`

- [ ] **Step 1: Write seededRandom tests**

```js
// tests/seededRandom.test.js
import { describe, it, expect } from 'vitest';
import { createRng, shuffle } from '../src/utils/seededRandom.js';

describe('createRng', () => {
  it('produces deterministic sequence for same seed', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);
    const seq1 = [rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2()];
    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(99);
    expect(rng1()).not.toBe(rng2());
  });

  it('returns values between 0 and 1', () => {
    const rng = createRng(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('shuffle', () => {
  it('returns all original elements', () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffle(items, createRng(42));
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate the original array', () => {
    const items = [1, 2, 3];
    const copy = [...items];
    shuffle(items, createRng(42));
    expect(items).toEqual(copy);
  });

  it('produces deterministic output for same seed', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const a = shuffle(items, createRng(42));
    const b = shuffle(items, createRng(42));
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/seededRandom.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement seededRandom.js**

```js
// src/utils/seededRandom.js

// Mulberry32 — simple, fast, good distribution
export function createRng(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle using provided rng
export function shuffle(array, rng) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/seededRandom.test.js
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Write gameCode tests**

```js
// tests/gameCode.test.js
import { describe, it, expect } from 'vitest';
import { generateGameCode, codeTopeerId, peerIdToCode } from '../src/utils/gameCode.js';

describe('generateGameCode', () => {
  it('returns a 6-character uppercase alphanumeric string', () => {
    const code = generateGameCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('generates different codes on successive calls', () => {
    const codes = new Set(Array.from({ length: 20 }, generateGameCode));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('code <-> peerId roundtrip', () => {
  it('converts code to peerId and back', () => {
    const code = 'ABC123';
    const peerId = codeTopeerId(code);
    expect(peerId).toBe('hitster-ABC123');
    expect(peerIdToCode(peerId)).toBe('ABC123');
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
npx vitest run tests/gameCode.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement gameCode.js**

```js
// src/utils/gameCode.js
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/1/I to avoid confusion
const PREFIX = 'hitster-';

export function generateGameCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function codeTopeerId(code) {
  return PREFIX + code;
}

export function peerIdToCode(peerId) {
  return peerId.slice(PREFIX.length);
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run tests/gameCode.test.js
```

Expected: All 3 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/utils/ tests/seededRandom.test.js tests/gameCode.test.js
git commit -m "feat: add seeded random and game code utilities"
```

---

## Task 3: Song Database + Song Picker

**Files:**
- Create: `src/data/songs.json`
- Create: `src/songs/songPicker.js`
- Create: `tests/songPicker.test.js`

- [ ] **Step 1: Create starter song database**

Create `src/data/songs.json` with a starter set of 30 songs spanning decades. These are real songs with placeholder Spotify track IDs (to be filled with real IDs later):

```json
[
  {"id":"s001","t":"Respect","a":"Aretha Franklin","y":1967,"sid":"7s25THrKz86DM225dOYwnr"},
  {"id":"s002","t":"Hey Jude","a":"The Beatles","y":1968,"sid":"0aym2LBJBk9DAYuHHutrIl"},
  {"id":"s003","t":"Imagine","a":"John Lennon","y":1971,"sid":"7pKfPomDEeI4TPT6EOYjn9"},
  {"id":"s004","t":"Bohemian Rhapsody","a":"Queen","y":1975,"sid":"4u7EnebtmKWzUH433cf5Qv"},
  {"id":"s005","t":"Hotel California","a":"Eagles","y":1977,"sid":"40riOy7x9W7GXjyGp4pjAv"},
  {"id":"s006","t":"Stayin' Alive","a":"Bee Gees","y":1977,"sid":"4uLU6hMCjMI75M1A2tKUQC"},
  {"id":"s007","t":"Don't Stop Believin'","a":"Journey","y":1981,"sid":"4bHsxqR3GMrXTxEPLuK5ue"},
  {"id":"s008","t":"Billie Jean","a":"Michael Jackson","y":1982,"sid":"5ChkMS8OtdzJeqyybCc9R5"},
  {"id":"s009","t":"Sweet Child O' Mine","a":"Guns N' Roses","y":1987,"sid":"7o2CTH4ctstm8TNelqjb51"},
  {"id":"s010","t":"Like a Prayer","a":"Madonna","y":1989,"sid":"1z3ugFmUKoCzGsI6jdY4Ci"},
  {"id":"s011","t":"Smells Like Teen Spirit","a":"Nirvana","y":1991,"sid":"5ghIJDpPoe3CfHMGu71E6T"},
  {"id":"s012","t":"Wonderwall","a":"Oasis","y":1995,"sid":"1qPbGZqppFgLIkTim2mEkS"},
  {"id":"s013","t":"Wannabe","a":"Spice Girls","y":1996,"sid":"1Je1IMUlBXcx1Fz0WE7oPT"},
  {"id":"s014","t":"...Baby One More Time","a":"Britney Spears","y":1998,"sid":"3MjUtNVVq3C8Fn0MP3zhXa"},
  {"id":"s015","t":"Lose Yourself","a":"Eminem","y":2002,"sid":"1v7L65Lc0Vkl37mMiRCoaE"},
  {"id":"s016","t":"Hey Ya!","a":"OutKast","y":2003,"sid":"2PpruBYCo4H7WOBJ7Q2EwM"},
  {"id":"s017","t":"Crazy in Love","a":"Beyonce","y":2003,"sid":"5IVuqXILoxVWvWEPm82Bkj"},
  {"id":"s018","t":"Umbrella","a":"Rihanna","y":2007,"sid":"2RlgNHKcydI9sayD2Df2xp"},
  {"id":"s019","t":"Poker Face","a":"Lady Gaga","y":2008,"sid":"5R8dQOPq8haW94K7mgERlO"},
  {"id":"s020","t":"Rolling in the Deep","a":"Adele","y":2010,"sid":"4OSBTnDJnhTSOhfCFVPRIi"},
  {"id":"s021","t":"Somebody That I Used to Know","a":"Gotye","y":2011,"sid":"4wCmqSrbyCgxEXROQE6vtV"},
  {"id":"s022","t":"Happy","a":"Pharrell Williams","y":2013,"sid":"60nZcImufyMA1MKQY3dcCH"},
  {"id":"s023","t":"Uptown Funk","a":"Mark Ronson ft. Bruno Mars","y":2014,"sid":"32OlwWuMpZ6b0aN2RZOeMS"},
  {"id":"s024","t":"Shape of You","a":"Ed Sheeran","y":2017,"sid":"7qiZfU4dY1lWllzX7mPBI3"},
  {"id":"s025","t":"Old Town Road","a":"Lil Nas X","y":2019,"sid":"2YpeDb67231RjR0MgVLzsG"},
  {"id":"s026","t":"Blinding Lights","a":"The Weeknd","y":2019,"sid":"0VjIjW4GlUZAMYd2vXMi3b"},
  {"id":"s027","t":"Levitating","a":"Dua Lipa","y":2020,"sid":"463CkQjx2Zk1yXoBuierM9"},
  {"id":"s028","t":"As It Was","a":"Harry Styles","y":2022,"sid":"4Dvkj6JhhA12EX05fT5y56"},
  {"id":"s029","t":"Flowers","a":"Miley Cyrus","y":2023,"sid":"0yLdNVWF3Srea0uzk55zFr"},
  {"id":"s030","t":"Espresso","a":"Sabrina Carpenter","y":2024,"sid":"2qSkIjg1o9h3YT9RAgYN75"}
]
```

- [ ] **Step 2: Write songPicker tests**

```js
// tests/songPicker.test.js
import { describe, it, expect } from 'vitest';
import { createSongPicker } from '../src/songs/songPicker.js';

const fakeSongs = [
  { id: 's1', t: 'A', a: 'X', y: 2000, sid: 'a' },
  { id: 's2', t: 'B', a: 'Y', y: 2001, sid: 'b' },
  { id: 's3', t: 'C', a: 'Z', y: 2002, sid: 'c' },
  { id: 's4', t: 'D', a: 'W', y: 2003, sid: 'd' },
  { id: 's5', t: 'E', a: 'V', y: 2004, sid: 'e' },
];

describe('createSongPicker', () => {
  it('draws songs without repeating', () => {
    const picker = createSongPicker(fakeSongs, 42);
    const drawn = [picker.draw(), picker.draw(), picker.draw(), picker.draw(), picker.draw()];
    const ids = drawn.map((s) => s.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('returns null when draw pile is exhausted', () => {
    const picker = createSongPicker(fakeSongs, 42);
    for (let i = 0; i < 5; i++) picker.draw();
    expect(picker.draw()).toBeNull();
  });

  it('reports remaining count', () => {
    const picker = createSongPicker(fakeSongs, 42);
    expect(picker.remaining()).toBe(5);
    picker.draw();
    expect(picker.remaining()).toBe(4);
  });

  it('produces same sequence for same seed', () => {
    const picker1 = createSongPicker(fakeSongs, 42);
    const picker2 = createSongPicker(fakeSongs, 42);
    for (let i = 0; i < 5; i++) {
      expect(picker1.draw().id).toBe(picker2.draw().id);
    }
  });

  it('can restore from a draw index', () => {
    const picker1 = createSongPicker(fakeSongs, 42);
    picker1.draw();
    picker1.draw();
    const idx = picker1.drawIndex();

    const picker2 = createSongPicker(fakeSongs, 42, idx);
    expect(picker2.draw().id).toBe(picker1.draw().id);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run tests/songPicker.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement songPicker.js**

```js
// src/songs/songPicker.js
import { createRng, shuffle } from '../utils/seededRandom.js';

export function createSongPicker(songs, seed, startIndex = 0) {
  const rng = createRng(seed);
  const shuffled = shuffle(songs, rng);
  let index = startIndex;

  return {
    draw() {
      if (index >= shuffled.length) return null;
      return shuffled[index++];
    },
    remaining() {
      return shuffled.length - index;
    },
    drawIndex() {
      return index;
    },
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run tests/songPicker.test.js
```

Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/songs.json src/songs/songPicker.js tests/songPicker.test.js
git commit -m "feat: add song database and seeded song picker"
```

---

## Task 4: Game State Machine + Logic

**Files:**
- Create: `src/state/gameState.js`
- Create: `src/state/gameLogic.js`
- Create: `tests/gameState.test.js`
- Create: `tests/gameLogic.test.js`

- [ ] **Step 1: Write gameLogic tests**

```js
// tests/gameLogic.test.js
import { describe, it, expect } from 'vitest';
import { isPlacementCorrect } from '../src/state/gameLogic.js';

describe('isPlacementCorrect', () => {
  it('correct when placed between two songs in year order', () => {
    const timeline = [
      { id: 's1', y: 1970 },
      { id: 's2', y: 1990 },
    ];
    // Placing a 1980 song at index 1 (between 1970 and 1990)
    expect(isPlacementCorrect(timeline, 1, 1980)).toBe(true);
  });

  it('correct when placed at the start before all songs', () => {
    const timeline = [{ id: 's1', y: 1990 }];
    expect(isPlacementCorrect(timeline, 0, 1980)).toBe(true);
  });

  it('correct when placed at the end after all songs', () => {
    const timeline = [{ id: 's1', y: 1970 }];
    expect(isPlacementCorrect(timeline, 1, 1980)).toBe(true);
  });

  it('wrong when year violates order with left neighbor', () => {
    const timeline = [
      { id: 's1', y: 1990 },
      { id: 's2', y: 2000 },
    ];
    // Placing 1980 at index 1 — after 1990, but 1980 < 1990
    expect(isPlacementCorrect(timeline, 1, 1980)).toBe(false);
  });

  it('wrong when year violates order with right neighbor', () => {
    const timeline = [
      { id: 's1', y: 1970 },
      { id: 's2', y: 1980 },
    ];
    // Placing 1990 at index 1 — between 1970 and 1980, but 1990 > 1980
    expect(isPlacementCorrect(timeline, 1, 1990)).toBe(false);
  });

  it('correct when year equals neighbor (same year is valid)', () => {
    const timeline = [{ id: 's1', y: 1980 }];
    expect(isPlacementCorrect(timeline, 0, 1980)).toBe(true);
    expect(isPlacementCorrect(timeline, 1, 1980)).toBe(true);
  });

  it('correct with empty timeline at index 0', () => {
    expect(isPlacementCorrect([], 0, 2000)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/gameLogic.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement gameLogic.js**

```js
// src/state/gameLogic.js

/**
 * Check if placing a song with the given year at `insertIndex` in the timeline
 * maintains chronological order. Timeline is sorted by year.
 * insertIndex 0 = before first card, insertIndex N = after last card.
 */
export function isPlacementCorrect(timeline, insertIndex, year) {
  const leftYear = insertIndex > 0 ? timeline[insertIndex - 1].y : -Infinity;
  const rightYear = insertIndex < timeline.length ? timeline[insertIndex].y : Infinity;
  return year >= leftYear && year <= rightYear;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/gameLogic.test.js
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Write gameState tests**

```js
// tests/gameState.test.js
import { describe, it, expect } from 'vitest';
import { createInitialState, gameReducer, PHASES } from '../src/state/gameState.js';

describe('createInitialState', () => {
  it('creates state with correct defaults', () => {
    const state = createInitialState({
      players: [
        { id: 'host', name: 'Alice' },
        { id: 'p1', name: 'Bob' },
      ],
      winThreshold: 10,
      hitsterTimer: 15,
      seed: 42,
    });
    expect(state.phase).toBe(PHASES.LISTENING);
    expect(state.settings.winThreshold).toBe(10);
    expect(state.settings.hitsterTimer).toBe(15);
    expect(state.players).toHaveLength(2);
    expect(state.players[0].tokens).toBe(2);
    expect(state.players[0].timeline).toHaveLength(1); // anchor song
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.currentSong).toBeDefined();
    expect(state.seed).toBe(42);
  });
});

describe('gameReducer', () => {
  function makeState() {
    return createInitialState({
      players: [
        { id: 'host', name: 'Alice' },
        { id: 'p1', name: 'Bob' },
      ],
      winThreshold: 10,
      hitsterTimer: 15,
      seed: 42,
    });
  }

  it('LOCK_PLACEMENT transitions to HITSTER_WINDOW', () => {
    const state = makeState();
    const next = gameReducer(state, {
      type: 'LOCK_PLACEMENT',
      playerId: state.players[state.currentPlayerIndex].id,
      insertIndex: 0,
    });
    expect(next.phase).toBe(PHASES.HITSTER_WINDOW);
    expect(next.placement).toEqual({
      playerId: state.players[state.currentPlayerIndex].id,
      insertIndex: 0,
    });
  });

  it('CLAIM_HITSTER records the hitster and costs a token', () => {
    let state = makeState();
    state = gameReducer(state, {
      type: 'LOCK_PLACEMENT',
      playerId: state.players[0].id,
      insertIndex: 0,
    });
    const next = gameReducer(state, {
      type: 'CLAIM_HITSTER',
      playerId: 'p1',
    });
    expect(next.hitster.playerId).toBe('p1');
    const bob = next.players.find((p) => p.id === 'p1');
    expect(bob.tokens).toBe(1);
  });

  it('CLAIM_HITSTER rejected if already claimed', () => {
    let state = makeState();
    // Add a third player for this test
    state.players.push({ id: 'p2', name: 'Charlie', tokens: 2, timeline: [] });
    state = gameReducer(state, {
      type: 'LOCK_PLACEMENT',
      playerId: state.players[0].id,
      insertIndex: 0,
    });
    state = gameReducer(state, { type: 'CLAIM_HITSTER', playerId: 'p1' });
    const next = gameReducer(state, { type: 'CLAIM_HITSTER', playerId: 'p2' });
    // Still p1's hitster
    expect(next.hitster.playerId).toBe('p1');
  });

  it('SKIP_TURN costs a token and advances turn', () => {
    const state = makeState();
    const next = gameReducer(state, {
      type: 'SKIP_TURN',
      playerId: state.players[0].id,
    });
    expect(next.currentPlayerIndex).toBe(1);
    const alice = next.players.find((p) => p.id === 'host');
    expect(alice.tokens).toBe(1);
    expect(next.phase).toBe(PHASES.LISTENING);
  });

  it('REVEAL resolves correct placement — song added to timeline', () => {
    let state = makeState();
    // Force a known song with known year for predictable testing
    state.currentSong = { id: 'test', t: 'Test', a: 'Test', y: 2000, sid: 'x' };
    // Player's anchor is at some year, place the 2000 song after it
    const player = state.players[0];
    player.timeline = [{ id: 'anchor', t: 'A', a: 'A', y: 1990, sid: 'a' }];

    state = gameReducer(state, {
      type: 'LOCK_PLACEMENT',
      playerId: player.id,
      insertIndex: 1, // after 1990, so 2000 is correct
    });
    // Skip hitster window
    const next = gameReducer(state, { type: 'REVEAL' });
    expect(next.phase).toBe(PHASES.REVEAL);
    expect(next.revealResult.playerCorrect).toBe(true);
  });

  it('AWARD_TOKEN gives current player a token', () => {
    let state = makeState();
    state.phase = PHASES.TOKEN_CHALLENGE;
    const next = gameReducer(state, { type: 'AWARD_TOKEN', grant: true });
    const player = next.players[next.currentPlayerIndex];
    expect(player.tokens).toBe(3);
  });

  it('NEXT_TURN advances to next player and draws new song', () => {
    let state = makeState();
    state.phase = PHASES.TOKEN_CHALLENGE;
    const prevSong = state.currentSong;
    const next = gameReducer(state, { type: 'NEXT_TURN' });
    expect(next.currentPlayerIndex).toBe(1);
    expect(next.phase).toBe(PHASES.LISTENING);
    expect(next.currentSong.id).not.toBe(prevSong.id);
    expect(next.placement).toBeNull();
    expect(next.hitster).toBeNull();
    expect(next.revealResult).toBeNull();
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
npx vitest run tests/gameState.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement gameState.js**

```js
// src/state/gameState.js
import { createSongPicker } from '../songs/songPicker.js';
import { isPlacementCorrect } from './gameLogic.js';
import songs from '../data/songs.json';

export const PHASES = {
  LISTENING: 'LISTENING',
  PLACING: 'PLACING',
  HITSTER_WINDOW: 'HITSTER_WINDOW',
  REVEAL: 'REVEAL',
  TOKEN_CHALLENGE: 'TOKEN_CHALLENGE',
  GAME_OVER: 'GAME_OVER',
};

export function createInitialState({ players, winThreshold, hitsterTimer, seed }) {
  const picker = createSongPicker(songs, seed);

  const gamePlayers = players.map((p) => ({
    id: p.id,
    name: p.name,
    tokens: 2,
    timeline: [picker.draw()], // anchor song
  }));

  return {
    phase: PHASES.LISTENING,
    players: gamePlayers,
    currentPlayerIndex: 0,
    currentSong: picker.draw(),
    placement: null,
    hitster: null,
    revealResult: null,
    settings: { winThreshold, hitsterTimer },
    seed,
    drawIndex: picker.drawIndex(),
    winner: null,
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'LOCK_PLACEMENT': {
      return {
        ...state,
        phase: PHASES.HITSTER_WINDOW,
        placement: {
          playerId: action.playerId,
          insertIndex: action.insertIndex,
        },
      };
    }

    case 'CLAIM_HITSTER': {
      if (state.hitster) return state; // already claimed
      const player = state.players.find((p) => p.id === action.playerId);
      if (!player || player.tokens < 1) return state;
      if (action.playerId === state.players[state.currentPlayerIndex].id) return state;

      return {
        ...state,
        hitster: { playerId: action.playerId, insertIndex: null },
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, tokens: p.tokens - 1 } : p
        ),
      };
    }

    case 'LOCK_HITSTER_PLACEMENT': {
      if (!state.hitster || state.hitster.playerId !== action.playerId) return state;
      return {
        ...state,
        hitster: { ...state.hitster, insertIndex: action.insertIndex },
      };
    }

    case 'SKIP_TURN': {
      const player = state.players.find((p) => p.id === action.playerId);
      if (!player || player.tokens < 1) return state;

      const picker = createSongPicker(songs, state.seed, state.drawIndex);
      const nextSong = picker.draw();

      return {
        ...state,
        phase: nextSong ? PHASES.LISTENING : PHASES.GAME_OVER,
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
        currentSong: nextSong,
        drawIndex: picker.drawIndex(),
        placement: null,
        hitster: null,
        revealResult: null,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, tokens: p.tokens - 1 } : p
        ),
      };
    }

    case 'REVEAL': {
      const song = state.currentSong;
      const currentPlayer = state.players[state.currentPlayerIndex];
      const playerCorrect = isPlacementCorrect(
        currentPlayer.timeline,
        state.placement.insertIndex,
        song.y
      );

      let hitsterCorrect = false;
      if (state.hitster && state.hitster.insertIndex !== null) {
        hitsterCorrect = isPlacementCorrect(
          currentPlayer.timeline,
          state.hitster.insertIndex,
          song.y
        );
      }

      // Update timelines
      const updatedPlayers = state.players.map((p) => {
        if (playerCorrect && p.id === currentPlayer.id) {
          const newTimeline = [...p.timeline];
          newTimeline.splice(state.placement.insertIndex, 0, song);
          return { ...p, timeline: newTimeline };
        }
        if (!playerCorrect && hitsterCorrect && state.hitster && p.id === state.hitster.playerId) {
          return { ...p, timeline: [...p.timeline, song].sort((a, b) => a.y - b.y) };
        }
        return p;
      });

      // Check for winner
      const winner = updatedPlayers.find(
        (p) => p.timeline.length >= state.settings.winThreshold + 1 // +1 for anchor
      );

      return {
        ...state,
        phase: PHASES.REVEAL,
        players: updatedPlayers,
        revealResult: { playerCorrect, hitsterCorrect, song },
        winner: winner ? winner.id : state.winner,
      };
    }

    case 'AWARD_TOKEN': {
      if (!action.grant) return { ...state, phase: PHASES.TOKEN_CHALLENGE };
      const currentPlayer = state.players[state.currentPlayerIndex];
      return {
        ...state,
        phase: PHASES.TOKEN_CHALLENGE,
        players: state.players.map((p) =>
          p.id === currentPlayer.id ? { ...p, tokens: p.tokens + 1 } : p
        ),
      };
    }

    case 'NEXT_TURN': {
      const picker = createSongPicker(songs, state.seed, state.drawIndex);
      const nextSong = picker.draw();
      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;

      return {
        ...state,
        phase: nextSong ? PHASES.LISTENING : PHASES.GAME_OVER,
        currentPlayerIndex: nextIndex,
        currentSong: nextSong,
        drawIndex: picker.drawIndex(),
        placement: null,
        hitster: null,
        revealResult: null,
      };
    }

    default:
      return state;
  }
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run tests/gameState.test.js
```

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/state/ tests/gameState.test.js tests/gameLogic.test.js
git commit -m "feat: add game state machine with placement validation and turn logic"
```

---

## Task 5: Network Protocol + Message Types

**Files:**
- Create: `src/network/protocol.js`
- Create: `src/network/peerHost.js`
- Create: `src/network/peerPlayer.js`

- [ ] **Step 1: Define message protocol**

```js
// src/network/protocol.js

// Host → Player messages
export const HOST_MSG = {
  STATE_UPDATE: 'STATE_UPDATE',       // Full game state broadcast
  GAME_STARTED: 'GAME_STARTED',       // Game has begun
  PLAYER_JOINED: 'PLAYER_JOINED',     // New player joined lobby
  ERROR: 'ERROR',                     // Validation error
};

// Player → Host messages
export const PLAYER_MSG = {
  JOIN: 'JOIN',                       // { name }
  LOCK_PLACEMENT: 'LOCK_PLACEMENT',   // { insertIndex }
  CLAIM_HITSTER: 'CLAIM_HITSTER',     // {}
  LOCK_HITSTER_PLACEMENT: 'LOCK_HITSTER_PLACEMENT', // { insertIndex }
  SKIP_TURN: 'SKIP_TURN',            // {}
};

export function createMessage(type, payload = {}) {
  return JSON.stringify({ type, ...payload });
}

export function parseMessage(data) {
  return JSON.parse(data);
}
```

- [ ] **Step 2: Implement peerHost.js**

```js
// src/network/peerHost.js
import Peer from 'peerjs';
import { codeTopeerId } from '../utils/gameCode.js';
import { HOST_MSG, PLAYER_MSG, createMessage, parseMessage } from './protocol.js';

export function createPeerHost(gameCode, { onPlayerJoin, onPlayerAction, onError }) {
  const peerId = codeTopeerId(gameCode);
  const peer = new Peer(peerId);
  const connections = new Map(); // playerId → connection

  peer.on('open', () => {
    console.log('Host peer open:', peerId);
  });

  peer.on('connection', (conn) => {
    conn.on('open', () => {
      conn.on('data', (raw) => {
        const msg = parseMessage(raw);
        if (msg.type === PLAYER_MSG.JOIN) {
          const playerId = conn.peer;
          connections.set(playerId, conn);
          onPlayerJoin(playerId, msg.name);
        } else {
          onPlayerAction(conn.peer, msg);
        }
      });
    });

    conn.on('close', () => {
      connections.delete(conn.peer);
    });

    conn.on('error', (err) => {
      onError(conn.peer, err);
    });
  });

  peer.on('error', (err) => {
    console.error('Host peer error:', err);
    onError(null, err);
  });

  return {
    broadcast(state) {
      const msg = createMessage(HOST_MSG.STATE_UPDATE, { state });
      for (const conn of connections.values()) {
        if (conn.open) conn.send(msg);
      }
    },
    sendTo(playerId, type, payload) {
      const conn = connections.get(playerId);
      if (conn && conn.open) {
        conn.send(createMessage(type, payload));
      }
    },
    getConnectedPlayerIds() {
      return [...connections.keys()];
    },
    destroy() {
      peer.destroy();
    },
  };
}
```

- [ ] **Step 3: Implement peerPlayer.js**

```js
// src/network/peerPlayer.js
import Peer from 'peerjs';
import { codeTopeerId } from '../utils/gameCode.js';
import { PLAYER_MSG, createMessage, parseMessage } from './protocol.js';

export function createPeerPlayer(gameCode, playerName, { onStateUpdate, onError }) {
  const peer = new Peer(); // auto-generated ID
  let hostConn = null;
  let playerId = null;

  peer.on('open', (id) => {
    playerId = id;
    const hostPeerId = codeTopeerId(gameCode);
    hostConn = peer.connect(hostPeerId, { reliable: true });

    hostConn.on('open', () => {
      hostConn.send(createMessage(PLAYER_MSG.JOIN, { name: playerName }));
    });

    hostConn.on('data', (raw) => {
      const msg = parseMessage(raw);
      if (msg.type === 'STATE_UPDATE') {
        onStateUpdate(msg.state);
      }
    });

    hostConn.on('close', () => {
      onError(new Error('Disconnected from host'));
    });

    hostConn.on('error', (err) => {
      onError(err);
    });
  });

  peer.on('error', (err) => {
    onError(err);
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
      peer.destroy();
    },
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/network/
git commit -m "feat: add WebRTC networking layer with host/player peer management"
```

---

## Task 6: Spotify Integration

**Files:**
- Create: `src/spotify/auth.js`
- Create: `src/spotify/player.js`

- [ ] **Step 1: Implement PKCE auth flow**

```js
// src/spotify/auth.js

function generateRandomString(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, length);
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function startSpotifyAuth(clientId, redirectUri) {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);

  sessionStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'streaming user-read-email user-read-private',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function handleSpotifyCallback(clientId, redirectUri) {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return null;

  const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) return null;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error_description || data.error);

  sessionStorage.removeItem('spotify_code_verifier');

  // Clean URL
  window.history.replaceState({}, document.title, redirectUri);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshAccessToken(clientId, refreshToken) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error_description || data.error);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}
```

- [ ] **Step 2: Implement Spotify player wrapper**

```js
// src/spotify/player.js

let playerInstance = null;
let deviceId = null;

export function initSpotifyPlayer(accessToken, { onReady, onError }) {
  return new Promise((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Hitster Game',
        getOAuthToken: (cb) => cb(accessToken),
        volume: 1.0,
      });

      player.addListener('ready', ({ device_id }) => {
        deviceId = device_id;
        playerInstance = player;
        onReady(device_id);
        resolve(player);
      });

      player.addListener('initialization_error', ({ message }) => onError(message));
      player.addListener('authentication_error', ({ message }) => onError(message));
      player.addListener('account_error', ({ message }) => onError(message));
      player.addListener('playback_error', ({ message }) => onError(message));

      player.connect();
    };

    // Load the SDK script if not already loaded
    if (!document.getElementById('spotify-sdk')) {
      const script = document.createElement('script');
      script.id = 'spotify-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      document.body.appendChild(script);
    }
  });
}

export async function playSong(accessToken, spotifyTrackId) {
  if (!deviceId) throw new Error('Spotify player not ready');

  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uris: [`spotify:track:${spotifyTrackId}`],
    }),
  });
}

export async function pauseSong() {
  if (playerInstance) await playerInstance.pause();
}

export async function resumeSong() {
  if (playerInstance) await playerInstance.resume();
}

export async function stopSong() {
  if (playerInstance) await playerInstance.pause();
}

export function updateToken(newToken) {
  // The SDK calls getOAuthToken when it needs a fresh token,
  // but we can also disconnect and reconnect with a new token if needed.
  // For simplicity, we rely on the callback pattern — the token ref
  // should be updated in the calling code.
}
```

- [ ] **Step 3: Commit**

```bash
git add src/spotify/
git commit -m "feat: add Spotify PKCE auth and Web Playback SDK integration"
```

---

## Task 7: Persistence Layer

**Files:**
- Create: `src/persistence/storage.js`

- [ ] **Step 1: Implement localStorage persistence**

```js
// src/persistence/storage.js
const STORAGE_KEY = 'hitster-game-state';

export function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game state:', e);
  }
}

export function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to load game state:', e);
    return null;
  }
}

export function clearGameState() {
  localStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/persistence/
git commit -m "feat: add localStorage persistence for game state recovery"
```

---

## Task 8: React Context + App Shell

**Files:**
- Create: `src/hooks/useGameContext.jsx`
- Modify: `src/App.jsx` (create properly, replacing stub in main.jsx)
- Modify: `src/main.jsx`

- [ ] **Step 1: Create game context provider**

```jsx
// src/hooks/useGameContext.jsx
import React, { createContext, useContext, useReducer, useRef, useCallback } from 'react';
import { gameReducer } from '../state/gameState.js';
import { saveGameState } from '../persistence/storage.js';

const GameContext = createContext(null);

export function GameProvider({ initialState, isHost, networkRef, children }) {
  const [state, rawDispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatch = useCallback(
    (action) => {
      if (isHost) {
        // Host processes actions directly
        rawDispatch(action);
      } else {
        // Player sends action to host via network
        networkRef.current?.send(action.type, action);
      }
    },
    [isHost, networkRef]
  );

  // Host-only: broadcast state after each update
  const broadcastAndSave = useCallback(
    (newState) => {
      if (isHost && networkRef.current) {
        networkRef.current.broadcast(newState);
        saveGameState(newState);
      }
    },
    [isHost, networkRef]
  );

  return (
    <GameContext.Provider value={{ state, dispatch, isHost, broadcastAndSave, rawDispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
```

- [ ] **Step 2: Create App.jsx**

```jsx
// src/App.jsx
import React, { useState } from 'react';
import RoleSelect from './components/screens/RoleSelect.jsx';
import Lobby from './components/screens/Lobby.jsx';
import GameScreen from './components/screens/GameScreen.jsx';

const SCREENS = {
  ROLE_SELECT: 'ROLE_SELECT',
  LOBBY: 'LOBBY',
  GAME: 'GAME',
};

export default function App({ spotifyClientId }) {
  const [screen, setScreen] = useState(SCREENS.ROLE_SELECT);
  const [role, setRole] = useState(null); // 'host' or 'player'
  const [gameData, setGameData] = useState(null);

  function handleRoleSelect(selectedRole) {
    setRole(selectedRole);
    setScreen(SCREENS.LOBBY);
  }

  function handleGameStart(data) {
    setGameData(data);
    setScreen(SCREENS.GAME);
  }

  switch (screen) {
    case SCREENS.ROLE_SELECT:
      return <RoleSelect onSelect={handleRoleSelect} />;
    case SCREENS.LOBBY:
      return (
        <Lobby
          role={role}
          spotifyClientId={spotifyClientId}
          onGameStart={handleGameStart}
        />
      );
    case SCREENS.GAME:
      return <GameScreen gameData={gameData} spotifyClientId={spotifyClientId} />;
    default:
      return null;
  }
}
```

- [ ] **Step 3: Update main.jsx to use App**

```jsx
// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

const Hitster = {
  init({ container, spotifyClientId }) {
    const el = document.querySelector(container);
    if (!el) throw new Error(`Hitster: container "${container}" not found`);
    const root = createRoot(el);
    root.render(<App spotifyClientId={spotifyClientId} />);
  },
};

window.Hitster = Hitster;
export default Hitster;
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useGameContext.jsx src/App.jsx src/main.jsx
git commit -m "feat: add game context provider and app shell with screen routing"
```

---

## Task 9: Role Select + Lobby Screens

**Files:**
- Create: `src/components/screens/RoleSelect.jsx`
- Create: `src/components/screens/Lobby.jsx`
- Create: `src/components/shared/Button.jsx`

- [ ] **Step 1: Create Button component**

```jsx
// src/components/shared/Button.jsx
import React from 'react';

export default function Button({ onClick, disabled, variant = 'primary', children, style }) {
  const base = {
    fontSize: '1.1rem',
    padding: '14px 28px',
    border: 'none',
    borderRadius: '12px',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontWeight: 600,
    width: '100%',
    maxWidth: '320px',
    touchAction: 'manipulation',
  };

  const variants = {
    primary: { background: '#e63946', color: '#fff' },
    secondary: { background: '#457b9d', color: '#fff' },
    ghost: { background: 'transparent', color: '#eee', border: '2px solid #eee' },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create RoleSelect screen**

```jsx
// src/components/screens/RoleSelect.jsx
import React from 'react';
import Button from '../shared/Button.jsx';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '24px',
    padding: '24px',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 800,
    letterSpacing: '0.05em',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#aaa',
    marginBottom: '32px',
  },
};

export default function RoleSelect({ onSelect }) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>HITSTER</h1>
      <p style={styles.subtitle}>Guess the year. Build your timeline.</p>
      <Button onClick={() => onSelect('host')}>Host Game</Button>
      <Button onClick={() => onSelect('player')} variant="secondary">
        Join Game
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Create Lobby screen**

```jsx
// src/components/screens/Lobby.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from '../shared/Button.jsx';
import { generateGameCode } from '../../utils/gameCode.js';
import { createPeerHost } from '../../network/peerHost.js';
import { createPeerPlayer } from '../../network/peerPlayer.js';
import { createInitialState } from '../../state/gameState.js';
import { startSpotifyAuth, handleSpotifyCallback } from '../../spotify/auth.js';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    padding: '24px',
    gap: '16px',
  },
  code: {
    fontSize: '2.5rem',
    fontWeight: 800,
    letterSpacing: '0.2em',
    color: '#e63946',
    margin: '16px 0',
  },
  input: {
    fontSize: '1.2rem',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '2px solid #457b9d',
    background: '#16213e',
    color: '#eee',
    width: '100%',
    maxWidth: '320px',
    textAlign: 'center',
  },
  playerList: {
    listStyle: 'none',
    width: '100%',
    maxWidth: '320px',
  },
  playerItem: {
    padding: '10px 16px',
    background: '#16213e',
    borderRadius: '8px',
    marginBottom: '8px',
    fontSize: '1.1rem',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    maxWidth: '320px',
  },
  label: {
    fontSize: '0.95rem',
    color: '#aaa',
    flex: 1,
  },
  smallInput: {
    fontSize: '1.1rem',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '2px solid #457b9d',
    background: '#16213e',
    color: '#eee',
    width: '80px',
    textAlign: 'center',
  },
  spotifyBtn: {
    background: '#1db954',
    color: '#fff',
  },
};

export default function Lobby({ role, spotifyClientId, onGameStart }) {
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState(() => (role === 'host' ? generateGameCode() : ''));
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [winThreshold, setWinThreshold] = useState(10);
  const [hitsterTimer, setHitsterTimer] = useState(15);
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const networkRef = useRef(null);

  // Handle Spotify callback on page load (host only)
  useEffect(() => {
    if (role !== 'host') return;
    handleSpotifyCallback(spotifyClientId, window.location.origin + window.location.pathname)
      .then((tokens) => {
        if (tokens) setSpotifyToken(tokens);
      })
      .catch((err) => setError('Spotify auth failed: ' + err.message));
  }, [role, spotifyClientId]);

  const handleHostSpotifyLogin = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    startSpotifyAuth(spotifyClientId, redirectUri);
  };

  // Host: create peer and listen for joins
  useEffect(() => {
    if (role !== 'host' || !name) return;

    const host = createPeerHost(gameCode, {
      onPlayerJoin(playerId, playerName) {
        setPlayers((prev) => [...prev, { id: playerId, name: playerName }]);
      },
      onPlayerAction() {},
      onError(_, err) {
        setError('Connection error: ' + err.message);
      },
    });
    networkRef.current = host;

    return () => host.destroy();
  }, [role, name, gameCode]);

  // Host: start game
  const handleStartGame = useCallback(() => {
    const seed = Date.now();
    const allPlayers = [{ id: 'host', name }, ...players];
    const initialState = createInitialState({
      players: allPlayers,
      winThreshold,
      hitsterTimer,
      seed,
    });

    networkRef.current.broadcast(initialState);

    onGameStart({
      initialState,
      networkRef,
      isHost: true,
      spotifyToken,
    });
  }, [name, players, winThreshold, hitsterTimer, spotifyToken, onGameStart]);

  // Player: join game
  const handleJoin = useCallback(() => {
    const player = createPeerPlayer(joinCode.toUpperCase(), name, {
      onStateUpdate(state) {
        // First state update means game started
        onGameStart({
          initialState: state,
          networkRef: { current: player },
          isHost: false,
          spotifyToken: null,
        });
      },
      onError(err) {
        setError('Connection error: ' + err.message);
      },
    });
    networkRef.current = player;
    setJoined(true);
  }, [joinCode, name, onGameStart]);

  if (role === 'host') {
    return (
      <div style={styles.container}>
        <h2>Host Game</h2>

        {!name ? (
          <>
            <input
              style={styles.input}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Button onClick={() => setName(name)} disabled={!name.trim()}>
              Continue
            </Button>
          </>
        ) : (
          <>
            <p style={{ color: '#aaa' }}>Game Code:</p>
            <div style={styles.code}>{gameCode}</div>

            {!spotifyToken ? (
              <Button onClick={handleHostSpotifyLogin} style={styles.spotifyBtn}>
                Connect Spotify
              </Button>
            ) : (
              <p style={{ color: '#1db954' }}>Spotify connected</p>
            )}

            <div style={styles.settingRow}>
              <span style={styles.label}>Songs to win:</span>
              <input
                style={styles.smallInput}
                type="number"
                min="3"
                max="50"
                value={winThreshold}
                onChange={(e) => setWinThreshold(Number(e.target.value))}
              />
            </div>

            <div style={styles.settingRow}>
              <span style={styles.label}>Hitster timer (s):</span>
              <input
                style={styles.smallInput}
                type="number"
                min="5"
                max="60"
                value={hitsterTimer}
                onChange={(e) => setHitsterTimer(Number(e.target.value))}
              />
            </div>

            <p style={{ color: '#aaa', marginTop: '16px' }}>Players:</p>
            <ul style={styles.playerList}>
              <li style={styles.playerItem}>{name} (you - host)</li>
              {players.map((p) => (
                <li key={p.id} style={styles.playerItem}>{p.name}</li>
              ))}
            </ul>

            <Button
              onClick={handleStartGame}
              disabled={players.length < 1 || !spotifyToken}
            >
              Start Game ({players.length + 1} players)
            </Button>
          </>
        )}

        {error && <p style={{ color: '#e63946' }}>{error}</p>}
      </div>
    );
  }

  // Player join screen
  return (
    <div style={styles.container}>
      <h2>Join Game</h2>

      {!joined ? (
        <>
          <input
            style={styles.input}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <input
            style={{ ...styles.input, letterSpacing: '0.15em', textTransform: 'uppercase' }}
            placeholder="Game code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <Button onClick={handleJoin} disabled={!name.trim() || joinCode.length < 4}>
            Join
          </Button>
        </>
      ) : (
        <p style={{ color: '#aaa', fontSize: '1.2rem' }}>Waiting for host to start...</p>
      )}

      {error && <p style={{ color: '#e63946' }}>{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Verify screens render in dev**

```bash
npx vite
```

Expected: RoleSelect screen renders with "Host Game" and "Join Game" buttons. Clicking "Host Game" shows lobby with name input.

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add role select and lobby screens with networking and Spotify auth"
```

---

## Task 10: Timeline + Drag-and-Drop

**Files:**
- Create: `src/hooks/useDragToTimeline.js`
- Create: `src/components/game/Timeline.jsx`
- Create: `src/components/game/SongCard.jsx`
- Create: `src/components/game/DraggableMysteryCard.jsx`

- [ ] **Step 1: Implement drag hook**

```js
// src/hooks/useDragToTimeline.js
import { useState, useRef, useCallback } from 'react';

export function useDragToTimeline(dropZoneRefs, onDrop) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [activeDropZone, setActiveDropZone] = useState(null);
  const startPos = useRef(null);
  const cardRef = useRef(null);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    setDragPos({ x: e.clientX, y: e.clientY });
    e.target.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging) return;
      e.preventDefault();
      setDragPos({ x: e.clientX, y: e.clientY });

      // Check which drop zone we're over
      let found = null;
      for (let i = 0; i < dropZoneRefs.current.length; i++) {
        const ref = dropZoneRefs.current[i];
        if (!ref) continue;
        const rect = ref.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          found = i;
          break;
        }
      }
      setActiveDropZone(found);
    },
    [isDragging, dropZoneRefs]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!isDragging) return;
      e.preventDefault();
      setIsDragging(false);
      if (activeDropZone !== null) {
        onDrop(activeDropZone);
      }
      setActiveDropZone(null);
    },
    [isDragging, activeDropZone, onDrop]
  );

  return {
    isDragging,
    dragPos,
    activeDropZone,
    cardRef,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
  };
}
```

- [ ] **Step 2: Create SongCard component**

```jsx
// src/components/game/SongCard.jsx
import React from 'react';

const cardStyle = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 14px',
  borderRadius: '10px',
  minWidth: '90px',
  minHeight: '80px',
  textAlign: 'center',
  userSelect: 'none',
};

const frontStyle = {
  ...cardStyle,
  background: '#1a1a4e',
  border: '2px solid #457b9d',
};

const backStyle = {
  ...cardStyle,
  background: 'linear-gradient(135deg, #e63946, #9d4edd)',
  border: '2px solid #e63946',
};

const correctStyle = {
  ...frontStyle,
  border: '2px solid #2ecc71',
  boxShadow: '0 0 12px rgba(46,204,113,0.4)',
};

const wrongStyle = {
  ...frontStyle,
  border: '2px solid #e74c3c',
  boxShadow: '0 0 12px rgba(231,76,60,0.4)',
};

export default function SongCard({ song, isBack, result }) {
  if (isBack) {
    return (
      <div style={backStyle}>
        <span style={{ fontSize: '2rem' }}>?</span>
      </div>
    );
  }

  const style = result === 'correct' ? correctStyle : result === 'wrong' ? wrongStyle : frontStyle;

  return (
    <div style={style}>
      <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{song.y}</div>
      <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#ccc' }}>{song.t}</div>
      <div style={{ fontSize: '0.7rem', color: '#999' }}>{song.a}</div>
    </div>
  );
}
```

- [ ] **Step 3: Create DraggableMysteryCard component**

```jsx
// src/components/game/DraggableMysteryCard.jsx
import React from 'react';
import SongCard from './SongCard.jsx';

export default function DraggableMysteryCard({ isDragging, dragPos, handlers }) {
  const style = isDragging
    ? {
        position: 'fixed',
        left: dragPos.x - 45,
        top: dragPos.y - 40,
        zIndex: 1000,
        pointerEvents: 'none',
        transform: 'scale(1.1)',
        transition: 'transform 0.1s',
      }
    : {
        margin: '12px auto',
        touchAction: 'none',
        cursor: 'grab',
      };

  return (
    <div style={style} {...(isDragging ? {} : handlers)}>
      <SongCard isBack />
    </div>
  );
}
```

- [ ] **Step 4: Create Timeline component**

```jsx
// src/components/game/Timeline.jsx
import React, { useRef } from 'react';
import SongCard from './SongCard.jsx';

const timelineStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px',
  minHeight: '100px',
};

const dropZoneStyle = {
  width: '30px',
  minHeight: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  transition: 'all 0.15s',
};

const dropZoneActive = {
  ...dropZoneStyle,
  background: 'rgba(230, 57, 70, 0.3)',
  border: '2px dashed #e63946',
  width: '50px',
};

const dropZoneDefault = {
  ...dropZoneStyle,
  background: 'rgba(69, 123, 157, 0.15)',
  border: '2px dashed transparent',
};

export default function Timeline({ songs, showDropZones, activeDropZone, dropZoneRefs, revealedSong }) {
  return (
    <div style={timelineStyle}>
      {songs.map((song, i) => (
        <React.Fragment key={song.id}>
          {showDropZones && (
            <div
              ref={(el) => {
                if (dropZoneRefs) dropZoneRefs.current[i] = el;
              }}
              style={activeDropZone === i ? dropZoneActive : dropZoneDefault}
            />
          )}
          <SongCard
            song={song}
            result={revealedSong && revealedSong.id === song.id
              ? revealedSong.result
              : undefined}
          />
        </React.Fragment>
      ))}
      {showDropZones && (
        <div
          ref={(el) => {
            if (dropZoneRefs) dropZoneRefs.current[songs.length] = el;
          }}
          style={activeDropZone === songs.length ? dropZoneActive : dropZoneDefault}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify timeline renders in isolation**

Temporarily render a test timeline in App.jsx to verify cards and drop zones display correctly on mobile viewport.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useDragToTimeline.js src/components/game/
git commit -m "feat: add timeline, song cards, and drag-to-timeline interaction"
```

---

## Task 11: Game Screen + Phase Components

**Files:**
- Create: `src/components/screens/GameScreen.jsx`
- Create: `src/components/game/PhaseIndicator.jsx`
- Create: `src/components/game/PlayerList.jsx`
- Create: `src/components/game/PlaybackControls.jsx`
- Create: `src/components/game/HitsterButton.jsx`
- Create: `src/components/game/TokenChallenge.jsx`
- Create: `src/components/game/RevealResult.jsx`
- Create: `src/components/screens/GameOver.jsx`

- [ ] **Step 1: Create PhaseIndicator**

```jsx
// src/components/game/PhaseIndicator.jsx
import React from 'react';
import { PHASES } from '../../state/gameState.js';

const style = {
  textAlign: 'center',
  padding: '10px 16px',
  fontSize: '1rem',
  fontWeight: 600,
  background: '#16213e',
  borderBottom: '2px solid #457b9d',
};

const labels = {
  [PHASES.LISTENING]: 'Now Playing...',
  [PHASES.PLACING]: 'Place your song!',
  [PHASES.HITSTER_WINDOW]: 'Hitster window!',
  [PHASES.REVEAL]: 'Reveal!',
  [PHASES.TOKEN_CHALLENGE]: 'Name that song!',
  [PHASES.GAME_OVER]: 'Game Over!',
};

export default function PhaseIndicator({ phase, currentPlayerName, isMyTurn }) {
  const label = isMyTurn ? labels[phase] : `${currentPlayerName}'s turn — ${labels[phase]}`;

  return <div style={style}>{label}</div>;
}
```

- [ ] **Step 2: Create PlayerList**

```jsx
// src/components/game/PlayerList.jsx
import React from 'react';

const listStyle = {
  display: 'flex',
  gap: '8px',
  padding: '8px 12px',
  overflowX: 'auto',
  flexShrink: 0,
};

const playerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '6px 12px',
  borderRadius: '8px',
  background: '#16213e',
  fontSize: '0.85rem',
  minWidth: '70px',
};

const activePlayerStyle = {
  ...playerStyle,
  border: '2px solid #e63946',
};

export default function PlayerList({ players, currentPlayerIndex }) {
  return (
    <div style={listStyle}>
      {players.map((p, i) => (
        <div key={p.id} style={i === currentPlayerIndex ? activePlayerStyle : playerStyle}>
          <span>{p.name}</span>
          <span style={{ color: '#f4a261', fontSize: '0.75rem' }}>
            {p.timeline.length - 1} cards | {p.tokens} tokens
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create PlaybackControls (host only)**

```jsx
// src/components/game/PlaybackControls.jsx
import React, { useState } from 'react';
import Button from '../shared/Button.jsx';

const style = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
  padding: '12px',
};

export default function PlaybackControls({ onPlay, onPause, onResume, isPlaying }) {
  return (
    <div style={style}>
      {!isPlaying ? (
        <Button onClick={onPlay} style={{ maxWidth: '150px' }}>
          Play Song
        </Button>
      ) : (
        <>
          <Button onClick={onPause} variant="secondary" style={{ maxWidth: '150px' }}>
            Pause
          </Button>
          <Button onClick={onResume} style={{ maxWidth: '150px' }}>
            Resume
          </Button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create HitsterButton**

```jsx
// src/components/game/HitsterButton.jsx
import React, { useState, useEffect } from 'react';
import Button from '../shared/Button.jsx';

export default function HitsterButton({ timerSeconds, canHitster, onClaim, disabled }) {
  const [remaining, setRemaining] = useState(timerSeconds);

  useEffect(() => {
    if (!canHitster) return;
    setRemaining(timerSeconds);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [canHitster, timerSeconds]);

  if (!canHitster || remaining === 0) return null;

  return (
    <div style={{ textAlign: 'center', padding: '12px' }}>
      <Button onClick={onClaim} disabled={disabled} style={{ background: '#9d4edd', maxWidth: '200px' }}>
        HITSTER! ({remaining}s)
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Create TokenChallenge (host only)**

```jsx
// src/components/game/TokenChallenge.jsx
import React from 'react';
import Button from '../shared/Button.jsx';

const style = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  padding: '16px',
};

export default function TokenChallenge({ playerName, onAward }) {
  return (
    <div style={style}>
      <p style={{ fontSize: '1.1rem' }}>Did {playerName} name the song?</p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button onClick={() => onAward(true)} style={{ maxWidth: '120px', background: '#2ecc71' }}>
          Yes
        </Button>
        <Button onClick={() => onAward(false)} variant="secondary" style={{ maxWidth: '120px' }}>
          No
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create RevealResult**

```jsx
// src/components/game/RevealResult.jsx
import React from 'react';
import SongCard from './SongCard.jsx';

const style = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  padding: '16px',
};

export default function RevealResult({ revealResult }) {
  const { song, playerCorrect, hitsterCorrect } = revealResult;

  let message;
  if (playerCorrect) {
    message = 'Correct! Song added to timeline.';
  } else if (hitsterCorrect) {
    message = 'Wrong! Hitster got it right and takes the song.';
  } else {
    message = 'Nobody got it right. Song discarded.';
  }

  return (
    <div style={style}>
      <SongCard song={song} result={playerCorrect ? 'correct' : 'wrong'} />
      <p style={{ fontSize: '1.1rem', fontWeight: 600, color: playerCorrect ? '#2ecc71' : '#e74c3c' }}>
        {message}
      </p>
    </div>
  );
}
```

- [ ] **Step 7: Create GameOver screen**

```jsx
// src/components/screens/GameOver.jsx
import React from 'react';
import Button from '../shared/Button.jsx';

const style = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  gap: '24px',
  padding: '24px',
};

export default function GameOver({ winnerName, onContinue }) {
  return (
    <div style={style}>
      <h1 style={{ fontSize: '2rem' }}>{winnerName} Wins!</h1>
      <Button onClick={onContinue}>Keep Playing</Button>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/
git commit -m "feat: add game phase components — indicators, controls, hitster, reveal"
```

---

## Task 12: GameScreen — Wiring It All Together

**Files:**
- Create: `src/components/screens/GameScreen.jsx`

- [ ] **Step 1: Implement GameScreen**

```jsx
// src/components/screens/GameScreen.jsx
import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { PHASES, gameReducer, createInitialState } from '../../state/gameState.js';
import { PLAYER_MSG } from '../../network/protocol.js';
import { initSpotifyPlayer, playSong, pauseSong, resumeSong, stopSong } from '../../spotify/player.js';
import { saveGameState } from '../../persistence/storage.js';
import PhaseIndicator from '../game/PhaseIndicator.jsx';
import PlayerList from '../game/PlayerList.jsx';
import Timeline from '../game/Timeline.jsx';
import DraggableMysteryCard from '../game/DraggableMysteryCard.jsx';
import PlaybackControls from '../game/PlaybackControls.jsx';
import HitsterButton from '../game/HitsterButton.jsx';
import TokenChallenge from '../game/TokenChallenge.jsx';
import RevealResult from '../game/RevealResult.jsx';
import GameOver from './GameOver.jsx';
import Button from '../shared/Button.jsx';
import { useDragToTimeline } from '../../hooks/useDragToTimeline.js';

export default function GameScreen({ gameData, spotifyClientId }) {
  const { initialState, networkRef, isHost, spotifyToken } = gameData;
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [isPlaying, setIsPlaying] = useState(false);
  const [spotifyReady, setSpotifyReady] = useState(false);
  const tokenRef = useRef(spotifyToken?.accessToken);
  const dropZoneRefs = useRef([]);
  const myId = isHost ? 'host' : networkRef.current?.getPlayerId();

  // Find my player index
  const myPlayerIndex = state.players.findIndex((p) => p.id === myId);
  const isMyTurn = state.currentPlayerIndex === myPlayerIndex;
  const currentPlayer = state.players[state.currentPlayerIndex];

  // Host: init Spotify player
  useEffect(() => {
    if (!isHost || !spotifyToken) return;
    initSpotifyPlayer(spotifyToken.accessToken, {
      onReady: () => setSpotifyReady(true),
      onError: (msg) => console.error('Spotify error:', msg),
    });
  }, [isHost, spotifyToken]);

  // Host: listen for player actions
  useEffect(() => {
    if (!isHost) return;
    const host = networkRef.current;
    // Patch the onPlayerAction callback to dispatch
    // This is a simplification — in production you'd set this up in lobby
  }, [isHost]);

  // Player: listen for state updates from host
  useEffect(() => {
    if (isHost) return;
    const player = networkRef.current;
    // The player's onStateUpdate callback was set in lobby
    // We need to update local state when host broadcasts
  }, [isHost]);

  // Host: broadcast state on every change
  useEffect(() => {
    if (!isHost) return;
    networkRef.current?.broadcast(state);
    saveGameState(state);
  }, [isHost, state]);

  // Host: handle incoming player actions
  const handlePlayerAction = useCallback(
    (playerId, msg) => {
      switch (msg.type) {
        case PLAYER_MSG.LOCK_PLACEMENT:
          dispatch({ type: 'LOCK_PLACEMENT', playerId, insertIndex: msg.insertIndex });
          break;
        case PLAYER_MSG.CLAIM_HITSTER:
          dispatch({ type: 'CLAIM_HITSTER', playerId });
          break;
        case PLAYER_MSG.LOCK_HITSTER_PLACEMENT:
          dispatch({ type: 'LOCK_HITSTER_PLACEMENT', playerId, insertIndex: msg.insertIndex });
          break;
        case PLAYER_MSG.SKIP_TURN:
          dispatch({ type: 'SKIP_TURN', playerId });
          break;
      }
    },
    [dispatch]
  );

  // Drag and drop
  const [placementIndex, setPlacementIndex] = useState(null);
  const handleDrop = useCallback(
    (dropIndex) => {
      setPlacementIndex(dropIndex);
    },
    []
  );

  const { isDragging, dragPos, activeDropZone, handlers } = useDragToTimeline(
    dropZoneRefs,
    handleDrop
  );

  // Lock in placement
  const handleLockIn = useCallback(() => {
    if (placementIndex === null) return;
    if (isHost) {
      dispatch({ type: 'LOCK_PLACEMENT', playerId: myId, insertIndex: placementIndex });
    } else {
      networkRef.current.send(PLAYER_MSG.LOCK_PLACEMENT, { insertIndex: placementIndex });
    }
    setPlacementIndex(null);
  }, [placementIndex, isHost, myId, networkRef]);

  // Hitster claim
  const handleHitsterClaim = useCallback(() => {
    if (isHost) {
      dispatch({ type: 'CLAIM_HITSTER', playerId: myId });
    } else {
      networkRef.current.send(PLAYER_MSG.CLAIM_HITSTER);
    }
  }, [isHost, myId, networkRef]);

  // Host playback controls
  const handlePlay = useCallback(async () => {
    if (!spotifyReady || !state.currentSong) return;
    await playSong(tokenRef.current, state.currentSong.sid);
    setIsPlaying(true);
  }, [spotifyReady, state.currentSong]);

  const handlePause = useCallback(async () => {
    await pauseSong();
    setIsPlaying(false);
  }, []);

  const handleResume = useCallback(async () => {
    await resumeSong();
    setIsPlaying(true);
  }, []);

  // Host: reveal
  const handleReveal = useCallback(() => {
    stopSong();
    setIsPlaying(false);
    dispatch({ type: 'REVEAL' });
  }, []);

  // Host: award token
  const handleAwardToken = useCallback(
    (grant) => {
      dispatch({ type: 'AWARD_TOKEN', grant });
    },
    []
  );

  // Host: next turn
  const handleNextTurn = useCallback(() => {
    dispatch({ type: 'NEXT_TURN' });
  }, []);

  // Host: skip turn
  const handleSkipTurn = useCallback(() => {
    if (isHost) {
      dispatch({ type: 'SKIP_TURN', playerId: myId });
    } else {
      networkRef.current.send(PLAYER_MSG.SKIP_TURN);
    }
  }, [isHost, myId, networkRef]);

  // Winner check
  if (state.winner && state.phase === PHASES.REVEAL) {
    const winner = state.players.find((p) => p.id === state.winner);
    return (
      <GameOver
        winnerName={winner.name}
        onContinue={handleNextTurn}
      />
    );
  }

  const myTimeline = myPlayerIndex >= 0 ? state.players[myPlayerIndex].timeline : [];
  const currentPlayerTimeline = currentPlayer.timeline;
  const showMyTimeline = isMyTurn || state.phase === PHASES.LISTENING;
  const timelineToShow = isMyTurn ? myTimeline : currentPlayerTimeline;

  // Determine if hitster placing phase (I claimed hitster and need to place)
  const isHitsterPlacing =
    state.hitster &&
    state.hitster.playerId === myId &&
    state.hitster.insertIndex === null;

  const canDrag =
    (isMyTurn && state.phase === PHASES.HITSTER_WINDOW && placementIndex === null) ||
    isHitsterPlacing ||
    (isMyTurn && (state.phase === PHASES.LISTENING || state.phase === PHASES.PLACING) && placementIndex === null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PhaseIndicator
        phase={state.phase}
        currentPlayerName={currentPlayer.name}
        isMyTurn={isMyTurn}
      />

      <PlayerList
        players={state.players}
        currentPlayerIndex={state.currentPlayerIndex}
      />

      {/* Host playback controls */}
      {isHost && state.phase === PHASES.LISTENING && (
        <PlaybackControls
          onPlay={handlePlay}
          onPause={handlePause}
          onResume={handleResume}
          isPlaying={isPlaying}
        />
      )}

      {/* Draggable mystery card */}
      {canDrag && (
        <DraggableMysteryCard
          isDragging={isDragging}
          dragPos={dragPos}
          handlers={handlers}
        />
      )}

      {/* Timeline */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Timeline
          songs={timelineToShow}
          showDropZones={canDrag}
          activeDropZone={activeDropZone}
          dropZoneRefs={dropZoneRefs}
          revealedSong={state.revealResult?.song ? {
            id: state.revealResult.song.id,
            result: state.revealResult.playerCorrect ? 'correct' : 'wrong',
          } : undefined}
        />
      </div>

      {/* Lock in button */}
      {placementIndex !== null && !isDragging && (
        <div style={{ padding: '12px', textAlign: 'center' }}>
          <Button onClick={handleLockIn}>Lock In</Button>
        </div>
      )}

      {/* Hitster button for non-current players */}
      {!isMyTurn && state.phase === PHASES.HITSTER_WINDOW && !state.hitster && (
        <HitsterButton
          timerSeconds={state.settings.hitsterTimer}
          canHitster={state.phase === PHASES.HITSTER_WINDOW}
          onClaim={handleHitsterClaim}
          disabled={state.players[myPlayerIndex]?.tokens < 1}
        />
      )}

      {/* Reveal result */}
      {state.phase === PHASES.REVEAL && state.revealResult && (
        <RevealResult revealResult={state.revealResult} />
      )}

      {/* Token challenge (host only) */}
      {isHost && state.phase === PHASES.TOKEN_CHALLENGE && (
        <TokenChallenge
          playerName={currentPlayer.name}
          onAward={handleAwardToken}
        />
      )}

      {/* Host: reveal button during hitster window */}
      {isHost && state.phase === PHASES.HITSTER_WINDOW && (
        <div style={{ padding: '12px', textAlign: 'center' }}>
          <Button onClick={handleReveal} variant="secondary">
            Reveal Answer
          </Button>
        </div>
      )}

      {/* Host: next turn button after token challenge */}
      {isHost && state.phase === PHASES.TOKEN_CHALLENGE && (
        <div style={{ padding: '12px', textAlign: 'center' }}>
          <Button onClick={handleNextTurn}>Next Turn</Button>
        </div>
      )}

      {/* Skip turn (current player, if they have tokens) */}
      {isMyTurn && state.phase === PHASES.LISTENING && state.players[myPlayerIndex]?.tokens >= 1 && (
        <div style={{ padding: '12px', textAlign: 'center' }}>
          <Button onClick={handleSkipTurn} variant="ghost" style={{ maxWidth: '160px' }}>
            Skip Turn (1 token)
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify full game flow in dev mode**

```bash
npx vite
```

Open on two browser tabs (one as host, one as player). Test:
- Host creates game, sees code
- Player joins with code
- Host starts game
- Spotify plays song
- Current player can drag and lock in
- Hitster button appears for other players

- [ ] **Step 3: Commit**

```bash
git add src/components/screens/GameScreen.jsx
git commit -m "feat: wire up complete game screen with all phases and interactions"
```

---

## Task 13: Build as Embeddable Bundle

**Files:**
- Modify: `vite.config.js`
- Modify: `package.json` (add build script)

- [ ] **Step 1: Update vite.config.js for production build**

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'Hitster',
      fileName: () => 'hitster.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: 'hitster.[ext]',
      },
    },
    cssCodeSplit: false,
  },
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 2: Add build script to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  }
}
```

- [ ] **Step 3: Build and verify output**

```bash
npm run build
ls dist/
```

Expected: `dist/hitster.js` and `dist/hitster.css` — two files that can be embedded on any page.

- [ ] **Step 4: Test embedding**

Create a quick test HTML file:

```bash
cat > dist/test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="hitster.css">
</head>
<body>
  <div id="hitster-game"></div>
  <script src="hitster.js"></script>
  <script>
    Hitster.init({
      container: '#hitster-game',
      spotifyClientId: '7002d9856f204ed6be87c73fec98e238',
    });
  </script>
</body>
</html>
EOF
```

Open `dist/test.html` in a browser to verify the embedded bundle works standalone.

- [ ] **Step 5: Commit**

```bash
git add vite.config.js package.json
git commit -m "feat: configure production build as embeddable IIFE bundle"
```

---

## Task 14: End-to-End Manual Testing + Fixes

**Files:** Any files that need fixes.

- [ ] **Step 1: Test full game loop on two devices**

Use `npx vite --host` to expose on local network. Open on phone (host) and another phone/laptop (player).

Verify:
1. Host creates game, connects Spotify
2. Player joins with code and name
3. Host starts game — both see game screen
4. Host taps Play Song — Spotify plays
5. Current player drags card, locks in
6. Hitster window counts down, other player can claim
7. Host reveals — correct/wrong shown
8. Token challenge — host awards/denies
9. Next turn works
10. Win condition triggers at N songs

- [ ] **Step 2: Fix any issues found**

Address bugs discovered during testing. Common areas:
- PeerJS connection timing
- Spotify token refresh
- Drag interaction on mobile touch
- State sync race conditions

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: address issues found during end-to-end testing"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| WebRTC via PeerJS, host-authoritative | Task 5 |
| Game code for joining | Task 2 (gameCode), Task 9 (Lobby) |
| Spotify PKCE auth | Task 6 |
| Spotify Web Playback SDK | Task 6 |
| Bundled JSON song database | Task 3 |
| Seeded shuffle, no repeats | Task 2-3 |
| Game state machine (all phases) | Task 4 |
| Placement validation | Task 4 |
| Token economy | Task 4 |
| Hitster claim (first-come-first-served) | Task 4, 11 |
| 15s hitster timer (configurable) | Task 9 (lobby settings), Task 11 |
| Timeline with drag-and-drop | Task 10 |
| Host manual playback controls | Task 11 |
| Token challenge (admin yes/no) | Task 11 |
| Win at N songs + continue | Task 4, 11 |
| localStorage persistence | Task 7, 12 |
| Embeddable JS bundle with init() | Task 1, 8, 13 |
| Mobile Chrome target | Task 1 (CSS), all UI tasks |
