import { useState } from "react";

import InstructorApprovals from "./instructor/InstructorApprovals";
import FloatCourse from "./instructor/FloatCourse";
import InstructorFeedback from "./instructor/InstructorFeedback";
import InstructorGrading from "./instructor/InstructorGrading";
import AcademicEvents from "./student/AcademicEvents";
import AllCourses from "./instructor/AllCourses";
import InstructorProfile from "./instructor/InstructorProfile";
import InstructorProjects from "./instructor/InstructorProjects"; // ✅ NEW IMPORT

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState("approvals");
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ================= SIDEBAR ================= */}
      <nav className="fixed top-0 left-0 h-screen w-64 bg-neutral-900 text-neutral-200 shadow-lg flex flex-col justify-between">
        {/* TOP */}
        <div>
          <h1 className="text-lg font-semibold px-6 py-5 border-b border-neutral-700 tracking-wide">
            Instructor Portal
          </h1>

          <div className="flex flex-col mt-4">
            <NavBtn
              active={activeTab === "approvals"}
              onClick={() => setActiveTab("approvals")}
            >
              My Courses
            </NavBtn>

            <NavBtn
              active={activeTab === "all-courses"}
              onClick={() => setActiveTab("all-courses")}
            >
              All Offerings
            </NavBtn>

            <NavBtn
              active={activeTab === "float"}
              onClick={() => setActiveTab("float")}
            >
              Float Course
            </NavBtn>

            {/* ✅ NEW PROJECTS TAB */}
            <NavBtn
              active={activeTab === "projects"}
              onClick={() => setActiveTab("projects")}
            >
              Research Projects
            </NavBtn>

            <NavBtn
              active={activeTab === "feedback"}
              onClick={() => setActiveTab("feedback")}
            >
              Feedback
            </NavBtn>

            <NavBtn
              active={activeTab === "grading"}
              onClick={() => setActiveTab("grading")}
            >
              Award Grades
            </NavBtn>

            <NavBtn
              active={activeTab === "academic-events"}
              onClick={() => setActiveTab("academic-events")}
            >
              Academic Events
            </NavBtn>

            <NavBtn
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </NavBtn>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="px-6 py-4 border-t border-neutral-700">
          <p className="text-sm text-neutral-400 mb-3">
            {user?.name || "Instructor"}
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
        {activeTab === "approvals" && <InstructorApprovals />}

        {activeTab === "all-courses" && <AllCourses />}

        {activeTab === "float" && (
          <FloatCourse onSuccess={() => setActiveTab("approvals")} />
        )}

        {activeTab === "projects" && <InstructorProjects />}

        {activeTab === "feedback" && <InstructorFeedback />}

        {activeTab === "grading" && <InstructorGrading />}

        {activeTab === "academic-events" && <AcademicEvents />}

        {activeTab === "profile" && <InstructorProfile />}
      </main>
    </div>
  );
}

/* ================= HELPERS ================= */

function NavBtn({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`text-left px-6 py-3 text-sm transition-colors ${
        active
          ? "bg-neutral-800 text-white font-medium"
          : "text-neutral-300 hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}
