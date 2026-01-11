// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ScanPage from "./pages/ScanPage";
import AnalysisResults from "./pages/AnalysisResults";
import Recommendations from "./pages/Recommendations";

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
