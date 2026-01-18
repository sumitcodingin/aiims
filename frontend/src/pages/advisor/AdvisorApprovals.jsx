import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdvisorApprovals() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);

  /* ===============================
     1. Fetch courses for advisor
  =============================== */
  useEffect(() => {
    api
      .get("/advisor/courses", {
        params: { advisor_id: user.id },
      })
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [user.id]);

  /* ===============================
     2. Fetch students for course
  =============================== */
  const fetchStudents = async (courseId) => {
    setSelectedCourse(courseId);

    try {
      const res = await api.get("/advisor/pending-students", {
        params: {
          advisor_id: user.id,
          course_id: courseId,
        },
      });

      setStudents(res.data || []);
    } catch (err) {
      console.error("FETCH STUDENTS ERROR:", err);
      setStudents([]);
    }
  };

  /* ===============================
     3. Approve / Reject student
  =============================== */
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
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold mb-4">
        Pending Advisor Approvals
      </h2>

      {/* COURSE SELECTOR */}
      <select
        className="border p-2 rounded mb-6 w-full"
        onChange={(e) => fetchStudents(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>
          Select Course
        </option>
        {courses.map((c) => (
          <option key={c.course_id} value={c.course_id}>
            {c.course_code} - {c.title}
          </option>
        ))}
      </select>

      {/* STUDENT LIST */}
      {selectedCourse && (
        <>
          {students.length === 0 ? (
            <p className="text-gray-600">
              No pending students for this course.
            </p>
          ) : (
            students.map((s) => (
              <div
                key={s.enrollment_id}
                className="bg-white p-4 shadow rounded mb-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{s.student.full_name}</p>
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
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() =>
                      handleAction(s.enrollment_id, "REJECT")
                    }
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
