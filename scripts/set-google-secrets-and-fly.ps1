# Add GOOGLE_CLIENT_SECRET to GitHub Secrets (for frontend builds).
# Backend runs on Railway: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Railway dashboard.
# Requires: gh CLI (https://cli.github.com), logged in (gh auth login).

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI (gh) is required. Install: https://cli.github.com"
    exit 1
}

$secret = $env:GOOGLE_CLIENT_SECRET
if (-not $secret -or $secret.Trim() -eq "") {
    if ([Environment]::UserInteractive -eq $false) {
        Write-Host "GOOGLE_CLIENT_SECRET is not set. In a terminal run:"
        Write-Host '  $env:GOOGLE_CLIENT_SECRET = "your-client-secret-from-google-console"'
        Write-Host "  .\scripts\set-google-secrets.ps1"
        exit 1
    }
    Write-Host "Paste your Google OAuth Client Secret (from Google Cloud Console -> Credentials -> your OAuth 2.0 client):"
    $secret = Read-Host
}

if (-not $secret -or $secret.Trim() -eq "") {
    Write-Error "GOOGLE_CLIENT_SECRET cannot be empty."
    exit 1
}

Write-Host "Setting GOOGLE_CLIENT_SECRET in GitHub Actions secrets..."
$secret | gh secret set GOOGLE_CLIENT_SECRET --repo "$(gh repo view --json nameWithOwner -q .nameWithOwner)"

Write-Host "Done. GitHub secret set."
Write-Host "Backend: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Railway dashboard for the backend service."