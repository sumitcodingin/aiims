import { useState } from "react";
import Courses from "./student/Courses";
import StudentProfile from "./student/StudentProfile";
import StudentRecords from "./student/StudentRecords";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("courses");
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">
          🎓 Student Dashboard
        </h1>

        <div className="flex gap-6 items-center">
          <button
            onClick={() => setActiveTab("courses")}
            className={`font-medium ${
              activeTab === "courses" && "text-blue-600"
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`font-medium ${
              activeTab === "profile" && "text-blue-600"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`font-medium ${
              activeTab === "records" && "text-blue-600"
            }`}
          >
            Records
          </button>

          <span className="text-gray-600">{user.name}</span>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="p-6">
        {activeTab === "courses" && <Courses />}
        {activeTab === "profile" && <StudentProfile />}
        {activeTab === "records" && <StudentRecords />}
      </div>
    </div>
  );
}
