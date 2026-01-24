import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Check localStorage instead of sessionStorage
  const user = localStorage.getItem("user");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}