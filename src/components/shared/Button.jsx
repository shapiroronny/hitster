import React from 'react';

export default function Button({ onClick, disabled, variant = 'primary', children, style }) {
  const base = {
    fontSize: '1.1rem',
    padding: '14px 28px',
    border: 'none',
    borderRadius: '12px',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontWeight: 600,
    width: '100%',
    maxWidth: '320px',
    touchAction: 'manipulation',
  };

  const variants = {
    primary: { background: '#e63946', color: '#fff' },
    secondary: { background: '#457b9d', color: '#fff' },
    ghost: { background: 'transparent', color: '#eee', border: '2px solid #eee' },
  };

  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}
