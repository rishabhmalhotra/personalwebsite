class SpotifyService {
    constructor() {
        this.OEMBED_ENDPOINT = 'https://open.spotify.com/oembed';
        this.PLAYLIST_ID = '6YGvluoYkCURQePkFMoYqW';  // Your playlist ID
    }

    async getPlaylistData() {
        try {
            const response = await fetch(`${this.OEMBED_ENDPOINT}?url=spotify:playlist:${this.PLAYLIST_ID}`);
            const data = await response.json();
            
            // Modify the HTML to fix the allow attribute warning
            const modifiedHtml = data.html.replace(
                'allow="encrypted-media"',
                'allow="encrypted-media" allowfullscreen=""'
            );
            
            return {
                title: data.title,
                author: data.author_name,
                thumbnail: data.thumbnail_url,
                html: modifiedHtml,
                width: data.width,
                height: data.height
            };
        } catch (error) {
            console.error('Error fetching playlist data:', error);
            return null;
        }
    }

    // Parse the Spotify SDK messages for track changes
    handleSDKMessage(event) {
        if (event.origin !== 'https://open.spotify.com') return null;
        
        try {
            // Handle both string and object messages
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            
            if (data.type === 'playback_update') {
                return {
                    track: data.track?.name || '',
                    artist: data.track?.artists?.[0]?.name || '',
                    isPlaying: data.playing || false
                };
            }
        } catch (error) {
            // Only log parsing errors for string data
            if (typeof event.data === 'string') {
                console.error('Error parsing Spotify message:', error);
            }
        }
        return null;
    }

    // Initialize the Spotify Web Playback SDK
    initializeSDK() {
        window.onSpotifyWebPlaybackSDKReady = () => {
            // The SDK is ready to use
            console.log('Spotify Web Playback SDK is ready');
        };

        // Load the Spotify Web Playback SDK script
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        document.head.appendChild(script);
    }
} 