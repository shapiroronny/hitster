import React from 'react';
import { PHASES } from '../../state/gameState.js';

const PHASE_LABELS = {
  [PHASES.LISTENING]: 'Now Playing...',
  [PHASES.PLACING]: 'Place your song!',
  [PHASES.HITSTER_WINDOW]: 'Hitster window!',
  [PHASES.REVEAL]: 'Reveal!',
  [PHASES.TOKEN_CHALLENGE]: 'Name that song!',
  [PHASES.GAME_OVER]: 'Game Over!',
};

export default function PhaseIndicator({ phase, currentPlayerName, isMyTurn }) {
  const label = PHASE_LABELS[phase] ?? phase;
  const text = isMyTurn ? label : `${currentPlayerName}'s turn — ${label}`;

  return (
    <div
      style={{
        background: '#16213e',
        borderBottom: '2px solid #457b9d',
        padding: '10px 16px',
        textAlign: 'center',
      }}
    >
      <span style={{ color: '#eee', fontWeight: 600, fontSize: '1rem' }}>{text}</span>
    </div>
  );
}
