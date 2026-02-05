// src/App.tsx - Premium GUI v3 - Complete Frontend
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
import NetworkStatus from "./components/NetworkStatus";

// Page Imports - Lazy loaded for faster initial load
const HomePage = React.lazy(() => import("./pages/HomePage"));
const MePage = React.lazy(() => import("./pages/MePage"));
// Fixed auth page with direct API calls (guaranteed working)
const AuthPage = React.lazy(() =>
  import("./pages/AuthPageFixed").then((module) => ({ 
    default: module.AuthPageFixed 
  }))
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
const DigitalTwinTimelinePage = React.lazy(() => import("./pages/DigitalTwinTimelinePage"));
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
const IngredientDictionaryPage = React.lazy(() => import("./pages/IngredientDictionaryPage"));
const SkinTypeGuidePage = React.lazy(() => import("./pages/SkinTypeGuidePage"));
const VideoTutorialsPage = React.lazy(() => import("./pages/VideoTutorialsPage"));
const DeviceContextPage = React.lazy(() => import("./pages/DeviceContextPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

function AppRoutes() {
  const navigate = useNavigate();
  return (
    <ErrorBoundary onRetry={() => navigate("/", { replace: true })}>
      <Suspense fallback={<LoadingScreen message="Loading page..." fullscreen={false} />}>
        <Routes>
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
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/digital-twin" element={<DigitalTwinTimelinePage />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/discover" element={<Recommendations />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/product/compare" element={<ProductComparePage />} />
          <Route path="/routine-builder" element={<RoutineBuilderPage />} />
          <Route path="/routines" element={<RoutineBuilderPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/myshelf" element={<MyShelfPage />} />
          <Route path="/scanner" element={<Navigate to="/scan?mode=product" replace />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/profile" element={<ProfileSettingsPage />} />
          <Route path="/consent" element={<ConsentPage />} />
          <Route path="/skin-goals" element={<SkinGoalsPage />} />
          <Route path="/progress" element={<ProgressTrackingPage />} />
          <Route path="/export" element={<DataExportPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/notifications" element={<NotificationCenterPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/catalog" element={<AdminCatalogPage />} />
          <Route path="/admin/content" element={<AdminContentPage />} />
          <Route path="/admin/blogs" element={<AdminBlogsPage />} />
          <Route path="/admin/videos" element={<AdminVideosPage />} />
          <Route path="/admin/news" element={<AdminNewsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/ingredients" element={<IngredientDictionaryPage />} />
          <Route path="/skin-type-guide" element={<SkinTypeGuidePage />} />
          <Route path="/tutorials" element={<VideoTutorialsPage />} />
          <Route path="/device-context" element={<DeviceContextPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ShelfProvider>
          <ToastProvider>
          <DevBanner />
          <NetworkStatus />
          <BrowserRouter>
            <NotificationProvider>
              <AppLayout>
                <AppRoutes />
              </AppLayout>
            </NotificationProvider>
          </BrowserRouter>
          <ToastContainer />
          </ToastProvider>
        </ShelfProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
