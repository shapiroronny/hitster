import React from 'react';

export function SongCard({ song, isBack, result }) {
  if (isBack) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #e63946, #9d4edd)',
          border: '2px solid #e63946',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 90,
          minHeight: 80,
          borderRadius: 10,
        }}
      >
        <span style={{ fontSize: '2rem' }}>?</span>
      </div>
    );
  }

  let borderColor = '#457b9d';
  let boxShadow = 'none';
  if (result === 'correct') {
    borderColor = '#2ecc71';
    boxShadow = '0 0 8px #2ecc71';
  } else if (result === 'wrong') {
    borderColor = '#e74c3c';
    boxShadow = '0 0 8px #e74c3c';
  }

  return (
    <div
      style={{
        background: '#1a1a4e',
        border: `2px solid ${borderColor}`,
        boxShadow,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 90,
        minHeight: 80,
        borderRadius: 10,
        padding: '6px 8px',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>
        {song?.y}
      </span>
      <span style={{ fontSize: '0.8rem', color: '#ccc', marginTop: 2 }}>
        {song?.t}
      </span>
      <span style={{ fontSize: '0.7rem', color: '#999', marginTop: 1 }}>
        {song?.a}
      </span>
    </div>
  );
}
