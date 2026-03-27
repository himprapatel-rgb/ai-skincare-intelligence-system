// src/App.tsx - Premium GUI v3 - Complete Frontend
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from "./context/AuthContext";
import { ScanProvider } from "./context/ScanContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ShelfProvider } from "./context/ShelfContext";
import { NotificationProvider } from "./context/NotificationContext";
import AppLayout from "./components/AppLayout";
import { HomeRoute } from "./components/HomeRoute";
import DevBanner from "./components/DevBanner";
import LoadingScreen from "./components/LoadingScreen";
import { ToastContainer } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NetworkStatus from "./components/NetworkStatus";
import ChatWidget from "./components/chat/ChatWidget";

// Page Imports - Lazy loaded for faster initial load
const HomePage = React.lazy(() => import("./pages/HomePage"));
const MePage = React.lazy(() => import("./pages/MePage"));
// Use original working auth page
const AuthPage = React.lazy(() =>
  import("./pages/AuthPage").then((module) => ({ default: module.AuthPage }))
);
const PasswordResetPage = React.lazy(() => import("./pages/PasswordResetPage"));
const PasswordResetConfirmPage = React.lazy(() => import("./pages/PasswordResetConfirmPage"));
const EmailVerificationPage = React.lazy(() => import("./pages/EmailVerificationPage"));
const GoogleCallbackPage = React.lazy(() => import("./pages/GoogleCallbackPage"));
const ScanPage = React.lazy(() => import("./pages/ScanPage"));
const AnalysisResults = React.lazy(() => import("./pages/AnalysisResults"));
const HistoryPage = React.lazy(() => import("./pages/HistoryPage"));
const ComparisonPage = React.lazy(() => import("./pages/ComparisonPage"));
const SampleReportPage = React.lazy(() => import("./pages/SampleReportPage"));
const DigitalTwinTimelinePage = React.lazy(() => import("./pages/DigitalTwinFixed"));
const Recommendations = React.lazy(() => import("./pages/Recommendations"));
const ProductDetailsPage = React.lazy(() => import("./pages/ProductDetailsPage"));
const ProductComparePage = React.lazy(() => import("./pages/ProductComparePage"));
const RoutineBuilderPage = React.lazy(() => import("./pages/RoutineBuilderPage"));
const FavoritesPage = React.lazy(() => import("./pages/FavoritesPage"));
const MyShelfPage = React.lazy(() => import("./pages/MyShelfPage"));
const ProfileSettingsPage = React.lazy(() => import("./pages/ProfileSettingsPage"));
const OnboardingPage = React.lazy(() => import("./pages/OnboardingPage"));
const ConsentPage = React.lazy(() => import("./pages/ConsentPage"));
const SkinGoalsPage = React.lazy(() => import("./pages/SkinGoalsPage"));
const ProgressTrackingPage = React.lazy(() => import("./pages/ProgressTrackingPage"));
const DataExportPage = React.lazy(() => import("./pages/DataExportPage"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const NotificationCenterPage = React.lazy(() => import("./pages/NotificationCenterPage"));
const AdminDashboardPage = React.lazy(() => import("./pages/AdminDashboardPage"));
const AdminUsersPage = React.lazy(() => import("./pages/AdminUsersPage"));
const AdminProductsPage = React.lazy(() => import("./pages/AdminProductsPage"));
const AdminCatalogPage = React.lazy(() => import("./pages/AdminCatalogPage"));
const AdminBlogsPage = React.lazy(() => import("./pages/AdminBlogsPage"));
const AdminVideosPage = React.lazy(() => import("./pages/AdminVideosPage"));
const AdminNewsPage = React.lazy(() => import("./pages/AdminNewsPage"));
const AdminContentPage = React.lazy(() => import("./pages/AdminContentPage"));
const AboutPage = React.lazy(() => import("./pages/AboutPage"));
const ContactPage = React.lazy(() => import("./pages/ContactPage"));
const PrivacyPage = React.lazy(() => import("./pages/PrivacyPage"));
const TermsPage = React.lazy(() => import("./pages/TermsPage"));
const BlogPage = React.lazy(() => import("./pages/BlogPage"));
const BlogPostPage = React.lazy(() => import("./pages/BlogPostPage"));
const IngredientDictionaryPage = React.lazy(() => import("./pages/IngredientDictionaryPage"));
const SkinTypeGuidePage = React.lazy(() => import("./pages/SkinTypeGuidePage"));
const SkinTypeQuizPage = React.lazy(() => import("./pages/SkinTypeQuizPage"));
const VideoTutorialsPage = React.lazy(() => import("./pages/VideoTutorialsPage"));
const DeviceContextPage = React.lazy(() => import("./pages/DeviceContextPage"));
const AIChatPage = React.lazy(() => import("./pages/AIChatPage"));
const ClinicalDashboardPage = React.lazy(() => import("./pages/ClinicalDashboardPage"));
const AdminAnalyticsPage = React.lazy(() => import("./pages/AdminAnalyticsPage"));
const SearchPage = React.lazy(() => import("./pages/SearchPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));
const AuthDebug = React.lazy(() => import("./pages/AuthDebug").then(m => ({ default: m.AuthDebug })));

function AppRoutes() {
  const navigate = useNavigate();
  return (
    <ErrorBoundary onRetry={() => navigate("/", { replace: true })}>
      <Suspense fallback={<LoadingScreen message="Loading page..." fullscreen={false} />}>
        <Routes>
          {/* ── PUBLIC ROUTES ── */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/password-reset/confirm" element={<PasswordResetConfirmPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/analysis/:analysisId" element={<AnalysisResults />} />
          <Route path="/analysis/demo" element={<SampleReportPage />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/discover" element={<Recommendations />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/product/compare" element={<ProductComparePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPostPage />} />
          <Route path="/ingredients" element={<IngredientDictionaryPage />} />
          <Route path="/skin-type-guide" element={<SkinTypeGuidePage />} />
          <Route path="/skin-quiz" element={<SkinTypeQuizPage />} />
          <Route path="/tutorials" element={<VideoTutorialsPage />} />
          <Route path="/scanner" element={<Navigate to="/scan?mode=product" replace />} />

          {/* ── AUTHENTICATED ROUTES ── */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/comparison" element={<ProtectedRoute><ComparisonPage /></ProtectedRoute>} />
          <Route path="/digital-twin" element={<ProtectedRoute><DigitalTwinTimelinePage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ProgressTrackingPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><AIChatPage /></ProtectedRoute>} />
          <Route path="/clinical" element={<ProtectedRoute><ClinicalDashboardPage /></ProtectedRoute>} />
          <Route path="/routine-builder" element={<ProtectedRoute><RoutineBuilderPage /></ProtectedRoute>} />
          <Route path="/routines" element={<ProtectedRoute><RoutineBuilderPage /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="/myshelf" element={<ProtectedRoute><MyShelfPage /></ProtectedRoute>} />
          <Route path="/skin-goals" element={<ProtectedRoute><SkinGoalsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationCenterPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
          <Route path="/me" element={<ProtectedRoute><MePage /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          <Route path="/consent" element={<ProtectedRoute><ConsentPage /></ProtectedRoute>} />
          <Route path="/export" element={<ProtectedRoute><DataExportPage /></ProtectedRoute>} />
          <Route path="/device-context" element={<ProtectedRoute><DeviceContextPage /></ProtectedRoute>} />

          {/* ── ADMIN ROUTES ── */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><AdminProductsPage /></ProtectedRoute>} />
          <Route path="/admin/catalog" element={<ProtectedRoute><AdminCatalogPage /></ProtectedRoute>} />
          <Route path="/admin/content" element={<ProtectedRoute><AdminContentPage /></ProtectedRoute>} />
          <Route path="/admin/blogs" element={<ProtectedRoute><AdminBlogsPage /></ProtectedRoute>} />
          <Route path="/admin/videos" element={<ProtectedRoute><AdminVideosPage /></ProtectedRoute>} />
          <Route path="/admin/news" element={<ProtectedRoute><AdminNewsPage /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalyticsPage /></ProtectedRoute>} />

          {/* ── DEV/FALLBACK ── */}
          <Route path="/auth-debug" element={<AuthDebug />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 min — don't refetch fresh data
      gcTime: 30 * 60 * 1000,          // 30 min — keep in memory longer
      retry: 1,
      refetchOnWindowFocus: false,      // Don't refetch every tab switch
      refetchOnReconnect: 'always',     // Refetch after network recovery
    },
  },
});

export default function App() {
  const routerBase = import.meta.env.BASE_URL || "/";
  return (
    <ErrorBoundary onRetry={() => window.location.reload()}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ShelfProvider>
            <ScanProvider>
            <ToastProvider>
            <DevBanner />
            <NetworkStatus />
            <BrowserRouter basename={routerBase}>
              <NotificationProvider>
                <AppLayout>
                  <AppRoutes />
                </AppLayout>
                <ChatWidget />
              </NotificationProvider>
            </BrowserRouter>
            <ToastContainer />
            </ToastProvider>
            </ScanProvider>
          </ShelfProvider>
        </ThemeProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
