import { useEffect, useState } from "react";
import api from "../services/api";
import FloatCourse from "./instructor/FloatCourse";

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState("approvals");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user"));

  const logout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  /* ======================================
     1. FETCH COURSES OFFERED BY INSTRUCTOR
  ====================================== */
  useEffect(() => {
    if (activeTab !== "approvals") return;

    api
      .get("/instructor/courses", {
        params: { instructor_id: user.id },
      })
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [activeTab, user.id]);

  /* ======================================
     2. FETCH APPLICATIONS FOR SELECTED COURSE
  ====================================== */
  useEffect(() => {
    if (!selectedCourse) return;

    setLoading(true);

    api
      .get("/instructor/applications", {
        params: {
          course_id: selectedCourse,
          instructor_id: user.id,
        },
      })
      .then((res) => setApplications(res.data || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [selectedCourse, user.id]);

  /* ======================================
     3. APPROVE / REJECT
  ====================================== */
  const handleAction = async (enrollmentId, action) => {
    try {
      await api.post("/instructor/approve-request", {
        enrollmentId,
        action,
        instructor_id: user.id,
      });

      setApplications((prev) =>
        prev.filter((a) => a.enrollment_id !== enrollmentId)
      );
    } catch {
      alert("Failed to update enrollment status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ================= LEFT FIXED SIDEBAR ================= */}
      <nav className="fixed top-0 left-0 h-screen w-64 bg-blue-600 text-white shadow flex flex-col justify-between">
        {/* TOP */}
        <div>
          <h1 className="text-2xl font-bold px-6 py-5 border-b border-blue-500">
            Instructor Portal
          </h1>

          <div className="flex flex-col mt-4">
            <NavBtn
              active={activeTab === "approvals"}
              onClick={() => setActiveTab("approvals")}
            >
              Approvals
            </NavBtn>

            <NavBtn
              active={activeTab === "float"}
              onClick={() => setActiveTab("float")}
            >
              Float Course
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
        <div className="px-6 py-4 border-t border-blue-500">
          <p className="text-sm opacity-90 mb-3">
            {user?.name || "Instructor"}
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
        {activeTab === "approvals" && (
          <div className="max-w-4xl">
            <h2 className="text-lg font-bold mb-4">
              Pending Student Applications
            </h2>

            {/* COURSE SELECT */}
            <select
              className="border px-3 py-2 rounded w-full mb-4"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">-- Select Course --</option>
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_code} - {c.title}
                </option>
              ))}
            </select>

            {!selectedCourse ? (
              <p className="text-gray-600">
                Select a course to view applications.
              </p>
            ) : loading ? (
              <p className="text-gray-600">Loading applications...</p>
            ) : applications.length === 0 ? (
              <p className="text-gray-600">No pending applications.</p>
            ) : (
              applications.map((a) => (
                <div
                  key={a.enrollment_id}
                  className="bg-white p-4 shadow rounded mb-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {a.student?.full_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {a.student?.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {a.status}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleAction(a.enrollment_id, "ACCEPT")
                      }
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() =>
                        handleAction(a.enrollment_id, "REJECT")
                      }
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "float" && <FloatCourse />}

        {activeTab === "profile" && (
          <div className="bg-white p-6 shadow rounded max-w-xl">
            <ProfileItem label="Name" value={user?.name} />
            <ProfileItem label="Role" value={user?.role} />
            <ProfileItem label="User ID" value={user?.id} />
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
        active
          ? "bg-blue-500 font-medium"
          : "opacity-90 hover:bg-blue-500 hover:opacity-100"
      }`}
    >
      {children}
    </button>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div className="mb-3">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
