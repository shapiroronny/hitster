let playerInstance = null;
let deviceId = null;

export function initSpotifyPlayer(accessToken, { onReady, onError } = {}) {
  return new Promise((resolve, reject) => {
    const setupPlayer = () => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
          name: 'Hitster Game',
          getOAuthToken: (cb) => cb(accessToken),
        });

        player.addListener('ready', ({ device_id }) => {
          deviceId = device_id;
          playerInstance = player;
          if (onReady) onReady(device_id);
          resolve(player);
        });

        player.addListener('not_ready', ({ device_id }) => {
          const err = new Error(`Device ${device_id} has gone offline`);
          if (onError) onError(err);
        });

        player.addListener('initialization_error', ({ message }) => {
          const err = new Error(`Initialization error: ${message}`);
          if (onError) onError(err);
          reject(err);
        });

        player.addListener('authentication_error', ({ message }) => {
          const err = new Error(`Authentication error: ${message}`);
          if (onError) onError(err);
          reject(err);
        });

        player.addListener('account_error', ({ message }) => {
          const err = new Error(`Account error: ${message}`);
          if (onError) onError(err);
          reject(err);
        });

        player.connect();
      };
    };

    if (window.Spotify) {
      // SDK already loaded — fire the callback manually
      setupPlayer();
      window.onSpotifyWebPlaybackSDKReady();
      return;
    }

    setupPlayer();

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
  });
}

export async function playSong(accessToken, spotifyTrackId) {
  if (!deviceId) {
    throw new Error('No Spotify device ID available');
  }

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [`spotify:track:${spotifyTrackId}`] }),
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to play song: ${error}`);
  }
}

export async function pauseSong() {
  if (!playerInstance) {
    throw new Error('Spotify player is not initialized');
  }
  await playerInstance.pause();
}

export async function resumeSong() {
  if (!playerInstance) {
    throw new Error('Spotify player is not initialized');
  }
  await playerInstance.resume();
}

export async function stopSong() {
  if (!playerInstance) {
    throw new Error('Spotify player is not initialized');
  }
  await playerInstance.pause();
}
