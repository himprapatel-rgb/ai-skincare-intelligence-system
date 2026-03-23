# Active Tasks

**Last updated:** 2026-03-23

---

## In progress

- [ ] Add Railway secrets for daily summary generation: `SUMMARY_ENDPOINT` (+ `SUMMARY_TOKEN` if required)
- [ ] Expand catalog seed beyond initial import batch (currently 9 products)

---

## Next

- [ ] Triage open PRs: `#2` docs reorganization
- [ ] PDF export enhancements (if needed)
- [ ] Service worker for offline (PWA)
- [ ] Broader E2E coverage for mobile flows

---

## Done this week

- [x] **GitHub Pages:** `build_type: workflow` via API; **Deploy Frontend** run `23394684493` success; site **200** at `himprapatel-rgb.github.io/ai-skincare-intelligence-system/`
- [x] **`daily-ai-agile-summary.yml`:** `SUMMARY_ENDPOINT` / `SUMMARY_TOKEN` from secrets; no `GPTGPT_API_BASE` URL fallback; errors post to issue instead of failing the job
- [x] **Backend CI/CD** green on `main` (isort across `backend/`; lint + test matrix)
- [x] **CI - Tests** green on `main` (Postgres in Actions: `ALLOW_TEST_DB` + catalog FTS `match()` fix)
- [x] Production DB check: `scripts/verify_two_databases.py` vs Railway backend (main + product + catalog healthy)
- [x] Catalog seed + verify: created catalog tables on Railway Postgres; imported first 9 OBF products (skincare category filter)
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
