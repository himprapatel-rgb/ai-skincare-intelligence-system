#!/usr/bin/env node
/**
 * Open the app in a mobile-sized browser window with a mobile user agent.
 *
 * Usage:
 *   npm run open:mobile     — open mobile view (dev server must be running)
 *   npm run dev:mobile      — start dev server, then open mobile view when ready
 *
 * Env: MOBILE_APP_URL (default http://localhost:3000)
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const URL = process.env.MOBILE_APP_URL || 'http://localhost:3000';
const WIDTH = 390;
const HEIGHT = 844;

// Mobile Safari user agent for realistic mobile feel
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function isWindows() {
  return process.platform === 'win32';
}

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = isWindows()
    ? [
        path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      ]
    : [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
      ];
  const fs = require('fs');
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function openMobile() {
  const chrome = findChrome();
  if (!chrome) {
    console.log('Chrome/Edge not found. Use Chrome DevTools for mobile feel:');
    console.log('  1. Open http://localhost:3000 in Chrome');
    console.log('  2. Press F12 → click device icon (Ctrl+Shift+M)');
    console.log('  3. Pick "iPhone 14" or "Pixel 7"');
    process.exit(1);
  }

  const args = [
    `--window-size=${WIDTH},${HEIGHT}`,
    `--user-agent=${MOBILE_UA}`,
    '--disable-features=TranslateUI',
    URL,
  ];

  const child = spawn(chrome, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  console.log(`Opened mobile view (${WIDTH}x${HEIGHT}) at ${URL}`);
}

function waitForServer(url, maxAttempts = 30, intervalMs = 500) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const tryOnce = (attempt) => {
      const req = http.get(
        { hostname: u.hostname, port: u.port || 80, path: u.pathname || '/', timeout: 2000 },
        () => {
          resolve(true);
        }
      );
      req.on('error', () => {
        if (attempt >= maxAttempts) return resolve(false);
        setTimeout(() => tryOnce(attempt + 1), intervalMs);
      });
      req.on('timeout', () => {
        req.destroy();
        if (attempt >= maxAttempts) return resolve(false);
        setTimeout(() => tryOnce(attempt + 1), intervalMs);
      });
    };
    tryOnce(0);
  });
}

const withDev = process.argv.includes('--with-dev');
if (withDev) {
  const root = path.resolve(__dirname, '..');
  const vite = spawn('npx', ['vite'], {
    cwd: root,
    stdio: 'inherit',
    shell: isWindows(),
  });
  console.log('Waiting for dev server...');
  waitForServer(URL).then((ok) => {
    if (ok) {
      openMobile();
    } else {
      console.log('Server did not become ready; open manually:', URL);
    }
  });
  vite.on('exit', (code) => process.exit(code ?? 0));
} else {
  openMobile();
}
