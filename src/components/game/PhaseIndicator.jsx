import React from 'react';
import { PHASES } from '../../state/gameState.js';

const PHASE_CONFIG = {
  [PHASES.LISTENING]: { label: 'Now Playing...', color: '#9d4edd', border: 'border-[#9d4edd]', text: 'text-[#9d4edd]' },
  [PHASES.PLACING]: { label: 'Place your song!', color: '#e63946', border: 'border-[#e63946]', text: 'text-[#e63946]' },
  [PHASES.HITSTER_WINDOW]: { label: 'Hitster window!', color: '#f4a261', border: 'border-[#f4a261]', text: 'text-[#f4a261]' },
  [PHASES.REVEAL]: { label: 'Reveal!', color: '#2ecc71', border: 'border-[#2ecc71]', text: 'text-[#2ecc71]' },
  [PHASES.TOKEN_CHALLENGE]: { label: 'Name that song!', color: '#f4a261', border: 'border-[#f4a261]', text: 'text-[#f4a261]' },
  [PHASES.GAME_OVER]: { label: 'Game Over!', color: '#e63946', border: 'border-[#e63946]', text: 'text-[#e63946]' },
};

const DEFAULT_CONFIG = { label: '', color: '#457b9d', border: 'border-[#457b9d]', text: 'text-[#457b9d]' };

export default function PhaseIndicator({ phase, currentPlayerName, isMyTurn }) {
  const config = PHASE_CONFIG[phase] ?? { ...DEFAULT_CONFIG, label: phase };
  const text = isMyTurn ? config.label : `${currentPlayerName}'s turn`;

  return (
    <div className={`bg-white/5 border-b-2 ${config.border} py-2.5 px-4 text-center shrink-0`}>
      <span className={`${config.text} font-bold text-[0.95rem]`}>
        {text}
      </span>
      {!isMyTurn && (
        <span className="text-white/40 text-[0.85rem] ml-2">
          {config.label}
        </span>
      )}
    </div>
  );
}
