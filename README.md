# AI Skincare Intelligence System

## Overview
AI-powered skincare analysis and treatment recommendation system with intelligent product ratings and personalized routines.

## Project Documentation

This repository contains the complete documentation and development materials for the AI Skincare Intelligence System.

### 📁 Documentation Files

The project documentation includes:

1. **Step 1**: Software Requirements Specification (SRS) V5 - Enhanced requirements document
2. **Step 2**: Product Backlog - Detailed task breakdown and sprint planning
3. **Step 3**: Sprint 0 - Foundation & Setup Sprint documentation
4. **Step 4**: Sprint 1 - Core MVP Development plan
5. **Epic Matrix**: Visual representation of project epics and features

> **Note**: Documentation files from Google Drive have been downloaded and are ready to be uploaded to this repository.

## Features

- 🔍 **AI-Powered Skin Analysis**: Advanced algorithms for accurate skin condition assessment
- 💊 **Treatment Recommendations**: Personalized skincare treatment suggestions
- ⭐ **Intelligent Product Ratings**: Smart product evaluation based on ingredients and effectiveness
- 📋 **Personalized Routines**: Custom skincare routines tailored to individual needs
- 📊 **Progress Tracking & Digital Twin**: Monitor skin health improvements and timeline snapshots
- 🧪 **Product Scanner**: Barcode scanning with ingredient safety analysis
- 📚 **Education Hub**: Blog, ingredient dictionary, and skin type guidance

## Technology Stack

- **Platforms**: Web, iOS, Android
- **AI/ML**: Skincare analysis models
- **Development**: Agile methodology with sprint-based development

## Project Status

🚀 **Current Phase**: Post-Sprint HP-1 - Production Operational ✅

### 🛠️ Implementation Status (Jan 26, 2026)

- ✅ **Frontend**: 35 pages (23 with real API, 8 mock, 4 static/education)
- ✅ **Backend**: ~50+ API endpoints operational (recent updates pending verification)
- ✅ **Database**: 15+ models with PostgreSQL on Railway
- ✅ **Authentication**: JWT + Argon2 + email verification
- ✅ **Face Scanning**: MediaPipe validation + ML analysis
- ✅ **Digital Twin**: Timeline visualization with snapshots + before/after slider
- ✅ **Admin Dashboard**: User/product management
- ✅ **GDPR Compliance**: Data export, consent management, audit trail
- ✅ **External ML**: HuggingFace integration + model registry
- ✅ **CI/CD Pipeline**: GitHub Actions passing
- ✅ **UI/UX Polish**: Spacing, typography, and profile tab refinements
- ✅ **QA Fixes**: Education pages, recommendations fallback, scan filtering
- ✅ **Scan Images**: Results now fall back to scan image endpoint
- 🟡 **Production Status**: Frontend live; backend health should be re-verified after latest deploy

**Implementation Level:** ~90% Complete

For comprehensive status, see:
- [Implementation Status](docs/06-operations/Implementation-Status-2026-01-26.md)
- [Feature Traceability](docs/01-requirements/Feature-Implementation-Traceability-2026-01-26.md)
- [Sprint Index](docs/07-sprints/README.md)

## Getting Started

### Prerequisites

- **Python 3.9+**
- **PostgreSQL 12+**
- **Git**
- **Docker & Docker Compose** (optional, for containerized setup)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/himprapatel-rgb/ai-skincare-intelligence-system.git
   cd ai-skincare-intelligence-system
   ```

2. **Backend Setup**
   ```bash
   cd backend
   
   # Create and activate virtual environment
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the `backend` directory:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/skincare_db
   SECRET_KEY=your-secret-key-here
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   GPTGPT_API_KEY=your-openai-api-key
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_API_BASE=https://api.openai.com/v1
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_TIMEOUT_SECONDS=60
   ```

4. **Database Setup & SCIN Data Pipeline**
   ```bash
   # Run full SCIN ETL pipeline (migrations -> seed -> SCIN import -> images)
   make scin-pipeline
   
   # Or run steps individually:
   make migrate           # Run database migrations
   make seed-data         # Seed core datasets
   make import-scin       # Import SCIN dataset
   make migrate-scin-images  # Upload SCIN images to Cloudinary
   ```

5. **Start the Backend Server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   
   API will be available at:
   - **Local**: http://localhost:8000
   - **Swagger UI**: http://localhost:8000/docs
   - **Health Check**: http://localhost:8000/api/health

6. **Run Tests**
   ```bash
   make test
   # Or directly:
   pytest -v
   ```

### Docker Setup (Alternative)

```bash
# Start all services (backend + database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

The backend is deployed on **Railway** with automatic CI/CD:
- **API**: https://ai-skincare-intelligence-system-production.up.railway.app
- **Swagger**: https://ai-skincare-intelligence-system-production.up.railway.app/docs
## Contributing

This is a private development project. Contribution guidelines will be established in future updates.

## License

All rights reserved - Himanshu Patel

## Contact

For inquiries about this project, please contact the development team.

---

*Last Updated: January 27, 2026*


## Live Production URLs

**Frontend**: https://frontend-production-0415.up.railway.app  
**Backend API**: https://ai-skincare-intelligence-system-production.up.railway.app  
**API Docs**: https://ai-skincare-intelligence-system-production.up.railway.app/docs  
**Health Check**: https://ai-skincare-intelligence-system-production.up.railway.app/health

---

## Deployment Status

**Last Updated:** January 26, 2026  
**Production Status:** 🟡 Frontend live, backend pending verification  
**Frontend Status:** ✅ Live  
**Backend Status:** ⚠️ Verify health  
**Database Status:** ✅ Operational
