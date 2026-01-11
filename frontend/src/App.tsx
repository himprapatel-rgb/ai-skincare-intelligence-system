// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ScanPage from "./pages/ScanPage";
import AnalysisResults from "./pages/AnalysisResults";
import Recommendations from "./pages/Recommendations";
import OnboardingPage from "./pages/OnboardingPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import ConsentPage from "./pages/ConsentPage";
import MyShelfPage from "./pages/MyShelfPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import RoutineBuilderPage from "./pages/RoutineBuilderPage";
import HistoryPage from "./pages/HistoryPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/analysis/:analysisId" element={<AnalysisResults />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/profile" element={<ProfileSettingsPage />} />
          <Route path="/consent" element={<ConsentPage />} />
          <Route path="/myshelf" element={<MyShelfPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/routine-builder" element={<RoutineBuilderPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="**" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
