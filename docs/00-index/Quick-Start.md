# 🚀 QUICK START GUIDE
## AI Skincare Intelligence System
### Get Your Development Environment Running in 30 Minutes

**Last Updated:** December 1, 2025  
**Sprint:** Sprint 1.1 Implementation  
**Target Audience:** Developers ready to implement

---

## 📋 PREREQUISITES

### Required Software
- ✅ **Python 3.10+** (for backend)
- ✅ **Node.js 18+** and npm (for web & mobile)
- ✅ **PostgreSQL 14+** (or Neon free tier account)
- ✅ **Git** (version control)
- ✅ **VS Code** or your preferred IDE

### Optional but Recommended
- ✅ **Docker** (for containerized development)
- ✅ **Expo CLI** (for mobile development)
- ✅ **Postman** or **Thunder Client** (for API testing)

---

## ⚡ 30-MINUTE SETUP

### Step 1: Clone Repository (2 min)

```bash
# Clone the repository
git clone https://github.com/himprapatel-rgb/ai-skincare-intelligence-system.git
cd ai-skincare-intelligence-system

# Check current structure
ls -la
# You should see: docs/ and README.md
```

### Step 2: Create Project Structure (3 min)

```bash
# Create main project folders
mkdir -p backend/app/{models,schemas,services,api/v1,core}
mkdir -p backend/{alembic/versions,tests}
mkdir -p web-frontend/{app,lib,components,__tests__}
mkdir -p mobile-app/{api,screens,components}

# Verify structure
tree -L 2
```

**Expected Structure:**
```
ai-skincare-intelligence-system/
├── backend/
│   ├── app/
│   ├── alembic/
│   └── tests/
├── web-frontend/
│   ├── app/
│   ├── lib/
│   └── __tests__/
├── mobile-app/
│   ├── api/
│   └── screens/
└── docs/
```

### Step 3: Set Up Backend (10 min)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy alembic psycopg2-binary \
            argon2-cffi pydantic[email] python-jose[cryptography] \
            python-multipart pytest pytest-cov

# Create requirements.txt
pip freeze > requirements.txt
```

**Create `.env` file:**
```bash
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/skincare_dev

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:19006"]
EOF
```

### Step 4: Initialize Database (5 min)

**Option A: Local PostgreSQL**
```bash
# Create database
psql -U postgres
CREATE DATABASE skincare_dev;
\q
```

**Option B: Neon (Recommended for Quick Start)**
```bash
# 1. Go to https://neon.tech
# 2. Sign up for free tier
# 3. Create new project: "skincare-dev"
# 4. Copy connection string to .env
#    DATABASE_URL=postgres://user:password@ep-xxxxx.us-east-1.aws.neon.tech/skincare_dev
```

**Initialize Alembic:**
```bash
alembic init alembic

# Update alembic.ini:
# sqlalchemy.url = postgresql://user:password@localhost:5432/skincare_dev
```

### Step 5: Copy Implementation Code (5 min)

```bash
# Open the implementation guide
open ../docs/sprint1/Sprint-1.1-Implementation-Complete.md

# Copy code files in this order:
# 1. backend/app/core/database.py
# 2. backend/app/core/config.py
# 3. backend/app/core/security.py
# 4. backend/app/models/user.py
# 5. backend/app/schemas/auth.py
# 6. backend/app/services/auth_service.py
# 7. backend/app/api/v1/auth.py
# 8. backend/app/main.py
# 9. backend/alembic/versions/001_create_users.py
# 10. backend/tests/test_registration.py
```

💡 **Pro Tip:** Use the implementation guide as your code source. Each file is complete and ready to copy-paste.

### Step 6: Run Database Migrations (2 min)

```bash
# Still in backend/ directory
alembic upgrade head

# Verify tables created
psql $DATABASE_URL -c "\dt"
# Should show: users, verification_tokens, alembic_version
```

### Step 7: Start Backend Server (1 min)

```bash
# Start FastAPI server
uvicorn app.main:app --reload --port 8000

# Test in browser:
# http://localhost:8000
# http://localhost:8000/docs (Swagger UI)
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Step 8: Set Up Web Frontend (8 min)

```bash
# Open new terminal
cd web-frontend

# Initialize Next.js 14
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Install additional dependencies
npm install react-hook-form @hookform/resolvers zod

# Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
EOF

# Copy implementation files:
# 1. lib/api.ts
# 2. app/register/page.tsx

# Start development server
npm run dev

# Test in browser:
# http://localhost:3000/register
```

### Step 9: Set Up Mobile App (Optional, 5 min)

```bash
# Open new terminal
cd mobile-app

# Initialize Expo
npx create-expo-app@latest . --template blank-typescript

# Create .env
cat > .env << 'EOF'
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
EOF

# Copy implementation files:
# 1. api/register.ts
# 2. screens/RegisterScreen.tsx

# Start Expo
npx expo start

# Scan QR code with Expo Go app
```

---

## ✅ VERIFICATION CHECKLIST

### Backend
- [ ] Virtual environment activated
- [ ] Dependencies installed
- [ ] Database created and accessible
- [ ] Migrations run successfully
- [ ] Server starts without errors
- [ ] Swagger UI accessible at http://localhost:8000/docs
- [ ] Can send test request to `/api/v1/auth/register`

### Web Frontend
- [ ] Next.js initialized
- [ ] Dependencies installed
- [ ] .env.local configured
- [ ] Register page accessible at http://localhost:3000/register
- [ ] Form validates properly
- [ ] Can submit registration (check Network tab)

### Mobile (Optional)
- [ ] Expo initialized
- [ ] Dependencies installed
- [ ] .env configured
- [ ] Can run on simulator/device
- [ ] Register screen displays

---

## 🧪 TEST YOUR SETUP

### Test 1: Backend API (via Swagger)

1. Go to http://localhost:8000/docs
2. Expand `POST /api/v1/auth/register`
3. Click "Try it out"
4. Enter test data:
   ```json
   {
     "email": "test@example.com",
     "password": "Test1234!"
   }
   ```
5. Click "Execute"
6. **Expected:** 201 Created with user_id

### Test 2: Web Registration

1. Go to http://localhost:3000/register
2. Fill form:
   - Email: `web-test@example.com`
   - Password: `WebTest1234!`
   - Confirm: `WebTest1234!`
3. Submit
4. **Expected:** Redirect to /onboarding (or 404 if page doesn't exist yet)

### Test 3: Database Verification

```bash
# Check registered users
psql $DATABASE_URL -c "SELECT user_id, email, status, created_at FROM users;"

# Verify password is hashed
psql $DATABASE_URL -c "SELECT substring(password_hash, 1, 20) FROM users LIMIT 1;"
# Should start with: $argon2id$
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Module not found" errors
**Solution:**
```bash
# Backend
cd backend
pip install -r requirements.txt

# Web
cd web-frontend
npm install
```

### Issue: Database connection fails
**Solution:**
```bash
# Check DATABASE_URL in .env
# Verify PostgreSQL is running:
sudo service postgresql status  # Linux
brew services list              # macOS

# Test connection:
psql $DATABASE_URL -c "SELECT 1;"
```

### Issue: CORS errors in browser
**Solution:**
```python
# In backend/app/main.py, update CORS:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:19006"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Alembic migrations fail
**Solution:**
```bash
# Reset database
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
alembic upgrade head
```

---

## 📚 NEXT STEPS

### Immediate
1. ✅ Complete Sprint 1.1 implementation
2. ✅ Run all tests: `pytest tests/ -v`
3. ✅ Test registration flow end-to-end

### This Week
4. 📋 Implement Sprint 1.2: User Login
5. 📋 Add JWT token refresh mechanism
6. 📋 Create protected route example

### Next Week
7. 📋 Implement Sprint 1.3: Password Reset
8. 📋 Deploy backend to Render staging
9. 📋 Deploy web to Vercel staging
10. 📋 Create EAS mobile builds

---

## 📖 ADDITIONAL RESOURCES

### Implementation Guides
- [Sprint 1.1 Complete Implementation](sprint1/Sprint-1.1-Implementation-Complete.md)
- [Sprint 1 Core MVP](Sprint-1-Core-MVP-Development.md)
- [Completed Work Status](Completed-Work-Sprint-1.1.md)

### External Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Expo Docs](https://docs.expo.dev)
- [Alembic Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)

### Getting Help
- 🐛 **Issues:** [GitHub Issues](https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/discussions)
- 📧 **Contact:** Your development team lead

---

## ⏱️ TIME ESTIMATES

| Task | Estimated Time | Actual Time |
|------|----------------|-------------|
| Prerequisites Install | 15 min | ___ |
| Clone & Setup Structure | 5 min | ___ |
| Backend Setup | 10 min | ___ |
| Database Init | 5 min | ___ |
| Code Implementation | 10 min | ___ |
| Web Frontend Setup | 10 min | ___ |
| Testing & Verification | 10 min | ___ |
| **TOTAL** | **65 min** | ___ |

💡 **With Neon database:** Can be done in 30-40 minutes

---

## ✅ SUCCESS CRITERIA

You've successfully completed the quick start when:

- ✅ Backend API responds at http://localhost:8000
- ✅ Swagger docs accessible at http://localhost:8000/docs  
- ✅ Web app loads at http://localhost:3000/register
- ✅ Can register a new user successfully
- ✅ Database contains the new user record
- ✅ Password is hashed with Argon2id
- ✅ All tests pass: `pytest tests/ -v`

**Congratulations!** 🎉 You're ready to start building Sprint 1.2!

---

**Document Version:** 1.0  
**Last Updated:** December 1, 2025  
**Maintainer:** Development Team
