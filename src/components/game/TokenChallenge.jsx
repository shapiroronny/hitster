import React from 'react';
import Button from '../shared/Button.jsx';

export default function TokenChallenge({ playerName, onAward }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 16px' }}>
      <p style={{ color: '#eee', fontSize: '1rem', marginBottom: 12 }}>
        Did {playerName} name the song?
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Button
          onClick={() => onAward(true)}
          variant="primary"
          style={{ maxWidth: 140, background: '#2ecc71' }}
        >
          Yes
        </Button>
        <Button
          onClick={() => onAward(false)}
          variant="secondary"
          style={{ maxWidth: 140 }}
        >
          No
        </Button>
      </div>
    </div>
  );
}
