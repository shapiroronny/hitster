import React from 'react';

const baseCard = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 85,
  minHeight: 90,
  borderRadius: 12,
  padding: '8px 10px',
  textAlign: 'center',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  transition: 'transform 0.15s, box-shadow 0.15s',
};

export function SongCard({ song, isBack, result }) {
  if (isBack) {
    return (
      <div
        style={{
          ...baseCard,
          background: 'linear-gradient(135deg, #e63946 0%, #9d4edd 100%)',
          border: '2px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 16px rgba(157,78,221,0.3)',
        }}
      >
        <span style={{ fontSize: '1.8rem' }}>?</span>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
          DRAG ME
        </span>
      </div>
    );
  }

  let borderColor = 'rgba(255,255,255,0.1)';
  let boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  let bg = 'linear-gradient(180deg, #1e1e3a 0%, #151530 100%)';

  if (result === 'correct') {
    borderColor = '#2ecc71';
    boxShadow = '0 0 16px rgba(46,204,113,0.4)';
  } else if (result === 'wrong') {
    borderColor = '#e74c3c';
    boxShadow = '0 0 16px rgba(231,76,60,0.4)';
  }

  return (
    <div style={{ ...baseCard, background: bg, border: `2px solid ${borderColor}`, boxShadow }}>
      <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
        {song?.y}
      </span>
      <span style={{
        fontSize: '0.7rem',
        color: '#ddd',
        marginTop: 3,
        lineHeight: 1.2,
        maxWidth: 80,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {song?.t}
      </span>
      <span style={{
        fontSize: '0.6rem',
        color: '#999',
        marginTop: 1,
        maxWidth: 80,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {song?.a}
      </span>
    </div>
  );
}
