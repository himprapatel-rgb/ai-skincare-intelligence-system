# Frontend Features

## Tech Stack
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: CSS Custom Properties + co-located page CSS
- **State**: React Context (Auth, Theme, Toast, Shelf, Scan, Notifications)
- **API**: Axios with JWT interceptor
- **Charts**: Recharts
- **3D**: Three.js (FaceMesh3D)
- **Camera**: react-webcam + MediaPipe face mesh
- **PDF**: jsPDF + html2canvas
- **Icons**: Lucide React (100+)
- **Barcode**: html5-qrcode

---

## Pages (50+ Routes)

### Public Pages (No Auth Required)
| Route | Page | Purpose |
|-------|------|---------|
| `/` | HomeRoute | Smart redirect (guest → HomePage, auth → Dashboard) |
| `/home` | HomePage | Marketing landing (hero, features, stats, testimonials, FAQ, CTA) |
| `/about` | AboutPage | Company info, mission, values |
| `/contact` | ContactPage | Contact form |
| `/privacy` | PrivacyPage | Privacy policy |
| `/terms` | TermsPage | Terms of service |
| `/blog` | BlogPage | Blog articles |
| `/tutorials` | VideoTutorialsPage | Video guides |
| `/ingredients` | IngredientDictionaryPage | Searchable ingredient reference (A-Z, categories) |
| `/skin-type-guide` | SkinTypeGuidePage | Skin type education |
| `/analysis/demo` | SampleReportPage | Demo analysis report |
| `/scan` | ScanPage | Face scan (works for guests too) |

### Authentication Pages
| Route | Page | Purpose |
|-------|------|---------|
| `/auth` | AuthPage | Login/Register toggle (email + Google OAuth) |
| `/password-reset` | PasswordResetPage | Request password reset email |
| `/password-reset/confirm` | PasswordResetConfirmPage | Set new password with token |
| `/verify-email` | EmailVerificationPage | Verify email token |
| `/auth/google/callback` | GoogleCallbackPage | Google OAuth callback |
| `/onboarding` | OnboardingPage | Multi-step onboarding wizard |
| `/consent` | ConsentPage | GDPR consent management |

### Core Feature Pages (Auth Required)
| Route | Page | Purpose |
|-------|------|---------|
| `/dashboard` | DashboardPage | User hub (stats, activity, reminders, quick actions) |
| `/me` | MePage | Profile card, stats, quick links |
| `/scan` | ScanPage | Camera face scan + image upload |
| `/analysis/:id` | AnalysisResults | Scan results (scores, heatmap, concerns, recommendations, export) |
| `/history` | HistoryPage | Scan history (filter, sort, search) |
| `/comparison` | ComparisonPage | Side-by-side scan comparison |
| `/digital-twin` | DigitalTwinFixed | Skin state timeline, simulation, before/after |
| `/progress` | ProgressTrackingPage | Progress charts, milestones, trends |

### Product Pages
| Route | Page | Purpose |
|-------|------|---------|
| `/recommendations` | Recommendations | AI-ranked product grid (filters, compare, favorites) |
| `/product/:id` | ProductDetailsPage | Product detail (ingredients, safety, reviews, where to buy) |
| `/product/compare` | ProductComparePage | Multi-product comparison |
| `/myshelf` | MyShelfPage | Product inventory (status, expiry, routine assignment) |
| `/favorites` | FavoritesPage | Favorite products |
| `/scanner` | ProductScannerPage | Barcode scanner + AI image identification |

### Routine & Goals
| Route | Page | Purpose |
|-------|------|---------|
| `/routine-builder` | RoutineBuilderPage | AM/PM routine editor (drag-reorder, reminders) |
| `/skin-goals` | SkinGoalsPage | Goal management (create, track, complete) |

### Settings & Account
| Route | Page | Purpose |
|-------|------|---------|
| `/profile` | ProfileSettingsPage | 7 tabs: personal, skin, goals, lifestyle, notifications, privacy, stats |
| `/notifications` | NotificationCenterPage | Notification inbox (filter, mark read) |
| `/export` | DataExportPage | GDPR data export (JSON/PDF) |

### Admin Pages (Admin Role)
| Route | Page | Purpose |
|-------|------|---------|
| `/admin` | AdminDashboardPage | Summary stats |
| `/admin/users` | AdminUsersPage | User management |
| `/admin/products` | AdminProductsPage | Product CRUD |
| `/admin/catalog` | AdminCatalogPage | Catalog editor |
| `/admin/blogs` | AdminBlogsPage | Blog CRUD |
| `/admin/videos` | AdminVideosPage | Video management |
| `/admin/news` | AdminNewsPage | News CRUD |
| `/admin/content` | AdminContentPage | Content dashboard |

---

## Context Providers (6)

| Context | State Type | Purpose |
|---------|-----------|---------|
| AuthContext | Client | user, token, isAuthenticated, login(), logout(), register() |
| ThemeContext | Client | theme (light/dark/system), setTheme(), resolvedTheme |
| ToastContext | Client | toast.success(), toast.error(), toast.info() |
| ShelfContext | Server | products[], totalCount, loading, CRUD methods |
| ScanContext | Server | scanHistory[], latestScan, recentScores[], refreshHistory() |
| NotificationContext | Server | notifications[], unreadCount, fetchNotifications() |

---

## Custom Hooks (18+)

| Hook | Purpose |
|------|---------|
| useViewport | Viewport size detection (canonical) |
| useIsMobile | Is mobile check |
| useIsMobileOrTablet | Mobile or tablet check |
| useDebounce | Debounce input values |
| usePageTitle | Set document title + meta |
| useScrollToHash | Scroll to hash anchor |
| usePullToRefresh | Pull-to-refresh gesture |
| useKeyboardVisible | Mobile keyboard open/closed |
| useDeviceContext | Device metadata |
| useErrorReport | Error tracking |
| useOptimizedApi | Optimized API calls |
| useContainerSize | Container resize observer |

---

## Key Components

### Layout
| Component | Purpose |
|-----------|---------|
| AppLayout | Main shell (header, nav, footer, bottom nav) |
| BottomNav | Mobile bottom nav (3 tabs: Today, Scan, Me) |
| PageContainer | Responsive wrapper (narrow/medium/wide/full) |
| ResponsiveGrid | Auto-column CSS grid |

### Skin Analysis
| Component | Purpose |
|-----------|---------|
| Camera | Live camera feed + capture |
| ScanOverlay | Face positioning guide |
| FaceHeatmap | Skin concern zone visualization |
| FaceMesh3D | 3D face mesh (Three.js) |
| TrendSparkline | Mini trend chart |
| ComparisonSlider | Before/after image slider |
| AnalysisLoader | AI analysis loading animation |

### Digital Twin
| Component | Purpose |
|-----------|---------|
| TimelineSnapshots | Snapshot timeline |
| SnapshotCard | Individual snapshot |
| SimulationPanel | What-if simulation |
| BeforeAfterCircle | Circular before/after |
| ProgressChart | Trend visualization |
| StatsCards | KPI grid |

### Mobile
| Component | Purpose |
|-----------|---------|
| MobileButton | Touch-optimized (5 variants, haptic) |
| MobileInput | Touch-optimized input (16px min) |
| MobileCard | Press-state card (elevated/outlined/filled) |
| MobileBottomSheet | Bottom sheet modal |
| MobileActionSheet | iOS-style action menu |

### UI Primitives
| Component | Purpose |
|-----------|---------|
| LoadingSpinner | Spinner |
| Skeleton | 10+ loading skeleton variants |
| Toast | Success/error/info notifications |
| EmptyState | Empty list + CTA |
| ErrorCard | Error + retry |
| ErrorBoundary | React error fallback |
| ConfirmModal | Destructive action confirmation |
| LazyImage | Lazy-loaded image |
| BackToTop | Scroll-to-top |
| DarkModeToggle | Theme switcher |
| Icons | 100+ Lucide icons |

---

## Design System

### Colors
- Primary: `#1f6feb` (blue)
- Success: `#10b981` / Warning: `#f59e0b` / Error: `#ef4444`
- Grays: 9-tier scale (`#f8fafc` → `#0f172a`)
- Dark mode: `[data-theme="dark"]` overrides

### Typography
- Font: Inter + system fallbacks
- Scale: xs (0.75rem) → 5xl (3rem)
- Headings: clamp() fluid sizing

### Spacing
- 4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80px

### Breakpoints
- Mobile: ≤768px
- Tablet: 769-1024px
- Desktop: ≥1025px

### Shadows
- Blue-tinted: 6 levels (xs → 2xl) + primary glow

### Animations
- Entrance: fadeIn, slideUp, scaleIn
- Interaction: press bounce (0.97), ripple, hover lift
- Loading: skeleton shimmer, spinner rotation
- `prefers-reduced-motion`: all disabled
