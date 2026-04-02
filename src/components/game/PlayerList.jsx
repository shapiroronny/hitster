import React from 'react';

export default function PlayerList({ players, currentPlayerIndex }) {
  return (
    <div
      style={{
        display: 'flex',
        overflowX: 'auto',
        gap: 10,
        padding: '8px 12px',
      }}
    >
      {players.map((player, index) => {
        const isActive = index === currentPlayerIndex;
        return (
          <div
            key={player.id}
            style={{
              background: '#16213e',
              border: `2px solid ${isActive ? '#e63946' : '#457b9d'}`,
              borderRadius: 8,
              padding: '6px 12px',
              flexShrink: 0,
              textAlign: 'center',
              minWidth: 90,
            }}
          >
            <div style={{ color: '#eee', fontWeight: 600, fontSize: '0.85rem' }}>
              {player.id}
            </div>
            <div style={{ color: '#aaa', fontSize: '0.75rem', marginTop: 2 }}>
              {player.timeline.length} cards | {player.tokens} tokens
            </div>
          </div>
        );
      })}
    </div>
  );
}
