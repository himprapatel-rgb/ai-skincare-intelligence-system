# Pellicura - AI Skincare Intelligence System

> **Clinical-grade AI-powered skin analysis platform** that provides personalized skincare recommendations, tracks skin health over time, and helps users achieve their skincare goals.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![React](https://img.shields.io/badge/react-18+-61dafb)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)
![Tasks](https://img.shields.io/badge/tasks-500%2F500%20Complete-success)

---

## 🚀 Quick Links

| Resource | URL |
|----------|-----|
| **Production Domain** | [pellicura.com](https://pellicura.com) *(Cloudflare - Coming Soon)* |
| **Current Frontend** | [frontend-production-0415.up.railway.app](https://frontend-production-0415.up.railway.app) |
| **Current Backend** | [ai-skincare-intelligence-system-production.up.railway.app](https://ai-skincare-intelligence-system-production.up.railway.app) |
| **API Documentation** | `/api/docs` (Swagger UI) |
| **GitHub Repository** | [github.com/himprapatel-rgb/ai-skincare-intelligence-system](https://github.com/himprapatel-rgb/ai-skincare-intelligence-system) |

### Upcoming Migration (2026-01-29)
| Service | Current | Target |
|---------|---------|--------|
| Frontend | Railway | Cloudflare Pages |
| Backend | Railway | Fly.io + Cloudflare |
| Database | Railway PostgreSQL | Neon PostgreSQL |
| Domain | Railway URLs | **pellicura.com** |

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Documentation](#documentation)
7. [Deployment](#deployment)
8. [Environment Variables](#environment-variables)
9. [API Reference](#api-reference)
10. [Contributing](#contributing)
11. [Accessibility](#accessibility)

---

## Accessibility

We aim for WCAG 2.1 Level AA where practical. Key decisions:

- **Skip link**: “Skip to main content” at top of every page for keyboard users.
- **Landmarks**: `main`, `nav`, `banner`, `contentinfo`; headings in logical order (single `h1` per page).
- **Forms**: Labels via `htmlFor`, errors via `aria-describedby` and `aria-invalid`; required fields use `aria-required`.
- **Modals**: Focus trap and return focus on close; `role="dialog"`, `aria-modal="true"`.
- **Toasts**: `role="alert"`, `aria-live="polite"`.
- **Loading**: Spinners use `role="status"` and `aria-label="Loading"`.
- **Motion**: `prefers-reduced-motion` respected in CSS.
- **Tables**: Headers use `scope="col"` where applicable.

---

## Overview

The AI Skincare Intelligence System is a full-stack web application that uses artificial intelligence to analyze skin conditions from uploaded photos and provide personalized skincare recommendations. The platform includes:

- **AI-Powered Skin Analysis**: Upload a selfie and get instant analysis of skin concerns
- **Digital Twin Technology**: Track your skin's evolution over time with visual comparisons
- **Personalized Recommendations**: Get product and routine recommendations tailored to your skin
- **Routine Builder**: Create and manage daily/nightly skincare routines
- **Product Scanner**: Scan products to check ingredient compatibility with your skin

---

## Key Features

### ✅ Implemented Features

| Feature | Description | Status |
|---------|-------------|--------|
| **User Authentication** | Email/password + Google OAuth with email verification | ✅ Complete |
| **Skin Analysis** | AI-powered photo analysis with face validation | ✅ Complete |
| **Digital Twin** | Skin state tracking over time with visualizations | ✅ Complete |
| **What-If Simulation** | Predict skin improvements based on product usage | ✅ Complete |
| **Personalized Recommendations** | AI-generated product/routine suggestions | ✅ Complete |
| **Routine Builder** | Create AM/PM skincare routines with reminders | ✅ Complete |
| **Product Scanner** | Barcode/ingredient scanning for product analysis | ✅ Complete |
| **My Shelf** | Track products you own and their status | ✅ Complete |
| **Favorites** | Save favorite products and routines | ✅ Complete |
| **Notifications** | In-app notifications and routine reminders | ✅ Complete |
| **Progress Tracking** | Before/after comparisons and improvement charts | ✅ Complete |
| **Export Data** | GDPR-compliant data export and deletion | ✅ Complete |
| **Responsive Design** | Mobile-first UI with hamburger menu | ✅ Complete |

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Python 3.11+** | Core language |
| **FastAPI** | Web framework |
| **PostgreSQL** | Primary database |
| **SQLAlchemy** | ORM |
| **Pydantic** | Data validation |
| **JWT** | Authentication |
| **Argon2** | Password hashing |
| **OpenAI API** | Vision analysis |
| **MediaPipe** | Face detection/validation |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **React Router** | Navigation |
| **Axios** | HTTP client |
| **Recharts** | Data visualization |
| **Lucide React** | Icons |
| **CSS Modules** | Styling |

### Infrastructure (Current → Target)
| Technology | Purpose | Migration Target |
|------------|---------|------------------|
| **Railway** | Current Hosting | → Cloudflare/Fly.io |
| **Cloudflare Pages** | Frontend CDN | ✅ Target |
| **Fly.io** | Backend Hosting | ✅ Target |
| **Neon** | Serverless PostgreSQL | ✅ Target |
| **GitHub Actions** | CI/CD pipelines | Unchanged |
| **Docker** | Containerization | Unchanged |
| **Playwright** | E2E testing | Unchanged |

---

## Project Structure

```
ai-skincare-intelligence-system/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/v1/endpoints/   # API route handlers
│   │   ├── models/             # SQLAlchemy models
│   │   ├── routers/            # Additional routers
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic services
│   │   ├── data/               # Static data (ingredients, etc.)
│   │   ├── config.py           # Configuration settings
│   │   ├── database.py         # Database connection
│   │   └── main.py             # FastAPI application
│   ├── scripts/                # Database migrations, utilities
│   ├── tests/                  # Backend tests
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page components
│   │   ├── context/            # React contexts (Auth, etc.)
│   │   ├── services/           # API service layer
│   │   ├── styles/             # Global styles, design system
│   │   ├── utils/              # Utility functions
│   │   └── App.tsx             # Main application component
│   ├── tests/                  # Frontend tests
│   └── package.json            # Node dependencies
│
├── docs/                       # Documentation
│   ├── 00-index/               # Documentation index
│   ├── 01-requirements/        # Requirements & traceability
│   ├── 02-architecture/        # System architecture
│   ├── 03-product/             # Product backlog
│   ├── 05-deployment/          # Deployment guides
│   ├── 06-operations/          # Operational docs
│   ├── 07-sprints/             # Sprint documentation
│   └── 10-branding/            # Brand guidelines
│
└── .github/workflows/          # CI/CD pipelines
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **PostgreSQL 14+**
- **Git**

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/himprapatel-rgb/ai-skincare-intelligence-system.git
cd ai-skincare-intelligence-system
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables section)
cp .env.example .env

# Run database migrations
python scripts/run_migrations.py

# Start backend server
uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Create .env file (copy from .env.example if present)
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
# Optionally set VITE_GOOGLE_CLIENT_ID for Google sign-in. See Environment Variables below.

# Start development server
npm run dev
```

#### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture and design |
| [BACKEND_GUIDE.md](./docs/BACKEND_GUIDE.md) | Backend API and services |
| [FRONTEND_GUIDE.md](./docs/FRONTEND_GUIDE.md) | Frontend components and pages |
| [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) | Database tables and relationships |
| [ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md) | All configuration options |
| [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | Deployment instructions |
| [COLOR_SCHEME.md](./frontend/src/styles/COLOR_SCHEME.md) | UI color palette (locked) |

---

## Deployment

### Current Deployment (Railway)

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://frontend-production-0415.up.railway.app | ✅ Live |
| **Backend** | https://ai-skincare-intelligence-system-production.up.railway.app | ✅ Live |
| **Database** | Railway PostgreSQL | ✅ Live |

### Target Deployment (Cloudflare - Migration 2026-01-29)

| Service | URL | Platform |
|---------|-----|----------|
| **Frontend** | https://pellicura.com | Cloudflare Pages |
| **Backend** | https://api.pellicura.com | Fly.io + Cloudflare |
| **Database** | Neon PostgreSQL | Serverless |

### Migration Plan

See [ZERO-DOWNTIME-MIGRATION-PLAN.md](./docs/ZERO-DOWNTIME-MIGRATION-PLAN.md) for details.

- **Zero Downtime**: Railway runs parallel during migration
- **Timeline**: 2026-01-29 to 2026-01-31
- **Rollback**: Instant DNS switch back to Railway if needed

### CI/CD Pipeline

- Push to `main` branch triggers automatic deployment
- Backend and Frontend deploy independently
- Database migrations run automatically on backend start

---

## Environment Variables

### Backend (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SECRET_KEY` | JWT signing secret (32+ chars) | `your-super-secret-key-here` |
| `FRONTEND_URL` | Frontend URL for emails/OAuth | `https://frontend-production-0415.up.railway.app` |

### Backend (Optional)

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for vision analysis |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `SMTP_HOST` | SMTP server for emails |
| `SMTP_USERNAME` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM_EMAIL` | Sender email address |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL. **Development:** use `http://localhost:8000/api/v1` (or your local backend). **Production:** use the deployed backend URL (e.g. `https://ai-skincare-intelligence-system-production.up.railway.app/api/v1`). |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (for button) |

See [ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md) for complete list.

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/google` | Google OAuth login |
| GET | `/api/v1/auth/me` | Get current user |
| GET | `/api/v1/auth/verify-email` | Verify email token |

### Scan Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/scan/analyze` | Analyze skin photo |
| GET | `/api/v1/scan/history` | Get scan history |
| GET | `/api/v1/scan/{id}` | Get scan details |

### Digital Twin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/digital-twin/query` | Get timeline snapshots |
| GET | `/api/v1/digital-twin/insights` | Get skin insights |
| POST | `/api/v1/digital-twin/simulate` | Run what-if simulation |

### Recommendations Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/recommendations` | Get personalized recommendations |
| GET | `/api/v1/recommendations/routines` | Get routine suggestions |

See full API documentation at `/api/docs` (Swagger UI). The **API contract** (OpenAPI 3) is available at `https://ai-skincare-intelligence-system-production.up.railway.app/api/docs` (production) or `http://localhost:8000/api/docs` (local).

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test` (frontend), `pytest` (backend)
5. Commit: `git commit -m "feat: add my feature"`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

### Commit Message Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

---

## License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file.

---

## Support

For questions or issues, please open a GitHub issue or contact the development team.

---

## Project Status

| Milestone | Status | Date |
|-----------|--------|------|
| MVP Development | ✅ Complete | 2026-01 |
| 500 Task Checklist | ✅ 500/500 Complete | 2026-01-28 |
| Railway Deployment | ✅ Live | 2026-01-28 |
| Cloudflare Migration | 🔄 Scheduled | 2026-01-29 |
| Production Launch | 🔄 Pending | TBD |

### Key Documents

| Document | Description |
|----------|-------------|
| [TASK-LIST-1-500.md](./docs/TASK-LIST-1-500.md) | All 500 tasks completed |
| [ZERO-DOWNTIME-MIGRATION-PLAN.md](./docs/ZERO-DOWNTIME-MIGRATION-PLAN.md) | Cloudflare migration plan |
| [CLOUDFLARE-MIGRATION-PLAN.md](./docs/CLOUDFLARE-MIGRATION-PLAN.md) | Detailed migration architecture |

---

*Last updated: January 28, 2026*  
*Domain: pellicura.com*  
*Status: Production Ready - Awaiting Cloudflare Migration*
