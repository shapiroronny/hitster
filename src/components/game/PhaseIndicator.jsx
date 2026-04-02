import React from 'react';
import { PHASES } from '../../state/gameState.js';

const PHASE_CONFIG = {
  [PHASES.LISTENING]: { label: 'Now Playing...', color: '#9d4edd' },
  [PHASES.PLACING]: { label: 'Place your song!', color: '#e63946' },
  [PHASES.HITSTER_WINDOW]: { label: 'Hitster window!', color: '#f4a261' },
  [PHASES.REVEAL]: { label: 'Reveal!', color: '#2ecc71' },
  [PHASES.TOKEN_CHALLENGE]: { label: 'Name that song!', color: '#f4a261' },
  [PHASES.GAME_OVER]: { label: 'Game Over!', color: '#e63946' },
};

export default function PhaseIndicator({ phase, currentPlayerName, isMyTurn }) {
  const config = PHASE_CONFIG[phase] ?? { label: phase, color: '#457b9d' };
  const text = isMyTurn ? config.label : `${currentPlayerName}'s turn`;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderBottom: `2px solid ${config.color}`,
      padding: '10px 16px',
      textAlign: 'center',
      flexShrink: 0,
    }}>
      <span style={{ color: config.color, fontWeight: 700, fontSize: '0.95rem' }}>
        {text}
      </span>
      {!isMyTurn && (
        <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: 8 }}>
          {config.label}
        </span>
      )}
    </div>
  );
}
