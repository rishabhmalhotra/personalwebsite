/**
 * Gradient Animation Module
 * Handles the animated gradient background effect
 */

export class GradientAnimation {
  constructor(targetElement, options = {}) {
    // Configuration
    this.element = targetElement;
    this.colors = options.colors || [
      [62, 35, 255],
      [60, 255, 60],
      [255, 35, 98],
      [45, 175, 230],
      [255, 0, 255],
      [255, 128, 0],
    ];
    this.speed = options.speed || 0.0015;
    
    // State
    this.step = 0;
    this.colorIndices = [0, 1, 2, 3];
    this.animationId = null;
  }

  /**
   * Interpolate between two colors
   * @param {Array} color1 - RGB array [r, g, b]
   * @param {Array} color2 - RGB array [r, g, b]
   * @param {number} factor - Interpolation factor (0-1)
   * @returns {string} RGB color string
   */
  interpolateColor(color1, color2, factor) {
    const r = Math.round(color1[0] * (1 - factor) + color2[0] * factor);
    const g = Math.round(color1[1] * (1 - factor) + color2[1] * factor);
    const b = Math.round(color1[2] * (1 - factor) + color2[2] * factor);
    return `rgb(${r},${g},${b})`;
  }

  /**
   * Update gradient colors
   */
  updateGradient() {
    if (!this.element) return;

    const c0_0 = this.colors[this.colorIndices[0]];
    const c0_1 = this.colors[this.colorIndices[1]];
    const c1_0 = this.colors[this.colorIndices[2]];
    const c1_1 = this.colors[this.colorIndices[3]];

    const color1 = this.interpolateColor(c0_0, c0_1, this.step);
    const color2 = this.interpolateColor(c1_0, c1_1, this.step);

    // Apply gradient with vendor prefixes
    const gradientCSS = `linear-gradient(to right, ${color1} 0%, ${color2} 100%)`;
    this.element.style.background = gradientCSS;
    this.element.style.backgroundImage = gradientCSS;

    // Update step
    this.step += this.speed;
    if (this.step >= 1) {
      this.step %= 1;
      this.rotateColors();
    }
  }

  /**
   * Rotate color indices for smooth transitions
   */
  rotateColors() {
    this.colorIndices[0] = this.colorIndices[1];
    this.colorIndices[2] = this.colorIndices[3];

    // Pick new target colors (ensure they're different from current)
    this.colorIndices[1] = (this.colorIndices[1] + 
      Math.floor(1 + Math.random() * (this.colors.length - 1))) % this.colors.length;
    this.colorIndices[3] = (this.colorIndices[3] + 
      Math.floor(1 + Math.random() * (this.colors.length - 1))) % this.colors.length;
  }

  /**
   * Start the animation
   */
  start() {
    if (this.animationId) return; // Already running
    
    const animate = () => {
      this.updateGradient();
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Stop the animation
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Destroy the animation and clean up
   */
  destroy() {
    this.stop();
    this.element = null;
  }
} 