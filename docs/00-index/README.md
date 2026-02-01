# Documentation Index

> Central navigation hub for all AI Skincare Intelligence System documentation

---

## Quick Start

| If you want to... | Read this |
|-------------------|-----------|
| **Understand the project** | [README.md](../../README.md) |
| **Set up development environment** | [Getting Started](../../README.md#getting-started) |
| **Deploy the application** | [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) |
| **Configure environment** | [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md) |
| **Work on backend** | [BACKEND_GUIDE.md](../BACKEND_GUIDE.md) |
| **Work on frontend** | [FRONTEND_GUIDE.md](../FRONTEND_GUIDE.md) |
| **Understand database** | [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) |
| **Check system design** | [ARCHITECTURE.md](../ARCHITECTURE.md) |
| **See active tasks** | [12-tasks/ACTIVE-TASKS.md](../12-tasks/ACTIVE-TASKS.md) |
| **Development workflow** | [13-workflow/DEVELOPMENT-WORKFLOW.md](../13-workflow/DEVELOPMENT-WORKFLOW.md) |

---

## Documentation Structure

```
docs/
├── 00-index/               ◄── You are here
│   └── README.md
│
├── 01-requirements/        # Requirements & traceability
│   ├── Traceability-Matrix.md
│   └── Feature-Implementation-Traceability-2026-01-26.md
│
├── 02-architecture/        # System design
│   └── Database-Design-Extensible.md
│
├── 03-product/             # Product management
│   ├── Product-Backlog-V5.md
│   └── Product-Tracker.md
│
├── 05-deployment/          # Deployment guides
│   └── Required-Secrets.md
│
├── 06-operations/          # Operational documentation
│   ├── Current-State.md
│   ├── Features-Left-to-Implement.md
│   ├── Implementation-Status-2026-01-26.md
│   └── Pages-Created-Status.md
│
├── 07-sprints/             # Sprint documentation
│   ├── sprint-7/
│   └── sprint-hp-1/
│
├── 08-audits/              # Code audits
│   └── Implementation-Audit.md
│
├── 09-reports/             # Status reports
│   ├── Completion-Report-2025-01-11.md
│   └── Project-Review-Summary.md
│
├── 10-branding/            # Brand guidelines
│   ├── 01-BRAND-STRATEGY.md
│   ├── 03-BRAND-GUIDELINES.md
│   ├── 04-VISUAL-IDENTITY.md
│   └── ...
│
├── 11-working/             # Working notes (troubleshooting, integration)
│   └── README.md
│
├── 12-tasks/               # ★ Tasks (single source)
│   ├── ACTIVE-TASKS.md
│   ├── BACKLOG.md
│   └── COMPLETED.md
│
├── 13-workflow/            # ★ Development process
│   ├── DEVELOPMENT-WORKFLOW.md
│   └── TESTING-CHECKLIST.md
│
├── 99-archive/             # Archived documents
│   ├── legacy/
│   └── task-lists-legacy/
│
├── ARCHITECTURE.md         ★ System architecture
├── BACKEND_GUIDE.md        ★ Backend development guide
├── DATABASE_SCHEMA.md      ★ Database documentation
├── DEPLOYMENT_GUIDE.md     ★ Deployment instructions
├── ENVIRONMENT_VARIABLES.md ★ Configuration reference
├── FRONTEND_GUIDE.md       ★ Frontend development guide
└── OPEN API _ AI_Skincare_Full_API_Master_Document.md
```

★ = Primary documentation (start here)

---

## Core Documentation

### System Overview

| Document | Description |
|----------|-------------|
| [README.md](../../README.md) | Project overview, quick start, tech stack |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System design, components, data flow |
| [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) | Database tables, relationships, indexes |

### Development Guides

| Document | Description |
|----------|-------------|
| [BACKEND_GUIDE.md](../BACKEND_GUIDE.md) | FastAPI backend development |
| [FRONTEND_GUIDE.md](../FRONTEND_GUIDE.md) | React frontend development |
| [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md) | All configuration options |

### Operations

| Document | Description |
|----------|-------------|
| [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) | Railway deployment, CI/CD |
| [06-operations/Current-State.md](../06-operations/Current-State.md) | Current implementation status |

---

## Feature Documentation

### Implemented Features (Complete)

| Feature | Documentation |
|---------|---------------|
| User Authentication | [BACKEND_GUIDE.md#authentication](../BACKEND_GUIDE.md#authentication) |
| Google OAuth | [ENVIRONMENT_VARIABLES.md#google-oauth](../ENVIRONMENT_VARIABLES.md#google-oauth-variables) |
| Skin Analysis | [ARCHITECTURE.md#aiml-pipeline](../ARCHITECTURE.md#aiml-pipeline) |
| Digital Twin | [Database: skin_state_snapshots](../DATABASE_SCHEMA.md#skin_state_snapshots) |
| What-If Simulation | [Backend: SimulationService](../BACKEND_GUIDE.md#simulationservice) |
| Routine Builder | [Database: saved_routines](../DATABASE_SCHEMA.md#saved_routines) |
| Notifications | [Database: notifications](../DATABASE_SCHEMA.md#notifications) |
| Product Shelf | [Database: shelf_products](../DATABASE_SCHEMA.md#shelf_products) |

---

## Design Documentation

### UI/UX

| Document | Description |
|----------|-------------|
| [COLOR_SCHEME.md](../../frontend/src/styles/COLOR_SCHEME.md) | Color palette (locked) |
| [10-branding/04-VISUAL-IDENTITY.md](../10-branding/04-VISUAL-IDENTITY.md) | Visual design system |
| [10-branding/03-BRAND-GUIDELINES.md](../10-branding/03-BRAND-GUIDELINES.md) | Brand standards |

---

## API Documentation

### OpenAPI/Swagger

Available at: `/api/docs` on the backend server

- **Local**: http://localhost:8000/api/docs
- **Production**: https://ai-skincare-intelligence-system-production.up.railway.app/api/docs

### API Reference

| Endpoint Group | Documentation |
|----------------|---------------|
| Authentication | [BACKEND_GUIDE.md#authentication-endpoints](../BACKEND_GUIDE.md#authentication-apiv1auth) |
| Scan | [BACKEND_GUIDE.md#scan-endpoints](../BACKEND_GUIDE.md#scan-apiv1scan) |
| Digital Twin | [BACKEND_GUIDE.md#digital-twin-endpoints](../BACKEND_GUIDE.md#digital-twin-apiv1digital-twin) |

---

## For New Team Members

### Day 1: Getting Started

1. Read [README.md](../../README.md) - Understand the project
2. Read [ARCHITECTURE.md](../ARCHITECTURE.md) - Understand the system
3. Set up local development (see README)
4. Review [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md)

### Week 1: Deep Dive

1. Read your track's guide:
   - Backend: [BACKEND_GUIDE.md](../BACKEND_GUIDE.md)
   - Frontend: [FRONTEND_GUIDE.md](../FRONTEND_GUIDE.md)
2. Understand [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)
3. Review current sprint in [07-sprints/](../07-sprints/)

### For Deployment

1. Read [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)
2. Review [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md)
3. Check [05-deployment/Required-Secrets.md](../05-deployment/Required-Secrets.md)

---

## Document Maintenance

### Updating Documentation

1. Make changes to relevant `.md` files
2. Update this index if adding new docs
3. Commit with message: `docs: update [document name]`

### Document Standards

- Use Markdown format
- Include table of contents for long docs
- Add "Last updated" date at bottom
- Use code blocks for commands and code
- Include practical examples

---

*Last updated: January 27, 2026*
