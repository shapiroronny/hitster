import React, { useState } from 'react';
import RoleSelect from './components/screens/RoleSelect.jsx';
import Lobby from './components/screens/Lobby.jsx';
import GameScreen from './components/screens/GameScreen.jsx';
import { createInitialState } from './state/gameState.js';

const SCREENS = {
  ROLE_SELECT: 'ROLE_SELECT',
  LOBBY: 'LOBBY',
  GAME: 'GAME',
};

function noopNetwork() {
  return { current: { broadcast() {}, sendTo() {}, getConnectedPlayerIds() { return []; }, destroy() {} } };
}

export default function App({ spotifyClientId }) {
  const [screen, setScreen] = useState(SCREENS.ROLE_SELECT);
  const [role, setRole] = useState(null);
  const [gameData, setGameData] = useState(null);

  function handleRoleSelect(selectedRole) {
    setRole(selectedRole);
    setScreen(SCREENS.LOBBY);
  }

  function handleGameStart(data) {
    setGameData(data);
    setScreen(SCREENS.GAME);
  }

  // Practice mode — single player, no Spotify, no network
  function handlePractice() {
    const initialState = createInitialState({
      players: [{ id: 'host', name: 'You' }],
      winThreshold: 10,
      hitsterTimer: 15,
      seed: Date.now(),
    });
    setGameData({
      initialState,
      networkRef: noopNetwork(),
      isHost: true,
      spotifyToken: null,
      actionHandlerRef: { current: null },
    });
    setScreen(SCREENS.GAME);
  }

  // Restore a saved game
  function handleRestore(savedState) {
    setGameData({
      initialState: savedState,
      networkRef: noopNetwork(),
      isHost: true,
      spotifyToken: null,
      actionHandlerRef: { current: null },
    });
    setScreen(SCREENS.GAME);
  }

  switch (screen) {
    case SCREENS.ROLE_SELECT:
      return <RoleSelect onSelect={handleRoleSelect} onRestore={handleRestore} onPractice={handlePractice} />;
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
