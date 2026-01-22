import { useEffect, useState } from "react";
import api from "../../services/api";

// Grading Scheme (2-char max for database compatibility)
const GRADING_SCHEME = [
  { grade: "A", points: 10, display: "A" },
  { grade: "A-", points: 9, display: "A-" },
  { grade: "B", points: 8, display: "B" },
  { grade: "B-", points: 7, display: "B-" },
  { grade: "C", points: 6, display: "C" },
  { grade: "C-", points: 5, display: "C-" },
  { grade: "D", points: 4, display: "D" },
  { grade: "E", points: 2, display: "E" },
  { grade: "F", points: 0, display: "F" },
  { grade: "NP", points: null, display: "NP" },
  { grade: "NF", points: null, display: "NF" },
  { grade: "I", points: null, display: "I" },
  { grade: "W", points: null, display: "W" },
  { grade: "S", points: null, display: "S" },
  { grade: "U", points: null, display: "U" },
];

export default function InstructorGrading() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Grade state: { [enrollment_id]: grade }
  const [grades, setGrades] = useState({});

  /* ================= FETCH COURSES ================= */
  useEffect(() => {
    if (!user?.id) return;

    api
      .get("/instructor/courses", {
        params: { instructor_id: user.id },
      })
      .then((res) => setCourses(res.data || []))
      .catch((err) => {
        console.error("Failed to fetch courses:", err);
        setCourses([]);
      });
  }, [user.id]);

  /* ================= FETCH ENROLLED STUDENTS ================= */
  useEffect(() => {
    if (!selectedCourse) {
      setEnrolledStudents([]);
      setGrades({});
      return;
    }

    setLoading(true);
    api
      .get("/instructor/applications", {
        params: { course_id: selectedCourse.course_id },
      })
      .then((res) => {
        const enrolled = (res.data || []).filter(
          (a) => a.status === "ENROLLED"
        );
        setEnrolledStudents(enrolled);

        // Initialize grades object
        const initialGrades = {};
        enrolled.forEach((student) => {
          initialGrades[student.enrollment_id] = "";
        });
        setGrades(initialGrades);
      })
      .catch((err) => {
        console.error("Failed to fetch enrolled students:", err);
        setEnrolledStudents([]);
      })
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  /* ================= HANDLE GRADE CHANGE ================= */
  const handleGradeChange = (enrollment_id, grade) => {
    setGrades((prev) => ({
      ...prev,
      [enrollment_id]: grade,
    }));
  };

  /* ================= SUBMIT GRADES ================= */
  const handleSubmitGrades = async () => {
    // Validate that all students have grades
    const ungradedStudents = enrolledStudents.filter(
      (s) => !grades[s.enrollment_id]
    );

    if (ungradedStudents.length > 0) {
      alert("Please assign grades to all students.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to award grades to ${enrolledStudents.length} students?`
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      // Submit all grades
      const gradeRequests = enrolledStudents.map((student) =>
        api.post("/instructor/award-grade", {
          enrollmentId: student.enrollment_id,
          grade: grades[student.enrollment_id],
          instructor_id: user.id,
        })
      );

      await Promise.all(gradeRequests);

      alert(" Grades awarded successfully!");

      // Reset
      setSelectedCourse(null);
      setEnrolledStudents([]);
      setGrades({});
    } catch (err) {
      console.error("Failed to award grades:", err);
      alert("Failed to award grades. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold mb-6">Award Grades</h2>

      {/* ================= STEP 1: SELECT COURSE ================= */}
      {!selectedCourse && (
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Select a Course</h3>

          {courses.length === 0 ? (
            <p className="text-gray-600">No courses found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <button
                  key={course.course_id}
                  onClick={() => setSelectedCourse(course)}
                  className="bg-blue-50 border-2 border-blue-200 hover:border-blue-600 hover:bg-blue-100 rounded-lg p-4 text-left transition"
                >
                  <p className="font-bold text-blue-900">{course.course_code}</p>
                  <p className="text-sm text-gray-700">{course.title}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Enrolled: {course.enrolled_count}/{course.capacity}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= STEP 2: AWARD GRADES ================= */}
      {selectedCourse && (
        <>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setEnrolledStudents([]);
              setGrades({});
            }}
            className="text-blue-600 mb-4 hover:underline"
          >
            ← Back to Course Selection
          </button>

          <div className="bg-white shadow rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold">
              {selectedCourse.course_code} — {selectedCourse.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedCourse.department} • {selectedCourse.acad_session}
            </p>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading enrolled students...</p>
          ) : enrolledStudents.length === 0 ? (
            <p className="text-gray-600">No enrolled students in this course.</p>
          ) : (
            <>
              <div className="bg-white shadow rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Student Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledStudents.map((student) => (
                        <tr
                          key={student.enrollment_id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 text-sm">
                            <p className="font-medium text-gray-900">
                              {student.student?.full_name}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {student.student?.email}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <select
                              value={grades[student.enrollment_id] || ""}
                              onChange={(e) =>
                                handleGradeChange(
                                  student.enrollment_id,
                                  e.target.value
                                )
                              }
                              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              <option value="">-- Select Grade --</option>
                              {GRADING_SCHEME.map((item) => (
                                <option
                                  key={item.grade}
                                  value={item.grade}
                                >
                                  {item.display}
                                  {item.points !== null ? ` (${item.points})` : ""}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ================= GRADING SCHEME REFERENCE ================= */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6 mb-6">
                <p className="text-sm font-semibold text-blue-900 mb-3">
                  📋 Grading Scheme Reference:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  {GRADING_SCHEME.map((item) => (
                    <div
                      key={item.grade}
                      className="bg-white rounded px-2 py-1 border border-blue-200"
                    >
                      <span className="font-semibold text-blue-700">
                        {item.display}
                      </span>
                      {item.points !== null && (
                        <span className="text-gray-600 ml-1">
                          = {item.points}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ================= ACTION BUTTONS ================= */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    setEnrolledStudents([]);
                    setGrades({});
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitGrades}
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Award Grades"}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
