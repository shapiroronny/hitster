import { useState, useRef, useCallback } from 'react';

export function useDragToTimeline(dropZoneRefs, onDrop) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [activeDropZone, setActiveDropZone] = useState(null);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragPos({ x: e.clientX, y: e.clientY });
    e.target.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging) return;
      e.preventDefault();
      setDragPos({ x: e.clientX, y: e.clientY });

      let found = null;
      for (let i = 0; i < dropZoneRefs.current.length; i++) {
        const ref = dropZoneRefs.current[i];
        if (!ref) continue;
        const rect = ref.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          found = i;
          break;
        }
      }
      setActiveDropZone(found);
    },
    [isDragging, dropZoneRefs]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!isDragging) return;
      e.preventDefault();
      setIsDragging(false);
      if (activeDropZone !== null) {
        onDrop(activeDropZone);
      }
      setActiveDropZone(null);
    },
    [isDragging, activeDropZone, onDrop]
  );

  return {
    isDragging,
    dragPos,
    activeDropZone,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
  };
}
