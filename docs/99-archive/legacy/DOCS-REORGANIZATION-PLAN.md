# Documentation Reorganization Plan

## 🎯 Objective

Reorganize 80+ documentation files into a professional, navigable structure following industry best practices (Diátaxis framework).

## 📊 Current Problems

- **84 files** with severe documentation bloat
- **Multiple overlapping reports** (API-TESTING-REPORT.md vs API_TESTING_COMPLETE_REPORT.md)
- **Inconsistent naming** (hyphens vs underscores, -COMPLETE/-FINAL suffixes)
- **No clear folder structure** - everything scattered in root
- **Sprint docs duplicated** across multiple locations
- **Naming conflicts** after kebab-case conversion

## ✅ Approved Solution: Hybrid Documentation Structure

Based on comprehensive AI audit (Gemini + ChatGPT, Combined Rating: 7/10 → Enhanced to production-ready):

```
/docs
  /00-index/           # Entry point & documentation map
  /architecture/       # SRS, DB schemas
  /product/           # Backlog, tracker, roadmap
  /sprints/           # Immutable sprint snapshots (sprint-0 to sprint-6)
  /api/               # API documentation
  /testing/           # Test reports
  /status/            # Current state, living docs
  /workflows/         # CI/CD, agile workflow
  README.md           # Root index to /docs/00-index/README.md
```

## 🔧 Implementation Steps

### Step 1: Clone and Prepare

```bash
git clone https://github.com/himprapatel-rgb/ai-skincare-intelligence-system.git
cd ai-skincare-intelligence-system
git checkout -b docs-reorganization-v1
```

### Step 2: Execute Reorganization Script

Save this script as `reorganize-docs.sh` and run it:

```bash
#!/bin/bash
set -e

echo "🚀 Starting Documentation Reorganization..."

# Create new folder structure
mkdir -p docs/00-index
mkdir -p docs/architecture
mkdir -p docs/product
mkdir -p docs/sprints
mkdir -p docs/api
mkdir -p docs/testing
mkdir -p docs/status
mkdir -p docs/workflows

# Move files to new structure

## 00-index (Entry Point)
git mv docs/.github/workflows/DOCUMENTATION-STRUCTURE.md docs/00-index/README.md

## Architecture
git mv docs/AI-Skincare-Intelligence-System-SRS-V5-2.md docs/architecture/srs-v5-2.md
git mv docs/SRS-V5-1-DATABASE-UPDATE.md docs/architecture/database-update-v5-1.md
git mv docs/DATABASE-TRANSITION-STRATEGY.md docs/architecture/database-transition-strategy.md

## Product
git mv docs/PRODUCT-BACKLOG.md docs/product/backlog.md
git mv docs/PROGRESS-TRACKER.md docs/product/progress-tracker.md

## Sprints (keep only final reports)
git mv docs/sprint1/SPRINT-1-REVIEW.md docs/sprints/sprint-1-review.md
git mv docs/sprint1/SPRINT-1-IMPLEMENTATION-COMPLETE.md docs/sprints/sprint-1-implementation.md
git mv docs/SPRINT-2-PHASE-3-COMPLETE.md docs/sprints/sprint-2-phase-3-complete.md

## API Documentation
git mv docs/API_TESTING_COMPLETE_REPORT.md docs/api/testing-complete-report.md
git mv docs/ADR-ML-003-External-Model-Storage-Service.md docs/api/adr-ml-003-external-storage.md

## Testing
git mv docs/BACKEND_TESTING_SUMMARY.md docs/testing/backend-summary.md
git mv docs/TESTING-PHASE-AGILE-INTEGRATION.md docs/testing/phase-agile-integration.md

## Status (Living Docs)
git mv docs/BASELINE-HEALTHCHECK.md docs/status/baseline-healthcheck.md
git mv docs/CURRENT-STATE.md docs/status/current-state.md
git mv docs/ACTION-PLAN-TODAY.md docs/status/action-plan-today.md

## Workflows
git mv docs/AI_AGILE_WORKFLOW.md docs/workflows/agile-workflow.md
git mv docs/CI-CD-DASHBOARD-APPROACH.md docs/workflows/ci-cd-dashboard.md

# Remove duplicates (keep only the best version)
rm docs/API-TESTING-REPORT.md  # Duplicate of API_TESTING_COMPLETE_REPORT.md
rm docs/AGILE-SPRINT-1.2-IMPLEMENTATION.md  # Duplicate of sprint1/SPRINT-1-IMPLEMENTATION-COMPLETE.md
rm docs/BACKEND_IMPROVEMENTS.md  # Merged into BACKEND_TESTING_SUMMARY.md
rm docs/AUDIT-REPORT.md  # One-time audit, not needed

echo "✅ Reorganization Complete!"
echo "📝 Next: Review changes, commit, and push PR"
```

### Step 3: Create Index Files

Create `docs/00-index/README.md` with navigation map (GitHub will do this via PR).

### Step 4: Update Root README

Update project root `README.md` to reference new structure:

```markdown
## 📚 Documentation

All documentation is organized in [`/docs`](./docs/00-index/README.md):

- **[Architecture](./docs/architecture/)** - SRS, database schemas
- **[Product](./docs/product/)** - Backlog, roadmap
- **[Sprints](./docs/sprints/)** - Sprint reviews (sprint-0 to sprint-6)
- **[API](./docs/api/)** - API testing, ADRs
- **[Status](./docs/status/)** - Current state, healthchecks
- **[Workflows](./docs/workflows/)** - CI/CD, Agile process
```

### Step 5: Commit and PR

```bash
git add .
git commit -m "docs: Major reorganization - Eliminate 80+ file bloat

- Created hybrid structure: /00-index, /architecture, /product, /sprints, /api, /testing, /status, /workflows
- Converted all filenames to kebab-case
- Removed duplicate reports (API-TESTING-REPORT.md, etc.)
- Resolved naming conflicts
- Improved navigation and discoverability

Closes #1"

git push origin docs-reorganization-v1
```

### Step 6: Create PR and Merge

- Create Pull Request on GitHub
- Review changes (should show ~80 file moves, ~5 deletions)
- Merge to main
- Verify documentation links in Railway/production

## 🔒 Naming Rules (Applied)

1. **Kebab-case only**: `my-file-name.md`
2. **No suffixes**: Remove `-COMPLETE`, `-FINAL`, `-LATEST`
3. **Version explicitly**: `srs-v5-2.md` not `SRS-Final.md`
4. **Descriptive prefixes**: `sprint-N-` for sprint docs
5. **Folder context**: Let folders provide context, keep filenames short

## 📦 Duplicate Resolutions (Applied)

### Set 1: API Testing
- ✅ **Keep**: `API_TESTING_COMPLETE_REPORT.md` → `api/testing-complete-report.md`
- ❌ **Delete**: `API-TESTING-REPORT.md` (incomplete version)

### Set 2: Sprint 1 Implementation
- ✅ **Keep**: `sprint1/SPRINT-1-IMPLEMENTATION-COMPLETE.md` → `sprints/sprint-1-implementation.md`
- ❌ **Delete**: `AGILE-SPRINT-1.2-IMPLEMENTATION.md` (duplicate)

### Set 3: Backend Testing
- ✅ **Keep**: `BACKEND_TESTING_SUMMARY.md` → `testing/backend-summary.md`
- ❌ **Merge & Delete**: `BACKEND_IMPROVEMENTS.md` (same content)

### Set 4: SRS Versions
- ✅ **Keep**: `AI-Skincare-Intelligence-System-SRS-V5-2.md` → `architecture/srs-v5-2.md` (latest)
- ✅ **Keep**: `SRS-V5-1-DATABASE-UPDATE.md` → `architecture/database-update-v5-1.md` (specific update)

### Set 5: Current State
- ✅ **Keep**: `CURRENT-STATE.md` → `status/current-state.md` (comprehensive)
- ✅ **Keep**: `CURRENT-STATE-UNDERSTANDING.md` → `status/current-state-understanding.md` (analysis)
- ✅ **Keep**: `ACTION-PLAN-TODAY.md` → `status/action-plan-today.md` (daily tracker)

## 🎉 Benefits

✅ Zero documentation bloat
✅ Clear navigation & hierarchy  
✅ Consistent kebab-case naming
✅ Permalink stability
✅ Industry best practices (Diátaxis framework)

## 🔗 References

- **Issue**: #1
- **AI Audit Sources**:
  - Gemini AI: Reorganization script & naming system
  - ChatGPT: Duplicate analysis & best practices validation
  - Combined Rating: 7/10 → Enhanced to production-ready

---

**Status**: ✅ READY FOR IMPLEMENTATION  
**Priority**: HIGH  
**Estimated Effort**: 2-3 hours  
**Branch**: `docs-reorganization-v1`
