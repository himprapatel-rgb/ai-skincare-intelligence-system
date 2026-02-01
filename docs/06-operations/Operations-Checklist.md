# Operations Checklist

**Last Updated:** January 2026

## Pre-Deploy

- [ ] All tests pass (`npm run test` frontend, `pytest` backend)
- [ ] Build succeeds (`npm run build` frontend)
- [ ] Environment variables set in Railway (see Required-Secrets.md)
- [ ] No secrets in code or logs

## Post-Deploy

- [ ] Frontend loads at pellicura.com
- [ ] Backend health: `GET /api/v1/health`
- [ ] Login works (email + Google)
- [ ] Skin scan flow works
- [ ] Product scanner works
- [ ] Database writes succeed (shelf, scans)

## Monitoring

- [ ] Check Railway logs for errors
- [ ] Verify no 5xx from backend
- [ ] Check Cloudflare analytics (if configured)

## Rollback

1. Revert last commit: `git revert HEAD && git push`
2. Or deploy previous Railway revision from dashboard

## Health Check URLs

- Backend: `https://ai-skincare-intelligence-system-production.up.railway.app/api/v1/health`
- Frontend: `https://pellicura.com`
