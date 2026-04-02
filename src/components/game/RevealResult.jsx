import React from 'react';
import { SongCard } from './SongCard.jsx';

export default function RevealResult({ revealResult }) {
  if (!revealResult) return null;

  const { song, playerCorrect, hitsterCorrect } = revealResult;

  let message;
  let messageColor;

  if (playerCorrect) {
    message = 'Correct! Song added to timeline.';
    messageColor = '#2ecc71';
  } else if (hitsterCorrect) {
    message = 'Wrong! Hitster got it right and takes the song.';
    messageColor = '#e74c3c';
  } else {
    message = 'Nobody got it right. Song discarded.';
    messageColor = '#e74c3c';
  }

  const result = playerCorrect ? 'correct' : 'wrong';

  return (
    <div style={{ textAlign: 'center', padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <SongCard song={song} result={result} />
      </div>
      <p style={{ color: messageColor, fontWeight: 600, fontSize: '1rem', margin: 0 }}>
        {message}
      </p>
    </div>
  );
}
