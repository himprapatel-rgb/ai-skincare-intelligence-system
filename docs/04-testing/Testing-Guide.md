# Testing Guide
## AI Skincare Intelligence System

**Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Active

---

## 1. Testing Overview

### 1.1 Testing Strategy
The project employs a comprehensive testing pyramid approach:

```
        /\         E2E Tests (10%)
       /  \        - Cypress
      /----\       Integration Tests (20%)
     /      \      - API testing
    /--------\     Unit Tests (70%)
   /          \    - Jest, PyTest
  --------------
```

### 1.2 Test Coverage Targets
| Layer | Target | Current |
|-------|--------|----------|
| Unit Tests | 80% | 76% |
| Integration | 60% | 55% |
| E2E | 40% | 35% |

---

## 2. Testing Environment Setup

### 2.1 Prerequisites
```bash
# Node.js environment
node -v  # v18.x or higher
npm -v   # v9.x or higher

# Python environment
python --version  # 3.10+
pip --version
```

### 2.2 Install Test Dependencies
```bash
# Frontend tests
cd frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom cypress

# Backend tests
cd api
npm install --save-dev jest supertest

# ML service tests
cd ml-service
pip install pytest pytest-cov pytest-asyncio
```

### 2.3 Environment Variables
```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/skincare_test
JWT_SECRET=test-secret-key
ML_SERVICE_URL=http://localhost:5001
```

---

## 3. Unit Testing

### 3.1 Frontend Unit Tests (Jest + React Testing Library)

#### Running Tests
```bash
cd frontend
npm test                  # Run all tests
npm test -- --coverage    # With coverage report
npm test -- --watch       # Watch mode
npm test -- ComponentName # Specific test
```

#### Example Test
```javascript
// src/components/__tests__/Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 3.2 Backend Unit Tests (Jest)

#### Running Tests
```bash
cd api
npm test
npm test -- --coverage
```

#### Example Test
```javascript
// tests/unit/auth.test.js
const { hashPassword, verifyPassword } = require('../../src/utils/auth');

describe('Auth Utils', () => {
  it('hashes password correctly', async () => {
    const password = 'TestPassword123';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('verifies correct password', async () => {
    const password = 'TestPassword123';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });
});
```

### 3.3 ML Service Unit Tests (PyTest)

#### Running Tests
```bash
cd ml-service
pytest                           # Run all tests
pytest --cov=src                 # With coverage
pytest tests/unit/               # Specific folder
pytest -v                        # Verbose output
```

#### Example Test
```python
# tests/unit/test_analyzer.py
import pytest
from src.analyzer import SkinAnalyzer

class TestSkinAnalyzer:
    def setup_method(self):
        self.analyzer = SkinAnalyzer()

    def test_preprocess_image(self):
        # Test image preprocessing
        image = self.analyzer.preprocess("test_image.jpg")
        assert image.shape == (224, 224, 3)

    def test_prediction_output(self):
        # Test prediction format
        result = self.analyzer.analyze("test_image.jpg")
        assert 'conditions' in result
        assert 'confidence' in result
```

---

## 4. Integration Testing

### 4.1 API Integration Tests

#### Running Tests
```bash
cd api
npm run test:integration
```

#### Example Test
```javascript
// tests/integration/auth.integration.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');

describe('Auth API Integration', () => {
  beforeAll(async () => {
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('POST /api/auth/register', () => {
    it('creates new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });
      
      expect(res.status).toBe(409);
    });
  });
});
```

---

## 5. End-to-End Testing (Cypress)

### 5.1 Setup
```bash
cd frontend
npx cypress open    # Interactive mode
npx cypress run     # Headless mode
```

### 5.2 Configuration
```javascript
// cypress.config.js
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js'
  }
};
```

### 5.3 Example E2E Test
```javascript
// cypress/e2e/auth.cy.js
describe('Authentication Flow', () => {
  it('allows user to register', () => {
    cy.visit('/register');
    cy.get('[data-testid=email-input]').type('newuser@test.com');
    cy.get('[data-testid=password-input]').type('Password123!');
    cy.get('[data-testid=submit-btn]').click();
    cy.url().should('include', '/dashboard');
  });

  it('allows user to login', () => {
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type('existing@test.com');
    cy.get('[data-testid=password-input]').type('Password123!');
    cy.get('[data-testid=submit-btn]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

---

## 6. Test Data Management

### 6.1 Fixtures
```javascript
// tests/fixtures/users.js
module.exports = {
  validUser: {
    email: 'test@example.com',
    password: 'Password123!'
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: 'admin'
  }
};
```

### 6.2 Database Seeding
```bash
npm run db:seed:test    # Seed test database
npm run db:reset:test   # Reset and reseed
```

---

## 7. CI/CD Integration

### 7.1 GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

---

## 8. Test Reports

### 8.1 Generating Reports
```bash
# HTML coverage report
npm test -- --coverage --coverageReporters="html"

# JUnit XML (for CI)
npm test -- --reporters=jest-junit
```

### 8.2 Report Locations
- Coverage: `coverage/lcov-report/index.html`
- JUnit: `test-results/junit.xml`
- Cypress: `cypress/reports/`

---

**End of Document**
