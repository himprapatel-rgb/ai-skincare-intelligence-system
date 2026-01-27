# AI Skincare Intelligence System - Documentation

> **Master Documentation Index** - Single source of truth for all project documentation

## 🚀 Quick Start

**New to the project?** Start here:
1. [Quick Start Guide](./00-index/Quick-Start.md)
2. [System Requirements](./01-requirements/SRS-V5.3-External-Pretrained-ML.md)
3. [Product Backlog](./03-product/Product-Backlog-V5.md)

## 📋 Core Documentation

### Requirements & Architecture
- **[SRS V5.3](./01-requirements/SRS-V5.3-External-Pretrained-ML.md)** - Software requirements specification
- **[Feature Implementation Traceability (Jan 26, 2026)](./01-requirements/Feature-Implementation-Traceability-2026-01-26.md)** - Maps SRS to code
- **[Traceability Matrix](./01-requirements/Traceability-Matrix.md)** - Original traceability
- **[Architecture Decisions](./02-architecture/Architecture-Decisions.md)** - ADRs and design decisions

### Product & Agile
- **[Product Backlog](./03-product/Product-Backlog-V5.md)**
- **[Product Tracker](./03-product/Product-Tracker.md)**
- **[Sprint Index](./07-sprints/README.md)**

### Operations (Living Docs)
- **[Implementation Status (Jan 26, 2026)](./06-operations/Implementation-Status-2026-01-26.md)** - Latest comprehensive status
- **[Features Left to Implement](./06-operations/Features-Left-to-Implement.md)** - Consolidated list of remaining features (Jan 27, 2026)
- **[Current State](./06-operations/Current-State.md)** - Living document with addendums
- **[Pages Status](./06-operations/Pages-Created-Status.md)** - All 31 pages inventory
- **[Baseline Healthcheck](./06-operations/Baseline-Healthcheck.md)**
- **[Action Plan](./06-operations/Action-Plan-Today.md)**

## 🧪 Testing & Deployment

- **[Testing Guide](./04-testing/Testing-Guide.md)**
- **[Testing Strategy (External ML Models)](./04-testing/Testing-Strategy-External-ML-Models.md)**
- **[Deployment Guide](./05-deployment/Deployment-Guide.md)**
- **[Required Secrets](./05-deployment/Required-Secrets.md)**

## 📂 Documentation Structure

```
/docs
├── README.md (THIS FILE)
├── /00-index        Entry point & navigation
├── /01-requirements SRS + traceability
├── /02-architecture ADRs + integrations
├── /03-product      Backlog + trackers
├── /04-testing      Test strategy
├── /05-deployment   Deployment + secrets
├── /06-operations   Live ops docs
├── /07-sprints      Sprint summaries & folders
├── /08-audits       Audit reports
├── /09-reports      Progress and completion reports
├── /11-working      Working notes during implementation
└── /99-archive      Legacy & historical docs
```

## 🔍 Finding What You Need

| I want to... | Go to |
|--------------|-------|
| See what's implemented NOW | [Implementation Status (Jan 26)](./06-operations/Implementation-Status-2026-01-26.md) |
| See what's left to implement | [Features Left to Implement](./06-operations/Features-Left-to-Implement.md) |
| Check which features are complete | [Feature Traceability](./01-requirements/Feature-Implementation-Traceability-2026-01-26.md) |
| Understand system requirements | [SRS V5.3](./01-requirements/SRS-V5.3-External-Pretrained-ML.md) |
| See all 31 frontend pages | [Pages Status](./06-operations/Pages-Created-Status.md) |
| Review sprint history | [Sprint Index](./07-sprints/README.md) |
| See current priorities | [Product Backlog](./03-product/Product-Backlog-V5.md) |
| Check production URLs | [README (root)](../README.md#live-production-urls) |
| Set up development environment | [Quick Start](./00-index/Quick-Start.md) |
| Deploy to production | [Deployment Guide](./05-deployment/Deployment-Guide.md) |
| Run tests | [Testing Guide](./04-testing/Testing-Guide.md) |
| View legacy docs | [Archive](./99-archive/) |

## 📖 Documentation Principles

✅ **Single Source of Truth**  
✅ **Living Docs for Operations**  
✅ **Immutable Sprint Summaries**  
✅ **Archive for Legacy/Evidence**

## 🔄 Document Lifecycle

1. **Active** - Current, referenced from this index
2. **Complete** - Sprint closed, moved to `/07-sprints`
3. **Archived** - Evidence preserved in `/99-archive`

---

**Last Updated:** January 27, 2026  
**Maintained by:** AI Skincare Intelligence System Team
