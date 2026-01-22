import { useEffect, useState } from "react";
import api from "../../services/api";

/* ================= CSV DOWNLOAD ================= */

const downloadEnrolledStudentsCSV = async (course_id, course_code, instructor_id) => {
  const res = await api.get(`/instructor/enrolled-students/${course_id}`, {
    params: { instructor_id },
  });

  const students = res.data || [];
  if (!students.length) return alert("No enrolled students");

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
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState("PENDING");

  /* ===== FILTER STATES ===== */
  const [courseSearch, setCourseSearch] = useState("");
  const [courseDept, setCourseDept] = useState("");

  const [studentSearch, setStudentSearch] = useState("");
  const [studentDept, setStudentDept] = useState("");

  /* ================= FETCH COURSES ================= */

  useEffect(() => {
    api
      .get("/instructor/courses", { params: { instructor_id: user.id } })
      .then(res => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [user.id]);

  /* ================= FETCH APPLICATIONS ================= */

  useEffect(() => {
    if (!selectedCourse) return;

    api
      .get("/instructor/applications", {
        params: { course_id: selectedCourse.course_id },
      })
      .then(res => setApplications(res.data || []))
      .catch(() => setApplications([]));
  }, [selectedCourse]);

  /* ================= ACTION ================= */

  const handleAction = async (enrollmentId, action) => {
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

  /* ================= FILTERED COURSES ================= */

  const filteredCourses = courses.filter(c => {
    const q = courseSearch.toLowerCase();
    return (
      (c.course_code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)) &&
      (!courseDept || c.department === courseDept)
    );
  });

  /* ================= FILTERED STUDENTS ================= */

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

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl">

      {/* ================= COURSE LIST ================= */}
      {!selectedCourse && (
        <>
          <h2 className="text-xl font-bold mb-4">My Courses</h2>

          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <input
              placeholder="Search course code / title"
              className="border px-3 py-2 text-sm"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
            />

            <select
              className="border px-3 py-2 text-sm"
              value={courseDept}
              onChange={(e) => setCourseDept(e.target.value)}
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
                    <td className="px-3 py-2">{c.enrolled_count}/{c.capacity}</td>
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
            <p className="text-sm">Department: {selectedCourse.department}</p>
            <p className="text-sm">Session: {selectedCourse.acad_session}</p>
            <p className="text-sm">
              Seats: {selectedCourse.enrolled_count}/{selectedCourse.capacity}
            </p>

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

          {/* ===== VIEW MODE + STUDENT FILTERS ===== */}
          <div className="grid md:grid-cols-4 gap-3 mb-3">
            <select
              className="border px-3 py-2 text-sm"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="PENDING">Pending Applications</option>
              <option value="ENROLLED">Enrolled Students</option>
            </select>

            <input
              placeholder="Search student name / entry no"
              className="border px-3 py-2 text-sm"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />

            <select
              className="border px-3 py-2 text-sm"
              value={studentDept}
              onChange={(e) => setStudentDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {[...new Set(applications.map(a => a.student?.department).filter(Boolean))].map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
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
          {students.map(a => (
            <tr key={a.enrollment_id} className="border-t">
              <td className="px-3 py-2">
                <b>{a.student?.full_name}</b>
                <div className="text-xs text-gray-600">
                  {a.student?.entry_no || a.student?.email}
                </div>
              </td>
              <td className="px-3 py-2">{a.student?.department}</td>
              <td className="px-3 py-2 text-right space-x-2">
                {viewMode === "PENDING" ? (
                  <>
                    <Btn green onClick={() => onAction(a.enrollment_id, "ACCEPT")}>Accept</Btn>
                    <Btn red onClick={() => onAction(a.enrollment_id, "REJECT")}>Reject</Btn>
                  </>
                ) : (
                  <Btn red outline onClick={() => onAction(a.enrollment_id, "REMOVE")}>
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

  if (green) cls += "bg-green-600 text-white border-green-600 hover:bg-green-700 ";
  if (red && !outline) cls += "bg-red-600 text-white border-red-600 hover:bg-red-700 ";
  if (outline && red) cls += "text-red-600 border-red-600 hover:bg-red-50 ";

  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
