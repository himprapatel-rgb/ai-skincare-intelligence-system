# Frontend Developer Guide

> Complete guide to the React frontend of the AI Skincare Intelligence System

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Key Components](#key-components)
5. [Pages](#pages)
6. [State Management](#state-management)
7. [API Services](#api-services)
8. [Styling](#styling)
9. [Adding New Features](#adding-new-features)
10. [Testing](#testing)

---

## Overview

The frontend is a **React 18** single-page application (SPA) built with:

- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **CSS Modules** - Component styling

---

## Getting Started

### Prerequisites

```bash
node --version  # 20+
npm --version   # 10+
```

### Setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Create environment file
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev       # Start dev server (port 3000)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run test      # Run Vitest tests
npm run test:e2e  # Run Playwright E2E tests
```

---

## Project Structure

```
frontend/src/
├── components/                 # Reusable components
│   ├── AppLayout.tsx          # Main layout (header, footer)
│   ├── AppLayout.css
│   ├── LoadingScreen.tsx      # Loading states
│   ├── LoadingScreen.css
│   ├── GoogleSignInButton.tsx # OAuth button
│   ├── Icons.tsx              # Icon exports (Lucide)
│   ├── LoginForm.tsx          # Login form
│   ├── RegistrationForm.tsx   # Registration form
│   │
│   └── digital-twin/          # Feature-specific components
│       ├── HeroSection.tsx
│       ├── StatsCards.tsx
│       ├── ProgressChart.tsx
│       ├── TimelineSnapshots.tsx
│       ├── SimulationPanel.tsx
│       └── styles/
│           └── digital-twin.css
│
├── pages/                     # Route pages
│   ├── HomePage.tsx           # Landing page
│   ├── HomePage.css
│   ├── DashboardPage.tsx      # User dashboard
│   ├── ScanPage.tsx           # Photo upload & analysis
│   ├── AnalysisResults.tsx    # Analysis results display
│   ├── DigitalTwinTimelinePage.tsx
│   ├── RoutineBuilderPage.tsx
│   ├── ProfileSettingsPage.tsx
│   ├── AuthPage.tsx           # Login/Register
│   ├── GoogleCallbackPage.tsx # OAuth callback
│   └── ... (37 total)
│
├── context/
│   └── AuthContext.tsx        # Authentication state
│
├── services/
│   ├── api.ts                 # Axios instance
│   ├── scanApi.ts             # Scan API calls
│   └── ...
│
├── styles/
│   ├── design-system.css      # Design tokens
│   └── COLOR_SCHEME.md        # Color documentation
│
├── utils/
│   ├── faceValidation.ts      # MediaPipe face detection
│   ├── devAutoLogin.ts        # Dev helper
│   └── backgroundSegmentation.ts
│
├── data/
│   └── mockProducts.ts        # Mock data for development
│
├── types/
│   └── index.ts               # TypeScript types
│
├── App.tsx                    # Route definitions
├── main.tsx                   # Entry point
└── index.css                  # Global styles
```

---

## Key Components

### AppLayout

Main layout wrapper with header and footer.

```tsx
// Usage
import AppLayout from '../components/AppLayout';

const MyPage = () => (
  <AppLayout>
    <div className="my-page">
      {/* Page content */}
    </div>
  </AppLayout>
);
```

**Features:**
- Sticky header with navigation
- Mobile hamburger menu (< 1024px)
- User dropdown with avatar
- Notification bell
- Premium footer with newsletter

### LoadingScreen

Displays loading state with spinner.

```tsx
import LoadingScreen from '../components/LoadingScreen';

// Full screen loading
<LoadingScreen message="Loading..." fullscreen={true} />

// Inline loading (for sections)
<LoadingScreen message="Loading data" fullscreen={false} />
```

### Icons

Centralized icon exports from Lucide React.

```tsx
import { 
  IconScan, 
  IconUser, 
  IconSettings,
  IconBell 
} from '../components/Icons';

<IconScan size={24} strokeWidth={2} />
```

**Available Icons:**
- Dashboard: `IconTrendingUp`, `IconCamera`, `IconSparkles`, `IconBarChart`
- Actions: `IconScan`, `IconHeart`, `IconStar`, `IconPlus`
- Navigation: `IconHome`, `IconUser`, `IconSettings`, `IconMenu`
- Status: `IconCheck`, `IconX`, `IconAlertCircle`, `IconLoader`
- Social: `IconInstagram`, `IconTwitter`, `IconLinkedin`

---

## Pages

### Route Structure

```tsx
// App.tsx - Route definitions
<Routes>
  {/* Public routes */}
  <Route path="/" element={<HomePage />} />
  <Route path="/auth" element={<AuthPage />} />
  <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
  <Route path="/about" element={<AboutPage />} />
  <Route path="/contact" element={<ContactPage />} />
  
  {/* Protected routes (require auth) */}
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/scan" element={<ScanPage />} />
  <Route path="/analysis/:id" element={<AnalysisResults />} />
  <Route path="/digital-twin" element={<DigitalTwinTimelinePage />} />
  <Route path="/recommendations" element={<Recommendations />} />
  <Route path="/routine-builder" element={<RoutineBuilderPage />} />
  <Route path="/profile" element={<ProfileSettingsPage />} />
  <Route path="/history" element={<HistoryPage />} />
  <Route path="/favorites" element={<FavoritesPage />} />
  <Route path="/myshelf" element={<MyShelfPage />} />
  <Route path="/scanner" element={<ProductScannerPage />} />
  <Route path="/notifications" element={<NotificationCenterPage />} />
  
  {/* Admin routes */}
  <Route path="/admin" element={<AdminDashboardPage />} />
</Routes>
```

### Page Template

```tsx
// pages/MyNewPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import './MyNewPage.css';

const MyNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // API call
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading" fullscreen={false} />;
  }

  return (
    <div className="my-new-page">
      <div className="page-container">
        <h1>My New Page</h1>
        {/* Page content */}
      </div>
    </div>
  );
};

export default MyNewPage;
```

---

## State Management

### AuthContext

Global authentication state.

```tsx
// context/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => void;
  register: (name: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}
```

**Usage:**

```tsx
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user?.full_name}</div>;
};
```

### Local Component State

Use `useState` for component-specific state:

```tsx
const [items, setItems] = useState<Item[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);
const [isOpen, setIsOpen] = useState(false);
```

---

## API Services

### API Instance

```tsx
// services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Making API Calls

```tsx
import { api } from '../services/api';

// GET request
const fetchData = async () => {
  const response = await api.get('/scan/history');
  return response.data;
};

// POST request
const createItem = async (data: CreateItemData) => {
  const response = await api.post('/items', data);
  return response.data;
};

// With error handling
const fetchWithError = async () => {
  try {
    const response = await api.get('/endpoint');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    throw error;
  }
};
```

---

## Styling

### Design System

Global CSS variables in `index.css`:

```css
:root {
  /* Colors - DO NOT CHANGE (locked) */
  --primary: #1f6feb;
  --primary-hover: #1e4fd6;
  --primary-light: #e6efff;
  --accent: #a9c7ff;
  
  /* Status */
  --success: #34c759;
  --warning: #ffb020;
  --danger: #ff3b30;
  
  /* Grays */
  --gray-50: #f8fbff;
  --gray-100: #eef3fb;
  --gray-600: #4b5b76;
  --gray-900: #0b1220;
  
  /* Spacing */
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  /* Typography */
  --font-family: 'Inter', sans-serif;
}
```

### Component Styling Pattern

```tsx
// MyComponent.tsx
import './MyComponent.css';

const MyComponent = () => (
  <div className="my-component">
    <h2 className="my-component-title">Title</h2>
    <p className="my-component-description">Description</p>
  </div>
);
```

```css
/* MyComponent.css */
.my-component {
  padding: var(--spacing-lg);
  background: var(--white);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
}

.my-component-title {
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.my-component-description {
  color: var(--text-secondary);
  margin-top: var(--spacing-sm);
}
```

### Responsive Design

```css
/* Mobile-first approach */
.my-component {
  padding: 16px;
}

@media (min-width: 768px) {
  .my-component {
    padding: 24px;
  }
}

@media (min-width: 1024px) {
  .my-component {
    padding: 32px;
  }
}
```

---

## Adding New Features

### 1. Create Page Component

```tsx
// pages/NewFeaturePage.tsx
import React from 'react';
import './NewFeaturePage.css';

const NewFeaturePage: React.FC = () => {
  return (
    <div className="new-feature-page">
      <h1>New Feature</h1>
    </div>
  );
};

export default NewFeaturePage;
```

### 2. Add Route

```tsx
// App.tsx
const NewFeaturePage = lazy(() => import('./pages/NewFeaturePage'));

// In Routes
<Route path="/new-feature" element={<NewFeaturePage />} />
```

### 3. Add Navigation Link

```tsx
// components/AppLayout.tsx
<Link to="/new-feature">New Feature</Link>
```

### 4. Create CSS File

```css
/* pages/NewFeaturePage.css */
.new-feature-page {
  max-width: var(--max-width-xl);
  margin: 0 auto;
  padding: var(--spacing-lg);
}
```

---

## Testing

### Unit Tests (Vitest)

```tsx
// tests/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Run Tests

```bash
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SkinCare/);
});
```

```bash
npm run test:e2e
```

---

## Common Patterns

### Protected Route

```tsx
const ProtectedPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading]);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return <div>Protected content</div>;
};
```

### Form Handling

```tsx
const [formData, setFormData] = useState({ email: '', password: '' });
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    await api.post('/endpoint', formData);
  } catch (err: any) {
    setError(err.response?.data?.detail || 'An error occurred');
  } finally {
    setLoading(false);
  }
};
```

### Data Fetching

```tsx
const [data, setData] = useState<DataType | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/endpoint');
      setData(response.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

---

*Last updated: January 27, 2026*
