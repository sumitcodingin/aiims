import { useState } from "react";

import InstructorApprovals from "./instructor/InstructorApprovals";
import FloatCourse from "./instructor/FloatCourse";
import InstructorFeedback from "./instructor/InstructorFeedback";
import AcademicEvents from "./student/AcademicEvents"; // ✅ reuse same component

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState("approvals");
  const user = JSON.parse(sessionStorage.getItem("user"));

  const logout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ================= SIDEBAR ================= */}
      <nav className="fixed top-0 left-0 h-screen w-64 bg-blue-600 text-white flex flex-col justify-between shadow">
        <div>
          <h1 className="text-2xl font-bold px-6 py-5 border-b border-blue-500">
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
              active={activeTab === "float"}
              onClick={() => setActiveTab("float")}
            >
              Float Course
            </NavBtn>

            <NavBtn
              active={activeTab === "feedback"}
              onClick={() => setActiveTab("feedback")}
            >
              Feedback
            </NavBtn>

            {/* ✅ Academic Events (NEW) */}
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

        <div className="px-6 py-4 border-t border-blue-500">
          <p className="text-sm mb-3">{user?.name}</p>
          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 py-2 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <main className="ml-64 p-6 min-h-screen overflow-y-auto">
        {/* MY COURSES */}
        {activeTab === "approvals" && <InstructorApprovals />}

        {/* FLOAT COURSE */}
        {activeTab === "float" && (
          <FloatCourse onSuccess={() => setActiveTab("approvals")} />
        )}

        {/* FEEDBACK */}
        {activeTab === "feedback" && <InstructorFeedback />}

        {/* ACADEMIC EVENTS */}
        {activeTab === "academic-events" && <AcademicEvents />}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="bg-gray-100">
            <div className="bg-indigo-600 h-36 rounded-xl"></div>

            <div className="bg-white rounded-xl shadow -mt-16 p-6 max-w-4xl mx-auto">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-white">
                  {user?.name?.[0] || "P"}
                </div>

                <div>
                  <h2 className="text-2xl font-bold">{user?.name}</h2>
                  <p className="text-gray-600">
                    {user?.department || "Computer Science"} • Instructor
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <ProfileCard title="Contact Info">
                  <ProfileRow label="Email" value={user?.email} />
                  <ProfileRow label="Department" value={user?.department} />
                  <ProfileRow label="Room No" value="319" />
                </ProfileCard>

                <ProfileCard title="Details">
                  <InputLike
                    label="Research Interests"
                    value="Computer Architecture"
                  />
                  <InputLike label="Experience" value="—" />
                </ProfileCard>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ================= HELPERS ================= */

function NavBtn({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`text-left px-6 py-3 transition ${
        active ? "bg-blue-500 font-medium" : "hover:bg-blue-500"
      }`}
    >
      {children}
    </button>
  );
}

function ProfileCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex justify-between mb-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function InputLike({ label, value }) {
  return (
    <div className="mb-4">
      <label className="text-sm text-gray-500 block mb-1">
        {label}
      </label>
      <div className="border rounded px-3 py-2 bg-gray-50">
        {value || "—"}
      </div>
    </div>
  );
}
