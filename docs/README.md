# AI Skincare Intelligence System - Documentation

> **Master Documentation Index** - Single source of truth for all project documentation

## 🚀 Quick Start

**New to the project?** Start here:
1. [Quick Start Guide](./QUICK-START.md) - Get up and running in 5 minutes
2. [System Requirements](./AI-Skincare-Intelligence-System-SRS-V5.3-EXTERNAL-PRETRAINED-ML.md) - Full SRS specification
3. [Product Backlog](./Product-Backlog-V5.md) - Current feature priorities

## 📋 Core Documentation

### System Requirements & Architecture
- **[SRS V5.3](./AI-Skincare-Intelligence-System-SRS-V5.3-EXTERNAL-PRETRAINED-ML.md)** - Software Requirements Specification (ACTIVE)
- **[Traceability Matrix](./TRACEABILITY-MATRIX.md)** - Requirements → Implementation mapping
- **[Architecture Decisions](./architecture/)** - ADRs and design decisions

### Product Management
- **[Product Backlog V5](./Product-Backlog-V5.md)** - Active backlog with epics and stories
- **[Product Tracker](./Product-Tracker.md)** - Live progress tracking
- **[Sprint Summaries](./sprints/)** - Canonical sprint records ([See Sprint Index](./sprints/README.md))

### Current Status (Living Docs)
- **[Current State](./CURRENT-STATE-UNDERSTANDING.md)** - System state as of today
- **[Baseline Healthcheck](./BASELINE-HEALTHCHECK.md)** - Production health status
- **[Action Plan](./ACTION-PLAN-TODAY.md)** - Today's priorities

## 🧪 Testing & Quality

- **[Testing Guide](./TESTING-GUIDE.md)** - Comprehensive testing strategy
- **[API Testing Reports](./API_TESTING_COMPLETE_REPORT.md)** - Latest API test results
- **[Backend Testing Summary](./BACKEND_TESTING_SUMMARY.md)** - Backend test coverage

## 🚢 Deployment & Operations

- **[CI/CD Setup Guide](./CI-CD-SETUP-GUIDE.md)** - GitHub Actions pipeline configuration
- **[Deployment Guide](./SPRINT-0-DEPLOYMENT-GUIDE.md)** - Railway deployment instructions
- **[Required Secrets](./REQUIRED_SECRETS.md)** - Environment variables reference
- **[Configuration Guide](./CONFIGURATION-GUIDE-EXTERNAL-ML-MODELS.md)** - External ML model setup

## 📚 Implementation Guides

- **[Database Integration](./DATABASE_INTEGRATION_GUIDE.md)** - PostgreSQL setup
- **[ML Inference Integration](./ML-INFERENCE-INTEGRATION.md)** - AI/ML implementation
- **[API Impact Analysis](./API-IMPACT-ANALYSIS.md)** - API changes and impacts

## 📂 Documentation Structure

```
/docs
├── README.md (THIS FILE) - Master index
├── /sprints - Canonical sprint summaries
├── /architecture - SRS, ADRs, design docs
├── /Archive - Historical docs (Sprint-History, SRS-Versions, Status-Reports)
├── /00-index - Documentation guides
├── /sprint1 - Sprint 1 artifacts
├── /status - Current state tracking
└── /docs - Legacy subfolder (being reorganized)
```

## 🔍 Finding What You Need

| I want to... | Go to |
|--------------|-------|
| Understand system requirements | [SRS V5.3](./AI-Skincare-Intelligence-System-SRS-V5.3-EXTERNAL-PRETRAINED-ML.md) |
| See current priorities | [Product Backlog](./Product-Backlog-V5.md) |
| Review sprint history | [Sprint Summaries](./sprints/) |
| Check production status | [Baseline Healthcheck](./BASELINE-HEALTHCHECK.md) |
| Set up development environment | [Quick Start](./QUICK-START.md) |
| Deploy to production | [Deployment Guide](./SPRINT-0-DEPLOYMENT-GUIDE.md) |
| Run tests | [Testing Guide](./TESTING-GUIDE.md) |
| View implementation details | [Sprint History Archive](./Archive/Sprint-History/) |

## 📖 Documentation Principles

✅ **Single Source of Truth**
- One canonical doc per topic
- Archive old versions, don't delete
- Link to Archive for historical evidence

✅ **Living Documents**
- Current status docs updated in place
- Sprint summaries immutable after close
- Archive detailed phase documentation

✅ **Zero Duplication**
- Reference existing docs, don't copy content
- Use links, not embedded content
- Merge overlapping docs

## 🗄️ Archive

Historical documentation preserved for audit and reference:
- **[Sprint History](./Archive/Sprint-History/)** - Phase docs, intermediate reports
- **[SRS Versions](./Archive/SRS-Versions/)** - Previous SRS versions
- **[Status Reports](./Archive/Status-Reports/)** - Completed status snapshots

## 🔄 Document Lifecycle

1. **Active** - Current, referenced from this index
2. **Complete** - Sprint closed, moved to `/sprints` as canonical summary
3. **Archived** - Evidence preserved in `/Archive`

---

**Last Updated:** December 25, 2025
**Maintained by:** AI Skincare Intelligence System Team
