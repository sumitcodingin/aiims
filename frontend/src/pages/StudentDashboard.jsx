import { useState } from "react";
import Courses from "./student/Courses";
import StudentProfile from "./student/StudentProfile";
import StudentRecords from "./student/StudentRecords";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("courses");
  const user = JSON.parse(sessionStorage.getItem("user"));

  const logout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🔵 BLUE NAVBAR */}
      <nav className="bg-blue-600 text-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          🎓 Student Dashboard
        </h1>

        <div className="flex gap-6 items-center">
          <NavButton
            label="Courses"
            active={activeTab === "courses"}
            onClick={() => setActiveTab("courses")}
          />
          <NavButton
            label="Profile"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
          <NavButton
            label="Records"
            active={activeTab === "records"}
            onClick={() => setActiveTab("records")}
          />

          <span className="opacity-90">
            {user?.name || "Student"}
          </span>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="p-6">
        {activeTab === "courses" && <Courses />}
        {activeTab === "profile" && <StudentProfile />}
        {activeTab === "records" && <StudentRecords />}
      </div>
    </div>
  );
}

/* ---------------------------
   Reusable Nav Button
---------------------------- */
function NavButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`font-medium transition ${
        active
          ? "underline underline-offset-4"
          : "opacity-90 hover:opacity-100"
      }`}
    >
      {label}
    </button>
  );
}
