# Sprint 2: Frontend-Backend Integration Implementation Guide

## Document Metadata

- **Sprint:** 2 - Phase 2 (Frontend-Backend Integration)
- **Status:** ✅ Backend Complete | 🔄 Frontend Complete | ⏳ Integration Pending
- **Date Created:** December 6, 2025
- **Last Updated:** December 6, 2025
- **Owner:** Product & Development Team

---

## Executive Summary

✅ **Phase 1 COMPLETE**: All Sprint 2 backend API endpoints successfully deployed to Railway:
- Face scan session management (init, upload, status)
- AI-powered skin analysis with confidence scoring
- Database schema with face_scans and skin_analyses tables
- Production URL: https://ai-skincare-intelligence-system-production.up.railway.app

✅ **Phase 2 COMPLETE**: All Sprint 2 frontend files created via GitHub web interface:
- Services layer: cameraService.ts, faceDetection.ts, scanApi.ts
- Pages: ScanPage.tsx
- Components: Camera.tsx, AnalysisResults.tsx, LoadingSpinner.tsx, ErrorMessage.tsx
- TypeScript types: faceScan.ts

⏳ **Phase 3 NEXT**: Frontend-Backend Integration & Deployment

---

## Phase 3: Integration Implementation Plan

### Step 1: Setup Local Development Environment

#### 1.1 Clone Repository Locally
```bash
# Clone the repository
git clone https://github.com/himprapatel-rgb/ai-skincare-intelligence-system.git
cd ai-skincare-intelligence-system

# Checkout main branch
git checkout main
git pull origin main
```

#### 1.2 Install Frontend Dependencies
```bash
cd frontend
npm install
# or
yarn install
```

#### 1.3 Configure Environment Variables
Create `frontend/.env.local`:
```env
# Backend API Configuration
VITE_API_BASE_URL=https://ai-skincare-intelligence-system-production.up.railway.app
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_FACE_SCAN=true
VITE_ENABLE_DEBUG_LOGS=true

# Camera Configuration
VITE_CAMERA_RESOLUTION=1920x1080
VITE_CAMERA_FRAME_RATE=30
```

---

### Step 2: Update Frontend Configuration

#### 2.1 Update API Base URL in scanApi.ts
Verify `frontend/src/services/scanApi.ts` has correct configuration:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### 2.2 Add Authentication Interceptor
Update `scanApi.ts` to include JWT token:
```typescript
// Add request interceptor for authentication
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

#### 2.3 Update App.tsx to Include ScanPage Route
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScanPage from './pages/ScanPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scan" element={<ScanPage />} />
        {/* Other routes */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

### Step 3: Local Testing

#### 3.1 Start Frontend Development Server
```bash
cd frontend
npm run dev
# or
yarn dev
```

#### 3.2 Test Face Scan Flow
1. Navigate to `http://localhost:5173/scan` (or configured port)
2. Grant camera permissions
3. Capture face image
4. Verify upload to Railway backend
5. Check analysis results display

#### 3.3 Verify API Integration
Check browser console for:
- ✅ Successful API calls to Railway backend
- ✅ Proper error handling
- ✅ Loading states working
- ✅ Results displaying correctly

#### 3.4 Test Error Scenarios
- Camera permission denied
- Network timeout
- Invalid face image
- Backend API errors

---

### Step 4: Build Frontend for Production

#### 4.1 Create Production Build
```bash
cd frontend
npm run build
# or
yarn build
```

#### 4.2 Test Production Build Locally
```bash
npm run preview
# or
yarn preview
```

#### 4.3 Verify Build Output
Check `frontend/dist/` directory:
- ✅ index.html
- ✅ assets/index-*.js (bundled JavaScript)
- ✅ assets/index-*.css (bundled CSS)
- ✅ No build errors

---

### Step 5: Deploy Frontend

#### Option A: Deploy to Railway (Recommended)

##### 5.1 Create New Service in Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to existing project
railway link

# Create new service for frontend
railway service create frontend
```

##### 5.2 Configure Railway Service
1. Go to Railway dashboard → Your project
2. Select frontend service
3. Settings → Configure:
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Start Command:** `cd frontend && npm run preview`
   - **Root Directory:** `/`
   - **Port:** `4173` (Vite preview default)

##### 5.3 Set Environment Variables
In Railway frontend service settings → Variables:
```
VITE_API_BASE_URL=https://ai-skincare-intelligence-system-production.up.railway.app
VITE_API_TIMEOUT=30000
VITE_ENABLE_FACE_SCAN=true
VITE_ENABLE_DEBUG_LOGS=false
```

##### 5.4 Deploy
```bash
railway up
```

#### Option B: Deploy to Vercel (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

#### Option C: Deploy to Netlify (Alternative)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy from frontend directory
cd frontend
netlify deploy --prod --dir=dist
```

---

### Step 6: Post-Deployment Verification

#### 6.1 Test Production Deployment
1. Open deployed frontend URL
2. Navigate to `/scan` route
3. Complete full face scan flow
4. Verify results display correctly
5. Check browser console for errors

#### 6.2 Verify Backend Integration
Check Railway backend logs:
```bash
railway logs
```
Look for:
- ✅ Incoming scan requests
- ✅ Successful image uploads
- ✅ Analysis results generated
- ✅ No CORS errors

#### 6.3 Performance Testing
- Measure page load time (<3s)
- Measure scan-to-results time (<10s)
- Test on multiple devices (desktop, mobile)
- Test on multiple browsers (Chrome, Firefox, Safari)

---

### Step 7: Configure CORS for Production

#### 7.1 Update Backend CORS Settings
Update `backend/app/main.py` to allow frontend domain:
```python
from fastapi.middleware.cors import CORSMiddleware

# Add your frontend URL
origins = [
    "http://localhost:5173",  # Local development
    "http://localhost:4173",  # Local preview
    "https://your-frontend-url.railway.app",  # Production Railway
    "https://your-frontend-url.vercel.app",   # Production Vercel (if used)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 7.2 Redeploy Backend
```bash
cd backend
git add .
git commit -m "chore: Update CORS for production frontend"
git push origin main
```

---

### Step 8: Update Documentation

#### 8.1 Update README.md
Add deployment URLs:
```markdown
## Live Deployments

- **Backend API**: https://ai-skincare-intelligence-system-production.up.railway.app
- **Frontend App**: [Your Frontend URL]
- **API Docs**: https://ai-skincare-intelligence-system-production.up.railway.app/docs
```

#### 8.2 Update Sprint 2 Documentation
Update `docs/Sprint-2-Face-Scan-AI-Analysis.md`:
- Mark Phase 2 (Frontend) as COMPLETE ✅
- Mark Phase 3 (Integration) as COMPLETE ✅
- Add deployment URLs
- Add testing results

---

## Implementation Checklist

### Local Development Setup
- [ ] Clone repository locally
- [ ] Install frontend dependencies
- [ ] Configure environment variables
- [ ] Update API base URL
- [ ] Add authentication interceptor
- [ ] Update App.tsx routes

### Local Testing
- [ ] Start dev server successfully
- [ ] Camera access working
- [ ] Face scan flow complete
- [ ] API calls successful
- [ ] Results display correctly
- [ ] Error handling working
- [ ] Loading states working

### Production Build
- [ ] Build completes without errors
- [ ] Preview build locally
- [ ] Verify all assets generated
- [ ] Test production build functionality

### Deployment
- [ ] Choose deployment platform (Railway/Vercel/Netlify)
- [ ] Configure deployment settings
- [ ] Set environment variables
- [ ] Deploy successfully
- [ ] Verify deployment URL accessible

### Post-Deployment
- [ ] Test full scan flow on production
- [ ] Verify backend integration
- [ ] Check Railway logs
- [ ] Update CORS configuration
- [ ] Performance testing complete
- [ ] Cross-browser testing complete
- [ ] Mobile testing complete
- [ ] Documentation updated

---

## Troubleshooting Guide

### Issue: Camera Not Working
**Symptoms:** Camera permission denied or not accessible
**Solutions:**
1. Ensure HTTPS connection (required for camera access)
2. Check browser permissions
3. Verify `getUserMedia` API support
4. Check browser console for specific errors

### Issue: API Calls Failing
**Symptoms:** Network errors, 404, or CORS errors
**Solutions:**
1. Verify `VITE_API_BASE_URL` is correct
2. Check Railway backend is running
3. Verify CORS configuration includes frontend domain
4. Check authentication token is being sent

### Issue: Analysis Results Not Displaying
**Symptoms:** Scan completes but no results shown
**Solutions:**
1. Check browser console for errors
2. Verify API response structure matches types
3. Check AnalysisResults component rendering
4. Verify data is being passed correctly

### Issue: Build Failing
**Symptoms:** `npm run build` fails
**Solutions:**
1. Delete `node_modules` and reinstall
2. Check TypeScript errors
3. Verify all imports are correct
4. Check vite.config.ts configuration

---

## Next Steps After Integration

### 1. Implement Additional Features
- User profile integration
- Scan history view
- Progress tracking over time
- Recommendation engine

### 2. Performance Optimization
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies

### 3. Testing
- Unit tests for components
- Integration tests for API calls
- E2E tests for scan flow
- Performance testing

### 4. Monitoring & Analytics
- Set up error tracking (Sentry)
- Add analytics (Google Analytics/Mixpanel)
- Monitor API performance
- Track user engagement

---

## Contact & Support

**Repository:** https://github.com/himprapatel-rgb/ai-skincare-intelligence-system

**Issues:** Report issues on GitHub Issues

**Documentation:** See `/docs` folder for additional guides

---

## Document Version

- **Version:** 1.0
- **Status:** ACTIVE - Ready for Implementation
- **Last Updated:** December 6, 2025
- **Next Review:** After Phase 3 completion

**END OF IMPLEMENTATION GUIDE**
