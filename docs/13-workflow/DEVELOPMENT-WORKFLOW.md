# Development Workflow

**Mandatory process for every development change.**

---

## Steps (per change)

### 1. Pick task
- From [ACTIVE-TASKS.md](../12-tasks/ACTIVE-TASKS.md)
- Mark as in progress

### 2. Develop
- Make code changes
- Follow existing patterns

### 3. Update docs (mandatory)
- [WHERE-WE-ARE.md](../00-index/WHERE-WE-ARE.md) if status changed
- [ACTIVE-TASKS.md](../12-tasks/ACTIVE-TASKS.md) – mark done, add new
- Any architecture/API doc you touched

### 4. Test (mandatory)
- Run [TESTING-CHECKLIST.md](TESTING-CHECKLIST.md)
- Build, mobile, tablet, desktop, regression

### 5. Check side effects
- Did this break any linked feature?
- Run relevant E2E tests
- Update TESTING-CHECKLIST if you added a new test

### 6. Commit
- Message: `feat/fix: [what] - [docs updated]`
- Include docs in same commit when possible

---

## Quick reference

```
Pick → Develop → Update docs → Test → Side effects → Commit
```
