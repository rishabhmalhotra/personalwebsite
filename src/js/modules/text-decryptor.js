/**
 * Text Decryptor Module
 * Handles the encrypted/decrypted text animation effect
 */

export class TextDecryptor {
  constructor(decryptedElement, encryptedElement, options = {}) {
    // Elements
    this.decryptedElement = decryptedElement;
    this.encryptedElement = encryptedElement;
    
    // Configuration
    this.shuffleInterval = options.shuffleInterval || 20;
    this.decryptCycle = options.decryptCycle || 7;
    this.startDelay = options.startDelay || 2000;
    this.charRangeStart = options.charRangeStart || 33;
    this.charRangeEnd = options.charRangeEnd || 126;
    
    // State
    this.originalText = '';
    this.isAnimating = false;
    this.intervalId = null;
  }

  /**
   * Generate a random character within the specified range
   * @returns {string} Random character
   */
  getRandomChar() {
    const range = this.charRangeEnd - this.charRangeStart + 1;
    return String.fromCharCode(
      Math.floor(Math.random() * range + this.charRangeStart)
    );
  }

  /**
   * Generate a shuffled string of specified length
   * @param {number} length - Length of the string to generate
   * @returns {string} Shuffled string
   */
  generateShuffledText(length) {
    let shuffled = '';
    for (let i = 0; i < length; i++) {
      shuffled += this.getRandomChar();
    }
    return shuffled;
  }

  /**
   * Start the decryption animation
   * @param {string} text - Text to decrypt (optional, uses element's text if not provided)
   */
  start(text = null) {
    if (this.isAnimating) return;
    
    // Get original text and prepare
    this.originalText = text || this.decryptedElement.textContent;
    const textArray = this.originalText.split('').reverse();
    let decryptedText = '';
    let cycleCount = 0;
    
    // Clear display
    this.decryptedElement.textContent = '';
    this.encryptedElement.textContent = '';
    
    this.isAnimating = true;
    
    // Start animation after delay
    setTimeout(() => {
      this.intervalId = setInterval(() => {
        // Generate shuffled text
        const remainingLength = textArray.length;
        const shuffledText = this.generateShuffledText(remainingLength);
        
        // On specified cycles, decrypt a character
        if (cycleCount++ % this.decryptCycle === 0 && textArray.length > 0) {
          decryptedText += textArray.pop();
        }
        
        // Update display
        this.decryptedElement.textContent = decryptedText;
        this.encryptedElement.textContent = shuffledText;
        
        // Stop when complete
        if (textArray.length === 0) {
          this.stop();
        }
      }, this.shuffleInterval);
    }, this.startDelay);
  }

  /**
   * Stop the animation
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isAnimating = false;
    
    // Clear encrypted text
    if (this.encryptedElement) {
      this.encryptedElement.textContent = '';
    }
  }

  /**
   * Reset the animation
   */
  reset() {
    this.stop();
    this.decryptedElement.textContent = this.originalText;
    this.encryptedElement.textContent = '';
  }

  /**
   * Destroy the instance and clean up
   */
  destroy() {
    this.stop();
    this.decryptedElement = null;
    this.encryptedElement = null;
  }
} 