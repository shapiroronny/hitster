import React from 'react';
import Button from '../shared/Button.jsx';

export default function PlaybackControls({ onPlay, onPause, onResume, isPlaying }) {
  if (!isPlaying) {
    return (
      <div className="flex justify-center py-2">
        <Button onClick={onPlay} variant="primary" className="!max-w-[150px]">
          Play Song
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 justify-center py-2">
      <Button onClick={onPause} variant="secondary" className="!max-w-[150px]">
        Pause
      </Button>
      <Button onClick={onResume} variant="primary" className="!max-w-[150px]">
        Resume
      </Button>
    </div>
  );
}
