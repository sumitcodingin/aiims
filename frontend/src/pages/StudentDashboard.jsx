import { useState } from "react";

import Courses from "./student/Courses";
import StudentProfile from "./student/StudentProfile";
import StudentRecords from "./student/StudentRecords";
import CourseInstructorFeedback from "./student/CourseInstructorFeedback";
import AcademicEvents from "./student/AcademicEvents";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("courses");
  const user = JSON.parse(sessionStorage.getItem("user"));

  const logout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ================= LEFT FIXED SIDEBAR ================= */}
      <nav className="fixed top-0 left-0 h-screen w-64 bg-blue-600 text-white shadow flex flex-col justify-between">
        {/* TOP */}
        <div>
          <h1 className="text-2xl font-bold px-6 py-5 border-b border-blue-500">
            Student Portal
          </h1>

          <div className="flex flex-col mt-4">
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

            <NavButton
              label="Feedback"
              active={activeTab === "feedback"}
              onClick={() => setActiveTab("feedback")}
            />

            {/* ✅ Academic Events — SAME FLOW */}
            <NavButton
              label="Academic Events"
              active={activeTab === "academic-events"}
              onClick={() => setActiveTab("academic-events")}
            />
          </div>
        </div>

        {/* BOTTOM */}
        <div className="px-6 py-4 border-t border-blue-500">
          <p className="text-sm opacity-90 mb-3">
            {user?.name || "Student"}
          </p>

          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 px-3 py-2 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <main className="ml-64 p-6 min-h-screen overflow-y-auto">
        {activeTab === "courses" && <Courses />}
        {activeTab === "profile" && <StudentProfile />}
        {activeTab === "records" && <StudentRecords />}
        {activeTab === "feedback" && <CourseInstructorFeedback />}
        {activeTab === "academic-events" && <AcademicEvents />}
      </main>
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
      className={`text-left px-6 py-3 transition ${
        active
          ? "bg-blue-500 font-medium"
          : "opacity-90 hover:bg-blue-500 hover:opacity-100"
      }`}
    >
      {label}
    </button>
  );
}
