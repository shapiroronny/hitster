const SPOTIFY_TOKEN_KEY = 'hitster-spotify-token';
const LOBBY_STATE_KEY = 'hitster-lobby-state';

function generateRandomString(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, length);
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// --- Token persistence ---

export function saveSpotifyToken(token) {
  try {
    localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(token));
  } catch (e) { /* ignore */ }
}

export function loadSpotifyToken() {
  try {
    const raw = localStorage.getItem(SPOTIFY_TOKEN_KEY);
    if (!raw) return null;
    const token = JSON.parse(raw);
    // Still valid if more than 5 min left
    if (token.expiresAt && token.expiresAt > Date.now() + 5 * 60 * 1000) {
      return token;
    }
    // Has refresh token — can be refreshed
    if (token.refreshToken) {
      return { ...token, needsRefresh: true };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function clearSpotifyToken() {
  localStorage.removeItem(SPOTIFY_TOKEN_KEY);
}

// --- Lobby state persistence (survives OAuth redirect) ---

export function saveLobbyState(state) {
  try {
    sessionStorage.setItem(LOBBY_STATE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

export function loadLobbyState() {
  try {
    const raw = sessionStorage.getItem(LOBBY_STATE_KEY);
    sessionStorage.removeItem(LOBBY_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// --- OAuth flow ---

export async function startSpotifyAuth(clientId, redirectUri, lobbyState) {
  // Save lobby state so we can restore after redirect
  if (lobbyState) {
    saveLobbyState(lobbyState);
  }

  const codeVerifier = generateRandomString(128);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);

  sessionStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'streaming user-read-email user-read-private',
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function handleSpotifyCallback(clientId, redirectUri) {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (!code) return null;

  const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) throw new Error('No code verifier found');

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  sessionStorage.removeItem('spotify_code_verifier');

  // Clean URL (preserve ?test if present)
  const cleanUrl = window.location.pathname + (window.location.search.includes('test') ? '?test=true' : '');
  history.replaceState({}, document.title, cleanUrl);

  const token = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  // Cache token
  saveSpotifyToken(token);

  return token;
}

export async function refreshAccessToken(clientId, refreshToken) {
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();

  const token = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  saveSpotifyToken(token);
  return token;
}

/**
 * Try to get a valid Spotify token: cached, refreshed, or from OAuth callback.
 * Returns token or null.
 */
export async function getOrRefreshToken(clientId, redirectUri) {
  // 1. Check if we're returning from OAuth
  const callbackToken = await handleSpotifyCallback(clientId, redirectUri);
  if (callbackToken) return callbackToken;

  // 2. Check cached token
  const cached = loadSpotifyToken();
  if (!cached) return null;

  // 3. Still valid
  if (!cached.needsRefresh) return cached;

  // 4. Try refresh
  try {
    return await refreshAccessToken(clientId, cached.refreshToken);
  } catch (e) {
    console.warn('Token refresh failed:', e);
    clearSpotifyToken();
    return null;
  }
}
