# Scripts

## Google OAuth (one-time setup)

**Set Google Client Secret in GitHub and push to Fly.io staging**

1. Get your **Client Secret** from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth 2.0 Web client.
2. From the repo root, run:

   **PowerShell:**
   ```powershell
   .\scripts\set-google-secrets-and-fly.ps1
   ```
   Paste the Client Secret when prompted. Or set env first: `$env:GOOGLE_CLIENT_SECRET = "your-client-secret-here"` then run the script.

   **CMD (Command Prompt):**
   ```cmd
   set GOOGLE_CLIENT_SECRET=your-client-secret-here
   scripts\set-google-secrets-and-fly.cmd
   ```

3. The script adds `GOOGLE_CLIENT_SECRET` to GitHub Actions secrets and triggers **Set Fly.io Google Secrets (Staging)**. When that workflow succeeds, Google sign-in on staging works.

**Requires:** [GitHub CLI (gh)](https://cli.github.com) installed and logged in (`gh auth login`).
