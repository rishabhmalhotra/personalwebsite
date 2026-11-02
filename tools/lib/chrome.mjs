// Minimal Chrome DevTools Protocol driver for local QA tools. Uses the installed
// Google Chrome and Node's built-in WebSocket, so it needs no npm packages.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATHS = {
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux: '/usr/bin/google-chrome',
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pageSocketUrl(port) {
  for (let i = 0; i < 80; i++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = pages.find((p) => p.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome is still starting.
    }
    await sleep(100);
  }
  throw new Error('Chrome did not start');
}

/**
 * Launches headless Chrome, runs `fn(page)`, and always cleans up.
 * page: { send, navigate, evaluate, click, waitFor, errors, logs }
 */
export async function withPage({ width = 1440, height = 900, dark = false, flags = [] } = {}, fn) {
  const chromePath = process.env.CHROME_PATH || CHROME_PATHS[process.platform];
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = mkdtempSync(join(tmpdir(), 'chrome-qa-'));
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    ...flags,
    'about:blank',
  ], { stdio: 'ignore' });

  let ws;
  try {
    ws = new WebSocket(await pageSocketUrl(port));
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let nextId = 0;
    const pending = new Map();
    const listeners = new Set();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        for (const l of listeners) l(msg);
      }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const once = (method) => new Promise((resolve) => {
      const l = (m) => { if (m.method === method) { listeners.delete(l); resolve(m); } };
      listeners.add(l);
    });

    const errors = [];
    const logs = [];
    listeners.add((m) => {
      if (m.method === 'Runtime.exceptionThrown') {
        errors.push(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text);
      } else if (m.method === 'Runtime.consoleAPICalled') {
        const text = m.params.args.map((a) => a.value ?? a.description).join(' ');
        if (m.params.type === 'error') errors.push(text);
        else logs.push(`${m.params.type}: ${text}`);
      }
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    const mobile = width < 700;
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
    if (dark) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });

    const evaluate = async (expression) => {
      const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
      return result.value;
    };
    const page = {
      send,
      errors,
      logs,
      evaluate,
      async navigate(url) {
        const loaded = once('Page.loadEventFired');
        const nav = await send('Page.navigate', { url });
        if (nav.errorText) throw new Error(`navigation to ${url} failed: ${nav.errorText}`);
        await loaded;
      },
      click: (selector) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('no element ${selector.replace(/'/g, '')}'); el.click(); return true; })()`),
      async waitFor(expression, { timeout = 10000, interval = 200 } = {}) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          if (await evaluate(expression)) return true;
          await sleep(interval);
        }
        return false;
      },
    };
    return await fn(page);
  } finally {
    try { ws?.close(); } catch { /* already closed */ }
    chrome.kill('SIGKILL');
    await sleep(200);
    rmSync(profile, { recursive: true, force: true });
  }
}
