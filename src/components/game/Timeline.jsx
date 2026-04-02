import React from 'react';
import { SongCard } from './SongCard';

export function Timeline({ songs, showDropZones, activeDropZone, dropZoneRefs, revealedSong }) {
  const items = [];

  songs.forEach((song, i) => {
    if (showDropZones) {
      const isActive = activeDropZone === i;
      items.push(
        <div
          key={`dz-${i}`}
          ref={(el) => {
            dropZoneRefs.current[i] = el;
          }}
          style={{
            width: isActive ? 50 : 30,
            minHeight: 80,
            border: '2px dashed',
            borderColor: isActive ? '#e63946' : '#457b9d',
            background: isActive ? 'rgba(230,57,70,0.15)' : 'transparent',
            borderRadius: 6,
            flexShrink: 0,
            transition: 'width 0.1s, background 0.1s',
          }}
        />
      );
    }

    const result =
      revealedSong && revealedSong.id === song.id ? revealedSong.result : undefined;

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
        ref={(el) => {
          dropZoneRefs.current[lastIndex] = el;
        }}
        style={{
          width: isActive ? 50 : 30,
          minHeight: 80,
          border: '2px dashed',
          borderColor: isActive ? '#e63946' : '#457b9d',
          background: isActive ? 'rgba(230,57,70,0.15)' : 'transparent',
          borderRadius: 6,
          flexShrink: 0,
          transition: 'width 0.1s, background 0.1s',
        }}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        justifyContent: 'center',
        padding: 12,
        minHeight: 100,
      }}
    >
      {items}
    </div>
  );
}
