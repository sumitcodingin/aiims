import { useState } from "react";
import AdvisorApprovals from "./advisor/AdvisorApprovals";
import CourseApprovals from "./advisor/CourseApprovals";
import AllCourses from "./advisor/AllCourses";
import AdvisorProfile from "./advisor/AdvisorProfile";
import AcademicEvents from "./advisor/AcademicEvents";
import MyStudents from "./advisor/MyStudents"; // ✅ NEW IMPORT

export default function AdvisorDashboard() {
  const [activeTab, setActiveTab] = useState("students");
  const user = JSON.parse(sessionStorage.getItem("user"));

  const logout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ================= SIDEBAR ================= */}
      <nav className="fixed top-0 left-0 h-screen w-64 bg-neutral-900 text-neutral-200 shadow-lg flex flex-col justify-between">
        <div>
          <h1 className="text-lg font-semibold px-6 py-5 border-b border-neutral-700 tracking-wide">
            Advisor Portal
          </h1>

          <div className="flex flex-col mt-4">
            <NavBtn active={activeTab === "students"} onClick={() => setActiveTab("students")}>
              Student Approvals
            </NavBtn>

            <NavBtn active={activeTab === "courses"} onClick={() => setActiveTab("courses")}>
              Course Approvals
            </NavBtn>

            <NavBtn active={activeTab === "all-courses"} onClick={() => setActiveTab("all-courses")}>
              All Offerings
            </NavBtn>

            {/* ✅ NEW TAB */}
            <NavBtn active={activeTab === "my-students"} onClick={() => setActiveTab("my-students")}>
              My Students
            </NavBtn>

            <NavBtn active={activeTab === "events"} onClick={() => setActiveTab("events")}>
              Academic Events
            </NavBtn>

            <NavBtn active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
              Profile
            </NavBtn>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-700">
          <p className="text-sm text-neutral-400 mb-3">
            {user?.name || "Advisor"}
          </p>
          <button
            onClick={logout}
            className="w-full bg-neutral-700 hover:bg-neutral-600 px-3 py-2 rounded-md text-sm text-white"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="ml-64 p-6 min-h-screen overflow-y-auto">
        {activeTab === "students" && <AdvisorApprovals />}
        {activeTab === "courses" && <CourseApprovals />}
        {activeTab === "all-courses" && <AllCourses />}
        {activeTab === "my-students" && <MyStudents />} {/* ✅ */}
        {activeTab === "events" && <AcademicEvents />}
        {activeTab === "profile" && <AdvisorProfile />}
      </main>
    </div>
  );
}

/* ================= NAV BUTTON ================= */

function NavBtn({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`text-left px-6 py-3 text-sm transition ${
        active
          ? "bg-neutral-800 text-white font-medium"
          : "text-neutral-300 hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}
