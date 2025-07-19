/**
 * Blog Features Module
 * Handles blog-specific interactive features
 */

/**
 * Initialize copy button for code blocks
 */
export function initializeCodeCopy() {
  const codeBlocks = document.querySelectorAll('pre code');
  
  codeBlocks.forEach(block => {
    const pre = block.parentElement;
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    
    // Wrap the pre element
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    
    // Create copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
    copyBtn.setAttribute('aria-label', 'Copy code');
    
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(block.textContent);
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
          copyBtn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
    
    wrapper.appendChild(copyBtn);
  });
}

/**
 * Initialize smooth scrolling for anchor links
 */
export function initializeSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      
      if (target) {
        e.preventDefault();
        
        const offset = 80; // Header height
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Update URL without jumping
        history.pushState(null, null, `#${targetId}`);
      }
    });
  });
}

/**
 * Initialize table of contents
 */
export function initializeTableOfContents() {
  const toc = document.querySelector('.table-of-contents');
  if (!toc) return;
  
  const headings = document.querySelectorAll('h2, h3');
  const tocList = document.createElement('ul');
  
  headings.forEach(heading => {
    const id = heading.id || heading.textContent.toLowerCase().replace(/\s+/g, '-');
    heading.id = id;
    
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${id}`;
    a.textContent = heading.textContent;
    a.className = heading.tagName.toLowerCase();
    
    li.appendChild(a);
    tocList.appendChild(li);
  });
  
  toc.appendChild(tocList);
  
  // Highlight active section
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = toc.querySelector(`a[href="#${id}"]`);
      
      if (entry.isIntersecting) {
        // Remove active class from all links
        toc.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        // Add active class to current link
        if (link) link.classList.add('active');
      }
    });
  }, {
    rootMargin: '-80px 0px -80% 0px'
  });
  
  headings.forEach(heading => observer.observe(heading));
}

/**
 * Initialize reading progress bar
 */
export function initializeReadingProgress() {
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress';
  document.body.appendChild(progressBar);
  
  const updateProgress = () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = window.scrollY;
    const progress = (scrolled / documentHeight) * 100;
    
    progressBar.style.width = `${progress}%`;
  };
  
  window.addEventListener('scroll', updateProgress);
  window.addEventListener('resize', updateProgress);
  updateProgress();
}

/**
 * Initialize interactive demos
 */
export function initializeInteractiveDemos() {
  // Rocket equation calculator
  const calculators = document.querySelectorAll('.rocket-calculator');
  calculators.forEach(calc => {
    const inputs = calc.querySelectorAll('input');
    const output = calc.querySelector('.output');
    
    const calculate = () => {
      const isp = parseFloat(calc.querySelector('#isp').value);
      const massRatio = parseFloat(calc.querySelector('#mass-ratio').value);
      const g0 = 9.81;
      
      const deltaV = isp * g0 * Math.log(massRatio);
      output.textContent = `ΔV = ${deltaV.toFixed(0)} m/s`;
    };
    
    inputs.forEach(input => {
      input.addEventListener('input', calculate);
    });
    
    calculate();
  });
}

/**
 * Initialize image zoom
 */
export function initializeImageZoom() {
  const images = document.querySelectorAll('.blog-content img');
  
  images.forEach(img => {
    img.addEventListener('click', () => {
      const overlay = document.createElement('div');
      overlay.className = 'image-zoom-overlay';
      
      const zoomedImg = document.createElement('img');
      zoomedImg.src = img.src;
      zoomedImg.alt = img.alt;
      
      overlay.appendChild(zoomedImg);
      document.body.appendChild(overlay);
      
      overlay.addEventListener('click', () => {
        overlay.remove();
      });
      
      // Fade in
      requestAnimationFrame(() => {
        overlay.classList.add('active');
      });
    });
  });
}

/**
 * Initialize all blog features
 */
export function initializeBlogFeatures() {
  // Only initialize on blog pages
  if (!window.location.pathname.includes('/Astrodynamics/')) {
    return;
  }
  
  // Initialize all features
  initializeCodeCopy();
  initializeSmoothScroll();
  initializeTableOfContents();
  initializeReadingProgress();
  initializeInteractiveDemos();
  initializeImageZoom();
  
  // Initialize MathJax if present
  if (window.MathJax) {
    window.MathJax.typesetPromise();
  }
} 