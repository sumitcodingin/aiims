import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import EmailOtp from "./pages/EmailOtp";
import VerifyOtp from "./pages/VerifyOtp";
import Signup from "./pages/Signup";
import VerifySignupOtp from "./pages/VerifySignupOtp";

import DashboardRouter from "./pages/DashboardRouter";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================
            AUTH ROUTES
        ====================== */}
        <Route path="/" element={<EmailOtp />} />
        <Route path="/verify" element={<VerifyOtp />} />

        {/* =====================
            SIGNUP ROUTES
        ====================== */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-signup" element={<VerifySignupOtp />} />

        {/* =====================
            DASHBOARD (PROTECTED)
        ====================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />

        {/* =====================
            FALLBACK
        ====================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
