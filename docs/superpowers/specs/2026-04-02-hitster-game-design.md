# Hitster — Online Multiplayer Song Year Guessing Game

## Overview

A browser-based multiplayer party game inspired by the Hitster card game. Players take turns listening to songs and placing them on a personal timeline by release year. Designed for in-person play — one device plays audio out loud, each player uses their own phone for their timeline and actions.

No backend server. All game logic runs in the browser. Players connect via WebRTC (PeerJS).

## Architecture

### Topology: Host-Authoritative Star

```
  [Player B Phone] <-- WebRTC --> [Host Phone] <-- WebRTC --> [Player C Phone]
                                       |
                                  PeerJS Cloud
                                 (signaling only)
```

- **Host** = admin + player. Runs game logic, holds the song database, controls Spotify playback, validates all moves, persists state to `localStorage`.
- **Players** = lightweight clients. Receive game state, render their view, send actions (place song, hitster, lock in) to the host.
- **PeerJS Cloud** = free signaling service for initial WebRTC handshake only. After connection, all data flows P2P.

### Game Code

Host generates a short alphanumeric code (e.g., `ROCK42`). This maps to the host's PeerJS peer ID. Players enter the code on the join screen to connect.

### State Sync

1. Player sends action → Host
2. Host validates, updates canonical game state
3. Host broadcasts full state → all players
4. Each player renders their view from the shared state

### What Gets Synced

The game state object:

- Player list (names, token counts, timelines with song data)
- Current turn (whose turn, current phase)
- Current song (only Spotify track ID during listening/placing — title/artist/year withheld until reveal)
- Hitster claim (who claimed, their placement)
- Game settings (win threshold, hitster timer duration)

Players never receive the song's year/title/artist until the reveal phase.

## Audio Playback

### Spotify Web Playback SDK

- Host authenticates via OAuth PKCE flow (no server needed — redirect URI is the host site URL)
- SDK turns host's browser into a Spotify Connect device
- Programmatic control: play, pause, resume — host triggers manually
- No visible Spotify UI — custom "Now Playing" display on host screen
- Only the host needs Spotify Premium

### Spotify App Setup (One-Time)

1. Create an app at Spotify Developer Dashboard
2. Set redirect URI to: `https://hitster.multiscreensite.com/`
3. Client ID: `7002d9856f204ed6be87c73fec98e238`
4. APIs enabled: Web API + Web Playback SDK

## Song Database

### Format

Bundled JSON file, loaded at startup:

```json
[
  {
    "id": "s001",
    "t": "Bohemian Rhapsody",
    "a": "Queen",
    "y": 1975,
    "sid": "4u7EnebtmKWzUH433cf5Qv"
  }
]
```

Fields: `id` (unique), `t` (title), `a` (artist), `y` (release year), `sid` (Spotify track ID).

### Scale

- Target: ~1000+ songs spanning 1960s–2026
- At ~100 bytes per record, 1000 songs ≈ 100 KB raw, ~30 KB gzipped
- Starter set generated covering diverse genres and decades, then curated manually

## Song Selection

- At game start, the host shuffles the full song database into a random order (the "draw pile")
- Each turn draws the next song from the pile — no song is ever repeated within a game
- The initial anchor songs dealt to each player also come from this pile
- The shuffle uses a seeded random so game state recovery (from `localStorage`) preserves the same order
- If the draw pile runs out (extremely long game), the game announces "No more songs!" and ends

## Game Flow

### Phases

```
LOBBY → PLAYING → (per-turn cycle) → GAME_OVER (optional continue)
```

### LOBBY

- Host sets: display name, win threshold (N songs), hitster timer duration (default 15s)
- Players join via game code, enter display name
- Host sees player list, starts game when ready
- Each player is dealt 1 random song (visible, with year) as their timeline anchor

### Per-Turn Cycle

#### LISTENING

- Host manually taps "Play Song" to start the turn
- Host device plays audio via Spotify — everyone in the room listens
- All player screens show "Now Playing..." with visual indicator
- Current player's screen shows their timeline, ready for placement
- Host has play/pause/resume controls

#### PLACING

- Current player drags the mystery card (showing card back, no info) into position on their timeline
- All other players can see the current player's timeline and their placement
- Player taps "Lock In" to confirm

#### HITSTER_WINDOW

- 15-second countdown to *claim* hitster (configurable at game start), starts when current player locks in
- Other players see a "Hitster!" button (activates only after current player locks in)
- First player to tap claims the hitster — window closes for others
- Hitster then sees the current player's timeline and places their alternative guess (no additional timer — they place and lock in at their own pace)
- If no one claims hitster within 15s, proceed directly to reveal

#### REVEAL

- Host broadcasts song's actual year, title, and artist
- Mystery card flips to show full info
- Outcome:
  - Current player correct → song added to their timeline
  - Current player wrong, hitster correct → hitster gets the song on their timeline
  - Both wrong (or no hitster) → song discarded

#### TOKEN_CHALLENGE

- Current player can verbally attempt to name the song title and/or artist
- Host sees "Award Token?" with yes/no buttons
- Only the current player can earn a token on their turn

#### NEXT_TURN

- Turn passes to next player
- If any player has reached N songs → "Player X Wins!" celebration, with option to keep playing
- Host manually starts the next song

### Token Economy

- Each player starts with 2 tokens
- Spend 1 token to hitster (challenge another player's placement)
- Spend 1 token to skip your turn
- Earn 1 token by correctly naming song/artist on your own turn (admin-verified)

## UI Design

### Target

Mobile Chrome only. Full-viewport experience.

### Mounting

Host site provides a container and includes the script:

```html
<div id="hitster-game"></div>
<script src="hitster.js"></script>
<script>
  Hitster.init({
    container: '#hitster-game',
    spotifyClientId: 'your-client-id-here'
  });
</script>
```

The game takes over the container entirely.

### Host Screen

- **Lobby:** Game code displayed prominently, player list, game settings, "Start Game" button
- **Playing:** "Play Song" button, play/pause/resume controls, current phase indicator, player list with token counts, "Award Token?" yes/no during token challenge, their own timeline when it's their turn

### Player Screen

- **Join:** Enter game code + display name
- **Main view:** Personal timeline (horizontal, wrapping for many cards), phase indicator at top
- **Their turn:** Mystery card (card back) floats above timeline, drag into position between existing cards, "Lock In" button
- **Others' turn:** Current player's timeline visible, "Hitster!" button (active after lock-in) with countdown timer
- **Reveal:** Card flips to show title + artist + year, correct = green, wrong = red

### Timeline Cards

- Each card shows: song title, artist, year
- Existing cards always show full info
- Mystery card shows styled back (no info) until reveal
- Gaps between cards are drop targets for placement
- Drag interaction uses pointer events (mobile touch-friendly)

### General UI Principles

- Large text, high contrast, big tap targets
- Phase indicator always visible at top
- Simple animations for reveals
- No scrolling except timeline itself (wraps when many cards)

## Technology Stack

| Layer | Choice |
|-------|--------|
| UI Framework | React |
| Build Tool | Vite (outputs single JS bundle) |
| Connectivity | PeerJS (WebRTC) |
| Audio | Spotify Web Playback SDK |
| Song Data | Bundled JSON file |
| State Persistence | localStorage on host |
| Drag & Drop | Pointer events |
| Target | Mobile Chrome |

## Persistence & Recovery

- Host's browser stores game state in `localStorage` after every state change
- If host's browser is killed (e.g., OS memory pressure), reopening the game URL offers to restore the previous session
- Players would need to reconnect (re-enter game code) but their timeline state is preserved on the host

## Non-Goals (for initial version)

- Desktop layout
- Safari / Firefox support
- Song database management UI
- Remote play (different locations)
- Spectator mode
- Chat or messaging between players
- Persistent accounts or game history
