/**
 * Generate PWA icons from icon.svg
 * Run: node scripts/generate-pwa-icons.js
 * Requires: npm install -D sharp
 */
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const iconSvg = path.join(publicDir, 'icon.svg');

if (!fs.existsSync(iconSvg)) {
  console.error('icon.svg not found in public/');
  process.exit(1);
}

async function generate() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('Run: npm install -D sharp');
    process.exit(1);
  }

  const svg = fs.readFileSync(iconSvg);

  const sizes = [
    { w: 180, name: 'apple-touch-icon' },
    { w: 192, name: 'icon-192' },
    { w: 512, name: 'icon-512' },
  ];

  for (const { w, name } of sizes) {
    const out = path.join(publicDir, `${name}.png`);
    await sharp(svg).resize(w, w).png().toFile(out);
    console.log(`Created ${name}.png (${w}x${w})`);
  }

  // Splash screen (gradient + centered icon) - 1284x2778 for iPhone 14 Pro Max
  const splashW = 1284;
  const splashH = 2778;
  const splashSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${splashW}" height="${splashH}" viewBox="0 0 ${splashW} ${splashH}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <g transform="translate(${splashW/2 - 256}, ${splashH/2 - 356})">
        <rect width="512" height="512" rx="96" fill="rgba(255,255,255,0.2)"/>
        <g fill="none" stroke="white" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
          <rect x="96" y="128" width="320" height="256" rx="24"/>
          <circle cx="256" cy="256" r="64"/>
          <circle cx="380" cy="172" r="24" fill="white"/>
        </g>
      </g>
      <text x="${splashW/2}" y="${splashH/2 + 320}" font-family="system-ui,-apple-system,sans-serif" font-size="48" font-weight="600" fill="white" text-anchor="middle">SkinCareAI</text>
    </svg>
  `;
  const splashOut = path.join(publicDir, 'splash-1284x2778.png');
  await sharp(Buffer.from(splashSvg)).png().toFile(splashOut);
  console.log('Created splash-1284x2778.png');
}

generate().catch((e) => {
  console.error(e);
  process.exit(1);
});
