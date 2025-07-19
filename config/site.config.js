/**
 * Site Configuration
 * Central configuration file for all site settings
 */

const siteConfig = {
  // Site metadata
  metadata: {
    title: 'Rishabh Malhotra',
    description: 'Personal portfolio and blog website for Rishabh Malhotra',
    author: 'Rishabh Malhotra',
    email: 'malhotra.rishabh88@yahoo.com',
    siteUrl: 'https://rishabhmalhotra.xyz',
  },

  // Social links
  social: {
    linkedin: 'https://www.linkedin.com/in/rishmalho/',
    github: 'https://github.com/rishabhmalhotra',
    twitter: 'https://twitter.com/rishmalho',
    nostr: 'http://primal.net/p/npub1gxuneh3mkxlm28fg0uxv2qtp8q4nr2h47kn26rqfp2vnw0gp30ustn3l2q',
    unsplash: 'https://unsplash.com/@rishmalho',
  },

  // Company information
  company: {
    current: 'BLOCK',
    previous: 'Square',
    subsidiaries: ['Square', 'Cash App', 'Spiral', 'Tidal', 'TBD'],
    website: 'https://block.xyz',
    legalUrl: 'https://block.xyz/legal',
  },

  // Education
  education: {
    degree: "Dean's Hons in Computer Science",
    university: 'University of Waterloo',
  },

  // Blog configuration
  blog: {
    title: 'Astrodynamics',
    subtitle: 'A critical examination of rocket propulsion and the physics of space travel',
    postsPerPage: 10,
    categories: ['rocket-propulsion', 'orbital-mechanics', 'spacecraft-design'],
  },

  // Theme configuration
  theme: {
    colors: {
      primary: '#7fffd4', // aquamarine
      secondary: '#ff6b35',
      background: '#000000',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.8)',
    },
    fonts: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      monospace: 'Monaco, Menlo, Consolas, "Courier New", monospace',
    },
    breakpoints: {
      mobile: 768,
      tablet: 991,
      desktop: 1200,
    },
  },

  // Animation settings
  animations: {
    typeSpeed: 100,
    deleteSpeed: 50,
    pauseDuration: 2000,
    cursorBlinkSpeed: 500,
  },

  // API endpoints (if any)
  api: {
    // Add any API endpoints here
  },

  // Feature flags
  features: {
    enableAnalytics: false,
    enableComments: false,
    enableNewsletter: false,
    enableDarkMode: true, // Always dark theme
  },

  // Development settings
  development: {
    port: 8000,
    host: 'localhost',
  },
};

// Export for use in both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = siteConfig;
} else if (typeof window !== 'undefined') {
  window.siteConfig = siteConfig;
} 