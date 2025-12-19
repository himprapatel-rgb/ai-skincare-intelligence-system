# Testing Guide - AI Skincare Intelligence System

## Overview

This document provides comprehensive testing guidelines for the AI Skincare Intelligence System, including test structure, execution, and best practices.

## Table of Contents

1. [Testing Framework](#testing-framework)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Categories](#test-categories)
5. [Writing Tests](#writing-tests)
6. [Code Coverage](#code-coverage)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)

## Testing Framework

### Backend Testing

- **Framework**: pytest
- **Configuration**: `pytest.ini`
- **Coverage Tool**: pytest-cov
- **Async Support**: pytest-asyncio

### Frontend Testing

- **Framework**: Vitest
- **Testing Library**: @testing-library/react
- **DOM Environment**: jsdom

## Test Structure

```
ai-skincare-intelligence-system/
├── backend/
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── unit/
│   │   │   ├── test_models.py
│   │   │   ├── test_services.py
│   │   │   └── test_utils.py
│   │   ├── integration/
│   │   │   ├── test_api_endpoints.py
│   │   │   ├── test_database.py
│   │   │   └── test_ml_pipeline.py
│   │   └── e2e/
│   │       └── test_user_workflows.py
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── utils/
│   │   └── ...
│   └── vitest.config.ts
├── tests/
│   ├── logs/
│   └── fixtures/
└── pytest.ini
```

## Running Tests

### Backend Tests

#### Run All Tests
```bash
# From project root
pytest

# With coverage
pytest --cov=backend --cov-report=html
```

#### Run Specific Test Categories
```bash
# Unit tests only
pytest -m unit

# Integration tests
pytest -m integration

# API tests
pytest -m api

# Database tests
pytest -m database

# ML model tests
pytest -m ml
```

#### Run Specific Test File
```bash
pytest backend/tests/unit/test_models.py
```

#### Run Specific Test Function
```bash
pytest backend/tests/unit/test_models.py::test_user_creation
```

#### Run Tests in Parallel
```bash
pytest -n auto
```

#### Stop on First Failure
```bash
pytest -x
```

### Frontend Tests

#### Run All Frontend Tests
```bash
cd frontend
npm test
```

#### Run with Coverage
```bash
npm test -- --coverage
```

#### Watch Mode
```bash
npm test -- --watch
```

## Test Categories

### 1. Unit Tests (@pytest.mark.unit)

**Purpose**: Test individual components in isolation

**Examples**:
- Model methods
- Utility functions
- Service layer functions
- Data validators

**Characteristics**:
- Fast execution
- No external dependencies
- Use mocks/stubs for dependencies

### 2. Integration Tests (@pytest.mark.integration)

**Purpose**: Test interaction between components

**Examples**:
- API endpoint integration
- Database operations
- Service layer integration
- External API calls

**Characteristics**:
- Slower than unit tests
- May use test database
- Test component interactions

### 3. End-to-End Tests (@pytest.mark.e2e)

**Purpose**: Test complete user workflows

**Examples**:
- User registration flow
- Skin analysis workflow
- Product recommendation flow

**Characteristics**:
- Slowest tests
- Test entire system
- Most realistic scenarios

### 4. API Tests (@pytest.mark.api)

**Purpose**: Test REST API endpoints

**Examples**:
- Request/response validation
- Authentication/authorization
- Error handling
- Status codes

### 5. Database Tests (@pytest.mark.database)

**Purpose**: Test database operations

**Examples**:
- CRUD operations
- Query performance
- Data integrity
- Migrations

### 6. ML Tests (@pytest.mark.ml)

**Purpose**: Test machine learning components

**Examples**:
- Model predictions
- Data preprocessing
- Feature extraction
- Model performance

### 7. Security Tests (@pytest.mark.security)

**Purpose**: Test security features

**Examples**:
- Authentication mechanisms
- Authorization checks
- Input validation
- SQL injection prevention

### 8. Performance Tests (@pytest.mark.performance)

**Purpose**: Test system performance

**Examples**:
- Response times
- Load handling
- Memory usage
- Query optimization

## Writing Tests

### Backend Test Example

```python
import pytest
from app.models import User
from app.services.user_service import UserService

@pytest.mark.unit
class TestUserService:
    """Unit tests for UserService"""
    
    def test_create_user_success(self, db_session):
        """Test successful user creation"""
        service = UserService(db_session)
        user_data = {
            "email": "test@example.com",
            "password": "SecurePass123!"
        }
        
        user = service.create_user(user_data)
        
        assert user.email == user_data["email"]
        assert user.id is not None
    
    @pytest.mark.asyncio
    async def test_async_operation(self):
        """Test async operation"""
        result = await some_async_function()
        assert result is not None

@pytest.mark.integration
@pytest.mark.api
class TestUserAPI:
    """Integration tests for User API"""
    
    def test_register_endpoint(self, client):
        """Test user registration endpoint"""
        response = client.post(
            "/api/users/register",
            json={
                "email": "newuser@example.com",
                "password": "SecurePass123!"
            }
        )
        
        assert response.status_code == 201
        assert "id" in response.json()
```

### Frontend Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('renders login form correctly', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
  
  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
```

## Code Coverage

### Coverage Requirements

- **Minimum Coverage**: 70%
- **Target Coverage**: 85%
- **Critical Paths**: 95%+

### Viewing Coverage Reports

#### Backend Coverage
```bash
# Generate HTML report
pytest --cov=backend --cov-report=html

# Open in browser
open htmlcov/index.html
```

#### Frontend Coverage
```bash
cd frontend
npm test -- --coverage

# View report
open coverage/index.html
```

### Coverage Configuration

Configured in `pytest.ini`:
```ini
[coverage:run]
source = backend,.
omit = 
    */tests/*
    */test_*.py
    */__pycache__/*
    */venv/*
```

## CI/CD Integration

### GitHub Actions Workflow

Tests are automatically run on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### Pipeline Stages

1. **Lint**: Code quality checks
2. **Test**: Run all test suites
3. **Coverage**: Generate coverage reports
4. **Security**: Security scanning
5. **Build**: Build artifacts
6. **Deploy**: Deploy to staging (main branch only)

### Workflow File

See `.github/workflows/ci.yml` for complete configuration.

## Best Practices

### General Guidelines

1. **Write Tests First**: Follow TDD when possible
2. **One Assert Per Test**: Keep tests focused
3. **Use Descriptive Names**: Test names should describe what they test
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Independent Tests**: Tests should not depend on each other
6. **Clean Up**: Use fixtures and teardown methods

### Testing Patterns

#### Fixtures (pytest)

```python
@pytest.fixture
def user(db_session):
    """Create a test user"""
    user = User(email="test@example.com")
    db_session.add(user)
    db_session.commit()
    yield user
    db_session.delete(user)
    db_session.commit()
```

#### Mocking

```python
from unittest.mock import Mock, patch

@patch('app.services.email_service.send_email')
def test_user_registration_sends_email(mock_send_email):
    mock_send_email.return_value = True
    # Test code
    assert mock_send_email.called
```

#### Parametrized Tests

```python
@pytest.mark.parametrize("email,password,expected", [
    ("valid@email.com", "ValidPass123!", True),
    ("invalid", "password", False),
    ("", "", False),
])
def test_user_validation(email, password, expected):
    result = validate_user(email, password)
    assert result == expected
```

### Error Testing

```python
def test_invalid_user_raises_error():
    with pytest.raises(ValueError):
        create_user(invalid_data)
```

### Async Testing

```python
@pytest.mark.asyncio
async def test_async_endpoint():
    result = await async_function()
    assert result is not None
```

## Debugging Tests

### Verbose Output
```bash
pytest -vv
```

### Show Print Statements
```bash
pytest -s
```

### Drop into Debugger on Failure
```bash
pytest --pdb
```

### Run Last Failed Tests
```bash
pytest --lf
```

## Additional Resources

- [pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Python Testing Best Practices](https://docs.python-guide.org/writing/tests/)

## Continuous Improvement

- Review test coverage regularly
- Update tests when requirements change
- Refactor tests to improve maintainability
- Add tests for bug fixes
- Monitor test execution time
- Keep dependencies updated

---

**Last Updated**: December 2025
**Maintained By**: Engineering Team
