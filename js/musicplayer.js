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
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('MusicPlayer: Initializing');
        try {
            // Find the container and Spotify iframe
            const container = document.querySelector('.music-player-container');
            this.spotifyIframe = container.querySelector('.spotify-music');

            if (!container || !this.spotifyIframe) {
                throw new Error('Required elements not found');
            }

            // Create and add the custom player UI
            this.createPlayerUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize waveform
            this.initWaveform();
            
            console.log('MusicPlayer: Initialization complete');
        } catch (error) {
            console.error('MusicPlayer: Initialization failed:', error);
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
                    this.updatePlayButtonState();
                    
                    // Handle waveform animation
                    if (this.isPlaying) {
                        if (!this.animationId) {
                            this.animate();
                        }
                    } else {
                        if (this.animationId) {
                            cancelAnimationFrame(this.animationId);
                            this.animationId = null;
                        }
                    }
                }
            } catch (error) {
                console.error('Error handling Spotify message:', error);
            }
        });
    }

    updatePlayButtonState() {
        if (this.playButton) {
            this.playButton.innerHTML = this.isPlaying ? 
                '<i class="fas fa-pause"></i>' : 
                '<i class="fas fa-play"></i>';
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
            
            // Create top section with track info and controls
            const topSection = document.createElement('div');
            topSection.className = 'player-top';
            
            // Create track info
            const trackInfo = document.createElement('div');
            trackInfo.className = 'track-info';
            this.trackInfoElement = trackInfo;
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
            
            // Create waveform container
            const waveformContainer = document.createElement('div');
            waveformContainer.className = 'waveform-container';
            
            // Create waveform canvas
            const waveform = document.createElement('canvas');
            waveform.id = 'waveform';
            this.waveformCanvas = waveform;
            this.waveformCtx = waveform.getContext('2d');
            
            // Assemble the UI
            controls.appendChild(prevButton);
            controls.appendChild(playButton);
            controls.appendChild(nextButton);
            
            topSection.appendChild(trackInfo);
            topSection.appendChild(controls);
            
            waveformContainer.appendChild(waveform);
            
            innerContainer.appendChild(topSection);
            innerContainer.appendChild(waveformContainer);
            
            playerContainer.appendChild(innerContainer);
            
            // Add to the page
            const container = document.querySelector('.music-player-container');
            container.appendChild(playerContainer);
            
            // Set initial canvas size
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            
        } catch (error) {
            console.error('MusicPlayer: Error creating UI:', error);
        }
    }
    
    resizeCanvas() {
        if (this.waveformCanvas) {
            const container = this.waveformCanvas.parentElement;
            this.waveformCanvas.width = container.clientWidth;
            this.waveformCanvas.height = container.clientHeight;
        }
    }
    
    togglePlayback() {
        this.isPlaying = !this.isPlaying;
        this.updatePlayButtonState();
        
        // Send message to Spotify iframe
        this.spotifyIframe.contentWindow.postMessage(
            { command: this.isPlaying ? 'play' : 'pause' },
            'https://open.spotify.com'
        );
        
        // Handle waveform animation
        if (this.isPlaying) {
            if (!this.animationId) {
                this.animate();
            }
        } else {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
    }
    
    initWaveform() {
        // Generate initial particles
        this.generateParticles();
        
        // Start animation if playing
        if (this.isPlaying) {
            this.animate();
        }
    }
    
    generateParticles() {
        this.particles = [];
        const particleCount = 50;
        const width = this.waveformCanvas.width;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: (width / particleCount) * i,
                y: this.waveformCanvas.height / 2,
                amplitude: Math.random() * 20 + 10,
                phase: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.02
            });
        }
    }
    
    animate() {
        if (!this.isPlaying) return;
        
        const ctx = this.waveformCtx;
        const height = this.waveformCanvas.height;
        const width = this.waveformCanvas.width;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw waveform
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        
        // Create smooth curve through particles
        for (let i = 0; i < this.particles.length - 1; i++) {
            const particle = this.particles[i];
            const nextParticle = this.particles[i + 1];
            
            // Update particle position
            particle.phase += particle.speed;
            particle.y = height / 2 + Math.sin(particle.phase) * particle.amplitude;
            
            // Calculate control points for smooth curve
            const xc = (particle.x + nextParticle.x) / 2;
            const yc = (particle.y + nextParticle.y) / 2;
            
            ctx.quadraticCurveTo(particle.x, particle.y, xc, yc);
        }
        
        // Style the waveform
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw reflection
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Initialize the player
new MusicPlayer(); 