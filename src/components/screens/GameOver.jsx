import React from 'react';
import Button from '../shared/Button.jsx';

export default function GameOver({ winnerName, onContinue }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        gap: 24,
      }}
    >
      <h1 style={{ color: '#eee', fontSize: '2rem', margin: 0, textAlign: 'center' }}>
        {winnerName} Wins!
      </h1>
      <Button onClick={onContinue} variant="primary">
        Keep Playing
      </Button>
    </div>
  );
}
