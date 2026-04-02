import React from 'react';

export default function PlayerList({ players, currentPlayerIndex }) {
  return (
    <div style={{
      display: 'flex',
      overflowX: 'auto',
      gap: 8,
      padding: '8px 12px',
      flexShrink: 0,
    }}>
      {players.map((player, index) => {
        const isActive = index === currentPlayerIndex;
        return (
          <div
            key={player.id}
            style={{
              background: isActive ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.05)',
              border: `2px solid ${isActive ? '#e63946' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10,
              padding: '6px 14px',
              flexShrink: 0,
              textAlign: 'center',
              minWidth: 80,
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              color: isActive ? '#fff' : '#bbb',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.85rem',
            }}>
              {player.name}
            </div>
            <div style={{ color: '#777', fontSize: '0.7rem', marginTop: 2 }}>
              {player.timeline.length - 1} cards &middot; {player.tokens} tokens
            </div>
          </div>
        );
      })}
    </div>
  );
}
