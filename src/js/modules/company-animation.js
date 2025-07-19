/**
 * Company Animation Module
 * Handles the company name typing/deleting animation
 */

export class CompanyAnimation {
  constructor(element, options = {}) {
    // Configuration
    this.element = element;
    this.content = options.content || [];
    this.typeSpeed = options.typeSpeed || 35;
    this.deleteSpeed = options.deleteSpeed || 20;
    this.pauseBeforeDelete = options.pauseBeforeDelete || 2000;
    this.pauseBeforeType = options.pauseBeforeType || 500;
    this.startDelay = options.startDelay || 6000;
    this.loopCount = options.loopCount || 1;
    
    // State
    this.currentIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    this.currentLoop = 0;
    this.intervalId = null;
    this.timeoutId = null;
  }

  /**
   * Start the animation
   */
  start() {
    // Clear any existing animations
    this.stop();
    
    // Start after delay
    this.timeoutId = setTimeout(() => {
      this.animate();
    }, this.startDelay);
  }

  /**
   * Main animation loop
   */
  animate() {
    const currentContent = this.content[this.currentIndex];
    
    if (this.isDeleting) {
      // Delete character
      this.charIndex--;
      const text = currentContent.substring(0, this.charIndex);
      this.updateElement(text);
      
      // Check if done deleting
      if (this.charIndex === 0) {
        this.isDeleting = false;
        this.currentIndex = (this.currentIndex + 1) % this.content.length;
        
        // Check if completed all loops
        if (this.currentIndex === 0) {
          this.currentLoop++;
          if (this.loopCount > 0 && this.currentLoop >= this.loopCount) {
            // Keep the first content displayed
            this.charIndex = 0;
            this.typeNextCharacter();
            return;
          }
        }
        
        // Pause before typing next
        setTimeout(() => this.animate(), this.pauseBeforeType);
        return;
      }
    } else {
      // Type character
      this.charIndex++;
      const text = currentContent.substring(0, this.charIndex);
      this.updateElement(text);
      
      // Check if done typing
      if (this.charIndex === currentContent.length) {
        if (this.loopCount > 0 && this.currentLoop >= this.loopCount - 1 && 
            this.currentIndex === this.content.length - 1) {
          // Last word of last loop - don't delete
          return;
        }
        
        this.isDeleting = true;
        // Pause before deleting
        setTimeout(() => this.animate(), this.pauseBeforeDelete);
        return;
      }
    }
    
    // Continue animation
    const speed = this.isDeleting ? this.deleteSpeed : this.typeSpeed;
    setTimeout(() => this.animate(), speed);
  }

  /**
   * Type the next character of the first content item
   */
  typeNextCharacter() {
    const text = this.content[0].substring(0, this.charIndex + 1);
    this.updateElement(text);
    this.charIndex++;
    
    if (this.charIndex < this.content[0].length) {
      setTimeout(() => this.typeNextCharacter(), this.typeSpeed);
    }
  }

  /**
   * Update the element with new text
   * @param {string} text - Text to display
   */
  updateElement(text) {
    if (this.element) {
      this.element.innerHTML = text;
    }
  }

  /**
   * Stop the animation
   */
  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Update animation mode (for responsive behavior)
   * @param {boolean} isMobile - Whether to use mobile mode
   */
  updateMode(isMobile) {
    // Could adjust speeds or content based on mobile/desktop
    // For now, just a placeholder for future enhancement
  }

  /**
   * Destroy the instance
   */
  destroy() {
    this.stop();
    this.element = null;
  }
}

/**
 * Initialize company animation based on viewport
 * @param {boolean} isMobile - Whether mobile view is active
 */
export function initializeCompanyAnimation(isMobile) {
  const element = document.querySelector('#text');
  if (!element) return null;

  // Desktop content with code block
  const desktopContent = [
    '<pre> def Block():\n      building_blocks = ["Square", \n                         "Cash App", \n                         "Spiral", \n                         "Tidal", \n                         "TBD"] \n\n      return building_blocks[0] </pre>'
  ];

  // Mobile content (simpler)
  const mobileContent = ['Square.'];

  const animation = new CompanyAnimation(element, {
    content: isMobile ? mobileContent : desktopContent,
    typeSpeed: 35,
    deleteSpeed: 20,
    pauseBeforeDelete: 2000,
    pauseBeforeType: 500,
    startDelay: 6000,
    loopCount: 1
  });

  animation.start();
  
  // Store globally for responsive updates
  window.companyAnimation = animation;
  
  return animation;
} 