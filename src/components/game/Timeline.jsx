import React from 'react';
import { SongCard } from './SongCard';

export function Timeline({ songs, showDropZones, activeDropZone, dropZoneRefs, revealedSong, placedIndex, isDragging, dragHandlers }) {
  const items = [];

  function renderDropZone(index) {
    const isActive = activeDropZone === index;
    const isPlaced = placedIndex === index && !isDragging;

    return (
      <div
        key={`dz-${index}`}
        ref={(el) => { dropZoneRefs.current[index] = el; }}
        className={`min-h-[90px] flex items-center justify-center rounded-lg transition-all duration-150 shrink-0 border-2 border-dashed ${
          isPlaced
            ? 'w-[85px] border-[#9d4edd] bg-[#9d4edd]/20'
            : isActive
              ? 'w-[60px] border-[#e63946] bg-[#e63946]/20 scale-y-105'
              : 'w-9 border-white/15 bg-white/[0.03]'
        }`}
      >
        {isPlaced && (
          <div className="touch-none cursor-grab select-none" {...dragHandlers}>
            <SongCard isBack />
          </div>
        )}
        {!isPlaced && isActive && <span className="text-xl text-[#e63946]">+</span>}
      </div>
    );
  }

  songs.forEach((song, i) => {
    if (showDropZones) {
      items.push(renderDropZone(i));
    }

    const result = revealedSong && revealedSong.id === song.id ? revealedSong.result : undefined;
    items.push(
      <div key={`song-${song.id ?? i}`} className="shrink-0">
        <SongCard song={song} result={result} />
      </div>
    );
  });

  if (showDropZones) {
    items.push(renderDropZone(songs.length));
  }

  return (
    <div className="flex flex-wrap gap-1.5 justify-center items-center py-4 px-2 min-h-[110px]">
      {items.length === 0 && (
        <span className="text-white/30 text-sm">No songs yet</span>
      )}
      {items}
    </div>
  );
}
