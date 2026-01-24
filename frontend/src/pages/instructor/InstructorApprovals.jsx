import { useEffect, useState } from "react";
import api from "../../services/api";

/* ================= CSV DOWNLOAD ================= */

const downloadEnrolledStudentsCSV = async (course_id, course_code, instructor_id) => {
  const res = await api.get(`/instructor/enrolled-students/${course_id}`, {
    params: { instructor_id },
  });

  const students = res.data || [];
  if (!students.length) {
    alert("No enrolled students");
    return;
  }

  const csv = [
    "Student Name,Email",
    ...students.map(s => `"${s.name}","${s.email}"`)
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${course_code}_students.csv`;
  link.click();
};

export default function InstructorApprovals() {
  /* ================= HOOKS (ALWAYS FIRST) ================= */

  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState("PENDING");

  const [courseSearch, setCourseSearch] = useState("");
  const [courseDept, setCourseDept] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDept, setStudentDept] = useState("");

  /* ================= USER SESSION ================= */

  const user = JSON.parse(localStorage.getItem("user"));
  const isSessionValid = Boolean(user && user.id);

  /* ================= FETCH COURSES ================= */

  useEffect(() => {
    if (!isSessionValid) return;

    api
      .get("/instructor/courses", {
        params: { instructor_id: user.id },
      })
      .then(res => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [isSessionValid, user?.id]);

  /* ================= FETCH APPLICATIONS ================= */

  useEffect(() => {
    if (!isSessionValid || !selectedCourse) return;

    api
      .get("/instructor/applications", {
        params: { course_id: selectedCourse.course_id },
      })
      .then(res => setApplications(res.data || []))
      .catch(() => setApplications([]));
  }, [isSessionValid, selectedCourse]);

  /* ================= ACTION ================= */

  const handleAction = async (enrollmentId, action) => {
    if (!isSessionValid) return;

    if (action === "REMOVE" && !window.confirm("Remove student?")) return;

    await api.post("/instructor/approve-request", {
      enrollmentId,
      action,
      instructor_id: user.id,
    });

    setApplications(prev =>
      prev.filter(a => a.enrollment_id !== enrollmentId)
    );
  };

  /* ================= FILTERED DATA ================= */

  const filteredCourses = courses.filter(c => {
    const q = courseSearch.toLowerCase();
    return (
      (c.course_code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)) &&
      (!courseDept || c.department === courseDept)
    );
  });

  const filteredStudents = applications
    .filter(a =>
      viewMode === "PENDING"
        ? a.status === "PENDING_INSTRUCTOR_APPROVAL"
        : a.status === "ENROLLED"
    )
    .filter(a => {
      const q = studentSearch.toLowerCase();
      const name = a.student?.full_name?.toLowerCase() || "";
      const entry = a.student?.entry_no?.toLowerCase() || "";

      return (
        (!studentSearch || name.includes(q) || entry.includes(q)) &&
        (!studentDept || a.student?.department === studentDept)
      );
    });

  /* ================= SESSION EXPIRED UI ================= */

  if (!isSessionValid) {
    return (
      <div className="p-10 text-red-600 font-bold">
        Session expired. Please login again.
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl">

      {!selectedCourse && (
        <>
          <h2 className="text-xl font-bold mb-4">My Courses</h2>

          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <input
              placeholder="Search course code / title"
              className="border px-3 py-2 text-sm"
              value={courseSearch}
              onChange={e => setCourseSearch(e.target.value)}
            />

            <select
              className="border px-3 py-2 text-sm"
              value={courseDept}
              onChange={e => setCourseDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {[...new Set(courses.map(c => c.department))].map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

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
                {filteredCourses.map(c => (
                  <tr key={c.course_id} className="border-t">
                    <td className="px-3 py-2">
                      <b>{c.course_code}</b>
                      <div className="text-xs text-gray-600">{c.title}</div>
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

      {selectedCourse && (
        <>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setApplications([]);
            }}
            className="text-blue-700 text-sm mb-4"
          >
            ← Back to My Courses
          </button>

          <div className="border bg-white p-4 mb-4">
            <h3 className="text-lg font-bold">
              {selectedCourse.course_code} — {selectedCourse.title}
            </h3>

            <button
              onClick={() =>
                downloadEnrolledStudentsCSV(
                  selectedCourse.course_id,
                  selectedCourse.course_code,
                  user.id
                )
              }
              className="mt-2 border px-4 py-1 text-sm"
            >
              Download Enrolled Students (CSV)
            </button>
          </div>

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
  if (!students.length) {
    return <p className="text-sm text-gray-500">No records found.</p>;
  }

  return (
    <div className="bg-white border">
      <table className="w-full text-sm">
        <tbody>
          {students.map(a => (
            <tr key={a.enrollment_id} className="border-t">
              <td className="px-3 py-2">
                <b>{a.student?.full_name}</b>
              </td>
              <td className="px-3 py-2 text-right">
                {viewMode === "PENDING" ? (
                  <>
                    <button onClick={() => onAction(a.enrollment_id, "ACCEPT")}>Accept</button>
                    <button onClick={() => onAction(a.enrollment_id, "REJECT")}>Reject</button>
                  </>
                ) : (
                  <button onClick={() => onAction(a.enrollment_id, "REMOVE")}>Remove</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
