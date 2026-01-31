@echo off
REM Add GOOGLE_CLIENT_SECRET to GitHub Secrets (for frontend builds).
REM Backend: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Railway dashboard.
REM Usage: set GOOGLE_CLIENT_SECRET=your-client-secret
REM        scripts\set-google-secrets.cmd

where gh >nul 2>&1
if errorlevel 1 goto no_gh

if "%GOOGLE_CLIENT_SECRET%"=="" goto no_secret

echo Setting GOOGLE_CLIENT_SECRET in GitHub Actions secrets...
gh secret set GOOGLE_CLIENT_SECRET --body "%GOOGLE_CLIENT_SECRET%"

echo Done. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Railway dashboard for backend.
exit /b 0

:no_gh
echo GitHub CLI (gh) is required. Install: https://cli.github.com
exit /b 1

:no_secret
echo GOOGLE_CLIENT_SECRET is not set.
echo In cmd run:
echo   set GOOGLE_CLIENT_SECRET=your-client-secret-from-google-console
echo   scripts\set-google-secrets-and-fly.cmd
exit /b 1
