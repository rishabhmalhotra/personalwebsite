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
        this.currentTrack = {
            name: "Loading...",
            artist: "..."
        };
        this.trackInfoElement = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            console.log('MusicPlayer: Waiting for DOM to load');
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            console.log('MusicPlayer: DOM already loaded, initializing');
            this.init();
        }
    }

    updateTrackInfo(name, artist) {
        this.currentTrack = { name, artist };
        if (this.trackInfoElement) {
            this.trackInfoElement.innerHTML = `
                <p class="track-name">${name}</p>
                <p class="track-artist">${artist}</p>
            `;
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
            
            // Create inner container
            const innerContainer = document.createElement('div');
            innerContainer.className = 'player-inner';
            
            // Create top section with track info and controls
            const topSection = document.createElement('div');
            topSection.className = 'player-top';
            
            // Create track info
            const trackInfo = document.createElement('div');
            trackInfo.className = 'track-info';
            this.trackInfoElement = trackInfo; // Store reference for updates
            this.updateTrackInfo(this.currentTrack.name, this.currentTrack.artist);
            
            // Create controls container
            const controls = document.createElement('div');
            controls.className = 'controls';
            
            // Create previous button
            const prevButton = document.createElement('button');
            prevButton.className = 'control-button';
            prevButton.innerHTML = '<i class="fas fa-backward"></i>';
            prevButton.addEventListener('click', () => {
                this.spotifyIframe.contentWindow.postMessage({ command: 'prev' }, 'https://open.spotify.com');
            });
            
            // Create play button
            const playButton = document.createElement('button');
            playButton.className = 'play-button';
            playButton.innerHTML = '<i class="fas fa-play"></i>';
            this.playButton = playButton;
            
            // Create next button
            const nextButton = document.createElement('button');
            nextButton.className = 'control-button';
            nextButton.innerHTML = '<i class="fas fa-forward"></i>';
            nextButton.addEventListener('click', () => {
                this.spotifyIframe.contentWindow.postMessage({ command: 'next' }, 'https://open.spotify.com');
            });
            
            // Create waveform canvas
            const waveformCanvas = document.createElement('canvas');
            waveformCanvas.className = 'waveform-canvas';
            waveformCanvas.width = 200;
            waveformCanvas.height = 24;
            this.waveformCanvas = waveformCanvas;
            this.waveformCtx = waveformCanvas.getContext('2d');
            
            // Assemble the controls
            controls.appendChild(prevButton);
            controls.appendChild(playButton);
            controls.appendChild(nextButton);
            
            // Assemble the top section
            topSection.appendChild(trackInfo);
            topSection.appendChild(controls);
            
            // Assemble the player
            innerContainer.appendChild(topSection);
            innerContainer.appendChild(waveformCanvas);
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
        
        // Listen for messages from Spotify iframe
        window.addEventListener('message', (event) => {
            if (event.origin !== 'https://open.spotify.com') return;
            
            try {
                const data = event.data;
                // Log all messages from Spotify to understand the data structure
                console.log('Spotify message:', data);
                
                // Handle track info updates
                if (data.type === 'playerStateChanged' && data.data && data.data.track) {
                    const track = data.data.track;
                    this.updateTrackInfo(
                        track.name || 'Unknown Track',
                        track.artists?.map(a => a.name).join(', ') || 'Unknown Artist'
                    );
                }
                
                // Handle play state changes
                if (data.type === 'playbackStateChanged') {
                    this.isPlaying = data.data?.isPaused === false;
                    this.playButton.innerHTML = this.isPlaying ? 
                        '<i class="fas fa-pause"></i>' : 
                        '<i class="fas fa-play"></i>';
                }
            } catch (error) {
                console.error('Error handling Spotify message:', error);
            }
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
        const numParticles = 32; // Increased number of particles
        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                x: (i / (numParticles - 1)) * this.waveformCanvas.width,
                baseY: this.waveformCanvas.height / 2,
                amplitude: 0,
                targetAmplitude: 0,
                frequency: 0.02 + Math.random() * 0.01, // Reduced frequency variation
                phase: Math.random() * Math.PI * 2 // Added phase offset
            });
        }
    }
    
    generateParticles() {
        // Only generate new particles if playing
        if (!this.isPlaying) {
            this.particles.forEach(particle => {
                particle.targetAmplitude = 0;
            });
            return;
        }
        
        // Simulate audio reactivity
        this.particles.forEach((particle, index) => {
            // Create a wave-like pattern
            const baseAmplitude = 8;
            const randomFactor = Math.random() * 4;
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
            const waveOffset = Math.sin(time + particle.phase) * particle.amplitude;
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
            const waveOffset = Math.sin(time + particle.phase) * particle.amplitude;
            const y = particle.baseY - waveOffset; // Inverted offset for reflection
            
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
        
        // Update particles only if playing
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