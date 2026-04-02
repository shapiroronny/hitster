import React from 'react';
import { SongCard } from './SongCard';

const CARD_WIDTH = 90;
const CARD_HEIGHT = 80;

export function DraggableMysteryCard({ isDragging, dragPos, handlers }) {
  if (isDragging) {
    return (
      <div
        style={{
          position: 'fixed',
          left: dragPos.x - CARD_WIDTH / 2,
          top: dragPos.y - CARD_HEIGHT / 2,
          zIndex: 1000,
          pointerEvents: 'none',
          transform: 'scale(1.1)',
          transformOrigin: 'center center',
        }}
      >
        <SongCard isBack />
      </div>
    );
  }

  return (
    <div
      style={{
        margin: 'auto',
        touchAction: 'none',
        cursor: 'grab',
      }}
      {...handlers}
    >
      <SongCard isBack />
    </div>
  );
}
