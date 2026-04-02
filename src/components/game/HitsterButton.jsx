import React, { useState, useEffect } from 'react';

export default function HitsterButton({ timerSeconds, canHitster, onClaim, disabled }) {
  const [remaining, setRemaining] = useState(timerSeconds);

  useEffect(() => {
    if (!canHitster) {
      setRemaining(timerSeconds);
      return;
    }

    setRemaining(timerSeconds);

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [canHitster, timerSeconds]);

  if (!canHitster || remaining === 0) return null;

  return (
    <button
      onClick={onClaim}
      disabled={disabled}
      className="bg-[#9d4edd] text-white border-none rounded-xl py-3.5 px-7 text-lg font-bold touch-manipulation transition-all hover:bg-[#8b3ecc] active:scale-95 disabled:opacity-50 disabled:cursor-default shadow-lg shadow-[#9d4edd]/30"
    >
      HITSTER! ({remaining}s)
    </button>
  );
}
