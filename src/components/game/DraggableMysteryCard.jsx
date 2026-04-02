import React from 'react';
import { SongCard } from './SongCard';

export function DraggableMysteryCard({ isDragging, dragPos, handlers }) {
  if (isDragging) {
    // Keep inline style for dynamic fixed positioning during drag
    return (
      <div
        style={{
          position: 'fixed',
          left: dragPos.x - 45,
          top: dragPos.y - 50,
          zIndex: 1000,
        }}
        className="pointer-events-none scale-110 transition-transform duration-[50ms] drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
      >
        <SongCard isBack />
      </div>
    );
  }

  return (
    <div
      className="flex justify-center py-3 touch-none cursor-grab select-none"
      {...handlers}
    >
      <SongCard isBack />
    </div>
  );
}
