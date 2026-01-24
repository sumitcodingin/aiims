import { Navigate } from "react-router-dom";

import StudentDashboard from "./StudentDashboard";
import InstructorDashboard from "./InstructorDashboard";
import AdvisorDashboard from "./AdvisorDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardRouter() {
  let user = null;

  try {
    // Retrieve from localStorage
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  // Safety fallback (ProtectedRoute should already block this)
  if (!user || !user.role) {
    return <Navigate to="/" replace />;
  }

  switch (user.role) {
    case "Student":
      return <StudentDashboard />;

    case "Instructor":
      return <InstructorDashboard />;

    case "Advisor":
      return <AdvisorDashboard />;

    case "Admin":
      return <AdminDashboard />;

    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-red-600 font-semibold">
            Unknown role: {user.role}
          </p>
        </div>
      );
  }
}