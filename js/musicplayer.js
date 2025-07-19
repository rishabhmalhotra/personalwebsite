// Custom Music Player Controller
console.log('DEBUG: Music Player Script Loaded!');

class MusicPlayer {
    constructor() {
        console.log('MusicPlayer: Constructor called');
        this.isPlaying = false;
        this.spotifyIframe = null;
        this.playButton = null;
        this.waveformCanvas = null;
        this.waveformCtx = null;
        this.animationId = null;
        this.particles = [];
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            console.log('MusicPlayer: Waiting for DOM to load');
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            console.log('MusicPlayer: DOM already loaded, initializing');
            this.init();
        }
    }
    
    init() {
        console.log('MusicPlayer: Init called');
        
        // Get container and Spotify iframe
        const container = document.querySelector('.music-player-container');
        this.spotifyIframe = container.querySelector('.spotify-music');
        
        console.log('MusicPlayer: Container found:', container);
        console.log('MusicPlayer: Spotify iframe found:', this.spotifyIframe);
        
        if (!container || !this.spotifyIframe) {
            console.error('MusicPlayer: Required elements not found!');
            return;
        }
        
        // Create custom player UI
        this.createPlayerUI();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize waveform
        this.initWaveform();
        
        // Start animation
        this.animate();
    }
    
    createPlayerUI() {
        console.log('MusicPlayer: Creating player UI');
        try {
            // Create player container
            const playerContainer = document.createElement('div');
            playerContainer.className = 'custom-music-player';
            console.log('MusicPlayer: Created player container');
        
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
        trackInfo.innerHTML = '<span class="track-text">Playlist</span>';
        
        // Assemble the player
        innerContainer.appendChild(playButton);
        innerContainer.appendChild(waveformCanvas);
        innerContainer.appendChild(trackInfo);
        playerContainer.appendChild(innerContainer);
        
        // Insert into the music player container
        this.spotifyIframe.parentNode.appendChild(playerContainer);
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
        
        // Listen for messages from Spotify iframe (if available)
        window.addEventListener('message', (event) => {
            if (event.origin !== 'https://open.spotify.com') return;
            // Handle Spotify events if needed
        });
    }
    
    togglePlayback() {
        if (!this.spotifyIframe.contentWindow) return;
        
        this.isPlaying = !this.isPlaying;
        
        // Update button icon
        this.playButton.innerHTML = this.isPlaying ? 
            '<i class="fas fa-pause"></i>' : 
            '<i class="fas fa-play"></i>';
        
        // Send message to Spotify iframe
        // Note: This uses undocumented Spotify embed API
        this.spotifyIframe.contentWindow.postMessage({
            command: this.isPlaying ? 'play' : 'pause'
        }, 'https://open.spotify.com');
        
        // Update waveform animation
        if (this.isPlaying) {
            this.generateParticles();
        }
    }
    
    initWaveform() {
        // Initialize particles for waveform effect
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: (i / 4) * this.waveformCanvas.width,
                baseY: this.waveformCanvas.height / 2,
                amplitude: 0,
                targetAmplitude: 0,
                frequency: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    generateParticles() {
        // Simulate audio reactivity
        this.particles.forEach(particle => {
            particle.targetAmplitude = this.isPlaying ? 
                5 + Math.random() * 15 : 0;
        });
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Clear canvas
        this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
        
        // Update and draw particles
        this.waveformCtx.strokeStyle = '#2bbc8a';
        this.waveformCtx.lineWidth = 2;
        this.waveformCtx.beginPath();
        
        this.particles.forEach((particle, index) => {
            // Smooth amplitude transition
            particle.amplitude += (particle.targetAmplitude - particle.amplitude) * 0.1;
            
            // Calculate wave position
            const waveOffset = this.isPlaying ? 
                Math.sin(Date.now() * particle.frequency) * particle.amplitude : 0;
            const y = particle.baseY + waveOffset;
            
            if (index === 0) {
                this.waveformCtx.moveTo(particle.x, y);
            } else {
                this.waveformCtx.lineTo(particle.x, y);
            }
        });
        
        this.waveformCtx.stroke();
        
        // Draw center dots
        this.particles.forEach(particle => {
            this.waveformCtx.fillStyle = '#2bbc8a';
            this.waveformCtx.beginPath();
            this.waveformCtx.arc(particle.x, particle.baseY, 2, 0, Math.PI * 2);
            this.waveformCtx.fill();
        });
        
        // Randomly update target amplitudes when playing
        if (this.isPlaying && Math.random() < 0.1) {
            this.generateParticles();
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize the music player with a small delay to ensure DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('Initializing MusicPlayer after DOMContentLoaded');
            const musicPlayer = new MusicPlayer();
        }, 100);
    });
} else {
    setTimeout(() => {
        console.log('Initializing MusicPlayer (DOM already loaded)');
        const musicPlayer = new MusicPlayer();
    }, 100);
} 