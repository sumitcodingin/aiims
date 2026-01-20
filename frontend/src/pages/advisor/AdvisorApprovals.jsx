import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdvisorApprovals() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH COURSES ================= */
  useEffect(() => {
    api
      .get("/advisor/courses", {
        params: { advisor_id: user.id },
      })
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [user.id]);

  /* ================= FETCH STUDENTS ================= */
  const fetchStudents = async (course) => {
    setSelectedCourse(course);
    setLoading(true);

    try {
      const res = await api.get("/advisor/pending-students", {
        params: {
          advisor_id: user.id,
          course_id: course.course_id,
        },
      });

      setStudents(res.data || []);
    } catch (err) {
      console.error("FETCH STUDENTS ERROR:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= APPROVE / REJECT ================= */
  const handleAction = async (enrollmentId, action) => {
    await api.post("/advisor/approve-request", {
      enrollmentId,
      action,
      advisor_id: user.id,
    });

    setStudents((prev) =>
      prev.filter((s) => s.enrollment_id !== enrollmentId)
    );
  };

  return (
    <div className="max-w-6xl">
      {/* ================= COURSE LIST ================= */}
      {!selectedCourse && (
        <>
          <h2 className="text-2xl font-bold mb-6">Courses</h2>

          {courses.length === 0 ? (
            <p className="text-gray-600">No courses assigned.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.course_id}
                  course={course}
                  onView={() => fetchStudents(course)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= STUDENT APPROVALS ================= */}
      {selectedCourse && (
        <>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setStudents([]);
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
            <p className="text-gray-600">Loading enrollment requests...</p>
          ) : students.length === 0 ? (
            <p className="text-gray-600">
              No pending students for this course.
            </p>
          ) : (
            <div className="space-y-4">
              {students.map((s) => (
                <div
                  key={s.enrollment_id}
                  className="bg-white shadow rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {s.student.full_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {s.student.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Dept: {s.student.department}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleAction(s.enrollment_id, "ACCEPT")
                      }
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() =>
                        handleAction(s.enrollment_id, "REJECT")
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
        <h3 className="text-lg font-bold">{course.course_code}</h3>
        <p className="font-medium text-gray-700">
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
        View Enrollment Requests
      </button>
    </div>
  );
}
