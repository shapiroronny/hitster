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
        rawDispatch(action);
      } else {
        networkRef.current?.send(action.type, action);
      }
    },
    [isHost, networkRef]
  );

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
