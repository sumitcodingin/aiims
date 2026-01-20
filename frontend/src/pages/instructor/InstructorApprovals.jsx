import { useEffect, useState } from "react";
import api from "../../services/api";

export default function InstructorApprovals() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH COURSES ================= */
  useEffect(() => {
    api
      .get("/instructor/courses", {
        params: { instructor_id: user.id },
      })
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [user.id]);

  /* ================= FETCH APPLICATIONS ================= */
  useEffect(() => {
    if (!selectedCourse) return;

    setLoading(true);
    api
      .get("/instructor/applications", {
        params: { course_id: selectedCourse.course_id },
      })
      .then((res) => setApplications(res.data || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  /* ================= APPROVE / REJECT ================= */
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

  /* ================= FILTER ================= */
  const filteredCourses = courses.filter(
    (c) =>
      c.course_code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= UI ================= */
  return (
    <div className="max-w-6xl">
      {/* ================= COURSES VIEW ================= */}
      {!selectedCourse && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Courses</h2>

            <input
              type="text"
              placeholder="Search by course code or title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-4 py-2 w-72"
            />
          </div>

          {filteredCourses.length === 0 ? (
            <p className="text-gray-600">No courses found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.course_id}
                  course={course}
                  onView={() => setSelectedCourse(course)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= ENROLLMENTS VIEW ================= */}
      {selectedCourse && (
        <>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setApplications([]);
            }}
            className="text-blue-600 mb-4 hover:underline"
          >
            ← Back to My Courses
          </button>

          <div className="bg-white shadow rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold">
              {selectedCourse.course_code} — {selectedCourse.title}
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              {selectedCourse.department} • {selectedCourse.acad_session}
            </p>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading applications...</p>
          ) : applications.length === 0 ? (
            <p className="text-gray-600">
              No pending student applications.
            </p>
          ) : (
            <div className="space-y-4">
              {applications.map((a) => (
                <div
                  key={a.enrollment_id}
                  className="bg-white shadow rounded-lg p-4 flex justify-between items-center"
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
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() =>
                        handleAction(a.enrollment_id, "REJECT")
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ================= COURSE CARD ================= */

function CourseCard({ course, onView }) {
  return (
    <div className="bg-white shadow rounded-xl p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold mb-1">
          {course.course_code}
        </h3>
        <p className="text-gray-700 font-medium">
          {course.title}
        </p>

        <div className="text-sm text-gray-600 mt-2 space-y-1">
          <p>Department: {course.department}</p>
          <p>Session: {course.acad_session}</p>
          <p>Capacity: {course.capacity}</p>
        </div>
      </div>

      <button
        onClick={onView}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
      >
        View Enrollments
      </button>
    </div>
  );
}
