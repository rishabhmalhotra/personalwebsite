/**
 * HTML Build Script
 * Processes HTML files for production
 */

const fs = require('fs').promises;
const path = require('path');
const htmlMinifier = require('html-minifier');

const config = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: true,
};

async function processHtmlFile(inputPath, outputPath) {
  try {
    const html = await fs.readFile(inputPath, 'utf-8');
    
    // Replace development paths with production paths
    let processedHtml = html
      .replace(/\/src\/js\/app\.js/g, '/js/main.[contenthash].js')
      .replace(/\/src\/css\/main\.css/g, '/css/style.css');
    
    // Minify HTML in production
    if (process.env.NODE_ENV === 'production') {
      processedHtml = htmlMinifier.minify(processedHtml, config);
    }
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Write processed file
    await fs.writeFile(outputPath, processedHtml);
    
    console.log(`✓ Processed: ${inputPath} → ${outputPath}`);
  } catch (error) {
    console.error(`✗ Error processing ${inputPath}:`, error);
  }
}

async function buildHtml() {
  const htmlFiles = [
    { input: 'index.html', output: 'dist/index.html' },
    { input: 'indexstatic.html', output: 'dist/indexstatic.html' },
    { input: 'Astrodynamics/comingsoon.html', output: 'dist/Astrodynamics/comingsoon.html' },
  ];
  
  console.log('Building HTML files...');
  
  for (const file of htmlFiles) {
    await processHtmlFile(file.input, file.output);
  }
  
  console.log('HTML build complete!');
}

// Run build
buildHtml().catch(console.error); 