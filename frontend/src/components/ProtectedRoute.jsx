/* file: frontend/src/components/ProtectedRoute.jsx */
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Check localStorage (Correct)
  const user = localStorage.getItem("user");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}