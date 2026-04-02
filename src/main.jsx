import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';

function App() {
  return <div>Hitster loading...</div>;
}

const Hitster = {
  init({ container, spotifyClientId }) {
    const el = document.querySelector(container);
    if (!el) throw new Error(`Hitster: container "${container}" not found`);
    const root = createRoot(el);
    root.render(<App spotifyClientId={spotifyClientId} />);
  },
};

window.Hitster = Hitster;
export default Hitster;
