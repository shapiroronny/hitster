import { useState, useRef, useCallback, useEffect } from 'react';

export function useDragToTimeline(dropZoneRefs, onDrop) {
  const [renderState, setRenderState] = useState({
    isDragging: false,
    dragPos: { x: 0, y: 0 },
    activeDropZone: null,
  });

  const isDraggingRef = useRef(false);
  const activeDropZoneRef = useRef(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const startPosRef = useRef({ x: 0, y: 0 });

  const findDropZone = useCallback((x, y) => {
    if (!dropZoneRefs.current) return null;
    for (let i = 0; i < dropZoneRefs.current.length; i++) {
      const el = dropZoneRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      // Use a generous hit area — expand by 10px each side for mobile touch
      if (
        x >= rect.left - 10 &&
        x <= rect.right + 10 &&
        y >= rect.top - 10 &&
        y <= rect.bottom + 10
      ) {
        return i;
      }
    }
    return null;
  }, [dropZoneRefs]);

  // Document-level move and up handlers — these work even when the
  // original element is unmounted or has pointerEvents:none
  useEffect(() => {
    function onMove(e) {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const zone = findDropZone(x, y);
      activeDropZoneRef.current = zone;
      setRenderState({ isDragging: true, dragPos: { x, y }, activeDropZone: zone });
    }

    function onEnd(e) {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      isDraggingRef.current = false;
      const zone = activeDropZoneRef.current;
      activeDropZoneRef.current = null;
      setRenderState({ isDragging: false, dragPos: { x: 0, y: 0 }, activeDropZone: null });
      if (zone !== null) {
        onDropRef.current(zone);
      }
    }

    // Use both touch and pointer events for maximum mobile compatibility
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: false });
    document.addEventListener('touchcancel', onEnd, { passive: false });
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onEnd, { passive: false });
    document.addEventListener('pointercancel', onEnd, { passive: false });

    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onEnd);
      document.removeEventListener('pointercancel', onEnd);
    };
  }, [findDropZone]);

  // Only pointerDown/touchStart needs to be on the card element
  const handleStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    isDraggingRef.current = true;
    startPosRef.current = { x, y };
    activeDropZoneRef.current = null;
    setRenderState({ isDragging: true, dragPos: { x, y }, activeDropZone: null });
  }, []);

  return {
    isDragging: renderState.isDragging,
    dragPos: renderState.dragPos,
    activeDropZone: renderState.activeDropZone,
    handlers: {
      onTouchStart: handleStart,
      onPointerDown: handleStart,
    },
  };
}
