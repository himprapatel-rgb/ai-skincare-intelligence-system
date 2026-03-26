# Sprint Execution Guide

## Overview
6 sprints, 2 weeks each, 12 weeks total. Each sprint doc contains:
- **Objectives** — what we're delivering
- **Tasks** — specific work items with files to create/modify
- **Dependencies** — what must be done before this sprint
- **Acceptance Criteria** — how we know it's done
- **Verification** — commands to run

## Sprint Index

| Sprint | Weeks | Doc | Status |
|--------|-------|-----|--------|
| [Sprint 1](SPRINT-1.md) | 1-2 | Foundation & Architecture | Pending |
| [Sprint 2](SPRINT-2.md) | 3-4 | Backend APIs & AI Chat Backend | Pending |
| [Sprint 3](SPRINT-3.md) | 5-6 | Page Redesigns & AI Chat Frontend | Pending |
| [Sprint 4](SPRINT-4.md) | 7-8 | Remaining Pages & Real-time & PWA | Pending |
| [Sprint 5](SPRINT-5.md) | 9-10 | Clinical Intelligence & Analytics | Pending |
| [Sprint 6](SPRINT-6.md) | 11-12 | Testing, i18n, Security, Polish | Pending |

## Definition of Done (Per Sprint)
- All tasks completed
- `cd backend && python -m pytest tests/ -x -q` passes
- `cd frontend && npm run build` succeeds with zero errors
- No regressions on existing features
- Code committed and pushed
