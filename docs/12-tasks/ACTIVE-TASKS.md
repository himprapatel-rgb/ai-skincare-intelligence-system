# Active Tasks

**Last updated:** 2026-03-22

---

## In progress

- [ ] **GitHub Pages:** enable **Source: GitHub Actions** in repo Settings → Pages (fixes deploy 404)
- [ ] Seed product catalog (optional) | See [WHERE-WE-ARE](../00-index/WHERE-WE-ARE.md) §6
- [ ] Verify both DBs after deploy | Run `verify_two_databases.py`

---

## Next

- [ ] Triage open PRs: `#2` docs reorganization, `#3` draft connection status
- [ ] PDF export enhancements (if needed)
- [ ] Service worker for offline (PWA)
- [ ] Broader E2E coverage for mobile flows

---

## Blocked

- **GitHub Pages deploy** — blocked until Pages source is set to **GitHub Actions** (not a code-only fix)

---

## Done this week

- [x] **CI - Tests** green on `main` (Postgres in Actions: `ALLOW_TEST_DB` + catalog FTS `match()` fix)
- [x] DB verification: Both DBs ok; catalog 0 products (seed with import_obf_catalog)
- [x] Dashboard: Empty-state CTAs for 0 Products / 0 Routines
- [x] Product Scanner: Lighter frame, centered Start Camera, simplified placeholder text
- [x] Analysis Results: Hide failed scans in comparison table
- [x] My Shelf audit fixes: icon, badges, search width, category capitalize, card height (2026-02-01)
- [x] Product Scanner→Product Detail data mismatch resolved (barcode link + multi-source fetch) (2026-02-01)
- [x] Product Scanner: BackToTop z-index overlap fix; Recently Scanned text wrap (2026-02-01)
- [x] Product Scanner Audit 2026 documented
- [x] E2E Agent – 24/7 GUI testing (no paid API calls) (2026-01-26)
- [x] Systematic development structure (2026-01-26)
- [x] Mobile/Tablet/Desktop app viewport modes (2026-01-26)
- [x] Admin Users mobile card layout (2026-01-26)
- [x] Mobile nav expansion + BottomNav + PWA manifest (2026-01-26)
