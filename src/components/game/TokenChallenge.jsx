import React from 'react';
import Button from '../shared/Button.jsx';

export default function TokenChallenge({ playerName, onAward }) {
  return (
    <div className="text-center py-3 px-4">
      <p className="text-[#eee] text-base mb-3">
        Did {playerName} name the song?
      </p>
      <div className="flex gap-2.5 justify-center">
        <Button
          onClick={() => onAward(true)}
          variant="success"
          className="!max-w-[140px]"
        >
          Yes
        </Button>
        <Button
          onClick={() => onAward(false)}
          variant="secondary"
          className="!max-w-[140px]"
        >
          No
        </Button>
      </div>
    </div>
  );
}
