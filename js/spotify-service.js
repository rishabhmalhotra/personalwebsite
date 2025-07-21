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
            // Log the raw message for debugging
            console.log('Received Spotify message:', event.data);
            
            // Handle both string and object messages
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            
            // Log parsed data
            console.log('Parsed Spotify data:', data);
            
            // Handle different message types
            if (data.type === 'playback_update' || data.type === 'player_state_changed') {
                const trackInfo = {
                    track: '',
                    artist: '',
                    isPlaying: false
                };

                // Try different possible data structures
                if (data.track) {
                    trackInfo.track = data.track.name || data.track.title || '';
                    trackInfo.artist = data.track.artists?.[0]?.name || data.track.artist || '';
                } else if (data.data) {
                    // Some messages might nest the data
                    trackInfo.track = data.data.name || data.data.title || '';
                    trackInfo.artist = data.data.artists?.[0]?.name || data.data.artist || '';
                }

                trackInfo.isPlaying = data.playing || data.data?.playing || false;

                console.log('Extracted track info:', trackInfo);
                return trackInfo;
            }
        } catch (error) {
            console.error('Error handling Spotify message:', error);
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