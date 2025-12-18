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
- 📊 **Progress Tracking**: Monitor skin health improvements over time

## Technology Stack

- **Platforms**: Web, iOS, Android
- **AI/ML**: Skincare analysis models
- **Development**: Agile methodology with sprint-based development

## Project Status

🚀 **Current Phase**: Sprint 3 - CI/CD Pipeline Complete ✅

### 🛠️ Development Status

- ✅ **CI/CD Pipeline**: Fully operational with automated testing
- ✅ **Backend Deployment**: Live on Railway (FastAPI)
- ✅ **Authentication**: Complete with JWT-based auth (login/register)
- ✅ **Scan Endpoints**: Implemented with UUID validation
- 🟡 **Test Coverage**: ~58% (7/7 tests passing)
- 🔗 **API Documentation**: [Swagger UI](https://ai-skincare-intelligence-system-production.up.railway.app/docs)

For detailed CI/CD completion report, see [SPRINT-3-PHASE-3-CI-CD-COMPLETION.md](docs/SPRINT-3-PHASE-3-CI-CD-COMPLETION.md)

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

*Last Updated: December 2025*


## Deployment Status

Last Updated: December 17, 2025  
Production Status: ✅ Active  
SCIN Dataset Integration: In Progress
