import React from 'react';

export default function PlayerList({ players, currentPlayerIndex }) {
  return (
    <div className="flex overflow-x-auto gap-2 py-2 px-3 shrink-0">
      {players.map((player, index) => {
        const isActive = index === currentPlayerIndex;
        return (
          <div
            key={player.id}
            className={`rounded-[10px] py-1.5 px-3.5 shrink-0 text-center min-w-[80px] transition-all duration-200 border-2 ${
              isActive
                ? 'bg-[#e63946]/15 border-[#e63946]'
                : 'bg-white/5 border-white/[0.08]'
            }`}
          >
            <div className={`text-[0.85rem] ${isActive ? 'text-white font-bold' : 'text-white/70 font-medium'}`}>
              {player.name}
            </div>
            <div className="text-white/40 text-[0.7rem] mt-0.5">
              {player.timeline.length - 1} cards &middot; {player.tokens} tokens
            </div>
          </div>
        );
      })}
    </div>
  );
}
