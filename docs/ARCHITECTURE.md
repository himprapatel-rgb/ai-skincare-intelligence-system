# System Architecture

> Complete technical architecture of the AI Skincare Intelligence System

---

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Database Design](#database-design)
6. [Authentication Flow](#authentication-flow)
7. [AI/ML Pipeline](#aiml-pipeline)
8. [API Design](#api-design)
9. [Security Architecture](#security-architecture)
10. [Deployment Architecture](#deployment-architecture)

---

## System Overview

The AI Skincare Intelligence System is a **three-tier web application** consisting of:

1. **Presentation Layer** (Frontend): React SPA with TypeScript
2. **Application Layer** (Backend): FastAPI with Python
3. **Data Layer** (Database): PostgreSQL

### Key Design Principles

- **Separation of Concerns**: Clear boundaries between layers
- **API-First Design**: RESTful API with OpenAPI documentation
- **Mobile-First UI**: Responsive design for all screen sizes
- **Security by Default**: JWT auth, HTTPS, input validation
- **Scalability**: Stateless backend, connection pooling

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USERS                                      │
│                    (Web Browser / Mobile)                            │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      RAILWAY PLATFORM                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    FRONTEND SERVICE                          │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │              React + TypeScript + Vite               │    │    │
│  │  │  • Pages (37 routes)                                 │    │    │
│  │  │  • Components (30+ reusable)                         │    │    │
│  │  │  • Context (Auth, State)                             │    │    │
│  │  │  • Services (API layer)                              │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│                                ▼ HTTPS (REST API)                   │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    BACKEND SERVICE                           │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │              FastAPI + Python 3.11                   │    │    │
│  │  │  • API Endpoints (auth, scan, recommendations)       │    │    │
│  │  │  • Services (analysis, notifications, simulation)    │    │    │
│  │  │  • Models (SQLAlchemy ORM)                          │    │    │
│  │  │  • Background Tasks (email, processing)              │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│                    ┌───────────┴───────────┐                        │
│                    ▼                       ▼                        │
│  ┌─────────────────────────┐   ┌─────────────────────────┐         │
│  │      PostgreSQL DB      │   │    Persistent Volume    │         │
│  │  • Users & Auth         │   │  • ML Models            │         │
│  │  • Scans & Analysis     │   │  • Uploaded Images      │         │
│  │  • Digital Twin Data    │   │                         │         │
│  │  • Products & Routines  │   │                         │         │
│  └─────────────────────────┘   └─────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
          ┌─────────────────┐     ┌─────────────────┐
          │   OpenAI API    │     │   Google OAuth  │
          │  (Vision/GPT)   │     │   (Identity)    │
          └─────────────────┘     └─────────────────┘
```

---

## Backend Architecture

### Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/          # Route handlers
│   │       │   ├── auth.py         # Authentication routes
│   │       │   ├── scan.py         # Skin analysis routes
│   │       │   ├── recommendations.py
│   │       │   ├── products.py
│   │       │   └── internal.py     # Internal/admin routes
│   │       └── router.py           # API router aggregation
│   │
│   ├── models/                     # SQLAlchemy ORM models
│   │   ├── user.py                 # User model
│   │   ├── scan.py                 # Scan & analysis models
│   │   ├── digital_twin.py         # Digital twin snapshots
│   │   ├── product_models.py       # Products & ingredients
│   │   ├── saved_routine.py        # User routines
│   │   ├── notifications.py        # Notification model
│   │   └── ...
│   │
│   ├── routers/                    # Additional routers
│   │   ├── digital_twin.py         # Digital twin endpoints
│   │   ├── notifications.py        # Notification endpoints
│   │   ├── routines.py             # Routine endpoints
│   │   └── ...
│   │
│   ├── schemas/                    # Pydantic schemas
│   │   ├── user.py                 # User request/response
│   │   ├── scan.py                 # Scan schemas
│   │   └── ...
│   │
│   ├── services/                   # Business logic
│   │   ├── auth_service.py         # Authentication logic
│   │   ├── analysis_service.py     # Skin analysis
│   │   ├── notification_service.py # Notifications
│   │   ├── simulation_service.py   # What-if predictions
│   │   ├── google_auth_service.py  # Google OAuth
│   │   └── email_service.py        # Email sending
│   │
│   ├── data/                       # Static data
│   │   └── ingredient_effects.py   # Ingredient database
│   │
│   ├── config.py                   # Settings (env vars)
│   ├── database.py                 # DB connection
│   └── main.py                     # FastAPI app entry
│
├── scripts/
│   ├── run_migrations.py           # Database migrations
│   └── seed_data.py                # Seed initial data
│
└── tests/                          # Pytest tests
```

### Key Services

| Service | File | Purpose |
|---------|------|---------|
| **AuthService** | `auth_service.py` | User registration, login, password hashing |
| **AnalysisService** | `analysis_service.py` | Skin photo analysis with AI |
| **SimulationService** | `simulation_service.py` | What-if skin predictions |
| **NotificationService** | `notification_service.py` | In-app notifications |
| **GoogleAuthService** | `google_auth_service.py` | Google OAuth flow |
| **EmailService** | `email_service.py` | Email sending (verification, etc.) |

### Middleware Stack

```python
# Order of middleware (bottom to top in processing)
1. ProxyHeadersMiddleware    # Handle Railway proxy headers
2. TrustedHostMiddleware     # Host validation
3. GZipMiddleware            # Response compression
4. CORSMiddleware            # Cross-origin requests
5. SecurityHeadersMiddleware # Security headers (custom)
```

---

## Frontend Architecture

### Directory Structure

```
frontend/src/
├── components/                 # Reusable components
│   ├── AppLayout.tsx          # Main layout (header, footer)
│   ├── LoadingScreen.tsx      # Loading states
│   ├── GoogleSignInButton.tsx # OAuth button
│   ├── Icons.tsx              # Icon exports
│   ├── digital-twin/          # Digital twin components
│   │   ├── HeroSection.tsx
│   │   ├── ProgressChart.tsx
│   │   ├── SimulationPanel.tsx
│   │   └── styles/
│   └── ...
│
├── pages/                     # Route pages
│   ├── HomePage.tsx           # Landing page
│   ├── DashboardPage.tsx      # User dashboard
│   ├── ScanPage.tsx           # Photo upload & analysis
│   ├── DigitalTwinTimelinePage.tsx
│   ├── RoutineBuilderPage.tsx
│   ├── ProfileSettingsPage.tsx
│   ├── AuthPage.tsx           # Login/Register
│   └── ... (37 total pages)
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
│   └── devAutoLogin.ts        # Dev helper
│
├── App.tsx                    # Route definitions
├── main.tsx                   # Entry point
└── index.css                  # Global styles
```

### State Management

- **AuthContext**: Global authentication state (user, token, login/logout)
- **Local State**: Component-level useState for UI state
- **URL State**: React Router for navigation state

### Routing Structure

```tsx
// Main routes defined in App.tsx
/                          → HomePage
/auth                      → AuthPage (Login/Register)
/auth/google/callback      → GoogleCallbackPage
/dashboard                 → DashboardPage
/scan                      → ScanPage
/analysis/:id              → AnalysisResults
/digital-twin              → DigitalTwinTimelinePage
/recommendations           → Recommendations
/routine-builder           → RoutineBuilderPage
/profile                   → ProfileSettingsPage
/history                   → HistoryPage
/favorites                 → FavoritesPage
/myshelf                   → MyShelfPage
/scanner                   → ProductScannerPage
/notifications             → NotificationCenterPage
/about                     → AboutPage
/contact                   → ContactPage
/privacy                   → PrivacyPage
/terms                     → TermsPage
... (and more)
```

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      users      │     │      scans      │     │  scan_results   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ user_id (FK)    │     │ scan_id (FK)    │
│ public_id       │     │ id (PK)         │◄────│ id (PK)         │
│ email           │     │ image_path      │     │ analysis_json   │
│ hashed_password │     │ created_at      │     │ concerns        │
│ full_name       │     │ status          │     │ recommendations │
│ is_verified     │     └─────────────────┘     └─────────────────┘
│ is_admin        │
│ created_at      │     ┌─────────────────┐     ┌─────────────────┐
└─────────────────┘     │ skin_state_     │     │ saved_routines  │
         │              │ snapshots       │     ├─────────────────┤
         │              ├─────────────────┤     │ user_id (FK)    │
         └──────────────│ user_id (FK)    │     │ id (PK)         │
                        │ id (PK)         │     │ name            │
                        │ hydration_level │     │ time_of_day     │
                        │ oil_level       │     │ products (JSON) │
                        │ skin_mood       │     │ reminder_enabled│
                        │ created_at      │     │ reminder_time   │
                        └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    products     │     │   ingredients   │     │  notifications  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ user_id (FK)    │
│ name            │     │ name            │     │ id (PK)         │
│ brand           │     │ category        │     │ type            │
│ category        │     │ benefits        │     │ title           │
│ ingredients     │     │ concerns        │     │ message         │
│ rating          │     │ comedogenic_    │     │ read            │
└─────────────────┘     │ rating          │     │ created_at      │
                        └─────────────────┘     └─────────────────┘
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts and authentication |
| `scans` | Uploaded photo records |
| `scan_results` | AI analysis results |
| `skin_state_snapshots` | Digital twin timeline data |
| `saved_routines` | User-created skincare routines |
| `products` | Product catalog |
| `ingredients` | Ingredient database |
| `notifications` | In-app notifications |
| `favorites` | User favorites |
| `shelf_products` | User's product shelf |
| `skin_goals` | User's skincare goals |

---

## Authentication Flow

### Email/Password Flow

```
1. User submits registration form
   └─► POST /api/v1/auth/register
       └─► Create user (is_verified=False)
       └─► Send verification email
       └─► Return { verification_required: true }

2. User clicks email link
   └─► GET /api/v1/auth/verify-email?token=xxx
       └─► Validate token
       └─► Set is_verified=True
       └─► Redirect to login

3. User logs in
   └─► POST /api/v1/auth/login
       └─► Validate credentials
       └─► Generate JWT token
       └─► Return { token, user }

4. Frontend stores token
   └─► localStorage.setItem('auth_token', token)
   └─► axios.defaults.headers['Authorization'] = 'Bearer ' + token
```

### Google OAuth Flow

```
1. User clicks "Continue with Google"
   └─► Frontend redirects to Google OAuth URL
       (client_id, redirect_uri, scope)

2. User authorizes on Google
   └─► Google redirects to /auth/google/callback?code=xxx

3. Frontend sends code to backend
   └─► POST /api/v1/auth/google { code }
       └─► Exchange code for tokens (Google API)
       └─► Get user info from Google
       └─► Create/find user in database
       └─► Generate JWT token
       └─► Return { token, user }

4. Frontend stores token (same as email flow)
```

---

## AI/ML Pipeline

### Skin Analysis Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User Photo  │────►│ Face Detect  │────►│   Validate   │
│   Upload     │     │  (MediaPipe) │     │  Face Found  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Store     │◄────│   OpenAI     │◄────│   Prepare    │
│   Results    │     │   Vision     │     │    Image     │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│                   Analysis Results                    │
│  • Overall skin score (0-100)                        │
│  • Concern scores (acne, wrinkles, hydration, etc.) │
│  • Detected conditions                               │
│  • Personalized recommendations                      │
└──────────────────────────────────────────────────────┘
```

### What-If Simulation

```
Input: Selected products/ingredients + Duration

1. Get user's current skin state (from latest snapshot)
2. Look up ingredient effects from database
3. Calculate projected improvement per metric
4. Apply time-based multipliers (1 week = 0.3x, 4 weeks = 1x)
5. Generate projected skin scores
6. Return comparison (current vs projected)
```

---

## Security Architecture

### Authentication Security

- **Password Hashing**: Argon2id (memory-hard, resistant to GPU attacks)
- **JWT Tokens**: HS256 signed, 30-minute expiration
- **Token Storage**: localStorage (with XSS protections)

### API Security

- **CORS**: Strict origin allowlist
- **Rate Limiting**: Built-in FastAPI throttling
- **Input Validation**: Pydantic schemas for all inputs
- **SQL Injection**: Parameterized queries via SQLAlchemy

### Security Headers

```python
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Data Protection

- **Encryption at Rest**: PostgreSQL with encrypted storage
- **Encryption in Transit**: TLS 1.3 (HTTPS only)
- **PII Handling**: Email hashing option, data export/deletion

---

## Deployment Architecture

### Railway Services

```
┌─────────────────────────────────────────────────────────────┐
│                     Railway Project                          │
│                                                              │
│  ┌───────────────────┐  ┌───────────────────┐              │
│  │  Backend Service  │  │ Frontend Service  │              │
│  │  (Python/FastAPI) │  │  (Node.js/React)  │              │
│  │                   │  │                   │              │
│  │  Port: 8080       │  │  Port: 3000       │              │
│  │  Dockerfile       │  │  npm run build    │              │
│  │  + start.sh       │  │  + server.js      │              │
│  └────────┬──────────┘  └───────────────────┘              │
│           │                                                  │
│           ▼                                                  │
│  ┌───────────────────┐  ┌───────────────────┐              │
│  │   PostgreSQL DB   │  │ Persistent Volume │              │
│  │  (Managed)        │  │  /models/         │              │
│  └───────────────────┘  └───────────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
GitHub Push (main branch)
        │
        ▼
┌───────────────────┐
│  GitHub Actions   │
│  CI Workflow      │
│  • Lint           │
│  • Type Check     │
│  • Unit Tests     │
└────────┬──────────┘
         │ (on success)
         ▼
┌───────────────────┐
│  Railway Auto     │
│  Deploy Trigger   │
│  • Build image    │
│  • Run migrations │
│  • Deploy         │
└───────────────────┘
```

---

*Last updated: January 27, 2026*
