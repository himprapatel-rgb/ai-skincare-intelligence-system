# 📚 Documentation Index

Welcome to the AI Skincare Intelligence System documentation! This is your entry point to all project documentation, organized by purpose and workflow.

## 🎯 Quick Links

### Current Status
- **[Current State](../status/current-state.md)** - Comprehensive project status analysis
- **[Baseline Healthcheck](../status/baseline-healthcheck.md)** - System health verification
- **[Action Plan Today](../status/action-plan-today.md)** - Daily priorities and tasks

### Architecture & Design
- **[SRS v5.2](../architecture/srs-v5-2.md)** - Software Requirements Specification (Latest)
- **[Database Update v5.1](../architecture/database-update-v5-1.md)** - Database schema updates
- **[Database Transition Strategy](../architecture/database-transition-strategy.md)** - Migration approach

### Product Management
- **[Product Backlog](../product/backlog.md)** - Feature roadmap and priorities
- **[Progress Tracker](../product/progress-tracker.md)** - Sprint and milestone tracking

### Sprint History
- **[Sprint 1 Review](../sprints/sprint-1-review.md)** - Sprint 1 retrospective
- **[Sprint 1 Implementation](../sprints/sprint-1-implementation.md)** - Sprint 1 deliverables
- **[Sprint 2 Phase 3 Complete](../sprints/sprint-2-phase-3-complete.md)** - Sprint 2 completion

### API & Integration
- **[API Testing Complete Report](../api/testing-complete-report.md)** - Comprehensive API testing
- **[ADR-ML-003: External Storage](../api/adr-ml-003-external-storage.md)** - ML model storage decisions

### Testing & QA
- **[Backend Testing Summary](../testing/backend-summary.md)** - Backend QA results
- **[Testing Phase Agile Integration](../testing/phase-agile-integration.md)** - Agile testing workflow

### Workflows & Processes
- **[Agile Workflow](../workflows/agile-workflow.md)** - Development process
- **[CI/CD Dashboard](../workflows/ci-cd-dashboard.md)** - Continuous integration setup

---

## 📁 Folder Structure

```
/docs
  /00-index/           # 👉 You are here - Entry point & navigation
  /architecture/       # SRS, database schemas, system design
  /product/           # Backlog, tracker, roadmap
  /sprints/           # Immutable sprint snapshots (sprint-0 to sprint-6)
  /api/               # API documentation, ADRs
  /testing/           # Test reports, QA documentation
  /status/            # Current state, living docs
  /workflows/         # CI/CD, agile processes
```

## 📝 Conventions

- **Naming**: All filenames use kebab-case (`my-file-name.md`)
- **Versioning**: Explicit versions in filenames (`srs-v5-2.md`)
- **Living Docs**: Status folder contains current, regularly updated documents
- **Immutable**: Sprint docs are historical snapshots, never modified

## 🔗 External Links

- **[GitHub Repository](https://github.com/himprapatel-rgb/ai-skincare-intelligence-system)**
- **[Production Deployment](https://ai-skincare-intelligence-system-production.up.railway.app/)**
- **[Railway Dashboard](https://railway.app/)**

## 🎉 Documentation Reorganization

This structure was created as part of Issue #1 - Major Documentation Reorganization:
- **Before**: 84 scattered files with naming chaos
- **After**: Professional, navigable structure following Diátaxis framework
- **AI Audit**: Gemini + ChatGPT (Combined Rating: 7/10 → Enhanced to production-ready)

---

👉 **For full reorganization details**, see [DOCS-REORGANIZATION-PLAN.md](../DOCS-REORGANIZATION-PLAN.md)
