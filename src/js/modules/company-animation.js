/**
 * Company Animation Module (Simplified)
 * Shows company name with simple typing effect
 * Note: Main page now uses static company name - this is kept for compatibility
 */

export class CompanyAnimation {
  constructor(element, options = {}) {
    this.element = element;
    this.text = options.text || 'BLOCK';
    this.speed = options.speed || 100;
    
    this.timeoutId = null;
  }

  start() {
    // Simplified - just show the text immediately
    if (this.element) {
      this.element.innerHTML = `<span class="company-name">${this.text}</span>`;
    }
  }

  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  destroy() {
    this.stop();
    this.element = null;
  }
}

/**
 * Initialize company animation (simplified)
 */
export function initializeCompanyAnimation(isMobile) {
  const element = document.querySelector('#text');
  if (!element) return null;

  const animation = new CompanyAnimation(element, {
    text: 'BLOCK'
  });

  animation.start();
  
  window.companyAnimation = animation;
  
  return animation;
}
