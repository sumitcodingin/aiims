import StudentDashboard from "./StudentDashboard";
import InstructorDashboard from "./InstructorDashboard";
import AdvisorDashboard from "./AdvisorDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardRouter() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <div>Unauthorized</div>;
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
      return <div>Unknown role</div>;
  }
}
