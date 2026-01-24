import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdvisorApprovals() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [viewMode, setViewMode] = useState("PENDING");

  const [courseSearch, setCourseSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  /* ================= FETCH COURSES ================= */

  useEffect(() => {
    api
      .get("/advisor/student-courses", {
        params: { advisor_id: user.id },
      })
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [user.id]);

  /* ================= FETCH STUDENTS ================= */

  useEffect(() => {
    if (!selectedCourse) return;

    api
      .get("/advisor/course-students", {
        params: {
          advisor_id: user.id,
          course_id: selectedCourse.course_id,
        },
      })
      .then((res) => setStudents(res.data || []))
      .catch(() => setStudents([]));
  }, [selectedCourse, user.id]);

  /* ================= ACTION ================= */

  const handleAction = async (enrollmentId, action) => {
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    await api.post("/advisor/approve-student", {
      enrollmentId,
      action,
      advisor_id: user.id,
    });

    setStudents((prev) =>
      prev.filter((s) => s.enrollment_id !== enrollmentId)
    );
  };

  /* ================= FILTERS ================= */

  const filteredCourses = courses.filter((c) =>
    `${c.course_code} ${c.title}`
      .toLowerCase()
      .includes(courseSearch.toLowerCase())
  );

  const filteredStudents = students
    .filter((s) =>
      viewMode === "PENDING"
        ? s.status === "PENDING_ADVISOR_APPROVAL"
        : s.status === "ENROLLED"
    )
    .filter((s) => {
      const q = studentSearch.toLowerCase();
      const name = s.student?.full_name?.toLowerCase() || "";
      const entry = s.student?.entry_no?.toLowerCase() || "";
      return !studentSearch || name.includes(q) || entry.includes(q);
    });

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl">

      {/* ================= COURSE LIST ================= */}
      {!selectedCourse && (
        <>
          <h2 className="text-xl font-bold mb-4">My Students' Courses</h2>

          <input
            placeholder="Search course code / title"
            className="border px-3 py-2 text-sm mb-4 w-full md:w-1/3"
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
          />

          <div className="bg-white border">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Course</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Session</th>
                  <th className="px-3 py-2">Seats</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((c) => (
                  <tr key={c.course_id} className="border-t">
                    <td className="px-3 py-2">
                      <b>{c.course_code}</b>
                      <div className="text-xs text-gray-600">
                        {c.title}
                      </div>
                    </td>
                    <td className="px-3 py-2">{c.department}</td>
                    <td className="px-3 py-2">{c.acad_session}</td>
                    <td className="px-3 py-2">
                      {c.enrolled_count}/{c.capacity}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setSelectedCourse(c)}
                        className="border px-3 py-1 text-xs hover:bg-gray-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================= COURSE DETAILS ================= */}
      {selectedCourse && (
        <>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setStudents([]);
            }}
            className="text-blue-700 text-sm mb-4"
          >
            ← Back to Courses
          </button>

          <div className="bg-white border p-4 mb-4">
            <h3 className="text-lg font-bold">
              {selectedCourse.course_code} — {selectedCourse.title}
            </h3>
            <p className="text-sm">
              Department: {selectedCourse.department} | Session:{" "}
              {selectedCourse.acad_session}
            </p>
          </div>

          {/* ===== VIEW MODE + SEARCH ===== */}
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <select
              className="border px-3 py-2 text-sm"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="PENDING">Pending Requests</option>
              <option value="ENROLLED">Enrolled Students</option>
            </select>

            <input
              placeholder="Search student name / entry no"
              className="border px-3 py-2 text-sm"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>

          {/* ===== STUDENT TABLE ===== */}
          <StudentTable
            students={filteredStudents}
            viewMode={viewMode}
            onAction={handleAction}
          />
        </>
      )}
    </div>
  );
}

/* ================= STUDENT TABLE ================= */

function StudentTable({ students, viewMode, onAction }) {
  if (!students.length)
    return <p className="text-sm text-gray-500">No records found.</p>;

  return (
    <div className="bg-white border">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">Student</th>
            <th className="px-3 py-2">Department</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.enrollment_id} className="border-t">
              <td className="px-3 py-2">
                <b>{s.student?.full_name}</b>
                <div className="text-xs text-gray-600">
                  {s.student?.entry_no || s.student?.email}
                </div>
              </td>
              <td className="px-3 py-2">{s.student?.department}</td>
              <td className="px-3 py-2 text-right space-x-2">
                {viewMode === "PENDING" ? (
                  <>
                    <Btn green onClick={() => onAction(s.enrollment_id, "ACCEPT")}>
                      Accept
                    </Btn>
                    <Btn red onClick={() => onAction(s.enrollment_id, "REJECT")}>
                      Reject
                    </Btn>
                  </>
                ) : (
                  <Btn red outline onClick={() => onAction(s.enrollment_id, "REMOVE")}>
                    Remove
                  </Btn>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================= BUTTON ================= */

function Btn({ children, onClick, green, red, outline }) {
  let cls = "px-3 py-1 text-xs border rounded ";

  if (green)
    cls += "bg-green-600 text-white border-green-600 hover:bg-green-700 ";
  if (red && !outline)
    cls += "bg-red-600 text-white border-red-600 hover:bg-red-700 ";
  if (outline && red)
    cls += "text-red-600 border-red-600 hover:bg-red-50 ";

  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
