import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import EmailOtp from "./pages/EmailOtp";
import VerifyOtp from "./pages/VerifyOtp";
import DashboardRouter from "./pages/DashboardRouter";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<EmailOtp />} />
        <Route path="/verify" element={<VerifyOtp />} />

        {/* Role-based Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
