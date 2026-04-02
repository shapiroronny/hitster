import { useState, useRef, useCallback } from 'react';

export function useDragToTimeline(dropZoneRefs, onDrop) {
  const [renderState, setRenderState] = useState({
    isDragging: false,
    dragPos: { x: 0, y: 0 },
    activeDropZone: null,
  });

  // Refs for current values inside handlers (avoid stale closures)
  const isDraggingRef = useRef(false);
  const activeDropZoneRef = useRef(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  const findDropZone = useCallback((x, y) => {
    for (let i = 0; i < dropZoneRefs.current.length; i++) {
      const el = dropZoneRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return i;
      }
    }
    return null;
  }, [dropZoneRefs]);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    activeDropZoneRef.current = null;
    setRenderState({
      isDragging: true,
      dragPos: { x: e.clientX, y: e.clientY },
      activeDropZone: null,
    });
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const zone = findDropZone(e.clientX, e.clientY);
    activeDropZoneRef.current = zone;
    setRenderState({
      isDragging: true,
      dragPos: { x: e.clientX, y: e.clientY },
      activeDropZone: zone,
    });
  }, [findDropZone]);

  const handlePointerUp = useCallback((e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    isDraggingRef.current = false;
    const zone = activeDropZoneRef.current;
    activeDropZoneRef.current = null;
    setRenderState({
      isDragging: false,
      dragPos: { x: 0, y: 0 },
      activeDropZone: null,
    });
    if (zone !== null) {
      onDropRef.current(zone);
    }
  }, []);

  return {
    isDragging: renderState.isDragging,
    dragPos: renderState.dragPos,
    activeDropZone: renderState.activeDropZone,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
  };
}
