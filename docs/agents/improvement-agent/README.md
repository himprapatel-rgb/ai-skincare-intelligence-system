# Improvement Agent

Runs daily to improve design and architecture. No new features – only polish.

---

## Schedule

**Daily 06:00 UTC** + manual trigger.

---

## What it does

### 1. Lint fix
- Runs `eslint --fix` on frontend
- Opens a PR if there are changes

### 2. Improvement of the Day
- Picks one item from [IMPROVEMENT-BACKLOG.md](../../12-tasks/IMPROVEMENT-BACKLOG.md)
- Creates a GitHub Issue: "Improvement: [description]"
- Cursor or human implements it

---

## Flow

```
Daily run → Lint fix → PR (if changes)
         → Pick next backlog item → Create Issue
         → Implement → Close Issue → Next day: next item
```

---

## Workflow

| File | Trigger |
|------|---------|
| `.github/workflows/improvement-agent-daily.yml` | Cron daily 06:00 UTC + manual |

---

## Scripts

| Path | Purpose |
|------|---------|
| `scripts/improvement-agent/items.json` | List of improvements |
| `scripts/improvement-agent/pick.js` | Picks item by date |
