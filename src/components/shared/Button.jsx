import React from 'react';

const baseClass = 'w-full max-w-xs py-3.5 px-6 rounded-xl font-semibold text-base tracking-wide transition-all active:scale-95 disabled:opacity-40 disabled:cursor-default touch-manipulation';

const variants = {
  primary: 'bg-[#e63946] hover:bg-[#d62839] text-white shadow-lg shadow-[#e63946]/20',
  secondary: 'bg-[#457b9d] hover:bg-[#3a6d8c] text-white shadow-lg shadow-[#457b9d]/20',
  ghost: 'bg-transparent text-white/70 border border-white/20 hover:border-white/40',
  success: 'bg-[#2ecc71] hover:bg-[#27ae60] text-white shadow-lg shadow-[#2ecc71]/20',
  spotify: 'bg-[#1db954] hover:bg-[#1aa34a] text-white shadow-lg shadow-[#1db954]/20',
};

export default function Button({ onClick, disabled, variant = 'primary', children, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variants[variant] || variants.primary} ${className}`}
    >
      {children}
    </button>
  );
}
