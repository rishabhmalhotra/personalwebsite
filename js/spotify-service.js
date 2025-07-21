class SpotifyService {
    constructor() {
        this.OEMBED_ENDPOINT = 'https://open.spotify.com/oembed';
        this.PLAYLIST_ID = '6YGvluoYkCURQePkFMoYqW';  // Your playlist ID
        this.currentTrackInfo = null;
        this.embedController = null; // Add this line
    }

    async getPlaylistData() {
        try {
            const response = await fetch(`${this.OEMBED_ENDPOINT}?url=spotify:playlist:${this.PLAYLIST_ID}`);
            const data = await response.json();
            
            // Modify the HTML to fix the allow attribute warning
            const modifiedHtml = data.html.replace(
                'allow="encrypted-media"',
                'allow="encrypted-media; autoplay" title="Spotify Player"'
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

    async getTrackInfo(trackURI) {
        try {
            // Extract track ID from URI (spotify:track:ID format)
            const trackId = trackURI.split(':').pop();
            
            // Use oEmbed API to get track information
            const response = await fetch(`${this.OEMBED_ENDPOINT}?url=https://open.spotify.com/track/${trackId}`);
            const data = await response.json();
            
            // The oEmbed response for a track provides the artist in `author_name`
            return {
                track: data.title || '',
                artist: data.author_name || '',
                thumbnail: data.thumbnail_url
            };
        } catch (error) {
            console.error('Error fetching track info:', error);
            return null;
        }
    }

    // Parse the Spotify SDK messages for track changes
    async handleSDKMessage(event) {
        if (event.origin !== 'https://open.spotify.com') return null;
        
        try {
            // Log the raw message for debugging
            // console.log('Received Spotify message:', event.data);
            
            // Handle both string and object messages
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            
            // Log parsed data
            // console.log('Parsed Spotify data:', data);
            
            if (data.type === 'playback_update' || data.type === 'player_state_changed') {
                const payload = data.payload || data.data || {};
                const playingURI = payload.playingURI || payload.track?.uri;

                if (!playingURI) {
                    return null;
                }

                const isPaused = payload.isPaused;
                const isPlaying = payload.hasOwnProperty('isPaused') ? !isPaused : (this.currentTrackInfo ? this.currentTrackInfo.isPlaying : false);

                // Only fetch new track info if we have a URI and it's different from current
                if (playingURI && (!this.currentTrackInfo || this.currentTrackInfo.uri !== playingURI)) {
                    // console.log('Fetching track info for URI:', playingURI);
                    const trackInfo = await this.getTrackInfo(playingURI);
                    
                    if (trackInfo) {
                        this.currentTrackInfo = {
                            ...trackInfo,
                            uri: playingURI,
                            isPlaying: isPlaying
                        };
                        // console.log('Updated track info:', this.currentTrackInfo);
                        return this.currentTrackInfo;
                    }
                } else if (this.currentTrackInfo) {
                    // Just update playing state if we already have track info
                    this.currentTrackInfo.isPlaying = isPlaying;
                    return this.currentTrackInfo;
                }
            }
        } catch (error) {
            console.error('Error handling Spotify message:', error, event.data);
        }
        return null;
    }

    // Initialize the Spotify Web Playback SDK
    initializeSDK(onReadyCallback) { // Add callback parameter
        window.onSpotifyIframeApiReady = (IFrameAPI) => {
            console.log('Spotify IFrame API is ready');
            const element = document.querySelector('.spotify-music');
            const options = {
                uri: `spotify:playlist:${this.PLAYLIST_ID}`
            };
            const callback = (controller) => {
                console.log('EmbedController created');
                this.embedController = controller;
                // Execute the callback when the controller is ready
                if (onReadyCallback) {
                    onReadyCallback(controller);
                }
            };
            IFrameAPI.createController(element, options, callback);
        };

        // Load the Spotify IFrame API script
        const script = document.createElement('script');
        script.src = 'https://open.spotify.com/embed-podcast/iframe-api/v1';
        script.async = true;
        document.head.appendChild(script);
    }
} 