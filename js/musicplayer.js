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
        
        // Initialize Spotify SDK
        this.spotifyService.initializeSDK();
        
        // Get playlist data
        const playlistData = await this.spotifyService.getPlaylistData();
        if (playlistData) {
            // Create and insert the Spotify iframe with the obtained HTML
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = playlistData.html;
            const iframe = tempContainer.querySelector('iframe');
            iframe.classList.add('spotify-music');
            this.container.appendChild(iframe);
            
            // Create custom player UI
            this.createPlayerUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize waveform
            this.initWaveform();
            
            // Start animation
            this.animate();
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
            
            // Create waveform canvas
            const waveformCanvas = document.createElement('canvas');
            waveformCanvas.className = 'waveform-canvas';
            waveformCanvas.width = 200;
            waveformCanvas.height = 40;
            this.waveformCanvas = waveformCanvas;
            this.waveformCtx = waveformCanvas.getContext('2d');
            
            // Create track info
            const trackInfo = document.createElement('div');
            trackInfo.className = 'track-info';
            
            // Create and store references to track info elements
            this.trackTitleElement = document.createElement('div');
            this.trackTitleElement.className = 'track-title';
            
            this.trackArtistElement = document.createElement('div');
            this.trackArtistElement.className = 'track-artist';
            
            // Add track info elements to container
            trackInfo.appendChild(this.trackTitleElement);
            trackInfo.appendChild(this.trackArtistElement);
            
            // Assemble the player
            innerContainer.appendChild(playButton);
            innerContainer.appendChild(waveformCanvas);
            innerContainer.appendChild(trackInfo);
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
        window.addEventListener('message', (event) => {
            const trackData = this.spotifyService.handleSDKMessage(event);
            if (trackData) {
                this.updateTrackInfo(trackData.track, trackData.artist);
                this.isPlaying = trackData.isPlaying;
                this.updatePlayButton();
            }
        });
    }
    
    togglePlayback() {
        const iframe = document.querySelector('.spotify-music');
        if (!iframe?.contentWindow) return;
        
        this.isPlaying = !this.isPlaying;
        this.updatePlayButton();
        
        // Send message to Spotify iframe
        iframe.contentWindow.postMessage({
            command: this.isPlaying ? 'play' : 'pause'
        }, 'https://open.spotify.com');
        
        // Update waveform animation
        if (this.isPlaying) {
            this.generateParticles();
        }
    }
    
    updatePlayButton() {
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
        
        if (title) {
            this.trackTitleElement.textContent = title;
            this.currentTrack.name = title;
        }
        
        if (artist) {
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
        
        // Update and draw particles
        this.waveformCtx.strokeStyle = 'rgba(43, 188, 138, 0.6)';
        this.waveformCtx.lineWidth = 2;
        
        // Draw the main waveform
        this.waveformCtx.beginPath();
        this.particles.forEach((particle, index) => {
            // Smooth amplitude transition
            particle.amplitude += (particle.targetAmplitude - particle.amplitude) * 0.15;
            
            // Calculate wave position with phase offset
            const time = Date.now() * particle.frequency;
            const waveOffset = this.isPlaying ? 
                Math.sin(time + particle.phase) * particle.amplitude : 0;
            const y = particle.baseY + waveOffset;
            
            if (index === 0) {
                this.waveformCtx.moveTo(particle.x, y);
            } else {
                // Use quadratic curves for smoother lines
                const prevParticle = this.particles[index - 1];
                const cpX = (particle.x + prevParticle.x) / 2;
                this.waveformCtx.quadraticCurveTo(prevParticle.x, prevParticle.baseY + 
                    Math.sin(time + prevParticle.phase) * prevParticle.amplitude,
                    cpX, y);
            }
        });
        this.waveformCtx.stroke();
        
        // Draw a subtle reflection
        this.waveformCtx.strokeStyle = 'rgba(43, 188, 138, 0.2)';
        this.waveformCtx.beginPath();
        this.particles.forEach((particle, index) => {
            const time = Date.now() * particle.frequency;
            const waveOffset = this.isPlaying ? 
                Math.sin(time + particle.phase) * particle.amplitude : 0;
            const y = particle.baseY - waveOffset;
            
            if (index === 0) {
                this.waveformCtx.moveTo(particle.x, y);
            } else {
                const prevParticle = this.particles[index - 1];
                const cpX = (particle.x + prevParticle.x) / 2;
                this.waveformCtx.quadraticCurveTo(prevParticle.x, prevParticle.baseY - 
                    Math.sin(time + prevParticle.phase) * prevParticle.amplitude,
                    cpX, y);
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