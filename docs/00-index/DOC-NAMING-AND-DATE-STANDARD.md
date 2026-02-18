# Documentation Naming And Date Standard

Use these rules for all new documentation and major updates.

---

## File Naming

- Use `Title-Case-With-Hyphens.md` for long-lived docs.
- Use `UPPERCASE-WITH-HYPHENS.md` only for legacy compatibility.
- Avoid vague names like `FIXES.md`, `NOTES.md`, `FINAL.md`.
- Include domain in the file name when relevant, for example:
  - `Login-Troubleshooting.md`
  - `Railway-Environment-Variables-Setup.md`
  - `UI-UX-Design-Audit-2026.md`

---

## Date Format

- Use ISO date format: `YYYY-MM-DD`.
- For date-specific documents, append date in file name:
  - `Session-Report-2026-02-18.md`
  - `Test-Results-2026-02-18.md`
- For living docs, keep stable file names and update a footer:
  - `Last updated: 2026-02-18`

---

## Document Types

- **Living docs:** ongoing references; must have owners and update cadence.
- **Runbooks:** operational how-to guides with exact commands and rollback notes.
- **Reports:** date-stamped snapshots; immutable after publication.
- **Archive docs:** historical evidence; do not use as source of truth.

---

## Required Metadata (Top Or Bottom)

- Document purpose (1-2 lines).
- Owner/team (for living docs and runbooks).
- Last updated date in `YYYY-MM-DD`.
- Links to canonical docs when topic overlaps.

---

## Team Rules

- Update canonical docs first: see [`CANONICAL-DOCS.md`](./CANONICAL-DOCS.md).
- If a new doc overlaps an existing one, merge instead of duplicating.
- Keep root directory clean: prefer `docs/` for all non-README markdown.
- Root-level status notes should be indexed in archive docs.

---

Last updated: 2026-02-18
