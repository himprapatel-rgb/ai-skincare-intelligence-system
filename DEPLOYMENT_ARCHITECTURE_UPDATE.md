# Production Deployment Architecture

> **ℹ️ NOTE:** This is a historical architecture document. Current architecture documented in:
> - [Implementation Status (Jan 26, 2026)](docs/06-operations/Implementation-Status-2026-01-26.md)
> - [Architecture Decisions](docs/02-architecture/Architecture-Decisions.md)

**Updated**: January 26, 2026, 11:45 PM GMT  
**Status**: Cloud-Native Production Setup  
**Current Status (Jan 26, 2026):** ⚠️ Backend Health Verification Pending

## 🏗️ **Architecture Overview**

### Production Environment (NO LOCALHOST)

```
┌─────────────────────────────────────────────────────────┐
│                     PRODUCTION                          │
│                                                         │
│  ┌──────────────┐         ┌────────────────────────┐  │
│  │   FRONTEND   │────────>│      BACKEND API       │  │
│  │              │  calls  │                        │  │
│  │   Railway    │         │  Railway (FastAPI)     │  │
│  │              │         │   + Database (PG)      │  │
│  └──────────────┘         └────────────────────────┘  │
│                                                         │
│  User Access                API Calls                  │
└─────────────────────────────────────────────────────────┘
```

## 📍 **Production Endpoints**

### Frontend (Railway)
**URL**: `https://frontend-production-0415.up.railway.app`  
**Platform**: Railway  
**Status**: ✅ DEPLOYED  
**Technology**: React + TypeScript + Vite

**Deployment**:
- Auto-deploys from `main` branch
- Service root: `frontend/`
- Build: `npm install && npm run build`
- Start: `node server.js`

### Backend API (Railway)
**URL**: `https://ai-skincare-intelligence-system-production.up.railway.app`  
**Platform**: Railway  
**Status**: ⚠️ DEPLOYED, HEALTH CHECK PENDING  
**Technology**: Python FastAPI

**Deployment**:
- Auto-deploys from `main` branch
- Triggered by any push to repository
- Connected to Railway PostgreSQL database

### Database (Railway PostgreSQL)
**Platform**: Railway  
**Type**: PostgreSQL  
**Status**: ✅ RUNNING  
**Connection**: Internal to Railway backend

## 🔄 **Data Flow**

1. **User** → Accesses frontend via Railway URL
2. **Frontend** → Makes API calls to Railway backend
3. **Backend** → Processes requests, queries Railway PostgreSQL
4. **Database** → Returns data to backend
5. **Backend** → Returns JSON response to frontend
6. **Frontend** → Displays data to user

## 🎯 **NO LOCALHOST IN PRODUCTION**

**Important**: 
- ❌ NO local development servers in production
- ❌ NO localhost:3000 or localhost:8000
- ✅ All components run in cloud
- ✅ Codespace is ONLY for development/testing

## 🚨 **Current Issues**

### Issue: Backend Health Check Pending
**Status**: HIGH  
**Impact**: Verify API availability post-deploy

**Symptoms**:
- Railway deployment succeeds ✅
- Health check needs re-verification ⚠️

**Fix Required**: Validate `/health` and `/api/v1` endpoints

## ✅ **Working Components**

1. **CI/CD Pipeline**: GitHub Actions running all tests ✅
2. **Frontend Deployment**: Railway service deployed ✅
3. **Railway Connection**: Repository connected to Railway ✅
4. **Database**: PostgreSQL running on Railway ✅
5. **GitHub Pages**: Configured and enabled ✅

## 📊 **Environment Variables**

### Railway (Backend)
Required environment variables on Railway:
- `PORT` - Provided automatically by Railway
- `DATABASE_URL` - Railway PostgreSQL connection string
- `ENVIRONMENT` - production

### Frontend (Railway)
Optional environment variables (if used in Vite build):
- `VITE_API_BASE_URL`

## 🔐 **Security**

- Frontend: HTTPS via Railway
- Backend: HTTPS via Railway
- Database: Internal Railway network (not publicly exposed)
- API Keys: Stored as Railway environment variables

## 📈 **Scaling**

**Current Setup**:
- Frontend: Railway web service
- Backend: Railway free tier (500 hours/month)
- Database: Railway PostgreSQL (512 MB free tier)

**Future Scaling Options**:
- Railway Pro plan for more resources
- Database upgrade for larger data
- CDN for frontend assets

## 🛠️ **Development Workflow**

1. **Develop**: Use Codespace for local testing
2. **Commit**: Push to `main` branch
3. **CI/CD**: GitHub Actions runs tests
4. **Deploy Frontend**: Railway auto-deploys
5. **Deploy Backend**: Railway auto-deploys
6. **Test**: Verify production URLs work

## ✅ **Next Steps**

1. **Fix Railway Backend** - Investigate and resolve 502 error
2. **Test API Endpoints** - Verify backend responds correctly  
3. **Connect Frontend** - Ensure frontend can call backend API
4. **Monitor Performance** - Set up logging and monitoring

---
**Last Updated**: January 26, 2026  
**Deployment Model**: Cloud-Native (NO LOCALHOST)  
**Production Ready**: Frontend ✅ | Backend ⚠️ | Database ✅
