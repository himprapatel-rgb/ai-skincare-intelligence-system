#!/usr/bin/env node
/**
 * Token Build Script
 * Reads tokens.json → generates CSS custom properties files.
 * Usage: node src/tokens/build.js
 */

const fs = require('fs');
const path = require('path');

const tokens = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'tokens.json'), 'utf-8')
);

function generateCSS(tokenGroup, prefix) {
  return Object.entries(tokenGroup)
    .map(([key, value]) => `  --${prefix}-${key}: ${value};`)
    .join('\n');
}

// Generate light theme tokens
const lightCSS = `/* AUTO-GENERATED from tokens.json — do not edit manually */
/* Run: node src/tokens/build.js */

:root {
  /* Colors */
${generateCSS(tokens.color, 'color')}

  /* Spacing */
${generateCSS(tokens.spacing, 'space')}

  /* Border Radius */
${generateCSS(tokens.radius, 'radius')}

  /* Shadows */
${generateCSS(tokens.shadow, 'shadow')}

  /* Typography */
${generateCSS(tokens.font, 'font')}

  /* Transitions */
${generateCSS(tokens.transition, 'transition')}

  /* Z-Index */
${generateCSS(tokens['z-index'], 'z')}

  /* Breakpoints */
${generateCSS(tokens.breakpoint, 'bp')}

  /* Semantic aliases (backward compat with existing CSS) */
  --primary: var(--color-primary);
  --primary-hover: var(--color-primary-hover);
  --primary-light: var(--color-primary-light);
  --primary-dark: var(--color-primary-dark);
  --accent: var(--color-accent);
  --accent-light: var(--color-accent-light);
  --danger: var(--color-danger);
  --success: var(--color-success);
  --warning: var(--color-warning);
  --bg-primary: var(--color-white);
  --bg-secondary: var(--color-gray-50);
  --bg-tertiary: var(--color-gray-100);
  --text-primary: var(--color-gray-900);
  --text-secondary: var(--color-gray-600);
  --text-muted: var(--color-gray-400);
  --border-color: var(--color-gray-200);
  --surface-elevated: var(--color-white);
}
`;

// Generate dark theme tokens
const darkCSS = `/* AUTO-GENERATED dark mode overrides — do not edit manually */

[data-theme="dark"] {
${generateCSS(tokens['color-dark'], 'color')}

  /* Semantic aliases */
  --primary: var(--color-primary);
  --primary-light: var(--color-primary-light);
  --bg-primary: var(--color-bg-primary);
  --bg-secondary: var(--color-bg-secondary);
  --bg-white: var(--color-bg-white);
  --bg-tertiary: var(--color-surface-elevated);
  --text-primary: var(--color-text-primary);
  --text-secondary: var(--color-text-secondary);
  --text-muted: var(--color-text-muted);
  --border-color: var(--color-border-color);
  --surface-elevated: var(--color-surface-elevated);

  /* Shadows — darker in dark mode */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.35);
  --shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.4);
}
`;

const outDir = path.join(__dirname, '..', 'styles');
fs.writeFileSync(path.join(outDir, 'tokens.generated.css'), lightCSS);
fs.writeFileSync(path.join(outDir, 'tokens-dark.generated.css'), darkCSS);

console.log('✅ Generated styles/tokens.generated.css');
console.log('✅ Generated styles/tokens-dark.generated.css');
