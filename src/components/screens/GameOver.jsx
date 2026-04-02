import React from 'react';
import Button from '../shared/Button.jsx';

export default function GameOver({ winnerName, onContinue }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-5 gap-6">
      <h1 className="text-[#eee] text-3xl font-bold m-0 text-center">
        {winnerName} Wins!
      </h1>
      {onContinue && (
        <Button onClick={onContinue} variant="primary">
          Keep Playing
        </Button>
      )}
    </div>
  );
}
