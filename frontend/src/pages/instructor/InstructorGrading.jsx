import { useEffect, useState } from "react";
import api from "../../services/api";

const GRADING_SCHEME = [
  { grade: "A", display: "A" },
  { grade: "A-", display: "A-" },
  { grade: "B", display: "B" },
  { grade: "B-", display: "B-" },
  { grade: "C", display: "C" },
  { grade: "C-", display: "C-" },
  { grade: "D", display: "D" },
  { grade: "E", display: "E" },
  { grade: "F", display: "F" },
  { grade: "NP", display: "NP" },
  { grade: "NF", display: "NF" },
  { grade: "I", display: "I" },
  { grade: "W", display: "W" },
  { grade: "S", display: "S" },
  { grade: "U", display: "U" },
];

export default function InstructorGrading() {
  const [gradingMode, setGradingMode] = useState("individual");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [massGradingCourse, setMassGradingCourse] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [massSubmitting, setMassSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const isSessionValid = Boolean(user && user.id);

  useEffect(() => {
    if (!isSessionValid) return;
    api
      .get("/instructor/courses", { params: { instructor_id: user.id } })
      .then(res => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [isSessionValid, user?.id]);

  useEffect(() => {
    if (!isSessionValid || !selectedCourse) {
      setEnrolledStudents([]);
      setGrades({});
      return;
    }
    setLoading(true);
    api
      .get("/instructor/applications", {
        params: { course_id: selectedCourse.course_id },
      })
      .then(res => {
        const enrolled = (res.data || []).filter(s => s.status === "ENROLLED");
        setEnrolledStudents(enrolled);
        const initialGrades = {};
        enrolled.forEach(s => {
          initialGrades[s.enrollment_id] = "";
        });
        setGrades(initialGrades);
      })
      .finally(() => setLoading(false));
  }, [isSessionValid, selectedCourse]);

  const handleGradeChange = (id, grade) => {
    setGrades(prev => ({ ...prev, [id]: grade }));
  };

  const handleSubmitGrades = async () => {
    const ungraded = enrolledStudents.filter(s => !grades[s.enrollment_id]);
    if (ungraded.length) {
      alert("Please assign grades to all students.");
      return;
    }
    if (!window.confirm(`Award grades to ${enrolledStudents.length} students?`)) return;
    setSubmitting(true);
    try {
      await Promise.all(
        enrolledStudents.map(s =>
          api.post("/instructor/award-grade", {
            enrollmentId: s.enrollment_id,
            grade: grades[s.enrollment_id],
            instructor_id: user.id,
          })
        )
      );
      alert("Grades awarded successfully");
      setSelectedCourse(null);
    } catch {
      alert("Failed to award grades");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCSVUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const rows = ev.target.result
        .trim()
        .split("\n")
        .slice(1)
        .map(r => r.split(",").map(c => c.trim()));
      setCsvData(
        rows.map(r => ({
          name: r[0],
          email: r[1],
          grade: r[2],
        }))
      );
    };
    reader.readAsText(file);
  };

  const handleValidateCSV = async () => {
    const res = await api.post("/instructor/validate-grades-csv", {
      course_id: massGradingCourse.course_id,
      instructor_id: user.id,
      data: csvData,
      valid_grades: GRADING_SCHEME.map(g => g.grade),
    });
    setValidationResults(res.data);
  };

  const handleMassSubmit = async () => {
    setMassSubmitting(true);
    await api.post("/instructor/submit-mass-grades", {
      course_id: massGradingCourse.course_id,
      instructor_id: user.id,
      grades: validationResults.valid_rows,
    });
    alert("Grades uploaded successfully");
    setMassGradingCourse(null);
    setMassSubmitting(false);
  };

  if (!isSessionValid) {
    return <div className="p-8 text-red-600 font-bold">Session expired</div>;
  }

  return (
    <div className="max-w-5xl">
      <h2 className="text-xl font-bold mb-6">Award Grades</h2>

      {!selectedCourse && !massGradingCourse && (
        <div className="flex mb-6 bg-white border w-fit">
          <button
            onClick={() => setGradingMode("individual")}
            className={`px-4 py-2 text-sm ${gradingMode === "individual" ? "bg-gray-200 font-semibold" : ""}`}
          >
            Individual
          </button>
          <button
            onClick={() => setGradingMode("mass")}
            className={`px-4 py-2 text-sm ${gradingMode === "mass" ? "bg-gray-200 font-semibold" : ""}`}
          >
            Mass (CSV)
          </button>
        </div>
      )}

      {gradingMode === "individual" && !selectedCourse && (
        <CourseTable courses={courses} onSelect={setSelectedCourse} />
      )}

      {selectedCourse && (
        <div>
          <button onClick={() => setSelectedCourse(null)} className="mb-4 underline">
            ← Back
          </button>

          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Student</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Grade</th>
              </tr>
            </thead>
            <tbody>
              {enrolledStudents.map(s => (
                <tr key={s.enrollment_id}>
                  <td className="border p-2">{s.student?.full_name}</td>
                  <td className="border p-2">{s.student?.email}</td>
                  <td className="border p-2">
                    <select
                      value={grades[s.enrollment_id]}
                      onChange={e => handleGradeChange(s.enrollment_id, e.target.value)}
                      className="border px-2 py-1 text-sm"
                    >
                      <option value="">Select</option>
                      {GRADING_SCHEME.map(g => (
                        <option key={g.grade} value={g.grade}>{g.display}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            disabled={submitting}
            onClick={handleSubmitGrades}
            className="mt-4 bg-black text-white px-4 py-2 text-sm"
          >
            {submitting ? "Submitting..." : "Award Grades"}
          </button>
        </div>
      )}

      {gradingMode === "mass" && !massGradingCourse && (
        <CourseTable courses={courses} onSelect={setMassGradingCourse} />
      )}

      {massGradingCourse && (
        <div>
          <button onClick={() => setMassGradingCourse(null)} className="underline mb-3">
            ← Back
          </button>

          <input type="file" onChange={handleCSVUpload} />

          {csvData.length > 0 && (
            <button onClick={handleValidateCSV} className="ml-3 border px-3 py-1 text-sm">
              Validate CSV
            </button>
          )}

          {validationResults && (
            <button
              disabled={massSubmitting || validationResults.invalid_rows?.length}
              onClick={handleMassSubmit}
              className="block mt-4 bg-black text-white px-4 py-2 text-sm"
            >
              {massSubmitting ? "Uploading..." : "Submit Grades"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CourseTable({ courses, onSelect }) {
  return (
    <div className="overflow-x-auto bg-white border">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Course</th>
            <th className="border p-2 text-left">Title</th>
            <th className="border p-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(c => (
            <tr key={c.course_id}>
              <td className="border p-2 font-semibold">{c.course_code}</td>
              <td className="border p-2">{c.title}</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => onSelect(c)}
                  className="px-4 py-1 border border-gray-400 text-sm hover:bg-gray-100"
                >
                  Select
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
