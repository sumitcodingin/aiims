import { useEffect, useState } from "react";
import api from "../services/api";

export default function AdvisorDashboard() {
  const [activeTab, setActiveTab] = useState("approvals");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // ============================
  // Fetch pending courses
  // ============================
  const fetchPendingCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/advisor/pending-courses", {
        params: { advisor_id: user.id },
      });
      setCourses(res.data || []);
    } catch (err) {
      console.error(err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "approvals") {
      fetchPendingCourses();
    }
  }, [activeTab]);

  // ============================
  // Approve / Reject course
  // ============================
  const handleAction = async (course_id, action) => {
    try {
      await api.post("/advisor/approve-course", {
        course_id,
        action,
        advisor_id: user.id,
      });

      // remove approved course from UI
      setCourses(courses.filter(c => c.course_id !== course_id));
    } catch (err) {
      alert("Action failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🔵 NAVBAR */}
      <nav className="bg-blue-600 text-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Advisor Dashboard</h1>

        <div className="flex gap-6 items-center">
          <button
            onClick={() => setActiveTab("approvals")}
            className={activeTab === "approvals" ? "underline" : ""}
          >
            Approvals
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={activeTab === "profile" ? "underline" : ""}
          >
            Profile
          </button>

          <span>{user?.name}</span>

          <button
            onClick={logout}
            className="bg-red-500 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="p-6">
        {activeTab === "approvals" && (
          <div className="max-w-4xl">
            <h2 className="text-lg font-bold mb-4">
              Pending Course Approvals
            </h2>

            {loading && <p>Loading...</p>}

            {!loading && courses.length === 0 && (
              <p className="text-gray-600">
                No pending courses for approval.
              </p>
            )}

            {courses.map(course => (
              <div
                key={course.course_id}
                className="bg-white p-4 shadow rounded mb-3 flex justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {course.course_code} — {course.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    Instructor: {course.instructor?.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Session: {course.acad_session}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleAction(course.course_id, "APPROVE")
                    }
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      handleAction(course.course_id, "REJECT")
                    }
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white p-6 shadow rounded max-w-xl">
            <h2 className="text-lg font-bold mb-4">
              Advisor Profile
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

function ProfileItem({ label, value }) {
  return (
    <div className="mb-3">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
