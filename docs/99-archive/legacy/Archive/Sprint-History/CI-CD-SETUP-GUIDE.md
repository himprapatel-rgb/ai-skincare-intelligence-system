# CI/CD Setup Guide

**AI Skincare Intelligence System**  
**Continuous Integration & Deployment**  
**Last Updated:** December 2, 2025

---

## 🚀 Overview

This project uses GitHub Actions for automated CI/CD across all platforms:
- **Backend** (Python/FastAPI)
- **Frontend Web** (React)
- **iOS** (React Native)
- **Android** (React Native)

---

## 📋 Workflow Files

### 1. Backend CI/CD (`.github/workflows/backend-ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests
- Manual dispatch

**Jobs:**
1. **Lint & Code Quality** - Black, isort, Flake8, MyPy
2. **Test Suite** - Pytest with coverage (Python 3.10, 3.11, 3.12)
3. **Security Scan** - Safety, Bandit
4. **Build Docker Image** - Push to Docker Hub
5. **Deploy to Staging** - Optional deployment
6. **Notify Team** - Slack notifications on failure

**Key Features:**
- ✅ 80%+ test coverage requirement
- ✅ Multi-Python version testing
- ✅ Docker image caching
- ✅ Security vulnerability scanning
- ✅ Automated deployment

### 2. Frontend & Mobile CI/CD (`.github/workflows/frontend-mobile-ci.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests
- Manual dispatch

**Jobs:**
1. **Web Frontend** - Build, test, ESLint (Node.js 20)
2. **iOS Build** - Xcode build & test (macOS runner)
3. **Android Build** - Gradle build & test (Java 17)
4. **E2E Tests** - Playwright tests

**Key Features:**
- ✅ Cross-platform testing
- ✅ E2E testing with Playwright
- ✅ APK artifact generation
- ✅ Simulator/Emulator testing

---

## ⚙️ Setup Requirements

### GitHub Secrets

Add these secrets in **Settings → Secrets → Actions**:

```
DOCKER_USERNAME     # Docker Hub username
DOCKER_PASSWORD     # Docker Hub password/token
SLACK_WEBHOOK_URL   # Slack webhook for notifications (optional)
```

### Repository Settings

1. **Enable Actions:**
   - Settings → Actions → General
   - Allow all actions and reusable workflows

2. **Branch Protection:**
   - Require status checks before merging
   - Require branches to be up to date

---

## 🛠️ Local Testing

### Backend Tests
```bash
cd backend
pip install -r requirements.txt
pip install pytest pytest-cov black flake8 isort mypy

# Run tests
pytest tests/ -v --cov=app

# Linting
black --check .
flake8 app/
isort --check-only .
mypy app/
```

### Frontend Tests
```bash
cd frontend
npm install

# Run tests
npm test -- --coverage

# Linting
npm run lint

# Build
npm run build
```

### E2E Tests
```bash
cd frontend
npx playwright install --with-deps
npm run test:e2e
```

---

## 📊 Monitoring

### View Workflow Runs

1. Navigate to **Actions** tab
2. Select workflow (Backend CI/CD or Frontend & Mobile CI/CD)
3. View run details, logs, and artifacts

### Status Badges

Add to README.md:
```markdown
![Backend CI](https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/actions/workflows/backend-ci.yml/badge.svg)
![Frontend CI](https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/actions/workflows/frontend-mobile-ci.yml/badge.svg)
```

---

## ✅ Workflow Status

| Workflow | Status | Last Run | Coverage |
|----------|--------|----------|----------|
| Backend CI/CD | 🔴 Pending Setup | Dec 2, 2025 | N/A |
| Frontend & Mobile | 🔴 Pending Setup | Dec 2, 2025 | N/A |

**Note:** Workflows will succeed once project dependencies are configured.

---

## 🛠️ Troubleshooting

### Common Issues

**1. "requirements.txt not found"**
```bash
cd backend
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Add requirements.txt"
```

**2. "package.json not found"**
```bash
cd frontend
npm init -y
npm install react react-dom
git add package.json package-lock.json
```

**3. "Docker login failed"**
- Verify `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets
- Use Docker Hub access token, not password

**4. "iOS build failed"**
- Ensure Xcode project exists in `mobile/ios/`
- Check Ruby/CocoaPods installation

**5. "Android build failed"**
- Verify `gradlew` is executable: `chmod +x mobile/android/gradlew`
- Check Java 17 compatibility

---

## 📝 Next Steps

### Immediate (Required for CI to Pass)

1. **Create `backend/requirements.txt`:**
```bash
cd backend
echo "fastapi==0.104.1" > requirements.txt
echo "uvicorn[standard]==0.24.0" >> requirements.txt
echo "pytest==7.4.3" >> requirements.txt
echo "pytest-cov==4.1.0" >> requirements.txt
```

2. **Create `frontend/package.json`:**
```bash
cd frontend
npm init -y
npm install react@18 react-dom@18 typescript@5
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

3. **Commit and push:**
```bash
git add backend/requirements.txt frontend/package.json frontend/package-lock.json
git commit -m "Add dependency files for CI/CD"
git push origin main
```

### Future Enhancements

- ☐ Add deployment to production
- ☐ Implement blue-green deployment
- ☐ Add performance testing
- ☐ Set up staging environment
- ☐ Configure Codecov integration
- ☐ Add automated release notes generation

---

## 📞 Support

- **View Logs:** Actions tab → Select workflow → View details
- **Debug Mode:** Re-run workflow with debug logging enabled
- **Contact:** DataEdge Ltd Development Team

---

**CI/CD pipelines are now configured and ready for testing!**
