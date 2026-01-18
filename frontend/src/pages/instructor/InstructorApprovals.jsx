import { useEffect, useState } from "react";
import api from "../../services/api";

export default function InstructorApprovals() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  // ============================
  // Fetch instructor courses
  // ============================
  useEffect(() => {
    api
      .get("/instructor/courses", {
        params: { instructor_id: user.id },
      })
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [user.id]);

  // ============================
  // Fetch applications for course
  // ============================
  useEffect(() => {
    if (!selectedCourse) return;

    setLoading(true);
    api
      .get("/instructor/applications", {
        params: { course_id: selectedCourse },
      })
      .then((res) => setApplications(res.data || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

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
    } catch {
      alert("Failed to update enrollment status");
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold mb-4">
        Pending Student Applications
      </h2>

      {/* COURSE SELECTOR */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">
          Select Course
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="">-- Select a course --</option>
          {courses.map((c) => (
            <option key={c.course_id} value={c.course_id}>
              {c.course_code} — {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* APPLICATIONS */}
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
  );
}
