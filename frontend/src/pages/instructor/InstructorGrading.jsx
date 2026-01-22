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
        `Confirm: Award grades to ${enrolledStudents.length} students?`
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

      alert("✅ Grades awarded successfully!");

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Award Grades</h1>
      </div>

      {/* ================= STEP 1: SELECT COURSE (TABLE VIEW) ================= */}
      {!selectedCourse && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Select a Course to Grade</h2>
          </div>

          {courses.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No courses found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Enrolled
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {courses.map((course) => (
                    <tr key={course.course_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {course.course_code}
                          </p>
                          <p className="text-sm text-gray-600">
                            {course.title}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.department}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.acad_session}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.enrolled_count}/{course.capacity}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedCourse(course)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Grade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            ← Back to Course Selection
          </button>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedCourse.course_code} — {selectedCourse.title}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Department:</span> {selectedCourse.department} •
              <span className="ml-4 font-medium">Session:</span> {selectedCourse.acad_session} •
              <span className="ml-4 font-medium">Enrolled:</span> {selectedCourse.enrolled_count}/{selectedCourse.capacity}
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
              Loading enrolled students...
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
              No enrolled students in this course.
            </div>
          ) : (
            <>
              {/* ================= STUDENTS TABLE ================= */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Assign Grades to {enrolledStudents.length} Student(s)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Student Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {enrolledStudents.map((student) => (
                        <tr
                          key={student.enrollment_id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4">
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
                              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 text-sm"
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
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Grading Scheme Reference
                </p>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {GRADING_SCHEME.map((item) => (
                    <div
                      key={item.grade}
                      className="bg-gray-50 rounded px-3 py-2 border border-gray-200 text-center"
                    >
                      <span className="font-semibold text-gray-900 text-sm">
                        {item.display}
                      </span>
                      {item.points !== null && (
                        <div className="text-gray-600 text-xs mt-1">
                          {item.points} pts
                        </div>
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
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-900 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitGrades}
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
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
