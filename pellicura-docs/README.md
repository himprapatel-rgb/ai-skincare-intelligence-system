# Pellicura — Complete Product Documentation

## What is Pellicura?
Pellicura is a **clinical-grade AI-powered skincare intelligence system**. It uses computer vision (GPT-4V), machine learning (MediaPipe), and natural language AI (GPT-4o-mini) to analyze skin health, recommend products, build routines, and provide personalized skincare guidance.

## Documentation Index

| Document | Description |
|----------|-------------|
| [Feature Catalog](FEATURE-CATALOG.md) | Complete list of all 234 features with status |
| [Architecture](ARCHITECTURE.md) | System design, data flow, security, deployment |
| [Frontend Features](frontend/FEATURES.md) | All 50+ pages, components, hooks, UI patterns |
| [Backend API](backend/API-REFERENCE.md) | All 113 endpoints (current) + 87 planned |
| [Backend Services](backend/SERVICES.md) | 21 services: AI, auth, products, notifications |
| [Database Schema](database/SCHEMA.md) | All tables, columns, relationships, indexes |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, CSS Custom Properties |
| Backend | FastAPI, Python 3.11, SQLAlchemy, Pydantic |
| Database | PostgreSQL 15 (main) + PostgreSQL 15 (product catalog) |
| AI/ML | OpenAI GPT-4V (vision), GPT-4o-mini (text), MediaPipe (face mesh) |
| Auth | JWT (HS256), Argon2id password hashing, Google OAuth 2.0 |
| Encryption | AES-256 (Fernet) for sensitive profile fields |
| Deployment | Railway (backend), Cloudflare Pages (frontend) |

## Quick Start

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install
npm run dev

# Tests
cd backend && python -m pytest tests/ -x -q
cd frontend && npm test
```
