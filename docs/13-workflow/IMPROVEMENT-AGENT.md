# Improvement Agent

**→ See [docs/agents/improvement-agent/](../agents/improvement-agent/README.md)**

---

<!-- Legacy content below -->

## Agents Overview

| Agent | Role | Schedule |
|-------|------|----------|
| **Testing Agent** | Tests GUI, reports failures | Every 4h |
| **Improvement Agent** | Improves design & architecture, creates work | Daily |
| **API Smoke** | Checks backend health | Daily |

---

## What the Improvement Agent Does

### 1. Auto-fix (runs daily)
- `eslint --fix` on frontend
- Commits fixes to branch, opens PR for review

### 2. Improvement of the Day (runs daily)
- Picks next item from [IMPROVEMENT-BACKLOG.md](../12-tasks/IMPROVEMENT-BACKLOG.md)
- Creates a GitHub Issue: "Improvement: [description]"
- Cursor or human implements; when Issue is closed, next run picks the next item

---

## Flow

```
Daily run → Lint fix → PR (if changes)
         → Pick next backlog item → Create Issue
         → Cursor/human implements
         → Close Issue → Next day: next item
```

---

## Workflows

| File | Trigger |
|------|---------|
| `.github/workflows/improvement-agent-daily.yml` | Cron daily 06:00 UTC + manual |

## Scripts

| Path | Purpose |
|------|---------|
| `scripts/improvement-agent/items.json` | List of improvements (one per day) |
| `scripts/improvement-agent/pick.js` | Picks improvement of the day by date |

---

## Backlog

See [docs/12-tasks/IMPROVEMENT-BACKLOG.md](../12-tasks/IMPROVEMENT-BACKLOG.md) for the full list of design, a11y, performance, and architecture improvements.

---

## Coordination with New Features

- **During new feature work:** Improvement Agent continues; you can pause the workflow if needed.
- **Priority:** New features take precedence; improvement Issues can be deferred.
- **No duplication:** Backlog items are one-off improvements, not recurring tasks.
