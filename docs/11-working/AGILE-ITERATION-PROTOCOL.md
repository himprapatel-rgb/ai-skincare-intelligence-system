## Agile Iteration Protocol (Strict)

Purpose: enforce consistent, auditable development so any engineer can understand
what changed, why it changed, and how it was verified.

### Non‑negotiable rules

1. **Every change must be logged** in `docs/11-working/AI-AGILE-ITERATION-LOG.md`.
2. **No silent changes**: code changes require an entry with goal, scope, and tests.
3. **No destructive DB changes** in production without explicit approval.
4. **Always document new tables/fields** in `docs/02-architecture/Database-Design-Extensible.md`.
5. **Tests are mandatory**: if tests cannot run, record the reason and mitigation.
6. **Traceability is required**: reference the files and endpoints you changed.
7. **No duplicate docs**: update existing docs instead of creating parallel ones.
8. **Mobile‑ready mindset**: all API decisions must be compatible with future iOS/Android clients.
9. **Security first**: do not log secrets or PII; rotate keys if exposure occurs.
10. **Privacy by design**: document data retention, user export, and delete paths.
11. **Observability**: add logs/metrics for new critical paths.
12. **Backward compatibility**: avoid breaking API changes without versioning.
13. **Performance budget**: document any heavy operations and acceptable latency.
14. **Feature flags** for risky changes; default off until verified.
15. **API contract discipline**: request/response schemas must be versioned and validated.
16. **Idempotency**: critical write endpoints must be safe to retry.
17. **Rollback ready**: document a rollback path for schema and release changes.
18. **Data minimization**: collect only necessary PII and explain why.
19. **Error taxonomy**: use consistent error codes/messages across APIs.
20. **Dependency hygiene**: new dependencies require security review and justification.
21. **Deploy and verify on data changes**: any change that touches frontend, backend, or database must be deployed, followed by CLI login to Railway/GitHub and a full log review; do not stop until logs are clean and any errors are resolved.
22. **Docs before done**: work is not complete until the iteration log and relevant backlog/ops docs are updated to reflect the change.
23. **Access awareness**: assume access to GitHub, Railway, database, backend, and frontend services is available; proceed without repeatedly asking for access unless a permission error occurs.

### Required entry format (every iteration)

- **Goal**: one sentence
- **Scope**: bullet list of completed changes
- **Key Changes (Code)**: file list
- **Key Changes (Docs)**: file list
- **Verification / Tests**: exact commands + results
- **Risks / Follow‑ups**: any deferred issues

### Minimum documentation set

- `docs/11-working/AI-AGILE-ITERATION-LOG.md`
- `docs/02-architecture/Database-Design-Extensible.md`
- `docs/00-index/README.md`

### Release readiness checklist

- API contracts validated and versioned if breaking
- DB migrations reviewed (non‑destructive or approved)
- Security review completed (PII, auth, secrets)
- Monitoring/logging added for new flows
- Mobile clients unaffected or versioned
### Code quality rules

- Lint + format checks must pass
- Avoid hidden side effects in request handlers
- Prefer typed schemas over ad‑hoc dictionaries
### Data quality rules

- Store raw and normalized outputs for ML training
- Require schema validation on AI outputs
- Maintain deduplication hashes for media and scans
### Operational rules

- Rate limits for costly endpoints (scan, product scan)
- Job retries with backoff for external APIs
- Alerting on error rate or latency regression

### Enforcement checklist (before merge)

- Log entry added and matches changes
- Tests run or explicitly waived with reason
- DB changes documented
- API behavior consistent for web + mobile
