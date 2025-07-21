// Custom Music Player Controller
class MusicPlayer {
    constructor() {
        // Prevent multiple instances
        if (window.musicPlayerInstance) {
            console.log('MusicPlayer: Instance already exists');
            return window.musicPlayerInstance;
        }
        
        this.isPlaying = false;
        this.spotifyService = new SpotifyService();
        this.playButton = null;
        this.waveformCanvas = null;
        this.waveformCtx = null;
        this.animationId = null;
        this.particles = [];
        this.currentTrack = {
            name: '',
            artist: ''
        };
        this.container = null;
        this.trackTitleElement = null;
        this.trackArtistElement = null;
        
        // Store instance globally
        window.musicPlayerInstance = this;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
        
        return this;
    }

    
    async init() {
        console.log('MusicPlayer: Init called');
        
        // Get the container
        this.container = document.querySelector('.music-player-container');
        if (!this.container) {
            console.error('MusicPlayer: Container not found!');
            return;
        }

        // Get playlist data
        const playlistData = await this.spotifyService.getPlaylistData();
        if (playlistData) {
            // Create and insert the Spotify iframe
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = playlistData.html;
            const iframe = tempContainer.querySelector('iframe');
            iframe.className = 'spotify-music'; // Use className for consistency
            this.container.appendChild(iframe);
            
            // Initialize Spotify SDK and pass a callback to run when it's ready
            this.spotifyService.initializeSDK(() => {
                console.log('MusicPlayer: Spotify SDK is ready, creating UI.');
                
                // Now that the SDK is ready, create the custom player UI
                this.createPlayerUI();
                
                // Set up event listeners
                this.setupEventListeners();
                
                // Initialize and start the waveform animation
                this.initWaveform();
                this.animate();
            });
        }
    }
    
    createPlayerUI() {
        console.log('MusicPlayer: Creating player UI');
        try {
            // Create player container
            const playerContainer = document.createElement('div');
            playerContainer.className = 'custom-music-player';
            
            // Create inner container
            const innerContainer = document.createElement('div');
            innerContainer.className = 'player-inner';
            
            // Create play/pause button
            const playButton = document.createElement('button');
            playButton.className = 'play-button';
            playButton.innerHTML = '<i class="fas fa-play"></i>';
            this.playButton = playButton;

            // Create a wrapper for details (waveform and track info)
            const detailsWrapper = document.createElement('div');
            detailsWrapper.className = 'details-wrapper';
            
            // Create waveform canvas
            const waveformCanvas = document.createElement('canvas');
            waveformCanvas.className = 'waveform-canvas';
            waveformCanvas.width = 160;
            waveformCanvas.height = 35;
            this.waveformCanvas = waveformCanvas;
            this.waveformCtx = waveformCanvas.getContext('2d');
            
            // Create track info
            const trackInfo = document.createElement('div');
            trackInfo.className = 'track-info';
            
            // Create and store references to track info elements
            this.trackTitleElement = document.createElement('div');
            this.trackTitleElement.className = 'track-title';
            
            // Add a span inside the title element for scrolling
            const titleText = document.createElement('span');
            this.trackTitleElement.appendChild(titleText);
            
            this.trackArtistElement = document.createElement('div');
            this.trackArtistElement.className = 'track-artist';
            
            // Add track info elements to container
            trackInfo.appendChild(this.trackTitleElement);
            trackInfo.appendChild(this.trackArtistElement);

            // Add waveform and track info to details wrapper
            detailsWrapper.appendChild(waveformCanvas);
            detailsWrapper.appendChild(trackInfo);
            
            // Assemble the player
            innerContainer.appendChild(playButton);
            innerContainer.appendChild(detailsWrapper);
            playerContainer.appendChild(innerContainer);
            
            // Insert into the music player container
            this.container.appendChild(playerContainer);
            
            console.log('MusicPlayer: Player UI created and inserted');
        } catch (error) {
            console.error('MusicPlayer: Error creating player UI:', error);
        }
    }
    
    setupEventListeners() {
        // Play/pause button click
        this.playButton.addEventListener('click', () => {
            this.togglePlayback();
        });
        
        // Listen for messages from Spotify iframe
        window.addEventListener('message', async (event) => {
            const trackData = await this.spotifyService.handleSDKMessage(event);
            if (trackData && trackData.track) {
                this.updateTrackInfo(trackData.track, trackData.artist);
            }
        });

        // Listen for playback updates from the Spotify controller
        this.spotifyService.embedController.addListener('playback_update', e => {
            const wasPlaying = this.isPlaying;
            this.isPlaying = !e.data.isPaused;
            this.updatePlayButton();
            
            // If playback is paused, force amplitudes to zero for graceful shutdown
            if (wasPlaying && !this.isPlaying) {
                this.particles.forEach(p => p.targetAmplitude = 0);
            }
        });
    }
    
    togglePlayback() {
        if (!this.spotifyService.embedController) {
            console.error('MusicPlayer: Spotify EmbedController not available yet.');
            return;
        }

        // Use the official SDK method to toggle play/pause
        this.spotifyService.embedController.togglePlay();
    }
    
    updatePlayButton() {
        if (!this.playButton) return;
        this.playButton.innerHTML = this.isPlaying ? 
            '<i class="fas fa-pause"></i>' : 
            '<i class="fas fa-play"></i>';
    }
    
    updateTrackInfo(title, artist) {
        console.log('Updating track info:', { title, artist });
        
        if (!this.trackTitleElement || !this.trackArtistElement) {
            console.error('Track info elements not found!');
            return;
        }
        
        const titleSpan = this.trackTitleElement.querySelector('span');

        if (title && titleSpan.textContent !== title) {
            this.trackTitleElement.classList.remove('scrolling'); // Reset animation
            titleSpan.textContent = title;
            this.currentTrack.name = title;

            // Check for overflow and add scrolling class if needed
            // Use a timeout to allow the DOM to update before checking width
            setTimeout(() => {
                if (titleSpan.scrollWidth > this.trackTitleElement.clientWidth) {
                    this.trackTitleElement.classList.add('scrolling');
                }
            }, 100);
        }
        
        if (artist && this.trackArtistElement.textContent !== artist) {
            this.trackArtistElement.textContent = artist;
            this.currentTrack.artist = artist;
        }
        
        // Log current state
        console.log('Current track info:', {
            titleElement: this.trackTitleElement.textContent,
            artistElement: this.trackArtistElement.textContent,
            currentTrack: this.currentTrack
        });
    }
    
    initWaveform() {
        // Initialize particles for waveform effect
        const numParticles = 32;
        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                x: (i / (numParticles - 1)) * this.waveformCanvas.width,
                baseY: this.waveformCanvas.height / 2,
                amplitude: 0,
                targetAmplitude: 0,
                frequency: 0.02 + Math.random() * 0.01,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    generateParticles() {
        this.particles.forEach((particle, index) => {
            const baseAmplitude = this.isPlaying ? 8 : 0;
            const randomFactor = this.isPlaying ? Math.random() * 4 : 0;
            const positionFactor = Math.sin((index / this.particles.length) * Math.PI);
            particle.targetAmplitude = baseAmplitude * positionFactor + randomFactor;
        });
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Clear canvas
        this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
        
        const now = Date.now();
        // Update and draw particles
        this.waveformCtx.strokeStyle = 'rgba(43, 188, 138, 0.6)';
        this.waveformCtx.lineWidth = 2;
        
        // Draw the main waveform
        this.waveformCtx.beginPath();
        this.particles.forEach((particle, index) => {
            // Smooth amplitude transition
            particle.amplitude += (particle.targetAmplitude - particle.amplitude) * 0.15;
            
            // Calculate wave position with phase offset
            const time = now * particle.frequency;
            const waveOffset = this.isPlaying ? 
                Math.sin(time + particle.phase) * particle.amplitude : 0;
            const y = particle.baseY + waveOffset;
            
            if (index === 0) {
                this.waveformCtx.moveTo(particle.x, y);
            } else {
                // Use quadratic curves for smoother lines
                const prevParticle = this.particles[index - 1];
                const prevTime = now * prevParticle.frequency;
                const prevWaveOffset = this.isPlaying ?
                    Math.sin(prevTime + prevParticle.phase) * prevParticle.amplitude : 0;
                const cpX = (particle.x + prevParticle.x) / 2;
                this.waveformCtx.quadraticCurveTo(prevParticle.x, prevParticle.baseY + prevWaveOffset, cpX, y);
            }
        });
        this.waveformCtx.stroke();
        
        // Draw a subtle reflection
        this.waveformCtx.strokeStyle = 'rgba(43, 188, 138, 0.2)';
        this.waveformCtx.beginPath();
        this.particles.forEach((particle, index) => {
            const time = now * particle.frequency;
            const waveOffset = this.isPlaying ? 
                Math.sin(time + particle.phase) * particle.amplitude : 0;
            const y = particle.baseY - waveOffset;
            
            if (index === 0) {
                this.waveformCtx.moveTo(particle.x, y);
            } else {
                const prevParticle = this.particles[index - 1];
                const prevTime = now * prevParticle.frequency;
                const prevWaveOffset = this.isPlaying ?
                    Math.sin(prevTime + prevParticle.phase) * prevParticle.amplitude : 0;
                const cpX = (particle.x + prevParticle.x) / 2;
                this.waveformCtx.quadraticCurveTo(prevParticle.x, prevParticle.baseY - prevWaveOffset, cpX, y);
            }
        });
        this.waveformCtx.stroke();
        
        // Continuously update particles for smoother animation
        if (this.isPlaying) {
            this.generateParticles();
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize the music player
const musicPlayer = new MusicPlayer(); 