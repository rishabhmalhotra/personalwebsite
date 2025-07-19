/**
 * Main Application Entry Point
 * Initializes all modules and handles page-specific functionality
 */

import { GradientAnimation } from './modules/gradient-animation.js';
import { TextDecryptor } from './modules/text-decryptor.js';
import { initializeCompanyAnimation } from './modules/company-animation.js';
import { initializeTypewriter } from './modules/typewriter.js';
import { initializeThreeScene } from './modules/three-scene.js';
import { initializeBlogFeatures } from './modules/blog-features.js';

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
 * Initialize gradient animation if element exists
 */
function initGradientAnimation() {
  const gradientElement = document.getElementById('gradient');
  if (gradientElement) {
    const gradient = new GradientAnimation(gradientElement);
    gradient.start();
    return gradient;
  }
  return null;
}

/**
 * Initialize text decryption animation
 */
function initTextDecryption() {
  const decryptedEl = document.getElementById('decoded');
  const encryptedEl = document.getElementById('encoded');
  
  if (decryptedEl && encryptedEl) {
    const decryptor = new TextDecryptor(decryptedEl, encryptedEl);
    decryptor.start();
    return decryptor;
  }
  return null;
}

/**
 * Initialize page-specific features based on current page
 */
function initPageFeatures() {
  const currentPage = window.location.pathname;
  
  // Homepage features
  if (currentPage === '/' || currentPage === '/index.html') {
    // Initialize company name animation based on viewport
    const isMobile = document.documentElement.clientWidth <= 980;
    initializeCompanyAnimation(isMobile);
    
    // Initialize typewriter effect
    initializeTypewriter();
  }
  
  // Blog features
  if (currentPage.includes('/Astrodynamics/')) {
    // Initialize Three.js scene for blog
    initializeThreeScene();
    
    // Initialize blog-specific features
    initializeBlogFeatures();
  }
}

/**
 * Main initialization function
 */
function init() {
  console.log('Initializing Rishabh Malhotra Portfolio...');
  
  // Initialize global features
  const animations = {
    gradient: initGradientAnimation(),
    textDecryptor: initTextDecryption(),
  };
  
  // Initialize page-specific features
  initPageFeatures();
  
  // Handle window resize for responsive features
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Re-initialize responsive features
      const isMobile = document.documentElement.clientWidth <= 980;
      if (window.companyAnimation) {
        window.companyAnimation.updateMode(isMobile);
      }
    }, 250);
  });
  
  // Expose animations to global scope for debugging
  if (process.env.NODE_ENV !== 'production') {
    window.animations = animations;
  }
}

// Initialize when DOM is ready
domReady(init);

// Export for use in other scripts if needed
export { init, domReady }; 