# Phase 3 — Documentation Professionalization Plan

> Non-destructive proposal only. No files are to be renamed, moved, or deleted until Phase 4 is explicitly approved.

## 1. Objectives

- Make it fast for any engineer, QA, or auditor to answer: "What is live in production right now?" 
- Reduce cognitive load by grouping docs into a small number of clearly-named zones.
- Preserve all existing work; mark anything ambiguous as "candidate for archive" instead of deleting.
- Keep a tight mapping to Phase 1 and Phase 2 outcomes so the audit trail stays intact.

## 2. Proposed Top-Level Documentation Structure (Target State)

The target structure is organized as numbered zones to make navigation and checklists easier during sprints and audits:

1. `00_OVERVIEW` – high-level entry points
2. `01_PRODUCT` – SRS, user journeys, and backlog-facing docs
3. `02_ARCHITECTURE` – diagrams, service boundaries, data flows
4. `03_BACKEND` – API contracts, routers, data models, migrations
5. `04_FRONTEND` – UI flows, page/component maps
6. `05_ML_AND_DATA` – model training, datasets, evaluation
7. `06_QUALITY` – testing strategy, test reports, UAT notes
8. `07_DELIVERY` – CI/CD, environments, release notes
9. `08_AUDIT_AND_RISK` – audit reports, reconciliations, traceability
10. `09_OPERATIONS` – runbooks, incident logs, production support
11. `_archive` – legacy/low-signal docs kept for reference

This is a **logical** structure only. Implementation (moves/renames) is deferred to Phase 4.

## 3. Current → Proposed Mapping (High-Level)

| Current path / file | Proposed zone | Proposed path (logical) | Rationale | Risk if changed now | Risk if postponed |
| --- | --- | --- | --- | --- | --- |
| `docs/REPO-INVENTORY.md` | 00_OVERVIEW | `00_OVERVIEW/REPO-INVENTORY.md` | Acts as a map of the repo; belongs in the entry zone for newcomers. | Low – pure docs, no runtime impact. | Medium – new contributors may remain disoriented. |
| `docs/CURRENT-STATE-UNDERSTANDING.md` | 00_OVERVIEW | `00_OVERVIEW/CURRENT-STATE-UNDERSTANDING.md` | Captures Phase 1 mental model; should be a top-level orientation doc. | Low – doc-only. | Medium – Phase 1 insights become harder to discover over time. |
| `docs/PHASE-2-AUDIT-RECONCILIATION.md` | 08_AUDIT_AND_RISK | `08_AUDIT_AND_RISK/PHASE-2-AUDIT-RECONCILIATION.md` | Core audit artifact; central to alignment and future audits. | Low – referenced mainly by humans. | High – audit signal gets lost among many sprint docs. |
| `docs/AUDIT-REPORT.md` | 08_AUDIT_AND_RISK | `08_AUDIT_AND_RISK/AUDIT-REPORT.md` | Earlier audit; should live next to Phase 2 reconciliation to show evolution. | Low. | Medium – historical context for decisions is harder to trace. |
| `docs/API-TESTING-REPORT.md` | 06_QUALITY | `06_QUALITY/API-TESTING-REPORT.md` | Concrete evidence for API-level verification. | Low. | Medium – finding test evidence during regressions is slower. |
| `docs/API-TESTING-COMPLETE_REPORT.md` | 06_QUALITY | `06_QUALITY/API-TESTING-COMPLETE_REPORT.md` | Expanded API testing summary; pairs with the other API testing doc. | Low. | Medium – duplicates/variants stay confusing. |
| `docs/CI-CD-IMPLEMENTATION-COMPLETE_REPORT.md` | 07_DELIVERY | `07_DELIVERY/CI-CD-IMPLEMENTATION-COMPLETE_REPORT.md` | Describes CI/CD work; fits delivery pipeline zone. | Low. | Medium – future CI/CD changes may not see previous decisions. |
| `docs/CI-CD-SETUP-GUIDE.md` | 07_DELIVERY | `07_DELIVERY/CI-CD-SETUP-GUIDE.md` | Operational guide for pipeline; naturally grouped with CI/CD reports. | Low. | Medium – onboarding DevOps becomes slower. |
| `docs/BACKEND_IMPROVEMENTS.md` | 03_BACKEND | `03_BACKEND/BACKEND_IMPROVEMENTS.md` | Backend-focused changes and ideas; belongs with API/backend docs. | Low. | Medium – backend roadmap scattered across docs. |
| `docs/BACKEND_TESTING_SUMMARY.md` | 06_QUALITY | `06_QUALITY/BACKEND_TESTING_SUMMARY.md` | Summarizes backend testing; should sit with test reports. | Low. | Medium – quality story for backend remains fragmented. |
| `docs/AI-MODEL-TRAINING-INTEGRATION-PLAN.md` | 05_ML_AND_DATA | `05_ML_AND_DATA/AI-MODEL-TRAINING-INTEGRATION-PLAN.md` | Describes ML model training integration; natural fit for ML zone. | Low. | Medium – ML work risks drifting from product/engineering narrative. |
| `docs/AI-Skincare-Intelligence-System-SRS.md` | 01_PRODUCT | `01_PRODUCT/AI-Skincare-Intelligence-System-SRS.md` | Core SRS; should anchor the product zone. | Low. | High – SRS not clearly the "north star" document. |
| `docs/AI_AGILE_WORKFLOW.md` | 01_PRODUCT | `01_PRODUCT/AI_AGILE_WORKFLOW.md` | Documents the Agile workflow; part of how the product is delivered. | Low. | Medium – process guidance stays buried. |
| `docs/ACTION-PLAN-TODAY.md` | 01_PRODUCT or 08_AUDIT_AND_RISK | `01_PRODUCT/ACTION-PLAN-TODAY.md` (or mark as candidate for archive later) | Time-bound plan; currently useful for understanding intent; may later move to `_archive`. | Low. | Low – content is already historical, but still some context value. |

*(This table is intentionally incomplete; future iterations can expand row-by-row, using the same structure.)*

## 4. Folder-Level Proposals (Logical Only)

### 4.1 Create Logical Zones

Proposed logical folders under `docs/` (to be physically created only after Phase 4 approval):

- `00_OVERVIEW/`
- `01_PRODUCT/`
- `02_ARCHITECTURE/`
- `03_BACKEND/`
- `04_FRONTEND/`
- `05_ML_AND_DATA/`
- `06_QUALITY/`
- `07_DELIVERY/`
- `08_AUDIT_AND_RISK/`
- `09_OPERATIONS/`
- `_archive/`

Rules for moves (later):

1. **No deletions** – only moves/renames, with Git history preserved.
2. **Stable URLs for external links** – if any doc is linked from external systems (Notion/Jira), add small "Moved to" stubs rather than breaking links.
3. **Change scripts last** – if automation (e.g. CI steps) references doc paths, update those only after all human-facing moves are finalized.

### 4.2 Candidate Files for `_archive/`

These are **not** to be deleted; only marked as candidates for eventual archive once the team confirms they are historical-only:

- Older sprint-specific action plans once superseded by later ones.
- Partial or superseded reports where a newer, clearly canonical version exists (e.g. early CI/CD notes replaced by COMPLETE reports).
- Scratchpads or exploratory notes that are useful for context but noisy in the main navigation.

A separate `_archive/README.md` should clarify that content is historical, read-only, and not a source of truth.

## 5. Authoring & Maintenance Conventions (Proposed)

### 5.1 File Naming

- Use `SNAKE_CASE_WITH_DASHES.md` or `Title-Case-With-Dashes.md` consistently; avoid mixed styles.
- Prefix phase-specific artifacts with `PHASE-x-` to keep the audit trail explicit.
- For recurring reports, include date or sprint in the name, e.g. `API-TESTING-REPORT-Sprint-14.md`.

### 5.2 Front-Matter Headers

For key docs (SRS, audit reports, major runbooks), add a short header block at the top:

- `Owner:` (role or person)
- `Last-validated-against-production:` (date)
- `Related-SRS-IDs:` (if applicable)
- `Related-Sprint(s):`

This keeps the SRS → Story → Sprint → Commit → Deployment chain visible without heavy tooling.

### 5.3 Review & Validation

- Treat any change to `00_OVERVIEW`, `01_PRODUCT`, and `08_AUDIT_AND_RISK` as **change-controlled** – require at least one reviewer.
- For each deployment to production, ensure at least one of the following is updated **or explicitly confirmed as still accurate**:
  - SRS sections touched.
  - Relevant API docs.
  - Any associated test reports or runbooks.

## 6. Rollout Plan (Suggested Phases)

1. **Dry-run mapping** (this document) – no file operations, just mapping and agreement.
2. **Pilot move** – pick 2–3 low-risk docs (e.g. `REPO-INVENTORY.md`, `CURRENT-STATE-UNDERSTANDING.md`) and move them into the proposed structure on a branch.
3. **Validation** – ensure links are intact, CI/docs builds (if any) still pass, and the team can find content more quickly.
4. **Full re-organization** – move rdocs(phase3): Add PHASE-3-DOCS-PROFES- Phase 3 documentation professionalization plan
- Logical target structure for docs/ (no destructive changes)
- High-level mapping table + rollout approachSIONALIZATION-PLAN.mdemaining docs in small batches, each batch reviewed.
5. **Archive pass** – once confident, move confirmed legacy content into `_archive/`.

## 7. Open Questions for the Team

- Are there external tools (Notion, Jira, Confluence) that deep-link into any of these markdown files?
- Should audit and compliance artifacts live in this repo long-term, or be mirrored elsewhere for governance?
- Do we want a lightweight docs index page (e.g. `00_OVERVIEW/README.md`) acting as the single entry point for humans?

---

This Phase 3 plan is intentionally conservative: it **proposes** a structure and migration path, but does not change any files yet. Final decisions and actual moves should be made in Phase 4 with explicit approval.
