# Agile Iteration Guide (Traditional Sprint-Based)

> **Single source of truth** for how we run agile iterations (sprints). All iteration docs point here.

## 1. Iteration = Sprint

We use **time-boxed iterations** (sprints). Each iteration has:

| Phase | Purpose | Where it lives |
|-------|---------|----------------|
| **Product Backlog** | Prioritized list of user stories, features, bugs, improvements | [03-product/Product-Backlog-V5.md](03-product/Product-Backlog-V5.md), [12-tasks/BACKLOG.md](12-tasks/BACKLOG.md), [12-tasks/IMPROVEMENT-BACKLOG.md](12-tasks/IMPROVEMENT-BACKLOG.md) |
| **Sprint Planning** | Choose scope for this iteration; define sprint goal | [12-tasks/ACTIVE-TASKS.md](12-tasks/ACTIVE-TASKS.md) = current sprint backlog; new sprint → [07-sprints/SPRINT-TEMPLATE.md](07-sprints/SPRINT-TEMPLATE.md) |
| **Sprint Backlog** | Committed work for this iteration | [12-tasks/ACTIVE-TASKS.md](12-tasks/ACTIVE-TASKS.md) |
| **Daily Work / Execution** | Implement, test, integrate | Code + [11-working/AI-AGILE-ITERATION-LOG.md](11-working/AI-AGILE-ITERATION-LOG.md) (iteration log entries) |
| **Sprint Review / Demo** | Show done work; accept or carry over | [07-sprints/](07-sprints/) – one summary per sprint; [09-reports/](09-reports/) for completion reports |
| **Sprint Retrospective** | What went well, what to improve, actions | [09-reports/RETROSPECTIVE-TEMPLATE.md](09-reports/RETROSPECTIVE-TEMPLATE.md); can be section in sprint summary |
| **Release / Version** | Ship to production; record version | [Deployment URLs (archived)](99-archive/root-legacy-notes/DEPLOYMENT_URLS.md), [05-deployment/](05-deployment/), [09-reports/](09-reports/) |

## 2. Document Map (Agile Artifacts)

```
docs/
├── AGILE-ITERATION-GUIDE.md     ← You are here (master agile guide)
├── 03-product/                   # Product Backlog
│   ├── Product-Backlog-V5.md     # Main product backlog (user stories, epics)
│   └── Product-Tracker.md        # Status tracker
├── 07-sprints/                   # Sprint summaries (immutable after close)
│   ├── README.md                 # Sprint index
│   ├── SPRINT-TEMPLATE.md        # Template for new sprint
│   └── sprint-<name>/            # One folder or summary per sprint
├── 09-reports/                   # Completion reports, retrospectives
│   ├── RETROSPECTIVE-TEMPLATE.md # Retro template
│   └── *.md                      # Completion / status reports
├── 11-working/                  # Working notes & iteration log
│   └── AI-AGILE-ITERATION-LOG.md # Per-iteration change log (goal, scope, verification)
└── 12-tasks/                     # Sprint backlog & product backlog
    ├── ACTIVE-TASKS.md           # Current sprint backlog (in progress, next, blocked)
    ├── BACKLOG.md                # Future ideas (product backlog)
    ├── IMPROVEMENT-BACKLOG.md    # Design/a11y/performance improvements
    └── COMPLETED.md              # Reference of completed work
```

## 3. Iteration Lifecycle (What to Update When)

### Start of iteration (Sprint start)

1. **Sprint planning:** Choose items from Product Backlog / IMPROVEMENT-BACKLOG; move them into **ACTIVE-TASKS.md** (sprint backlog).
2. **Sprint goal:** Write one sentence goal; add to a new sprint summary in **07-sprints/** using [SPRINT-TEMPLATE.md](07-sprints/SPRINT-TEMPLATE.md).
3. **Backlog refill:** Add new ideas to BACKLOG.md or IMPROVEMENT-BACKLOG.md; keep Product-Backlog-V5.md updated for larger features.

### During iteration

1. **Work:** Implement from ACTIVE-TASKS; move done items to "Done this week" or COMPLETED.md.
2. **Log:** Add an entry to **AI-AGILE-ITERATION-LOG.md** for each significant change (goal, scope, key changes, verification, follow-ups).
3. **Ops:** Update **06-operations/** (Implementation-Status, Current-State, Features-Left-to-Implement) when features are completed or status changes.

### End of iteration (Sprint end)

1. **Sprint review:** Demo done work; anything not done stays in backlog or moves to next sprint backlog.
2. **Sprint summary:** Finalize the sprint summary in **07-sprints/** (deliverables, metrics, production status). Keep it immutable after close.
3. **Retrospective:** Run retro; capture in **09-reports/** using [RETROSPECTIVE-TEMPLATE.md](09-reports/RETROSPECTIVE-TEMPLATE.md) or a section in the sprint summary.
4. **Release:** If releasing, update DEPLOYMENT_URLS, deployment docs, and add a short completion report in **09-reports/** if needed.
5. **Next sprint:** Move remaining/planned items into ACTIVE-TASKS for the next iteration; create new sprint summary from template.

## 4. Definitions (Traditional Agile)

| Term | Our usage |
|------|-----------|
| **Product Backlog** | Prioritized list of all work (features, bugs, tech debt). Sources: Product-Backlog-V5.md, BACKLOG.md, IMPROVEMENT-BACKLOG.md. |
| **Sprint Backlog** | Work committed for the current iteration. Stored in ACTIVE-TASKS.md. |
| **Sprint (iteration)** | Time-boxed period (e.g. 1–2 weeks). One sprint = one summary in 07-sprints/. |
| **Sprint goal** | One clear objective for the iteration. Written in sprint summary and ACTIVE-TASKS. |
| **Done** | Definition of done: implemented, tested, documented where needed, and (if applicable) deployed. |
| **Iteration log** | AI-AGILE-ITERATION-LOG.md – log of what changed per iteration (goal, scope, verification). |
| **Sprint summary** | Immutable record of what the sprint delivered. One per sprint in 07-sprints/. |
| **Retrospective** | Session to reflect on process; output in 09-reports/ or sprint summary. |

## 5. Quick Links

| I want to... | Go to |
|--------------|--------|
| See current sprint work | [12-tasks/ACTIVE-TASKS.md](12-tasks/ACTIVE-TASKS.md) |
| See product backlog | [03-product/Product-Backlog-V5.md](03-product/Product-Backlog-V5.md), [12-tasks/BACKLOG.md](12-tasks/BACKLOG.md), [12-tasks/IMPROVEMENT-BACKLOG.md](12-tasks/IMPROVEMENT-BACKLOG.md) |
| Log an iteration change | [11-working/AI-AGILE-ITERATION-LOG.md](11-working/AI-AGILE-ITERATION-LOG.md) |
| Start a new sprint | [07-sprints/SPRINT-TEMPLATE.md](07-sprints/SPRINT-TEMPLATE.md), then update [12-tasks/ACTIVE-TASKS.md](12-tasks/ACTIVE-TASKS.md) |
| Run a retrospective | [09-reports/RETROSPECTIVE-TEMPLATE.md](09-reports/RETROSPECTIVE-TEMPLATE.md) |
| See past sprints | [07-sprints/README.md](07-sprints/README.md) |
| See implementation status | [06-operations/Implementation-Status-2026-01-26.md](06-operations/Implementation-Status-2026-01-26.md), [06-operations/Current-State.md](06-operations/Current-State.md) |

---

**Last updated:** February 2026  
**Ownership:** Pellicura team – keep this guide and linked docs in sync with how you run iterations.
