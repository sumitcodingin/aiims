import { useEffect, useState } from "react";
import api from "../services/api";

export default function AdvisorDashboard() {
  const [activeTab, setActiveTab] = useState("students");

  // STUDENT APPROVAL STATE
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents] = useState([]);

  // COURSE APPROVAL STATE
  const [pendingCourses, setPendingCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user"));

  const logout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  /* ================= STUDENT APPROVAL FLOW ================= */

  useEffect(() => {
    if (activeTab !== "students") return;

    api
      .get("/advisor/courses", {
        params: { advisor_id: user.id },
      })
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [activeTab, user.id]);

  useEffect(() => {
    if (!selectedCourse) return;

    api
      .get("/advisor/pending-students", {
        params: {
          advisor_id: user.id,
          course_id: selectedCourse,
        },
      })
      .then((res) => setStudents(res.data || []))
      .catch(() => setStudents([]));
  }, [selectedCourse, user.id]);

  const handleStudentAction = async (enrollmentId, action) => {
    await api.post("/advisor/approve-request", {
      enrollmentId,
      action,
      advisor_id: user.id,
    });

    setStudents((prev) =>
      prev.filter((s) => s.enrollment_id !== enrollmentId)
    );
  };

  /* ================= COURSE APPROVAL FLOW ================= */

  const fetchPendingCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/advisor/pending-courses", {
        params: { advisor_id: user.id },
      });
      setPendingCourses(res.data || []);
    } catch {
      setPendingCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "courses") {
      fetchPendingCourses();
    }
  }, [activeTab]);

  const handleCourseAction = async (course_id, action) => {
    await api.post("/advisor/approve-course", {
      course_id,
      action,
      advisor_id: user.id,
    });

    setPendingCourses((prev) =>
      prev.filter((c) => c.course_id !== course_id)
    );
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ================= LEFT FIXED SIDEBAR ================= */}
      <nav className="fixed top-0 left-0 h-screen w-64 bg-blue-600 text-white shadow flex flex-col justify-between">
        {/* TOP */}
        <div>
          <h1 className="text-2xl font-bold px-6 py-5 border-b border-blue-500">
            Advisor Portal
          </h1>

          <div className="flex flex-col mt-4">
            <NavBtn
              active={activeTab === "students"}
              onClick={() => setActiveTab("students")}
            >
              Student Approvals
            </NavBtn>

            <NavBtn
              active={activeTab === "courses"}
              onClick={() => setActiveTab("courses")}
            >
              Course Approvals
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
            {user?.name || "Advisor"}
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
        {/* ================= STUDENT APPROVALS ================= */}
        {activeTab === "students" && (
          <div className="max-w-4xl">
            <h2 className="text-lg font-bold mb-4">
              Student Enrollment Approvals
            </h2>

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
              <p className="text-gray-600">Select a course to view students.</p>
            ) : students.length === 0 ? (
              <p className="text-gray-600">No students pending approval.</p>
            ) : (
              students.map((s) => (
                <div
                  key={s.enrollment_id}
                  className="bg-white p-4 shadow rounded mb-3 flex justify-between"
                >
                  <div>
                    <p className="font-semibold">{s.student.full_name}</p>
                    <p className="text-sm text-gray-600">{s.student.email}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleStudentAction(s.enrollment_id, "ACCEPT")
                      }
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        handleStudentAction(s.enrollment_id, "REJECT")
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

        {/* ================= COURSE APPROVALS ================= */}
        {activeTab === "courses" && (
          <div className="max-w-4xl">
            <h2 className="text-lg font-bold mb-4">
              Course Approvals
            </h2>

            {loading && <p>Loading...</p>}

            {!loading && pendingCourses.length === 0 && (
              <p className="text-gray-600">No pending courses.</p>
            )}

            {pendingCourses.map((c) => (
              <div
                key={c.course_id}
                className="bg-white p-4 shadow rounded mb-3 flex justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {c.course_code} - {c.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    Instructor: {c.instructor?.full_name}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleCourseAction(c.course_id, "APPROVE")
                    }
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleCourseAction(c.course_id, "REJECT")
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

        {/* ================= PROFILE ================= */}
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
