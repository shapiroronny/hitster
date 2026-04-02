import React, { useState, useRef } from 'react';
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

  // Restore a saved game (host-only, no network — local single-device resume)
  function handleRestore(savedState) {
    const networkRef = { current: { broadcast() {}, sendTo() {}, getConnectedPlayerIds() { return []; }, destroy() {} } };
    const actionHandlerRef = { current: null };
    setGameData({
      initialState: savedState,
      networkRef,
      isHost: true,
      spotifyToken: null, // Will need to re-auth Spotify
      actionHandlerRef,
    });
    setScreen(SCREENS.GAME);
  }

  switch (screen) {
    case SCREENS.ROLE_SELECT:
      return <RoleSelect onSelect={handleRoleSelect} onRestore={handleRestore} />;
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
