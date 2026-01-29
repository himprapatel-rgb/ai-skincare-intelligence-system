# AI Prompt: Complete Fly.io Setup for Pellicura Backend

**Copy everything below this line and paste into any AI assistant:**

---

## 🚀 MASTER PROMPT: Fly.io Backend Deployment Setup

You are an expert DevOps engineer helping me deploy a Python FastAPI backend to Fly.io. Please guide me through EVERY step with detailed instructions, commands, and explanations.

### MY PROJECT DETAILS:

```
Project Name: Pellicura (AI Skincare Intelligence System)
Backend: Python 3.11 + FastAPI + SQLAlchemy
Database: PostgreSQL (will use Neon PostgreSQL separately)
Current Hosting: Railway (migrating away)
Target Domain: api.pellicura.com
Operating System: Windows 10/11
Shell: PowerShell
```

### MY BACKEND STRUCTURE:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings and environment variables
│   ├── database.py          # SQLAlchemy database connection
│   ├── api/v1/              # API endpoints
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   └── routers/             # API routers
├── requirements.txt         # Python dependencies
├── Dockerfile               # Docker configuration
└── .env.example             # Environment variables template
```

### ENVIRONMENT VARIABLES NEEDED:

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=your-secret-key
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
OPENAI_API_KEY=xxx
FRONTEND_URL=https://pellicura.com
ALLOWED_ORIGINS=https://pellicura.com,https://www.pellicura.com
```

### WHAT I NEED YOU TO DO:

Please provide a COMPLETE, STEP-BY-STEP guide covering:

---

## PART 1: INSTALLATION & AUTHENTICATION

1. **Install Fly CLI on Windows**
   - Provide the exact PowerShell command (run as Administrator)
   - How to verify installation was successful
   - Troubleshooting if installation fails

2. **Authenticate with Fly.io**
   - Command to login
   - What to expect during authentication
   - How to verify I'm logged in

3. **Create Organization (if needed)**
   - Command to list organizations
   - Command to create new organization
   - Best practices for organization naming

---

## PART 2: APP CREATION & CONFIGURATION

4. **Initialize Fly App**
   - Command to create new app
   - Choosing the right region (closest to users - Europe/US)
   - App naming conventions

5. **Create fly.toml Configuration**
   - Provide COMPLETE fly.toml file for my FastAPI app
   - Explain each section
   - Include:
     - App name
     - Primary region
     - HTTP service configuration
     - Health checks
     - Auto-scaling settings
     - Environment variables section

6. **Create/Update Dockerfile for Fly**
   - Provide optimized Dockerfile for Python FastAPI
   - Multi-stage build for smaller image
   - Include:
     - Python 3.11 base
     - Requirements installation
     - Uvicorn server
     - Proper port exposure

---

## PART 3: ENVIRONMENT VARIABLES & SECRETS

7. **Set Environment Variables**
   - Command to set each secret
   - How to set multiple secrets at once
   - How to update existing secrets
   - How to list current secrets

8. **Database Connection**
   - How to connect to external Neon PostgreSQL
   - SSL requirements
   - Connection string format

---

## PART 4: DEPLOYMENT

9. **First Deployment**
   - Command to deploy
   - What to expect during deployment
   - How to monitor deployment progress
   - How to view logs during deployment

10. **Verify Deployment**
    - Command to check app status
    - How to access the deployed app
    - How to check logs
    - How to SSH into the container (if needed)

---

## PART 5: CUSTOM DOMAIN SETUP

11. **Add Custom Domain**
    - Command to add api.pellicura.com
    - DNS records needed (CNAME or A record)
    - How to get the Fly.io IP/hostname for DNS
    - SSL certificate (automatic with Fly?)

12. **Cloudflare DNS Configuration**
    - Exact DNS records to add in Cloudflare
    - Proxy settings (orange cloud on/off?)
    - SSL settings in Cloudflare

---

## PART 6: SCALING & OPTIMIZATION

13. **Scaling Configuration**
    - Free tier limits
    - How to scale up/down
    - Auto-scaling settings
    - Memory and CPU allocation

14. **Health Checks**
    - Configure health check endpoint
    - Timeout and interval settings
    - Grace period settings

---

## PART 7: MONITORING & MAINTENANCE

15. **Monitoring**
    - How to view logs
    - How to view metrics
    - Setting up alerts

16. **Updates & Redeployment**
    - How to deploy updates
    - Zero-downtime deployment
    - Rollback if something goes wrong

---

## PART 8: TROUBLESHOOTING

17. **Common Issues & Solutions**
    - App won't start
    - Database connection fails
    - Out of memory
    - Deployment fails
    - Health check fails

18. **Useful Commands Reference**
    - List all apps
    - View app info
    - View logs
    - SSH into container
    - Scale app
    - Delete app

---

## PART 9: COST OPTIMIZATION

19. **Free Tier Maximization**
    - What's included in free tier
    - How to stay within free tier
    - Monitoring usage

20. **Cost Estimates**
    - When will I start paying?
    - Expected monthly cost for my app

---

## OUTPUT FORMAT:

Please provide:
1. **Clear numbered steps** with exact commands
2. **Copy-paste ready commands** in code blocks
3. **Expected output** after each command
4. **Screenshots descriptions** of what I should see
5. **Warnings** for common mistakes
6. **Verification steps** after each major action

---

## EXAMPLE OUTPUT FORMAT:

```
### Step 1: Install Fly CLI

**Command (Run PowerShell as Administrator):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**Expected Output:**
```
Downloading flyctl from https://...
Installing flyctl to C:\Users\...
```

**Verify Installation:**
```powershell
flyctl version
```

**Expected Output:**
```
flyctl v0.1.xxx windows/amd64
```

**Troubleshooting:**
- If you get "access denied", make sure PowerShell is running as Administrator
- If command not found, add to PATH: C:\Users\YourName\.fly\bin
```

---

## ADDITIONAL CONTEXT:

- I'm migrating from Railway to reduce costs and use Cloudflare ecosystem
- My frontend will be on Cloudflare Pages at pellicura.com
- My database will be on Neon PostgreSQL (separate setup)
- I need zero-downtime migration
- I want the backend at api.pellicura.com

---

## START NOW:

Begin with Part 1, Step 1. After each section, ask if I completed it successfully before moving to the next section. Be patient and thorough - I'm not an expert DevOps engineer.

If I encounter any errors, help me troubleshoot before moving forward.

Let's begin!

---

**END OF PROMPT**
