import React from 'react';
import { SongCard } from './SongCard';

const dropZoneBase = {
  minHeight: 90,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  transition: 'all 0.15s ease',
  flexShrink: 0,
};

export function Timeline({ songs, showDropZones, activeDropZone, dropZoneRefs, revealedSong }) {
  const items = [];

  songs.forEach((song, i) => {
    if (showDropZones) {
      const isActive = activeDropZone === i;
      items.push(
        <div
          key={`dz-${i}`}
          ref={(el) => { dropZoneRefs.current[i] = el; }}
          style={{
            ...dropZoneBase,
            width: isActive ? 60 : 36,
            border: isActive ? '2px dashed #e63946' : '2px dashed rgba(255,255,255,0.15)',
            background: isActive ? 'rgba(230,57,70,0.2)' : 'rgba(255,255,255,0.03)',
            transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
          }}
        >
          {isActive && <span style={{ fontSize: '1.2rem', color: '#e63946' }}>+</span>}
        </div>
      );
    }

    const result = revealedSong && revealedSong.id === song.id ? revealedSong.result : undefined;
    items.push(
      <div key={`song-${song.id ?? i}`} style={{ flexShrink: 0 }}>
        <SongCard song={song} result={result} />
      </div>
    );
  });

  if (showDropZones) {
    const lastIndex = songs.length;
    const isActive = activeDropZone === lastIndex;
    items.push(
      <div
        key={`dz-${lastIndex}`}
        ref={(el) => { dropZoneRefs.current[lastIndex] = el; }}
        style={{
          ...dropZoneBase,
          width: isActive ? 60 : 36,
          border: isActive ? '2px dashed #e63946' : '2px dashed rgba(255,255,255,0.15)',
          background: isActive ? 'rgba(230,57,70,0.2)' : 'rgba(255,255,255,0.03)',
          transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
        }}
      >
        {isActive && <span style={{ fontSize: '1.2rem', color: '#e63946' }}>+</span>}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px 8px',
      minHeight: 110,
    }}>
      {items.length === 0 && (
        <span style={{ color: '#666', fontSize: '0.9rem' }}>No songs yet</span>
      )}
      {items}
    </div>
  );
}
