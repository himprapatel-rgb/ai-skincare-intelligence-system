# 🗄️ Local Database Setup - Complete Guide
**SQLite for local development (No PostgreSQL needed!)**

---

## 🎯 **PROBLEM SOLVED**

**Issue:** PostgreSQL not installed locally, can't login

**Solution:** Use SQLite for local development (much easier!)

---

## ✅ **QUICK SETUP (3 Steps)**

### **Step 1: Create Database & Test User**

```bash
cd backend
.\venv\Scripts\Activate.ps1
python setup_local_db.py
```

**This will:**
- ✅ Create SQLite database file
- ✅ Create all tables
- ✅ Create test user (himanshu@test.com)
- ✅ Ready in 5 seconds!

---

### **Step 2: Start Local Backend**

```bash
# Still in backend folder with venv activated
python run_local.py
```

**This will:**
- ✅ Start backend on http://localhost:8000
- ✅ Use SQLite database (no PostgreSQL needed)
- ✅ Auto-reload on code changes
- ✅ API docs at http://localhost:8000/api/docs

---

### **Step 3: Update Frontend to Use Local Backend**

**File:** `frontend/.env`

**Change from:**
```env
VITE_API_URL=https://ai-skincare-intelligence-system-production.up.railway.app/api/v1
```

**To:**
```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 🎉 **DONE!**

Now you can login with:
- **Email:** himanshu@test.com
- **Password:** Test1234!

---

## 📋 **COMPLETE STEP-BY-STEP**

### **Terminal 1: Backend**

```powershell
# Navigate to backend
cd E:\ai-skincare-intelligence-system\backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Create database and test user
python setup_local_db.py

# Start backend server
python run_local.py

# Should see:
# ✅ Server running on http://localhost:8000
# ✅ Database: skincare_local.db
```

**Keep this terminal running!**

---

### **Terminal 2: Frontend**

```powershell
# Navigate to frontend
cd E:\ai-skincare-intelligence-system\frontend

# Update .env file first (see below)

# Start frontend (already running)
npm run dev

# Should see:
# ✅ Frontend on http://localhost:3000
```

---

### **File Edit: frontend/.env**

Update the API URL:

```env
# Frontend Environment Variables
# Local Development Setup

# Backend API URL
# Using LOCAL backend with SQLite
VITE_API_URL=http://localhost:8000/api/v1

# Enable debug mode for development
VITE_DEBUG=true
```

---

## 🧪 **VERIFY IT'S WORKING**

### **Check 1: Backend Health**

Open in browser:
```
http://localhost:8000/api/docs
```

**Should see:** Swagger API documentation ✅

---

### **Check 2: Test Login API**

Open in browser:
```
http://localhost:8000/health
```

**Should see:** `{"status": "healthy"}` ✅

---

### **Check 3: Try Login**

1. Go to: http://localhost:3000/auth
2. Enter:
   - Email: `himanshu@test.com`
   - Password: `Test1234!`
3. Click "Sign In"
4. **Should work!** ✅

---

## 📊 **DATABASE INFO**

### **SQLite Database:**
- **File:** `backend/skincare_local.db`
- **Type:** SQLite3 (file-based)
- **Size:** ~50KB initially
- **Location:** Same folder as backend

### **Test User Created:**
```
Email: himanshu@test.com
Password: Test1234!
Name: Himanshu Patel
Status: Active & Verified ✅
```

---

## 🔄 **ALTERNATIVE: Use Railway Production Database**

If you prefer using the production database:

### **Update backend/.env:**

```env
# Use Railway production database
DATABASE_URL=<your-railway-postgres-url>

# Get the URL from Railway dashboard:
# 1. Go to railway.app
# 2. Select your project
# 3. Go to PostgreSQL service
# 4. Copy "Postgres Connection URL"
```

Then start backend normally:
```bash
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

---

## 🎯 **RECOMMENDED APPROACH**

### **For Local Development:**
✅ Use **SQLite** (easiest, no installation needed)

### **For Production:**
✅ Use **PostgreSQL** on Railway (as configured)

### **Why SQLite for Local?**
- ✅ No installation required
- ✅ File-based (easy to backup)
- ✅ Fast for development
- ✅ No server to manage
- ✅ Perfect for testing

---

## 🚀 **COMPLETE COMMANDS**

### **Copy-paste ready:**

```powershell
# Terminal 1 - Backend Setup
cd E:\ai-skincare-intelligence-system\backend
.\venv\Scripts\Activate.ps1
python setup_local_db.py
python run_local.py

# Keep running!
```

```powershell
# Terminal 2 - Frontend (in new terminal)
cd E:\ai-skincare-intelligence-system\frontend

# Update .env file:
# VITE_API_URL=http://localhost:8000/api/v1

# Frontend should auto-reload
```

---

## ✅ **VERIFICATION CHECKLIST**

After setup:

- [ ] Backend running on http://localhost:8000 ✅
- [ ] Database file created: `backend/skincare_local.db` ✅
- [ ] Test user created: himanshu@test.com ✅
- [ ] Frontend using local API ✅
- [ ] Can access API docs: http://localhost:8000/api/docs ✅
- [ ] Login works! ✅

---

## 🎊 **RESULT**

After running these commands:
- ✅ Local SQLite database running
- ✅ Backend connected to local DB
- ✅ Frontend connected to local backend
- ✅ Test user ready: himanshu@test.com
- ✅ Can login successfully!
- ✅ No PostgreSQL needed!

---

## 🚀 **RUN NOW**

Execute the commands above and you'll have:
- Full local development environment
- Working authentication
- No external dependencies
- Fast and easy!

**Let me know when you're ready to run these commands!** 💪
