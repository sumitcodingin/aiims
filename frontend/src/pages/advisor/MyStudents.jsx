import { useEffect, useState } from "react";
import api from "../../services/api";

export default function MyStudents() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courses, setCourses] = useState([]);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= FETCH STUDENTS ================= */

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/advisor/all-students", {
        params: { advisor_id: user.id },
      });
      setStudents(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (student) => {
    setSelectedStudent(student);
    try {
      const res = await api.get("/advisor/student-details", {
        params: { student_id: student.user_id },
      });
      setCourses(res.data || []);
    } catch {
      setCourses([]);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* ================= FILTER ================= */

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (!search ||
        s.full_name.toLowerCase().includes(q) ||
        s.entry_no?.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)) &&
      (!department || s.department === department)
    );
  });

  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl">

      {!selectedStudent && (
        <>
          <h2 className="text-2xl font-bold mb-4">My Students</h2>

          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <input
              placeholder="Search name / entry no / email"
              className="border rounded px-4 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border rounded px-4 py-2 text-sm"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <div className="bg-white border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3">Entry No</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Email</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.user_id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{s.full_name}</td>
                      <td className="px-4 py-3">{s.entry_no || "—"}</td>
                      <td className="px-4 py-3">{s.department}</td>
                      <td className="px-4 py-3 text-xs">{s.email}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => fetchStudentDetails(s)}
                          className="border px-3 py-1 text-xs rounded hover:bg-gray-100"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ================= STUDENT DETAIL VIEW ================= */}

      {selectedStudent && (
        <>
          <button
            onClick={() => setSelectedStudent(null)}
            className="text-blue-600 text-sm mb-4"
          >
            ← Back to Students
          </button>

          <div className="bg-white border p-8 mb-6">
            <h1 className="text-center text-2xl font-bold mb-1">
              INDIAN INSTITUTE OF TECHNOLOGY ROPAR
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Student Information Record
            </p>

            <h3 className="font-bold mb-2">STUDENT DETAILS</h3>

            <table className="w-full text-sm border">
              <tbody>
                <Row label="Full Name" value={selectedStudent.full_name} />
                <Row label="Email Address" value={selectedStudent.email} />
                <Row label="Department" value={selectedStudent.department} />
                <Row label="Entry Number" value={selectedStudent.entry_no || "—"} />
                <Row label="Role" value="Student" />
              </tbody>
            </table>
          </div>

          <div className="bg-white border p-6">
            <h3 className="font-bold mb-4">ACADEMIC INFORMATION</h3>

            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Course Code</th>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Grade</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{c.course.course_code}</td>
                    <td className="px-3 py-2">{c.course.title}</td>
                    <td className="px-3 py-2">
                      <Status status={c.status} />
                    </td>
                    <td className="px-3 py-2">{c.grade || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ================= HELPERS ================= */

function Row({ label, value }) {
  return (
    <tr className="border-t">
      <td className="bg-gray-50 px-4 py-2 font-medium w-1/3">{label}</td>
      <td className="px-4 py-2">{value}</td>
    </tr>
  );
}

function Status({ status }) {
  let cls = "px-2 py-1 text-xs rounded font-medium ";
  if (status === "ENROLLED") cls += "bg-green-100 text-green-700";
  else if (status.includes("PENDING")) cls += "bg-yellow-100 text-yellow-700";
  else if (status.includes("REJECTED") || status.includes("DROPPED"))
    cls += "bg-red-100 text-red-700";
  else cls += "bg-gray-100 text-gray-700";

  return <span className={cls}>{status.replace(/_/g, " ")}</span>;
}
