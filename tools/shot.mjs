#!/usr/bin/env node
// Screenshot a page with the locally installed Chrome.
// Usage: node tools/shot.mjs <file-or-url> <out.png> [width=1440] [height=900]
//          [--full] [--dark] [--wait=1500] [--click=<css selector>] [--after=900] [--scroll=<px>]
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { withPage, sleep } from './lib/chrome.mjs';

const MAX_FULL_HEIGHT = 16000;

const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (const arg of argv) {
  if (arg.startsWith('--')) {
    const eq = arg.indexOf('=');
    if (eq === -1) flags[arg.slice(2)] = true;
    else flags[arg.slice(2, eq)] = arg.slice(eq + 1);
  } else {
    positional.push(arg);
  }
}
const [target, out, w = '1440', h = '900'] = positional;
if (!target || !out) {
  console.error('usage: node tools/shot.mjs <file-or-url> <out.png> [width] [height] [--full] [--dark] [--wait=ms] [--click=selector] [--after=ms] [--scroll=px]');
  process.exit(2);
}
const width = Number(w);
const height = Number(h);
const url = /^(https?|file):/.test(target) ? target : pathToFileURL(resolve(target)).href;

try {
  await withPage({ width, height, dark: !!flags.dark }, async (page) => {
    await page.navigate(url);
    await sleep(Number(flags.wait ?? 1500));
    if (flags.click) {
      await page.click(flags.click);
      await sleep(Number(flags.after ?? 900));
    }
    if (flags.scroll) {
      await page.evaluate(`window.scrollTo({ top: ${Number(flags.scroll)}, behavior: 'instant' })`);
      await sleep(400);
    }
    let clip;
    if (flags.full) {
      const { cssContentSize } = await page.send('Page.getLayoutMetrics');
      clip = { x: 0, y: 0, width, height: Math.min(Math.ceil(cssContentSize.height), MAX_FULL_HEIGHT), scale: 1 };
    }
    const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!flags.full, ...(clip ? { clip } : {}) });
    writeFileSync(out, Buffer.from(data, 'base64'));
    console.log(`saved ${out} (${width}x${clip ? clip.height : height})`);
    if (page.errors.length) console.log(`page errors:\n  ${page.errors.join('\n  ')}`);
  });
} catch (err) {
  console.error('screenshot failed:', err.message);
  process.exitCode = 1;
}
