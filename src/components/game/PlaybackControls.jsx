import React from 'react';
import Button from '../shared/Button.jsx';

export default function PlaybackControls({ onPlay, onPause, onResume, isPlaying }) {
  if (!isPlaying) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <Button onClick={onPlay} variant="primary" style={{ maxWidth: 150 }}>
          Play Song
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', padding: '8px 0' }}>
      <Button onClick={onPause} variant="secondary" style={{ maxWidth: 150 }}>
        Pause
      </Button>
      <Button onClick={onResume} variant="primary" style={{ maxWidth: 150 }}>
        Resume
      </Button>
    </div>
  );
}
