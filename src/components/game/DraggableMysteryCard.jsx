import React from 'react';
import { SongCard } from './SongCard';

export function DraggableMysteryCard({ isDragging, dragPos, handlers }) {
  // Single element — style changes, DOM doesn't swap
  const style = isDragging
    ? {
        position: 'fixed',
        left: dragPos.x - 45,
        top: dragPos.y - 50,
        zIndex: 1000,
        pointerEvents: 'none',
        transform: 'scale(1.1)',
        transition: 'transform 0.05s',
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))',
      }
    : {
        display: 'flex',
        justifyContent: 'center',
        padding: '12px 0',
        touchAction: 'none',
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      };

  // When dragging, handlers are on document (via hook).
  // When not dragging, handlers are on this element to initiate drag.
  return (
    <div style={style} {...(isDragging ? {} : handlers)}>
      <SongCard isBack />
    </div>
  );
}
