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
      style={{
        background: '#9d4edd',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        padding: '14px 28px',
        fontSize: '1.1rem',
        fontWeight: 700,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        touchAction: 'manipulation',
      }}
    >
      HITSTER! ({remaining}s)
    </button>
  );
}
