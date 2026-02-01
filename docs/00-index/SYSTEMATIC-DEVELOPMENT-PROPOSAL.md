# Systematic Development Proposal

**Goal:** Organize ongoing development so that every change updates docs, is tested on mobile/tablet/desktop, and has no side effects—with no duplicate documents and a single place for tasks.

---

## 1. Current Problems

| Problem | Example |
|---------|---------|
| **Scattered tasks** | TASK-LIST-1-500, PER-PAGE-GUI-TASKS-4200, MOBILE-TASKS-LIST, GUI-IMPROVEMENT-TASKS-1000, FUTURE-TASKS |
| **Duplicate docs** | Similar content in 11-working/, 06-operations/, root docs |
| **No workflow** | New dev → no clear update docs → test → check side effects |
| **Unclear "where"** | Hard to find current tasks, status, next steps |

---

## 2. Proposed Folder Structure

```
docs/
├── 00-index/                    # Entry points (keep)
│   ├── README.md
│   ├── Quick-Start.md
│   ├── WHERE-WE-ARE.md          # Single source of truth for status
│   └── SYSTEMATIC-DEVELOPMENT-PROPOSAL.md  # This doc
│
├── 12-tasks/                    # NEW: Single folder for all tasks
│   ├── README.md                # Index of task files
│   ├── ACTIVE-TASKS.md          # Current sprint / in-progress (one file)
│   ├── COMPLETED.md             # Archive of done work (reference only)
│   └── BACKLOG.md               # Future ideas, not yet planned
│
├── 13-workflow/                 # NEW: Process docs
│   ├── DEVELOPMENT-WORKFLOW.md  # Mandatory steps per change
│   └── TESTING-CHECKLIST.md     # Mobile/Tablet/Desktop + regression
│
├── 01-requirements/             # Keep (SRS, traceability)
├── 02-architecture/             # Keep
├── 03-product/                  # Keep (backlog, product plans)
├── 04-testing/                  # Keep (strategy, guides)
├── 05-deployment/               # Keep
├── 06-operations/               # Keep (Operations-Checklist, etc.)
├── 07-sprints/                  # Keep
├── 08-audits/                   # Keep
├── 09-reports/                  # Keep
├── 10-branding/                 # Keep
│
├── 11-working/                  # CONSOLIDATE: working notes only
│   ├── README.md                # What goes here
│   └── [troubleshooting, integration notes - not task lists]
│
└── 99-archive/                  # Move old task lists here
    └── task-lists-legacy/
        ├── PER-PAGE-GUI-TASKS-4200.md
        ├── MOBILE-TASKS-LIST.md
        └── ...
```

---

## 3. Single Source of Truth

| What | Where |
|------|-------|
| **Current status** | `docs/00-index/WHERE-WE-ARE.md` |
| **Active tasks** | `docs/12-tasks/ACTIVE-TASKS.md` |
| **Process** | `docs/13-workflow/DEVELOPMENT-WORKFLOW.md` |
| **Test checklist** | `docs/13-workflow/TESTING-CHECKLIST.md` |
| **Future ideas** | `docs/12-tasks/BACKLOG.md` |

---

## 4. Development Workflow (Per Change)

Every development session follows:

```
1. PICK TASK
   └── From ACTIVE-TASKS.md

2. DEVELOP
   └── Make code changes

3. UPDATE DOCS (mandatory)
   └── WHERE-WE-ARE.md (if status changed)
   └── ACTIVE-TASKS.md (mark done, add new)
   └── Any architecture/API doc you touched

4. TEST (mandatory)
   └── Build: npm run build (frontend), pytest (backend)
   └── Mobile: 375px viewport
   └── Tablet: 768px viewport
   └── Desktop: 1280px viewport
   └── Regression: affected flows (login, scan, shelf, etc.)

5. CHECK SIDE EFFECTS
   └── Did this break any linked feature?
   └── Run relevant E2E tests
   └── Update TESTING-CHECKLIST if new test added

6. COMMIT
   └── Message: "feat/fix: [what] - [docs updated]"
```

---

## 5. Task Format (ACTIVE-TASKS.md)

```markdown
# Active Tasks

Last updated: YYYY-MM-DD

## In progress
- [ ] Task name | Owner | Docs to update

## Next
- [ ] Task name

## Blocked
- [ ] Task (reason)

## Done this week
- [x] Task (completed YYYY-MM-DD)
```

---

## 6. Consolidation Plan

| Action | Details |
|--------|---------|
| **Create** | `docs/12-tasks/`, `docs/13-workflow/` |
| **Create** | `ACTIVE-TASKS.md` (seed from WHERE-WE-ARE + current priorities) |
| **Create** | `DEVELOPMENT-WORKFLOW.md`, `TESTING-CHECKLIST.md` |
| **Move** | Old task lists → `99-archive/task-lists-legacy/` |
| **Update** | `WHERE-WE-ARE.md` to reference 12-tasks |
| **Update** | `docs/00-index/README.md` with new structure |
| **Simplify** | `11-working/` – keep only non-task working notes |

---

## 7. Testing Checklist (Template)

```markdown
# Testing Checklist

Run after any UI or layout change.

## Build
- [ ] `cd frontend && npm run build`
- [ ] `cd backend && pytest -q`

## Viewports
- [ ] Mobile 375px: Home, Auth, Scan, Dashboard, Shelf
- [ ] Tablet 768px: Same + layout check
- [ ] Desktop 1280px: Full layout

## Regression
- [ ] Login flow
- [ ] Scan → Analysis flow
- [ ] Product add to shelf
- [ ] Navigation (all main links)
```

---

## 8. Implementation Order

1. Create `docs/12-tasks/` and `docs/13-workflow/`
2. Add `ACTIVE-TASKS.md`, `DEVELOPMENT-WORKFLOW.md`, `TESTING-CHECKLIST.md`
3. Move legacy task lists to archive
4. Update `WHERE-WE-ARE.md` and `README.md`
5. Use this workflow for the next development session

---

## 9. Summary

| Before | After |
|--------|-------|
| Tasks in 6+ places | One folder: `12-tasks/` |
| No workflow | Mandatory: dev → docs → test → side effects |
| Unclear testing | Checklist: mobile/tablet/desktop + regression |
| Duplicate docs | Single source per topic |

---

**Next step:** Approve this proposal, then implement steps 1–5. After that, all new work follows the workflow and lives in the new structure.
