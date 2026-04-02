import React from 'react';
import Button from '../shared/Button.jsx';
import { loadGameState, clearGameState } from '../../persistence/storage.js';

export default function RoleSelect({ onSelect, onRestore, onPractice }) {
  const [savedGame, setSavedGame] = React.useState(() => loadGameState());

  function handleDelete() {
    clearGameState();
    setSavedGame(null);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-6 bg-gradient-to-b from-[#0a0a1a] to-[#1a1a3e]">
      <h1 className="text-6xl font-black tracking-widest bg-gradient-to-r from-[#e63946] to-[#9d4edd] bg-clip-text text-transparent mb-1">
        HITSTER
      </h1>
      <p className="text-base text-white/40 mb-8">
        Guess the year. Build your timeline.
      </p>

      {savedGame && (
        <div className="flex flex-col items-center gap-2 mb-2 w-full max-w-xs">
          <Button onClick={() => onRestore(savedGame)} variant="success">
            Resume Game ({savedGame.players?.length} players)
          </Button>
          <button
            onClick={handleDelete}
            className="text-sm text-white/30 hover:text-[#e63946] transition-colors"
          >
            Delete saved game
          </button>
        </div>
      )}

      {onPractice && (
        <Button onClick={onPractice} variant="ghost">
          Practice (Test)
        </Button>
      )}
      <Button onClick={() => onSelect('host')}>Host New Game</Button>
      <Button onClick={() => onSelect('player')} variant="secondary">
        Join Game
      </Button>
    </div>
  );
}
