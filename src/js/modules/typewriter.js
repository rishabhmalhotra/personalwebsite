/**
 * Typewriter Module
 * Simple typewriter effect (different from text decryptor)
 */

export class Typewriter {
  constructor(element, options = {}) {
    this.element = element;
    this.text = options.text || element.textContent;
    this.speed = options.speed || 100;
    this.cursor = options.cursor || '|';
    this.showCursor = options.showCursor !== false;
    
    // State
    this.currentIndex = 0;
    this.timeoutId = null;
  }

  /**
   * Start typing
   */
  start() {
    this.element.textContent = '';
    this.currentIndex = 0;
    this.type();
  }

  /**
   * Type next character
   */
  type() {
    if (this.currentIndex < this.text.length) {
      this.element.textContent = this.text.substring(0, this.currentIndex + 1);
      if (this.showCursor) {
        this.element.textContent += this.cursor;
      }
      
      this.currentIndex++;
      this.timeoutId = setTimeout(() => this.type(), this.speed);
    } else if (this.showCursor) {
      // Remove cursor when done
      this.element.textContent = this.text;
    }
  }

  /**
   * Stop typing
   */
  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Reset
   */
  reset() {
    this.stop();
    this.currentIndex = 0;
    this.element.textContent = '';
  }

  /**
   * Destroy
   */
  destroy() {
    this.stop();
    this.element = null;
  }
}

/**
 * Initialize typewriter effects on the page
 */
export function initializeTypewriter() {
  // Currently handled by text-decryptor module
  // This is a placeholder for any additional typewriter effects
  return null;
} 