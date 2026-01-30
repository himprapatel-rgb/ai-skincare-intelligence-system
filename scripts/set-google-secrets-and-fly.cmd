@echo off
REM Add GOOGLE_CLIENT_SECRET to GitHub Secrets and trigger Fly.io staging.
REM Usage: set GOOGLE_CLIENT_SECRET=your-client-secret
REM        scripts\set-google-secrets-and-fly.cmd

where gh >nul 2>&1
if errorlevel 1 goto no_gh

if "%GOOGLE_CLIENT_SECRET%"=="" goto no_secret

echo Setting GOOGLE_CLIENT_SECRET in GitHub Actions secrets...
gh secret set GOOGLE_CLIENT_SECRET --body "%GOOGLE_CLIENT_SECRET%"

echo Triggering workflow: Set Fly.io Google Secrets (Staging)...
gh workflow run "Set Fly.io Google Secrets (Staging).yml"

echo Done. Check Actions: https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/actions
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
