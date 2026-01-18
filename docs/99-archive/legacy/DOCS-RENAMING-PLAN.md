# Documentation Renaming & Reorganization Plan

**Status**: Ready for Execution  
**Created**: January 14, 2026  
**Target Completion**: January 14-15, 2026

## Overview

This plan standardizes ALL documentation naming to **lowercase-kebab-case** and organizes files into logical category folders with numeric prefixes.

## Naming Convention Rules

1. ✅ **lowercase-kebab-case** for all filenames
2. ✅ **Numeric prefixes** for ordered categories (01-, 02-, 03-)
3. ✅ **Descriptive names** without redundancy
4. ✅ **Version numbers** at end: `-v5.md`, `-v5.1.md`
5. ✅ **Dates** in ISO format: `-2026-01-11.md`

## Target Structure

```
📁 /docs/
├── 00-index/              # Documentation indices
├── 01-requirements/       # Requirements & specifications  
├── 02-architecture/       # Architecture decisions & design
├── 03-development/        # Development plans & guides
├── 04-testing/           # Testing strategies & audits
├── 05-deployment/        # Deployment & operations
├── 06-maintenance/       # Database, ML, integrations
├── sprints/              # Sprint summaries (canonical)
├── archive/              # Historical documentation
├── status/               # Current project status
└── README.md             # Documentation hub
```

---

## Phase 1: Requirements & Specifications → `01-requirements/`

| Current Name | New Location & Name |
|-------------|--------------------|
| `AI-Skincare-Intelligence-System-SRS-V5.3-EXTERNAL-PRETRAINED-ML.md` | `01-requirements/srs-v5.3-external-ml.md` |
| `Product-Backlog-V5.md` | `01-requirements/product-backlog-v5.md` |
| `PRODUCT-BACKLOG-V5.1-DATABASE-STORIES.md` | `01-requirements/product-backlog-v5.1-database.md` |
| `SRS-ADDENDUM-EXTERNAL-PRETRAINED-MODEL.md` | `01-requirements/srs-addendum-external-models.md` |
| `REQUIRED_SECRETS.md` | `01-requirements/required-secrets.md` |

---

## Phase 2: Architecture → `02-architecture/`

| Current Name | New Location & Name |
|-------------|--------------------|
| `ADR-ML-003-External-Model-Storage.md` | `02-architecture/adr-ml-003-external-storage.md` |
| `API-IMPACT-ANALYSIS.md` | `02-architecture/api-impact-analysis.md` |
| `CONFIGURATION-GUIDE-EXTERNAL-ML-MODELS.md` | `02-architecture/config-guide-external-ml.md` |

---

## Phase 3: Development → `03-development/`

| Current Name | New Location & Name |
|-------------|--------------------|
| `MASTER-DEVELOPMENT-PLAN.md` | `03-development/master-plan.md` |
| `FRONTEND-IMPLEMENTATION-PLANNING.md` | `03-development/frontend-planning.md` |
| `FRONTEND-IMPLEMENTATION-REPORT.md` | `03-development/frontend-report-2026-01-11.md` |
| `FRONTEND-SPRINT-PLAN.md` | `03-development/frontend-sprint-plan.md` |
| `IMPLEMENTATION-GUIDE-STORY-16.1-RAILWAY-VOLUME.md` | `03-development/guide-story-16.1-railway.md` |
| `IMPLEMENTATION-GUIDE-STORY-16.2-EXTERNAL-MODEL-INTEGRATION.md` | `03-development/guide-story-16.2-ml-integration.md` |
| `MAIN-PY-INTEGRATION-PATCH-STORY-16.1.md` | `03-development/patch-story-16.1-main-py.md` |
| `DEVELOPMENT-PROGRESS-CHECKPOINT.md` | `03-development/progress-checkpoint-2026-01-07.md` |
| `ACTION-PLAN-TODAY.md` | `03-development/action-plan-current.md` |
| `CURRENT-STATE-UNDERSTANDING.md` | `03-development/current-state.md` |

---

## Phase 4: Testing & Quality → `04-testing/`

| Current Name | New Location & Name |
|-------------|--------------------|
| `AUDIT-REPORT.md` | `04-testing/audit-report-2025-12-22.md` |
| `BASELINE-HEALTHCHECK.md` | `04-testing/baseline-healthcheck.md` |
| `IMPLEMENTATION_AUDIT.md` | `04-testing/implementation-audit-v2.md` |
| `PHASE-2-AUDIT-RECONCILIATION.md` | `04-testing/phase-2-audit.md` |
| `REPO-INVENTORY.md` | `04-testing/repo-inventory.md` |

---

## Phase 5: Deployment & Operations → `05-deployment/`

| Current Name | New Location & Name |
|-------------|--------------------|
| `CI-CD-IMPLEMENTATION-COMPLETE.md` | `05-deployment/cicd-implementation.md` |
| `DEPLOYMENT-STATUS-JAN-11-2025-7PM.md` | `05-deployment/status-2026-01-11.md` |
| `RAILWAY-ENVIRONMENT-VARIABLES-SETUP.md` | `05-deployment/railway-env-setup.md` |
| `QUICK-START.md` | `05-deployment/quick-start.md` |
| `SETUP_GPTGPT.md` | `05-deployment/setup-guide.md` |

---

## Phase 6: Maintenance & Integration → `06-maintenance/`

| Current Name | New Location & Name |
|-------------|--------------------|
| `DATABASE-MIGRATIONS-AUDIT.md` | `06-maintenance/database-migrations.md` |
| `DATASET_LICENSES.md` | `06-maintenance/dataset-licenses.md` |
| `ML-INFERENCE-INTEGRATION.md` | `06-maintenance/ml-inference-integration.md` |
| `ML_TRAINING_DATASET_INTEGRATION.md` | `06-maintenance/ml-training-datasets.md` |
| `PRODUCT-RECOMMENDATIONS-IMPLEMENTATION.md` | `06-maintenance/product-recommendations.md` |

---

## Phase 7: Documentation Index → `00-index/`

| Current Name | New Location & Name |
|-------------|--------------------|
| `Master-Documentation-Log.md` | `00-index/master-log.md` |
| `DOCS-REORGANIZATION-PLAN.md` | `00-index/reorganization-plan-original.md` |
| `PHASE-3-DOCS-PROFESSIONALIZATION-PLAN.md` | `00-index/professionalization-plan.md` |
| `PAGES-CREATED-STATUS.md` | `00-index/pages-status.md` |
| `Product-Tracker.md` | `00-index/product-tracker.md` |

---

## Phase 8: Reports & Completion → Keep dates clear

| Current Name | New Location & Name |
|-------------|--------------------|
| `COMPLETION-REPORT-JAN-11-2025.md` | `sprints/completion-report-2026-01-11.md` |
| `Sprint-1.2-COMPLETION-SUMMARY.md` | `sprints/sprint-1.2-completion.md` |
| `Sprint-1.2-Implementation-Status.md` | `sprints/sprint-1.2-status.md` |
| `Sprint-1.2-Onboarding-Profile-Consent.md` | `sprints/sprint-1.2-onboarding.md` |
| `Sprint-1.2-Test-Execution-Report.md` | `sprints/sprint-1.2-testing.md` |

---

## Phase 9: Sprint Documentation → Normalize naming

| Current Name | New Location & Name |
|-------------|--------------------|
| `SPRINT-0-DATABASE-IMPLEMENTATION-GUIDE.md` | `sprints/sprint-0-database-guide.md` |
| `SPRINT-0-IMPLEMENTATION-STATUS.md` | `sprints/sprint-0-status.md` |
| `SPRINT-1.1-CODE-FILES.md` | `sprints/sprint-1.1-code-files.md` |
| `SPRINT-3-DIGITAL-TWIN-KICKOFF.md` | `sprints/sprint-3-kickoff.md` |
| `SPRINT-3-IMPLEMENTATION-NEXT-STEPS.md` | `sprints/sprint-3-next-steps.md` |
| `SPRINT-3-PROGRESS-STATUS.md` | `sprints/sprint-3-progress.md` |
| `SPRINT-4-AI-ML-IMPLEMENTATION-COMPLETE.md` | `sprints/sprint-4-completion.md` |
| `SPRINT-5-AI-MODEL-DEPLOYMENT-INTEGRATION-COMPLETE.md` | `sprints/sprint-5-deployment-complete.md` |
| `SPRINT-5-COMPLETION-REPORT.md` | `sprints/sprint-5-completion.md` |
| `SPRINT-5-IMPLEMENTATION-STATUS.md` | `sprints/sprint-5-status.md` |
| `SPRINT-5-PLAN.md` | `sprints/sprint-5-plan.md` |
| `SPRINT-6-CI-CD-FIXES-COMPLETE.md` | `sprints/sprint-6-cicd-fixes.md` |
| `SPRINT-6-CURRENT-STATE.md` | `sprints/sprint-6-current-state.md` |
| `SPRINT-6-DEVELOPMENT-EXECUTION-PLAN.md` | `sprints/sprint-6-execution-plan.md` |
| `SPRINT-6-FRONTEND-USER-STORIES.md` | `sprints/sprint-6-frontend-stories.md` |
| `SPRINT-AUDIT-STABILIZATION.md` | `sprints/sprint-audit-stabilization.md` |
| `SPRINT-F2-COMPLETION-REPORT.md` | `sprints/sprint-f2-completion.md` |
| `SPRINT-F2-F3-CI-FIX-REPORT.md` | `sprints/sprint-f2-f3-ci-fixes.md` |
| `SPRINT-F2-FINAL-STATUS-REPORT.md` | `sprints/sprint-f2-final-status.md` |
| `SPRINT-F2-TEST-EXECUTION-REPORT.md` | `sprints/sprint-f2-testing.md` |
| `SPRINT-VERIFICATION-COMPLETION-REPORT.md` | `sprints/sprint-verification-completion.md` |
| `Sprint-Documentation-Index.md` | `sprints/index.md` |

---

## Sprint-Specific Folders (Sprint 2, 4) → Normalize

| Current Name | New Location & Name |
|-------------|--------------------|
| `Sprint-2-Backend-Deployment-Verification.md` | `sprints/sprint-2-backend-verification.md` |
| `Sprint-2-Face-Scan-AI-Analysis.md` | `sprints/sprint-2-face-scan-ai.md` |
| `Sprint-2-Frontend-Implementation-Reference.md` | `sprints/sprint-2-frontend-reference.md` |
| `Sprint-2-Implementation-Guide.md` | `sprints/sprint-2-guide.md` |
| `Sprint-2-Implementation-Status.md` | `sprints/sprint-2-status.md` |
| `Sprint-4-AI_Skincare_Sprint_Docs.md` | `sprints/sprint-4-docs.md` |
| `Sprint-4-Database_Setup_Integration.md` | `sprints/sprint-4-database.md` |
| `Sprint-4-Documentation_Summary.md` | `sprints/sprint-4-summary.md` |
| `Sprint-4-Integration_Checklist.md` | `sprints/sprint-4-checklist.md` |
| `Sprint-4-ML-Data-Integration.md` | `sprints/sprint-4-ml-data.md` |

---

## Execution Strategy

### Option A: GitHub Web UI (Manual but Safe)
1. Create target folders
2. Copy file content to new location with new name
3. Commit with message: `docs(rename): Move X to Y`
4. Delete old file
5. Update all internal links

### Option B: Git Rename (Preserves History - RECOMMENDED)
```bash
git mv docs/OLD-NAME.md docs/NEW-FOLDER/new-name.md
git commit -m "docs(rename): Standardize OLD-NAME to new-name"
```

---

## Link Update Strategy

After renaming, search and update:
1. README.md references
2. Cross-document links
3. Sprint index references
4. Archive folder links

**Search patterns**:
```
./ACTION-PLAN
./MASTER-DEVELOPMENT
./SPRINT-0-
./Product-Backlog
```

---

## Benefits

✅ **Consistent naming** across all 80+ documentation files  
✅ **Logical organization** with category folders  
✅ **Easy navigation** with numeric prefixes  
✅ **Professional appearance** for GitHub/external viewers  
✅ **Maintainability** - clear structure for future additions  

---

## Approval

- [ ] Review naming convention
- [ ] Confirm folder structure
- [ ] Execute Phase 1-9 renaming
- [ ] Update all cross-references
- [ ] Verify no broken links
- [ ] Update main README.md

**Next Step**: Execute with systematic renaming commits
