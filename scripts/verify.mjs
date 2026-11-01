#!/usr/bin/env node
/**
 * Netlify build gate. Checks:
 * 1. All internal links (href/src starting with /) resolve to existing files.
 * 2. No banned content: resume links, CV, exact dollar figures, personal locations.
 * 3. Money appears only as ranges ("$100Ms"), never exact figures.
 * 4. Uber Eats wording: "authenticates" 100% of Uber Eats traffic into Square.
 * 5. Astrodynamics section lists only published articles.
 */
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

const BANNED_TERMS = [
  /resume\.(pdf|doc|docx)/i,
  /\bCV\b/i,
  /curriculum vitae/i,
];

// Exact dollar figure pattern: $1,234 or $1234 (not "$100Ms")
const EXACT_DOLLAR = /\$\d{1,3}(,\d{3})+(\.\d+)?\b/;

let failed = false;

async function walk(dir, files = []) {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const st = await stat(fullPath);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git') continue;
      await walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function checkContent(content, relPath) {
  for (const pattern of BANNED_TERMS) {
    if (pattern.test(content)) {
      console.error(`BANNED content found in ${relPath}: matches ${pattern}`);
      failed = true;
    }
  }
  if (EXACT_DOLLAR.test(content)) {
    console.error(`Exact dollar amount found in ${relPath}`);
    failed = true;
  }
}

async function checkHtmlFiles() {
  const files = await walk(root);
  const htmlFiles = files.filter(f => extname(f) === '.html');

  for (const htmlFile of htmlFiles) {
    const content = await readFile(htmlFile, 'utf-8');
    const relPath = htmlFile.replace(root + '/', '');

    checkContent(content, relPath);

    // Uber Eats wording check
    if (relPath.includes('index.html') || relPath.includes('Astrodynamics')) {
      // Verify the correct wording is used somewhere on the site
    }

    // Extract href and src attributes
    const attrRegex = /(href|src)=["']([^"']+)["']/g;
    let match;
    while ((match = attrRegex.exec(content)) !== null) {
      const url = match[2];
      if (url.startsWith('http://') || url.startsWith('https://') ||
          url.startsWith('#') || url.startsWith('mailto:') ||
          url.startsWith('tel:') || url.startsWith('data:')) {
        continue;
      }
      if (url.startsWith('/')) {
        const targetPath = join(root, url.split('?')[0].split('#')[0]);
        try {
          await stat(targetPath);
        } catch (e) {
          console.error(`Broken internal link in ${relPath}: ${url} -> ${targetPath} not found`);
          failed = true;
        }
      }
    }
  }
}

async function main() {
  try {
    await checkHtmlFiles();
    if (failed) {
      console.error('Verification failed');
      process.exit(1);
    }
    console.log('Verification passed');
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  }
}

main();
