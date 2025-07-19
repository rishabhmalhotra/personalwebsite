/**
 * Three.js Scene Module
 * Handles 3D animations and visualizations
 */

export class ThreeScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    
    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationId = null;
    
    // Scene objects
    this.objects = [];
    this.lights = [];
    
    // State
    this.isInitialized = false;
    this.isAnimating = false;
  }

  /**
   * Initialize the Three.js scene
   */
  init() {
    if (this.isInitialized) return;
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // Setup camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(
      this.options.fov || 75,
      aspect,
      this.options.near || 0.1,
      this.options.far || 1000
    );
    this.camera.position.z = this.options.cameraZ || 5;
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    
    // Add lights
    this.setupLights();
    
    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
    
    this.isInitialized = true;
  }

  /**
   * Setup scene lighting
   */
  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);
    
    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
  }

  /**
   * Add an object to the scene
   * @param {THREE.Object3D} object - Three.js object to add
   */
  addObject(object) {
    this.scene.add(object);
    this.objects.push(object);
  }

  /**
   * Remove an object from the scene
   * @param {THREE.Object3D} object - Three.js object to remove
   */
  removeObject(object) {
    this.scene.remove(object);
    const index = this.objects.indexOf(object);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
  }

  /**
   * Start animation loop
   */
  start() {
    if (!this.isInitialized) {
      this.init();
    }
    
    this.isAnimating = true;
    this.animate();
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isAnimating) return;
    
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Update objects
    this.objects.forEach(obj => {
      if (obj.userData.update) {
        obj.userData.update(obj);
      }
    });
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Stop animation loop
   */
  stop() {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  /**
   * Destroy the scene and clean up
   */
  destroy() {
    this.stop();
    
    // Remove event listeners
    window.removeEventListener('resize', () => this.handleResize());
    
    // Dispose of Three.js objects
    this.objects.forEach(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
    
    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.objects = [];
    this.lights = [];
    this.isInitialized = false;
  }
}

/**
 * Create a starfield background
 * @param {number} count - Number of stars
 * @returns {THREE.Points} Starfield object
 */
export function createStarfield(count = 5000) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 100;
    positions[i + 1] = (Math.random() - 0.5) * 100;
    positions[i + 2] = (Math.random() - 0.5) * 100;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.8
  });
  
  const stars = new THREE.Points(geometry, material);
  
  // Add rotation animation
  stars.userData.update = (obj) => {
    obj.rotation.y += 0.0001;
  };
  
  return stars;
}

/**
 * Initialize Three.js scenes on the page
 */
export function initializeThreeScene() {
  // Find all containers that need Three.js scenes
  const containers = document.querySelectorAll('.three-container');
  const scenes = [];
  
  containers.forEach(container => {
    const scene = new ThreeScene(container, {
      fov: 75,
      cameraZ: 5
    });
    
    // Add starfield to blog scenes
    if (container.classList.contains('blog-hero')) {
      scene.init();
      const starfield = createStarfield();
      scene.addObject(starfield);
      scene.start();
    }
    
    scenes.push(scene);
  });
  
  return scenes;
} 