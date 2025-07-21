# Rishabh Malhotra - Personal Portfolio & Blog

A personal portfolio website featuring an Astrodynamics blog with interactive visualizations and animations.

## 🚀 Features

- **Interactive Portfolio**: Dynamic landing page with animated company name transitions
- **Astrodynamics Blog**: Technical blog series on rocket propulsion and space mechanics
- **3D Visualizations**: Three.js powered space animations and interactive demos
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Performance Optimized**: Lazy loading, minified assets, and efficient animations

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
├── css/                    # Global stylesheets
│   ├── style.css           # Main styles
│   ├── rtl.css            # RTL support
│   └── w3.css             # W3 utilities
├── js/                     # JavaScript modules
│   ├── main.js            # Core functionality
│   ├── typescript.js       # Name animation
│   ├── companyname_*.js   # Company transitions
│   └── imgslideshow.js    # Image animations
├── images/                 # Image assets
├── lib/                    # Third-party libraries
└── music/                  # Audio assets
```

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run lint` - Run ESLint and Stylelint
- `npm run format` - Format code with Prettier
- `npm run validate` - Run all validation checks
- `npm run build` - Build for production (coming soon)

## 📝 Code Style

This project follows:
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Standard CSS Style Guide](https://github.com/stylelint/stylelint-config-standard)
- Prettier for consistent formatting

### Running Code Quality Checks

```bash
# Lint JavaScript
npm run lint:js

# Lint CSS
npm run lint:css

# Format all files
npm run format

# Check formatting without modifying
npm run format:check
```

## 🎨 CSS Architecture

The project uses a modular CSS approach:

- **Global Styles**: Base styles and utilities in `/css`
- **Component Styles**: Scoped styles for specific features
- **Theme Variables**: Consistent color palette (aquamarine theme)
- **Responsive Breakpoints**: Mobile-first with tablet/desktop overrides

## 🧪 JavaScript Architecture

- **ES6 Modules**: Modern JavaScript with proper imports/exports
- **Event-Driven**: Clean event handling and DOM manipulation
- **Performance**: RequestAnimationFrame for smooth animations
- **Third-party Integration**: Three.js for 3D graphics

## 🚢 Deployment

The site is designed to be served as static files. Any web server or CDN can host it:

1. Build the project (when build system is implemented)
2. We can upload contents to our web server
3. Need to ensure proper MIME types for all assets

### Sample GitHub Pages Deployment [This site is hosted on a custom domain but in case you want to fork it]

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

## 🐛 Known Issues

- Font Awesome webfonts need to be added to `/lib/font-awesome/webfonts/`
- Some animations may not work in older browsers
- Build system is not yet implemented

## 📄 License

Free & encouraged to fork!

## 👤 Author

**Rishabh Malhotra**
- Website: [rishabhmalhotra.xyz](https://rishabhmalhotra.xyz)
- LinkedIn: [@rishmalho](https://www.linkedin.com/in/rishmalho/)
- GitHub: [@rishabhmalhotra](https://github.com/rishabhmalhotra)
- Twitter: [@rishmalho](https://twitter.com/rishmalho)

## 🙏 Acknowledgments

- Three.js for 3D graphics capabilities
- Font Awesome for icons
- The aerospace community & authors for inspiration on the blog content
