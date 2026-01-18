import { useEffect, useState } from "react";
import api from "../services/api";
import FloatCourse from "./instructor/FloatCourse";

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState("approvals");
  const [applications, setApplications] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // ============================
  // Fetch pending applications
  // ============================
  useEffect(() => {
    if (activeTab === "approvals") {
      api
        .get("/instructor/applications/1") // TODO: replace 1 with dynamic course later
        .then((res) => setApplications(res.data || []))
        .catch(() => setApplications([]));
    }
  }, [activeTab]);

  // ============================
  // Approve / Reject
  // ============================
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
    } catch (err) {
      alert("Failed to update enrollment");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🔵 BLUE NAVBAR */}
      <nav className="bg-blue-600 text-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          👨‍🏫 Instructor Dashboard
        </h1>

        <div className="flex gap-6 items-center">
          <button
            onClick={() => setActiveTab("approvals")}
            className={`font-medium ${
              activeTab === "approvals" && "underline"
            }`}
          >
            Approvals
          </button>

          <button
            onClick={() => setActiveTab("float")}
            className={`font-medium ${
              activeTab === "float" && "underline"
            }`}
          >
            Float Course
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`font-medium ${
              activeTab === "profile" && "underline"
            }`}
          >
            Profile
          </button>

          <span className="opacity-90">{user?.name}</span>

          <button
            onClick={logout}
            className="bg-red-500 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ============================
          CONTENT
      ============================ */}
      <div className="p-6">
        {/* ---------- APPROVALS ---------- */}
        {activeTab === "approvals" && (
          <div className="max-w-3xl">
            <h2 className="text-lg font-bold mb-4">
              Pending Student Applications
            </h2>

            {applications.length === 0 ? (
              <p className="text-gray-600">No pending applications.</p>
            ) : (
              applications.map((a) => {
                // ✅ SAFE student extraction (fixes your error)
                const student = a.student || a.users || {};

                return (
                  <div
                    key={a.enrollment_id}
                    className="bg-white p-4 shadow rounded mb-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold">
                        {student.full_name || "Unknown Student"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {student.email || "—"}
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
                );
              })
            )}
          </div>
        )}

        {/* ---------- FLOAT COURSE ---------- */}
        {activeTab === "float" && <FloatCourse />}

        {/* ---------- PROFILE ---------- */}
        {activeTab === "profile" && (
          <div className="bg-white p-6 shadow rounded max-w-xl">
            <h2 className="text-lg font-bold mb-4">
              Instructor Profile
            </h2>

            <ProfileItem label="Name" value={user?.name} />
            <ProfileItem label="Role" value={user?.role} />
            <ProfileItem label="User ID" value={user?.id} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================
// Profile Row Component
// ============================
function ProfileItem({ label, value }) {
  return (
    <div className="mb-3">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
