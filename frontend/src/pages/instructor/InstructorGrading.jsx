import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";

// Grading Scheme
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

  const [gradingMode, setGradingMode] = useState("individual");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [grades, setGrades] = useState({});

  const [massGradingCourse, setMassGradingCourse] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [massSubmitting, setMassSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    api.get("/instructor/courses", { params: { instructor_id: user.id } })
      .then((res) => setCourses(res.data || []))
      .catch((err) => console.error(err));
  }, [user.id]);

  useEffect(() => {
    if (!selectedCourse) {
      setEnrolledStudents([]);
      setGrades({});
      return;
    }
    setLoading(true);
    api.get("/instructor/applications", { params: { course_id: selectedCourse.course_id } })
      .then((res) => {
        const enrolled = (res.data || []).filter((a) => a.status === "ENROLLED");
        setEnrolledStudents(enrolled);
        const initialGrades = {};
        enrolled.forEach((s) => { initialGrades[s.enrollment_id] = ""; });
        setGrades(initialGrades);
      })
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  const handleModeChange = (mode) => {
    setGradingMode(mode);
    setSelectedCourse(null);
    setMassGradingCourse(null);
    setValidationResults(null);
  };

  const handleGradeChange = (enrollment_id, grade) => {
    setGrades((prev) => ({ ...prev, [enrollment_id]: grade }));
  };

  const handleSubmitGrades = async () => {
    const ungraded = enrolledStudents.filter(s => !grades[s.enrollment_id]);
    if (ungraded.length > 0) return alert("Please assign grades to all students.");
    if (!window.confirm(`Award grades to ${enrolledStudents.length} students?`)) return;

    setSubmitting(true);
    try {
      const requests = enrolledStudents.map((s) =>
        api.post("/instructor/award-grade", {
          enrollmentId: s.enrollment_id,
          grade: grades[s.enrollment_id],
          instructor_id: user.id,
        })
      );
      await Promise.all(requests);
      alert("✅ Grades awarded successfully!");
      setSelectedCourse(null);
    } catch (err) {
      alert("Failed to award grades.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = e.target.result.trim().split("\n").map(r => r.split(",").map(c => c.trim()));
      const data = rows.slice(1).map(r => ({ name: r[0], email: r[1], grade: r[2] }));
      setCsvData(data);
    };
    reader.readAsText(file);
  };

  const handleValidateCSV = async () => {
    try {
      const res = await api.post("/instructor/validate-grades-csv", {
        course_id: massGradingCourse.course_id,
        instructor_id: user.id,
        data: csvData,
        valid_grades: GRADING_SCHEME.map((g) => g.grade),
      });
      setValidationResults(res.data);
    } catch { alert("Error validating CSV."); }
  };

  const handleMassGradeSubmit = async () => {
    setMassSubmitting(true);
    try {
      await api.post("/instructor/submit-mass-grades", {
        course_id: massGradingCourse.course_id,
        instructor_id: user.id,
        grades: validationResults.valid_rows,
      });
      alert("✅ Grades uploaded successfully!");
      setMassGradingCourse(null);
    } finally { setMassSubmitting(false); }
  };

  return (
    <>
      <h2 className="text-xl font-bold mb-6">Award Grades</h2>

      {/* MODE SELECTOR */}
      {!selectedCourse && !massGradingCourse && (
        <div className="flex mb-6 border border-gray-400 w-fit bg-white">
          <button
            onClick={() => handleModeChange("individual")}
            className={`px-4 py-2 text-sm font-semibold border-r border-gray-400 ${gradingMode === "individual" ? "bg-gray-200" : "hover:bg-gray-50"}`}
          >
            Individual Grading
          </button>
          <button
            onClick={() => handleModeChange("mass")}
            className={`px-4 py-2 text-sm font-semibold ${gradingMode === "mass" ? "bg-gray-200" : "hover:bg-gray-50"}`}
          >
            Mass Grading (CSV)
          </button>
        </div>
      )}

      {/* STEP 1: COURSE SELECTION TABLE */}
      {((gradingMode === "individual" && !selectedCourse) || (gradingMode === "mass" && !massGradingCourse)) && (
        <div className="overflow-x-auto bg-white border border-gray-400">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-400">
              <tr>
                <th className="px-3 py-2 text-left">Course Code</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Department</th>
                <th className="px-3 py-2 text-left">Seats</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.course_id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-semibold">{c.course_code}</td>
                  <td className="px-3 py-2">{c.title}</td>
                  <td className="px-3 py-2">{c.department}</td>
                  <td className="px-3 py-2">{c.enrolled_count}/{c.capacity}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => gradingMode === "individual" ? setSelectedCourse(c) : setMassGradingCourse(c)}
                      className="border border-gray-400 px-3 py-1 text-xs hover:bg-gray-100"
                    >
                      Select Course
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* STEP 2: INDIVIDUAL GRADING INTERFACE */}
      {selectedCourse && (
        <div className="space-y-4">
          <button onClick={() => setSelectedCourse(null)} className="text-sm font-semibold underline mb-2">
            &larr; Back to Course List
          </button>
          
          <div className="border border-gray-400 p-4 bg-white">
            <h3 className="font-bold">{selectedCourse.course_code} - {selectedCourse.title}</h3>
            <p className="text-xs text-gray-600 mt-1">{selectedCourse.department} | Session: {selectedCourse.acad_session}</p>
          </div>

          <div className="overflow-x-auto bg-white border border-gray-400">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left">Student Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Current Grade</th>
                  <th className="px-3 py-2 text-left">New Grade</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map((s) => (
                  <tr key={s.enrollment_id} className="border-b">
                    <td className="px-3 py-2 font-medium">{s.student?.full_name}</td>
                    <td className="px-3 py-2 text-gray-600">{s.student?.email}</td>
                    <td className="px-3 py-2">{s.grade || "—"}</td>
                    <td className="px-3 py-2">
                      <select
                        value={grades[s.enrollment_id] || ""}
                        onChange={(e) => handleGradeChange(s.enrollment_id, e.target.value)}
                        className="border border-gray-400 px-2 py-1 text-xs"
                      >
                        <option value="">Select</option>
                        {GRADING_SCHEME.map((g) => (
                          <option key={g.grade} value={g.grade}>{g.display}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setSelectedCourse(null)} className="border border-gray-400 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
            <button 
                onClick={handleSubmitGrades} 
                disabled={submitting} 
                className="bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Award All Grades"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MASS GRADING INTERFACE */}
      {massGradingCourse && (
        <div className="space-y-4">
          <button onClick={() => setMassGradingCourse(null)} className="text-sm font-semibold underline">&larr; Back</button>
          <div className="border border-gray-400 p-4 bg-white">
            <h3 className="font-bold">Mass Grading: {massGradingCourse.course_code}</h3>
            <div className="mt-4">
                <label className="block text-xs font-bold mb-1">UPLOAD CSV (Student Name, Email, Grade)</label>
                <input type="file" onChange={handleCSVUpload} className="text-xs border border-gray-400 p-1 w-full" />
            </div>
            {csvData.length > 0 && (
                <button onClick={handleValidateCSV} className="mt-3 border border-gray-400 px-3 py-1 text-xs hover:bg-gray-100">
                    Validate CSV Data
                </button>
            )}
          </div>

          {validationResults && (
            <div className="border border-gray-400 p-4 bg-white">
                <p className="text-sm mb-2">Valid Rows: <span className="text-green-700 font-bold">{validationResults.valid_rows?.length}</span></p>
                {validationResults.invalid_rows?.length > 0 && (
                    <p className="text-sm text-red-600 mb-4">Errors found in {validationResults.invalid_rows.length} rows.</p>
                )}
                <button 
                    onClick={handleMassGradeSubmit}
                    disabled={massSubmitting || validationResults.invalid_rows?.length > 0}
                    className="bg-black text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
                >
                    {massSubmitting ? "Uploading..." : "Confirm & Submit Grades"}
                </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}