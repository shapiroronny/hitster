import React from 'react';

const baseCard = 'inline-flex flex-col items-center justify-center min-w-[85px] min-h-[90px] rounded-xl py-2 px-2.5 text-center select-none transition-all duration-150';

export function SongCard({ song, isBack, result }) {
  if (isBack) {
    return (
      <div className={`${baseCard} bg-gradient-to-br from-[#e63946] to-[#9d4edd] border-2 border-white/15 shadow-lg shadow-[#9d4edd]/30`}>
        <span className="text-3xl">?</span>
        <span className="text-[0.6rem] text-white/60 mt-0.5">
          DRAG ME
        </span>
      </div>
    );
  }

  let borderClass = 'border-white/10';
  let shadowClass = 'shadow-md shadow-black/20';

  if (result === 'correct') {
    borderClass = 'border-[#2ecc71]';
    shadowClass = 'shadow-lg shadow-[#2ecc71]/40';
  } else if (result === 'wrong') {
    borderClass = 'border-[#e74c3c]';
    shadowClass = 'shadow-lg shadow-[#e74c3c]/40';
  }

  return (
    <div className={`${baseCard} bg-gradient-to-b from-[#1e1e3a] to-[#151530] border-2 ${borderClass} ${shadowClass}`}>
      <span className="text-xl font-bold text-white">
        {song?.y}
      </span>
      <span className="text-[0.7rem] text-[#ddd] mt-0.5 leading-tight max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap">
        {song?.t}
      </span>
      <span className="text-[0.6rem] text-white/50 mt-px max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap">
        {song?.a}
      </span>
    </div>
  );
}
