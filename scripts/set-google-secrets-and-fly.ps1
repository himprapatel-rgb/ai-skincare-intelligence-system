# Add GOOGLE_CLIENT_SECRET to GitHub Secrets and trigger Fly.io staging to receive both Google secrets.
# Requires: gh CLI (https://cli.github.com), logged in (gh auth login).
# GOOGLE_CLIENT_ID is already in GitHub Secrets; this script adds GOOGLE_CLIENT_SECRET and runs the Fly workflow.

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI (gh) is required. Install: https://cli.github.com"
    exit 1
}

$secret = $env:GOOGLE_CLIENT_SECRET
if (-not $secret -or $secret.Trim() -eq "") {
    Write-Host "Paste your Google OAuth Client Secret (from Google Cloud Console -> Credentials -> your OAuth 2.0 client):"
    $secret = Read-Host
}

if (-not $secret -or $secret.Trim() -eq "") {
    Write-Error "GOOGLE_CLIENT_SECRET cannot be empty."
    exit 1
}

Write-Host "Setting GOOGLE_CLIENT_SECRET in GitHub Actions secrets..."
$secret | gh secret set GOOGLE_CLIENT_SECRET --repo "$(gh repo view --json nameWithOwner -q .nameWithOwner)"

Write-Host "Triggering workflow: Set Fly.io Google Secrets (Staging)..."
gh workflow run "Set Fly.io Google Secrets (Staging).yml" --repo "$(gh repo view --json nameWithOwner -q .nameWithOwner)"

Write-Host "Done. Check Actions tab for workflow status; when it succeeds, Google sign-in on staging will work."
Write-Host "  https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
