/**
 * Copy Assets Script
 * Copies static assets to the distribution folder
 */

const fs = require('fs').promises;
const path = require('path');

async function copyDirectory(source, destination) {
  try {
    await fs.mkdir(destination, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      
      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error(`Error copying ${source}:`, error);
  }
}

async function copyAssets() {
  const assetsToCopy = [
    { source: 'images', destination: 'dist/images' },
    { source: 'lib', destination: 'dist/lib' },
    { source: 'music', destination: 'dist/music' },
    { source: 'archives', destination: 'dist/archives' },
  ];
  
  console.log('Copying static assets...');
  
  for (const asset of assetsToCopy) {
    console.log(`Copying ${asset.source} → ${asset.destination}`);
    await copyDirectory(asset.source, asset.destination);
  }
  
  // Copy individual files
  const filesToCopy = [
    { source: 'robots.txt', destination: 'dist/robots.txt' },
    { source: 'sitemap.xml', destination: 'dist/sitemap.xml' },
  ];
  
  for (const file of filesToCopy) {
    try {
      await fs.copyFile(file.source, file.destination);
      console.log(`✓ Copied: ${file.source}`);
    } catch (error) {
      // File might not exist, which is okay
      if (error.code !== 'ENOENT') {
        console.error(`✗ Error copying ${file.source}:`, error);
      }
    }
  }
  
  console.log('Asset copy complete!');
}

// Run copy
copyAssets().catch(console.error); 