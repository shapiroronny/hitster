import React from 'react';

export default function PlaybackControls({ onToggle, isPlaying }) {
  return (
    <div className="flex justify-center py-2 shrink-0">
      <button
        onClick={onToggle}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl transition-all active:scale-90 shadow-lg"
        style={{
          background: isPlaying
            ? 'linear-gradient(135deg, #457b9d, #3a6d8c)'
            : 'linear-gradient(135deg, #e63946, #d62839)',
          boxShadow: isPlaying
            ? '0 4px 16px rgba(69,123,157,0.4)'
            : '0 4px 16px rgba(230,57,70,0.4)',
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  );
}
