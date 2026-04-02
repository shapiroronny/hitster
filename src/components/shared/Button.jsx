import React from 'react';

export default function Button({ onClick, disabled, variant = 'primary', children, style }) {
  const base = {
    fontSize: '1rem',
    padding: '14px 24px',
    border: 'none',
    borderRadius: '12px',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontWeight: 600,
    width: '100%',
    maxWidth: '320px',
    touchAction: 'manipulation',
    letterSpacing: '0.02em',
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #e63946, #d62839)',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(230,57,70,0.3)',
    },
    secondary: {
      background: 'linear-gradient(135deg, #457b9d, #3a6d8c)',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(69,123,157,0.3)',
    },
    ghost: {
      background: 'transparent',
      color: '#ccc',
      border: '1.5px solid rgba(255,255,255,0.25)',
    },
    success: {
      background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(46,204,113,0.3)',
    },
    spotify: {
      background: '#1db954',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(29,185,84,0.3)',
    },
  };

  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}
