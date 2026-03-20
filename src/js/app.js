/**
 * Main Application Entry Point
 * Minimal initialization - animations handled by CSS
 * Terminal/Code Aesthetic for Backend Engineer
 */

/**
 * DOM Ready handler
 * @param {Function} fn - Function to execute when DOM is ready
 */
function domReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

/**
 * Initialize scroll reveal animations
 * Uses simple IntersectionObserver
 */
function initScrollReveal() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe elements with 'reveal' class
  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
}

/**
 * Initialize navigation scroll effect
 */
function initNavScroll() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  }, { passive: true });
}

/**
 * Initialize mobile navigation toggle
 */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (!toggle || !navLinks) return;
  
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  
  // Close on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
}

/**
 * Main initialization function
 */
function init() {
  console.log('Initializing Rishabh Malhotra Portfolio...');
  
  // Initialize scroll reveal
  initScrollReveal();
  
  // Initialize navigation effects
  initNavScroll();
  initMobileNav();
  
  // Auto-update year in footer
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
  
  console.log('Portfolio initialized');
}

// Initialize when DOM is ready
domReady(init);

// Export for use in other scripts if needed
export { init, domReady };
