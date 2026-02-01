# Testing Checklist

**Run after any UI, layout, or feature change.**

---

## Build
- [ ] `cd frontend && npm run build`
- [ ] `cd backend && pytest -q` (requires DATABASE_URL if not SQLite)

---

## Viewports
- [ ] **Mobile 375px:** Home, Auth, Scan, Dashboard, Shelf, Profile
- [ ] **Tablet 768px:** Same pages + layout check
- [ ] **Desktop 1280px:** Full layout, all sections visible

---

## Regression
- [ ] Login flow (email/password)
- [ ] Google OAuth (if configured)
- [ ] Scan → Analysis flow
- [ ] Product add to shelf
- [ ] Navigation (all main links reachable)
- [ ] Mobile nav expand (Features, Learn)
- [ ] Bottom nav (Home, Scan, Dashboard, Shelf, Profile)

---

## E2E (optional, requires credentials)
```bash
cd frontend && npx playwright test
```

---

## Notes
- Use browser DevTools device emulation for viewport tests
- Mobile: one-screen Home (hero + CTA), no long scroll
- Tablet: 2-col layouts where appropriate
- Desktop: full content visible
