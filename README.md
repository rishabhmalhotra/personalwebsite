# Rishabh Malhotra - Personal Portfolio & Blog

A personal portfolio website featuring an Astrodynamics blog with interactive visualizations, built with a refined terminal/code aesthetic that reflects a backend engineering identity.

## 🎨 Design: Terminal/Code Aesthetic

The portfolio has been redesigned with a modern terminal-inspired theme:

- **Primary Color**: Terminal green (#00ff9d) for authentic terminal feel
- **Typography**: JetBrains Mono (monospace) + Inter (sans-serif)
- **Dark Theme**: Deep charcoal backgrounds (#0a0a0a)
- **Subtle Animations**: Purposeful, performance-optimized transitions
- **Content-First**: Animations serve content, not the other way around

## 🚀 Features

- **Interactive Portfolio**: Dynamic landing page with text decryptor animations
- **Astrodynamics Blog**: Technical blog series on rocket propulsion and space mechanics
- **Terminal Aesthetic**: Refined code-inspired design with subtle nods to classic terminals
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Performance Optimized**: Minimal dependencies, efficient animations, no heavy 3D libraries

## 📋 Prerequisites

- Python 3.x (for local development server)
- Node.js >= 16.0.0 and npm >= 8.0.0 (for build tools)
- Modern web browser with ES6 support

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/rishabhmalhotra/personalwebsite.git
cd personalwebsite
```

2. Install dependencies:
```bash
npm install
```

## 🚀 Development

Start the local development server:
```bash
npm start
# or
npm run dev
```

The site will be available at `http://localhost:8000`

## 📁 Project Structure

```
personalwebsite/
├── index.html              # Main portfolio page
├── indexstatic.html        # Static version (no animations)
├── Astrodynamics/          # Blog section
│   ├── index.html          # Blog home
│   ├── posts/              # Individual blog posts
│   ├── css/                # Blog-specific styles
│   └── js/                 # Blog-specific scripts
├── src/                    # Source files (modern CSS/JS)
│   ├── css/
│   │   ├── _variables.css  # Design tokens & CSS variables
│   │   ├── _base.css       # Base styles
│   │   ├── _components.css# Component styles
│   │   ├── _animations.css # Animation keyframes
│   │   └── main.css        # Main entry point
│   └── js/
│       ├── app.js          # Main application
│       └── modules/        # JS modules
│           ├── text-decryptor.js
│           ├── gradient-animation.js
│           ├── typewriter.js
│           └── company-animation.js
├── css/                    # Legacy global stylesheets
│   ├── style.css           # Main styles
│   ├── rtl.css            # RTL support
│   └── w3.css             # W3 utilities
├── js/                     # Legacy JavaScript modules
├── images/                 # Image assets
└── lib/                    # Third-party libraries
```

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run dev` - Start development server (alias)
- `npm run lint` - Run ESLint and Stylelint
- `npm run format` - Format code with Prettier
- `npm run validate` - Run all validation checks
- `npm run build` - Build for production (coming soon)

## 🎨 CSS Architecture

The project uses a modern CSS approach:

- **CSS Variables**: Design tokens for consistent theming (terminal green palette)
- **Modular Components**: Scoped styles for specific features
- **Custom Animations**: Keyframe animations without external libraries
- **Responsive Breakpoints**: Mobile-first with tablet/desktop overrides

### Design Tokens

```css
/* Terminal Theme Variables */
--color-primary: #00ff9d;        /* Terminal green */
--color-accent: #ff6b6b;         /* Coral accent */
--color-background: #0a0a0a;     /* Deep charcoal */
--font-mono: 'JetBrains Mono', ...;
--font-sans: 'Inter', ...;
```

## 🧪 JavaScript Architecture

- **ES6 Modules**: Modern JavaScript with proper imports/exports
- **Event-Driven**: Clean event handling and DOM manipulation
- **Performance**: RequestAnimationFrame for smooth animations
- **No Heavy Dependencies**: Removed Three.js for lightweight, purpose-built animations

## 🚢 Deployment

The site is designed to be served as static files. Any web server or CDN can host it:

1. Build the project (when build system is implemented)
2. Upload contents to your web server
3. Ensure proper MIME types for all assets

### Sample GitHub Pages Deployment

```bash
# Push to gh-pages branch
git subtree push --prefix dist origin gh-pages
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Run validation (`npm run validate`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, semicolons, etc)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## 📄 License

Free & encouraged to fork!

## 👤 Author

**Rishabh Malhotra**
- Website: [rishabhmalhotra.xyz](https://rishabhmalhotra.xyz)
- LinkedIn: [@rishmalho](https://www.linkedin.com/in/rishmalho/)
- GitHub: [@rishabhmalhotra](https://github.com/rishabhmalhotra)
- Twitter: [@rishmalho](https://twitter.com/rishmalho)

## 🙏 Acknowledgments

- Font Awesome for icons
- The aerospace community & authors for inspiration on the blog content
