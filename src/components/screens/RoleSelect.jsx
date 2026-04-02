import React from 'react';
import Button from '../shared/Button.jsx';

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: '#0f3460',
  padding: '24px',
  boxSizing: 'border-box',
};

const titleStyle = {
  fontSize: '3rem',
  fontWeight: 800,
  color: '#e63946',
  letterSpacing: '0.15em',
  margin: 0,
  marginBottom: '12px',
};

const subtitleStyle = {
  fontSize: '1.1rem',
  color: '#a8dadc',
  margin: 0,
  marginBottom: '48px',
  textAlign: 'center',
};

const buttonsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
  maxWidth: '320px',
  alignItems: 'center',
};

export default function RoleSelect({ onSelect }) {
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>HITSTER</h1>
      <p style={subtitleStyle}>Guess the year. Build your timeline.</p>
      <div style={buttonsStyle}>
        <Button variant="primary" onClick={() => onSelect('host')}>
          Host Game
        </Button>
        <Button variant="secondary" onClick={() => onSelect('player')}>
          Join Game
        </Button>
      </div>
    </div>
  );
}
