import React from 'react';
import { SongCard } from './SongCard.jsx';

export default function RevealResult({ revealResult }) {
  if (!revealResult) return null;

  const { song, playerCorrect, hitsterCorrect } = revealResult;

  let message;
  let messageClass;

  if (playerCorrect) {
    message = 'Correct! Song added to timeline.';
    messageClass = 'text-[#2ecc71]';
  } else if (hitsterCorrect) {
    message = 'Wrong! Hitster got it right and takes the song.';
    messageClass = 'text-[#e74c3c]';
  } else {
    message = 'Nobody got it right. Song discarded.';
    messageClass = 'text-[#e74c3c]';
  }

  const result = playerCorrect ? 'correct' : 'wrong';

  return (
    <div className="text-center py-3 px-4">
      <div className="flex justify-center mb-3">
        <SongCard song={song} result={result} />
      </div>
      <p className={`${messageClass} font-semibold text-base m-0`}>
        {message}
      </p>
    </div>
  );
}
