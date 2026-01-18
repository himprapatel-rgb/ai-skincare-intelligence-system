// src/App.tsx - Premium GUI v3 - Complete Frontend
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";

// Page Imports - Epic 1: Core Authentication
import { AuthPage } from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import PasswordResetPage from "./pages/PasswordResetPage";

// Page Imports - Epic 2: Skin Analysis Engine
import ScanPage from "./pages/ScanPage";
import AnalysisResults from "./pages/AnalysisResults";
import HistoryPage from "./pages/HistoryPage";
import ComparisonPage from "./pages/ComparisonPage";
import SampleReportPage from "./pages/SampleReportPage";

// Page Imports - Epic 3: Product Recommendations
import Recommendations from "./pages/Recommendations";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import RoutineBuilderPage from "./pages/RoutineBuilderPage";
import FavoritesPage from "./pages/FavoritesPage";
import MyShelfPage from "./pages/MyShelfPage";

// Page Imports - Epic 4: User Profile & History
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import OnboardingPage from "./pages/OnboardingPage";
import ConsentPage from "./pages/ConsentPage";
import SkinGoalsPage from "./pages/SkinGoalsPage";
import ProgressTrackingPage from "./pages/ProgressTrackingPage";
import DataExportPage from "./pages/DataExportPage";
import DashboardPage from "./pages/DashboardPage";

// Page Imports - Epic 5: Legal & Information Pages
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />
          
          {/* Skin Analysis Routes */}
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/analysis/:analysisId" element={<AnalysisResults />} />
          <Route path="/analysis/demo" element={<SampleReportPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          
          {/* Product Recommendation Routes */}
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/routine-builder" element={<RoutineBuilderPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/myshelf" element={<MyShelfPage />} />
          
          {/* User Profile Routes */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/profile" element={<ProfileSettingsPage />} />
          <Route path="/consent" element={<ConsentPage />} />
          <Route path="/skin-goals" element={<SkinGoalsPage />} />
          <Route path="/progress" element={<ProgressTrackingPage />} />
          <Route path="/export" element={<DataExportPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

                  {/* Legal & Information Pages */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
