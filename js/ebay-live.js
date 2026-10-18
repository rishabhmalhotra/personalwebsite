/**
 * eBay Live Animation Module
 * Live-streaming themed animations: pulsing LIVE badge, broadcast rings,
 * a flowing data-stream particle field, and a trust-layer pulse.
 */

const EBayLive = {
  rafId: null,
  particles: [],
  started: false,

  // eBay brand palette
  palette: [
    { r: 229, g: 40,  b: 23  }, // red
    { r: 247, g: 172, b: 10  }, // yellow
    { r: 0,   g: 118, b: 163 }, // blue
    { r: 0,   g: 131, b: 77  }, // green
  ],

  /**
   * Pulsing LIVE badge + broadcast rings on the eBay Live hero
   */
  initLiveBadge() {
    const badge = document.querySelector('.ebay-live-badge');
    if (!badge) return;

    const rings = ['ring-1', 'ring-2', 'ring-3'];
    rings.forEach((cls, i) => {
      let ring = badge.querySelector('.' + cls);
      if (!ring) {
        ring = document.createElement('span');
        ring.className = 'live-ring ' + cls;
        badge.appendChild(ring);
      }
      ring.style.animationDelay = (i * 0.6) + 's';
    });
  },

  /**
   * Trust-layer pulse on the trust callout
   */
  initTrustPulse() {
    const pulse = document.querySelector('.trust-pulse');
    if (!pulse) return;
    // The CSS handles the pulsing; just ensure it is visible.
    pulse.style.opacity = '1';
  },

  /**
   * Flowing data-stream particle field across the eBay Live section.
   * Lightweight canvas implementation (no external deps) so it works
   * even when the Three.js bundle is not loaded.
   */
  initStreamParticles() {
    const section = document.querySelector('#ebay-live');
    if (!section) return;

    let canvas = section.querySelector('.ebay-stream-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'ebay-stream-canvas';
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.opacity = '0.5';
      section.style.position = 'relative';
      section.insertBefore(canvas, section.firstChild);
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawnParticles(rect.width, rect.height);
    };

    function Particle() {
      this.reset();
    }
    Particle.prototype.reset = function () {
      const rect = canvas.getBoundingClientRect();
      this.x = Math.random() * rect.width;
      this.y = Math.random() * rect.height;
      this.r = 1 + Math.random() * 2;
      this.speed = 0.2 + Math.random() * 0.6;
      this.color = EBayLive.palette[(Math.random() * EBayLive.palette.length) | 0];
      this.phase = Math.random() * Math.PI * 2;
    };

    let particles = [];
    function spawnParticles(w, h) {
      const count = Math.min(80, Math.floor((w * h) / 20000));
      particles = [];
      for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x -= p.speed;
        p.y += Math.sin(p.phase) * 0.2;
        p.phase += 0.02;

        if (p.x < -10) p.reset();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.color.r + ',' + p.color.g + ',' + p.color.b + ',0.9)';
        ctx.fill();
      }

      EBayLive.rafId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    this._cleanup = () => {
      cancelAnimationFrame(EBayLive.rafId);
      window.removeEventListener('resize', resize);
    };
  },

  /**
   * Start all eBay Live animations
   */
  start() {
    if (this.started) return;
    this.started = true;
    this.initLiveBadge();
    this.initTrustPulse();
    this.initStreamParticles();
  },

  /**
   * Stop and clean up
   */
  stop() {
    if (this._cleanup) this._cleanup();
    this.started = false;
  },
};

/**
 * Initialize eBay Live animations when DOM is ready.
 */
function domReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

function initializeEBayLiveAnimation() {
  EBayLive.start();
}

function initializeStreamParticles() {
  EBayLive.initStreamParticles();
}

function initializeTrustPulse() {
  EBayLive.initTrustPulse();
}

domReady(initializeEBayLiveAnimation);

// Export for programmatic use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeEBayLiveAnimation,
    initializeStreamParticles,
    initializeTrustPulse,
    EBayLive,
  };
}