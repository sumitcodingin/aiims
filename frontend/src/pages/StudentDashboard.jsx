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
      {/* ================= SIDEBAR ================= */}
      <nav className="fixed top-0 left-0 h-screen w-64 bg-neutral-900 text-neutral-200 shadow-lg flex flex-col justify-between">
        
        {/* HEADER */}
        <div>
          <h1 className="text-lg font-semibold px-6 py-5 border-b border-neutral-700 tracking-wide">
            Student Portal
          </h1>

          {/* NAV ITEMS */}
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
            <NavButton
              label="Academic Events"
              active={activeTab === "academic-events"}
              onClick={() => setActiveTab("academic-events")}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-neutral-700">
          <p className="text-sm text-neutral-400 mb-3">
            {user?.name || "Student"}
          </p>

          <button
            onClick={logout}
            className="w-full bg-neutral-700 hover:bg-neutral-600 px-3 py-2 rounded-md text-sm text-white transition"
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
   NAV BUTTON
---------------------------- */
function NavButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-6 py-3 text-sm transition-colors
        ${
          active
            ? "bg-neutral-800 text-white font-medium"
            : "text-neutral-300 hover:bg-neutral-800"
        }`}
    >
      {label}
    </button>
  );
}
