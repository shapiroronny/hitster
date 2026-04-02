import React from 'react';
import Button from '../shared/Button.jsx';
import { loadGameState } from '../../persistence/storage.js';

export default function RoleSelect({ onSelect, onRestore }) {
  const savedGame = loadGameState();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 20,
      padding: 24,
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 100%)',
    }}>
      <h1 style={{
        fontSize: '3.5rem',
        fontWeight: 900,
        letterSpacing: '0.08em',
        background: 'linear-gradient(135deg, #e63946, #9d4edd)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: 4,
      }}>
        HITSTER
      </h1>
      <p style={{ fontSize: '1rem', color: '#888', marginBottom: 32 }}>
        Guess the year. Build your timeline.
      </p>

      {savedGame && (
        <Button onClick={() => onRestore(savedGame)} variant="success" style={{ marginBottom: 8 }}>
          Resume Game ({savedGame.players?.length} players, round {savedGame.drawIndex || '?'})
        </Button>
      )}

      <Button onClick={() => onSelect('host')}>Host New Game</Button>
      <Button onClick={() => onSelect('player')} variant="secondary">
        Join Game
      </Button>
    </div>
  );
}
