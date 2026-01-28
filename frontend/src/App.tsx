// src/App.tsx - Premium GUI v3 - Complete Frontend
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import AppLayout from "./components/AppLayout";
import DevBanner from "./components/DevBanner";
import LoadingScreen from "./components/LoadingScreen";
import { ToastContainer } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Page Imports - Lazy loaded for faster initial load
const HomePage = React.lazy(() => import("./pages/HomePage"));
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
const DigitalTwinTimelinePage = React.lazy(() => import("./pages/DigitalTwinTimelinePage"));
const Recommendations = React.lazy(() => import("./pages/Recommendations"));
const ProductDetailsPage = React.lazy(() => import("./pages/ProductDetailsPage"));
const RoutineBuilderPage = React.lazy(() => import("./pages/RoutineBuilderPage"));
const FavoritesPage = React.lazy(() => import("./pages/FavoritesPage"));
const MyShelfPage = React.lazy(() => import("./pages/MyShelfPage"));
const ProductScannerPage = React.lazy(() => import("./pages/ProductScannerPage"));
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
const AboutPage = React.lazy(() => import("./pages/AboutPage"));
const ContactPage = React.lazy(() => import("./pages/ContactPage"));
const PrivacyPage = React.lazy(() => import("./pages/PrivacyPage"));
const TermsPage = React.lazy(() => import("./pages/TermsPage"));
const BlogPage = React.lazy(() => import("./pages/BlogPage"));
const IngredientDictionaryPage = React.lazy(() => import("./pages/IngredientDictionaryPage"));
const SkinTypeGuidePage = React.lazy(() => import("./pages/SkinTypeGuidePage"));
const VideoTutorialsPage = React.lazy(() => import("./pages/VideoTutorialsPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DevBanner />
        <BrowserRouter>
          <AppLayout>
            <ErrorBoundary>
              <Suspense fallback={<LoadingScreen message="Loading page..." fullscreen={false} />}>
                <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/password-reset" element={<PasswordResetPage />} />
            <Route path="/password-reset/confirm" element={<PasswordResetConfirmPage />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
            <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
            
            {/* Skin Analysis Routes */}
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/analysis/:analysisId" element={<AnalysisResults />} />
            <Route path="/analysis/demo" element={<SampleReportPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/comparison" element={<ComparisonPage />} />
            <Route path="/digital-twin" element={<DigitalTwinTimelinePage />} />
            
            {/* Product Recommendation Routes */}
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/discover" element={<Recommendations />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
            <Route path="/routine-builder" element={<RoutineBuilderPage />} />
            <Route path="/routines" element={<RoutineBuilderPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/myshelf" element={<MyShelfPage />} />
            <Route path="/scanner" element={<ProductScannerPage />} />
            
            {/* User Profile Routes */}
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/profile" element={<ProfileSettingsPage />} />
            <Route path="/consent" element={<ConsentPage />} />
            <Route path="/skin-goals" element={<SkinGoalsPage />} />
            <Route path="/progress" element={<ProgressTrackingPage />} />
            <Route path="/export" element={<DataExportPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/notifications" element={<NotificationCenterPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />

                    {/* Legal & Information Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/ingredients" element={<IngredientDictionaryPage />} />
            <Route path="/skin-type-guide" element={<SkinTypeGuidePage />} />
            <Route path="/tutorials" element={<VideoTutorialsPage />} />
            
                  {/* 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AppLayout>
        </BrowserRouter>
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}
