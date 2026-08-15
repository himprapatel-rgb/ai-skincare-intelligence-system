# Local Development Setup Guide

**AI Skincare Intelligence System - Frontend**  
**Last Updated:** December 19, 2025  
**Sprint:** F3

---

## Quick Start (5 Minutes)

```bash
# 1. Clone the repository
git clone https://github.com/himprapatel-rgb/ai-skincare-intelligence-system.git
cd ai-skincare-intelligence-system/frontend

# 2. Install dependencies (this generates package-lock.json)
npm install

# 3. Create environment file
cp .env.example .env

# 4. Start development server
npm run dev

# 5. Open browser to http://localhost:3000
```

### Mobile feel (simulator)

To run the app in a **mobile-sized window** with a mobile user agent (phone-like layout and behavior):

**Option A – One command (starts dev server and opens mobile view):**
```bash
npm run dev:mobile
```
Starts the dev server and opens Chrome/Edge in a 390×844 window with a mobile user agent once the server is ready.

**Option B – Dev server already running:**
```bash
npm run dev          # in one terminal
npm run open:mobile  # in another
```

**Option C – Chrome DevTools device mode:**
1. Open http://localhost:3000 in Chrome.
2. Press **F12** → click the **device toolbar** icon (or **Ctrl+Shift+M**).
3. Choose a device (e.g. "iPhone 14" or "Pixel 7") for viewport and optional touch simulation.

**Option D – Real phone on same Wi‑Fi:**  
With `npm run dev`, Vite uses `host: true`, so you can open `http://<your-pc-ip>:3000` on your phone for a real mobile experience.

---

## Prerequisites

### Required Software
- **Node.js**: >= 18.0.0 (LTS recommended)
- **npm**: >= 9.0.0
- **Git**: Latest version

### Verify Installation
```bash
node --version  # Should show v18.x.x or v20.x.x
npm --version   # Should show 9.x.x or higher
git --version   # Any recent version
```

---

## Detailed Setup Instructions

### Step 1: Clone Repository
```bash
git clone https://github.com/himprapatel-rgb/ai-skincare-intelligence-system.git
cd ai-skincare-intelligence-system
```

### Step 2: Navigate to Frontend
```bash
cd frontend
```

### Step 3: Install Dependencies
```bash
npm install
```

**What this does:**
- Installs all packages from `package.json`
- Generates `package-lock.json` (CRITICAL for CI/CD)
- Creates `node_modules/` directory
- Takes ~2-3 minutes on first run

**Expected Output:**
```
added 1234 packages, and audited 1235 packages in 2m

123 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### Step 4: Configure Environment
```bash
cp .env.example .env
```

**Edit `.env` file:**
```env
# For local development with Railway backend
VITE_API_URL=https://ai-skincare-intelligence-system-production.up.railway.app

# For local backend development (if running backend locally)
# VITE_API_URL=http://localhost:8000

# Optional: Enable debug mode
VITE_DEBUG=true
```

### Step 5: Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
  VITE v5.0.8  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://<your-ip>:3000/
  ➜  press h + enter to show help
```

> This project pins the dev server to **port 3000** (`server.port` in `vite.config.ts`) with `host: true`, so it is reachable on your LAN too. It is not Vite's default `5173`.

### Step 6: Open in Browser
Navigate to: `http://localhost:3000`

You should see:
- Home page with "AI Skincare Intelligence System" header
- Navigation links: Home | Face Scan
- "Start Face Scan" CTA button

---

## Available Scripts

### Development
```bash
npm run dev          # Start dev server (hot reload enabled)
npm run preview      # Preview production build locally
```

### Building
```bash
npm run build        # Build for production (output: dist/)
```

### Testing
```bash
npm test             # Run Vitest tests
npm test -- --ui     # Run tests with UI
npm run coverage     # Generate test coverage report
```

### Linting
```bash
npm run lint         # Run ESLint
npm run lint -- --fix # Auto-fix linting issues
```

---

## Commit package-lock.json (CRITICAL)

**After running `npm install`, you MUST commit the package-lock.json:**

```bash
# From frontend/ directory
git add package-lock.json
git commit -m "chore: Add package-lock.json for dependency locking"
git push origin main
```

**Why this is critical:**
- ✅ Ensures CI/CD pipeline can install dependencies
- ✅ Locks exact versions for reproducible builds
- ✅ Prevents "works on my machine" issues
- ✅ Required for `npm ci` in GitHub Actions

---

## Project Structure

```
frontend/
├── .env.example              # Environment template
├── .eslintrc.cjs             # ESLint configuration
├── index.html                # HTML entry point
├── package.json              # Dependencies and scripts
├── package-lock.json         # 🔴 MUST BE COMMITTED
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite bundler config
├── public/                   # Static assets
└── src/
    ├── App.tsx               # Main app with routing
    ├── main.tsx              # React entry point
    ├── components/           # Reusable UI components
    │   ├── Camera.tsx
    │   ├── AnalysisResults.tsx
    │   ├── LoadingSpinner.tsx
    │   └── ErrorMessage.tsx
    ├── features/             # Feature modules
    │   ├── onboarding/
    │   └── profile/
    ├── pages/                # Route pages
    │   └── ScanPage.tsx
    ├── services/             # API and business logic
    │   ├── api.ts            # Base API client
    │   ├── scanApi.ts        # Scan API service
    │   ├── scanApi.test.ts   # Scan API tests
    │   ├── cameraService.ts  # Camera utilities
    │   └── faceDetection.ts  # ML face detection
    └── types/                # TypeScript type definitions
        └── scan.ts
```

---

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test scanApi.test.ts
```

### Watch Mode (Auto-rerun on changes)
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm run coverage
```

**View coverage report:** `coverage/index.html`

---

## Troubleshooting

### Issue: `npm install` fails

**Solution 1: Clear npm cache**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Solution 2: Use specific Node version**
```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node 20
nvm install 20
nvm use 20
npm install
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- --port 3001
```

### Issue: "Cannot find module" errors

**Solution:**
```bash
rm -rf node_modules
npm install
```

### Issue: TypeScript errors in IDE

**Solution:**
```bash
# Restart TypeScript server in VS Code
# Command Palette (Cmd/Ctrl+Shift+P) -> "TypeScript: Restart TS Server"

# Or reload window
# Command Palette -> "Developer: Reload Window"
```

### Issue: Tests failing

**Solution:**
```bash
# Clear Vitest cache
rm -rf node_modules/.vitest
npm test
```

---

## IDE Configuration

### VS Code (Recommended)

**Required Extensions:**
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Vite (`antfu.vite`)

**Recommended Extensions:**
- TypeScript Vue Plugin (`Vue.vscode-typescript-vue-plugin`)
- Auto Rename Tag (`formulahendry.auto-rename-tag`)
- Path Intellisense (`christian-kohler.path-intellisense`)

**Settings (`.vscode/settings.json`):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Git Workflow

### Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes
# ... edit files ...

# 3. Test locally
npm run lint
npm test
npm run build

# 4. Commit changes
git add .
git commit -m "feat: Add my feature"

# 5. Push and create PR
git push origin feature/my-feature
```

### Commit Message Format
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new feature
fix: Fix bug
test: Add tests
docs: Update documentation
chore: Maintenance tasks
refactor: Code refactoring
style: Code formatting
perf: Performance improvements
```

---

## CI/CD Pipeline

The frontend has automated CI/CD via GitHub Actions:

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Changes in `frontend/**` paths

**Pipeline Steps:**
1. Checkout code
2. Setup Node.js (18.x and 20.x matrix)
3. Install dependencies (`npm ci`)
4. Run ESLint
5. Run Vitest tests
6. Build for production
7. Upload build artifacts
8. Check build size

**View Pipeline:**
https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/actions/workflows/frontend-ci.yml

---

## Production Deployment

### Build for Production
```bash
npm run build
```

**Output:** `dist/` directory with optimized assets

### Deploy to Railway (production)
The frontend runs on **Railway**, built from `frontend/Dockerfile` (which serves the built `dist/` via `server.js` on port 3000; see `frontend/railway.toml`). Railway is git-connected, so pushing to `main` triggers an automatic deploy.

```bash
# Production build (what the Docker image runs)
npm run build
node server.js   # serves dist/ on $PORT (default 3000)
```

> The repo also contains a Cloudflare Pages config (`frontend/wrangler.toml`, `.github/workflows/deploy-cloudflare.yml`) as an optional/alternate host. Vercel and Netlify are not used by this project.

---

## Performance Tips

### Speed Up Development
```bash
# Enable SWC for faster builds
export VITE_USE_SWC=true
npm run dev
```

### Reduce Bundle Size
```bash
# Analyze bundle size
npm run build
du -h dist/* | sort -h
```

---

## Next Steps

1. ✅ Run `npm install` and commit `package-lock.json`
2. ✅ Start dev server and verify everything works
3. ✅ Run tests to ensure quality
4. ✅ Push changes to trigger CI/CD
5. 🚀 Start building Sprint F3 features!

---

## Support

**Issues:** https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/issues

**Documentation:**
- `docs/FRONTEND-SPRINT-PLAN.md`
- `docs/SPRINT-F2-COMPLETION-REPORT.md`

**Quick Links:**
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

**Happy Coding! 🚀**
