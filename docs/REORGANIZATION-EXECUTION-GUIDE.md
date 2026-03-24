# Documentation Reorganization - Execution Guide

**Status**: Ready for Local Execution  
**Branch**: `docs-reorganization-v1`  
**Issue**: #1 - Major Documentation Reorganization  
**Date Created**: January 7, 2026  

## Overview

This guide provides step-by-step instructions to complete the documentation reorganization from 80+ scattered files into a professional, navigable structure.

### ✅ Completed Tasks
- [x] Created branch: `docs-reorganization-v1`
- [x] Folder structure created (00-index, architecture, product, sprints, api, testing, status, workflows)
- [x] Documentation index created: `docs/00-index/README.md`
- [x] Reorganization script prepared: `reorganize-docs.sh`

### 📋 Remaining Tasks

**Total Files to Move**: ~20 critical documentation files  
**Total Files to Delete**: ~4 duplicate files  
**Execution Time**: 30-60 minutes (local execution)

## Method 1: Automated Local Execution (RECOMMENDED)

### Step 1: Clone and Prepare
```bash
git clone https://github.com/himprapatel-rgb/ai-skincare-intelligence-system.git
cd ai-skincare-intelligence-system
git checkout docs-reorganization-v1
```

### Step 2: Execute Reorganization Script
```bash
chmod +x reorganize-docs.sh
./reorganize-docs.sh
```

### Step 3: Review and Commit
```bash
git status
git add .
git commit -m "docs: Major reorganization - Eliminate 80+ file bloat

- Created hybrid structure: /00-index, /architecture, /product, /sprints, /api, /testing, /status, /workflows
- Converted all filenames to kebab-case
- Removed duplicate reports
- Resolved naming conflicts

Closes #1"
git push origin docs-reorganization-v1
```

### Step 4: Create Pull Request
1. Go to https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/pulls
2. Click "New pull request"
3. Compare: `main` ← `docs-reorganization-v1`
4. Add PR description
5. Create PR

## Method 2: Manual Web UI (For Each File)

If local execution is not available, follow this pattern for each file:

### For Each Architecture File (SRS, DB Schemas):
1. Open file in GitHub
2. Copy content
3. Delete original file
4. Create new file in `docs/architecture/`
5. Paste content with new kebab-case filename

### File Migration Mapping

**Architecture Folder** (docs/architecture/):
- AI-Skincare-Intelligence-System-SRS-V5-3-EXTERNAL-PR.md → srs-v5-3.md
- SRS-V5-1-DATABASE-UPDATE.md → database-update-v5-1.md
- DATABASE-TRANSITION-STRATEGY.md → database-transition-strategy.md

**Product Folder** (docs/product/):
- PRODUCT-BACKLOG.md → backlog.md
- PROGRESS-TRACKER.md → progress-tracker.md
- Product-Backlog-V5.md → backlog-v5.md

**Sprints Folder** (docs/sprints/):
- SPRINT-0-DATABASE-IMPLEMENTATION-GUIDE.md → sprint-0-database.md
- SPRINT-0-IMPLEMENTATION-STATUS.md → sprint-0-status.md
- SPRINT-1-1-CODE-FILES.md → sprint-1-1-code-files.md
- SPRINT-3-DIGITAL-TWIN-KICKOFF.md → sprint-3-digital-twin.md
- SPRINT-3-IMPLEMENTATION-NEXT-STEPS.md → sprint-3-next-steps.md
- SPRINT-3-PROGRESS-STATUS.md → sprint-3-progress.md
- SPRINT-4-AI-ML-IMPLEMENTATION-COMPLETE.md → sprint-4-ai-ml.md
- SPRINT-5-AI-MODEL-DEPLOYMENT-INTEGRATION-COM... → sprint-5-deployment.md
- SPRINT-5-COMPLETION-REPORT.md → sprint-5-completion.md

**API Folder** (docs/api/):
- API_TESTING_COMPLETE_REPORT.md → testing-complete-report.md
- ADR-ML-003-External-Model-Storage-Service.md → adr-ml-003-external-storage.md

**Testing Folder** (docs/testing/):
- BACKEND_TESTING_SUMMARY.md → backend-summary.md
- TESTING-PHASE-AGILE-INTEGRATION.md → phase-agile-integration.md

**Status Folder** (docs/status/):
- BASELINE-HEALTHCHECK.md → baseline-healthcheck.md
- CURRENT-STATE.md → current-state.md
- ACTION-PLAN-TODAY.md → action-plan-today.md

**Workflows Folder** (docs/workflows/):
- AI_AGILE_WORKFLOW.md → agile-workflow.md
- CI-CD-DASHBOARD-APPROACH.md → ci-cd-dashboard.md

### Files to Delete (Duplicates):
- docs/API-TESTING-REPORT.md
- docs/AGILE-SPRINT-1.2-IMPLEMENTATION.md
- docs/BACKEND_IMPROVEMENTS.md
- docs/AUDIT-REPORT.md

## Verification Checklist

- [ ] All files moved to correct folders
- [ ] All filenames in kebab-case
- [ ] Duplicate files removed
- [ ] No breaking references in docs
- [ ] 00-index/README.md updated with all links
- [ ] Root README updated to point to new docs structure
- [ ] PR created and reviewed
- [ ] All tests passing

## Post-Merge Tasks

1. **Update Root README**
   - Change docs references to point to new locations
   - Update links in README.md

2. **Update Internal Links**
   - Search for old doc references
   - Update to new kebab-case paths

3. **Close Issue #1**
   - Add comment with completion details
   - Close the issue

## Resources

- **Reorganization Script**: `reorganize-docs.sh` (contains all git mv commands)
- **Documentation Plan**: `docs/DOCS-REORGANIZATION-PLAN.md`
- **Index**: `docs/00-index/README.md`
- **Issue**: https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/issues/1

## Benefits Achieved

✅ Zero documentation bloat  
✅ Clear navigation & hierarchy  
✅ Consistent kebab-case naming  
✅ Permalink stability  
✅ Industry best practices (Diátaxis framework)  

---

**Last Updated**: January 7, 2026  
**Author**: Documentation Reorganization Task  
**Status**: Ready for Execution
