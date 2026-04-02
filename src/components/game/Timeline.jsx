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
          ref={(el) => { dropZoneRefs.current[i] = el; }}
          className={`min-h-[90px] flex items-center justify-center rounded-lg transition-all duration-150 shrink-0 border-2 border-dashed ${
            isActive
              ? 'w-[60px] border-[#e63946] bg-[#e63946]/20 scale-y-105'
              : 'w-9 border-white/15 bg-white/[0.03]'
          }`}
        >
          {isActive && <span className="text-xl text-[#e63946]">+</span>}
        </div>
      );
    }

    const result = revealedSong && revealedSong.id === song.id ? revealedSong.result : undefined;
    items.push(
      <div key={`song-${song.id ?? i}`} className="shrink-0">
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
        className={`min-h-[90px] flex items-center justify-center rounded-lg transition-all duration-150 shrink-0 border-2 border-dashed ${
          isActive
            ? 'w-[60px] border-[#e63946] bg-[#e63946]/20 scale-y-105'
            : 'w-9 border-white/15 bg-white/[0.03]'
        }`}
      >
        {isActive && <span className="text-xl text-[#e63946]">+</span>}
      </div>
    );
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
