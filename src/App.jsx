import React, { useState } from 'react';
import RoleSelect from './components/screens/RoleSelect.jsx';
import Lobby from './components/screens/Lobby.jsx';
import GameScreen from './components/screens/GameScreen.jsx';
import { loadGameState } from './persistence/storage.js';

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
  const [practice, setPractice] = useState(false);

  const isTestMode = new URLSearchParams(window.location.search).has('test');

  function handleRoleSelect(selectedRole) {
    setRole(selectedRole);
    setPractice(false);
    setScreen(SCREENS.LOBBY);
  }

  function handlePractice() {
    setRole('host');
    setPractice(true);
    setScreen(SCREENS.LOBBY);
  }

  function handleGameStart(data) {
    setGameData(data);
    setScreen(SCREENS.GAME);
  }

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
      return <RoleSelect onSelect={handleRoleSelect} onRestore={handleRestore} onPractice={isTestMode ? handlePractice : null} />;
    case SCREENS.LOBBY:
      return (
        <Lobby
          role={role}
          spotifyClientId={spotifyClientId}
          onGameStart={handleGameStart}
          practice={practice}
        />
      );
    case SCREENS.GAME:
      return <GameScreen gameData={gameData} spotifyClientId={spotifyClientId} />;
    default:
      return null;
  }
}
