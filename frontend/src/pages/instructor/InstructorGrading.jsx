import { useEffect, useState } from "react";
import api from "../../services/api";

const GRADING_SCHEME = [
  { grade: "A", display: "A" }, { grade: "A-", display: "A-" },
  { grade: "B", display: "B" }, { grade: "B-", display: "B-" },
  { grade: "C", display: "C" }, { grade: "C-", display: "C-" },
  { grade: "D", display: "D" }, { grade: "E", display: "E" },
  { grade: "F", display: "F" }, { grade: "NP", display: "NP" },
  { grade: "NF", display: "NF" }, { grade: "I", display: "I" },
  { grade: "W", display: "W" }, { grade: "S", display: "S" },
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
  const [isValidated, setIsValidated] = useState(false);
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
      .get("/instructor/applications", { params: { course_id: selectedCourse.course_id } })
      .then(res => {
        const enrolled = (res.data || []).filter(s => s.status === "ENROLLED");
        setEnrolledStudents(enrolled);
        const initialGrades = {};
        enrolled.forEach(s => { initialGrades[s.enrollment_id] = ""; });
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
      
      setCsvData(rows.map((r, index) => ({ 
        id: `row-${index}-${Date.now()}`,
        name: r[0] || "", 
        email: r[1] || "", 
        grade: r[2] || "" 
      })));
      setValidationResults(null);
      setIsValidated(false);
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input so same file can be re-uploaded
  };

  // FIXED REMOVE ROW FUNCTION
  const removeRow = (rowId) => {
    // 1. Remove the row from view
    setCsvData(prev => prev.filter(item => item.id !== rowId));

    // 2. Clear validation state to force user to re-validate 
    // This is the safest way to prevent 'undefined' errors and ensure data integrity
    setValidationResults(null);
    setIsValidated(false);
  };

  const handleValidateCSV = async () => {
    if (csvData.length === 0) return;
    try {
      const res = await api.post("/instructor/validate-grades", {
        course_id: massGradingCourse.course_id,
        instructor_id: user.id,
        data: csvData,
        valid_grades: GRADING_SCHEME.map(g => g.grade),
      });
      
      setValidationResults(res.data);
      setIsValidated(true);
      
      const invalidCount = res.data.invalid_rows?.length || 0;
      if (invalidCount > 0) {
        alert(`Validation complete: ${invalidCount} rows have errors.`);
      } else {
        alert("Validation successful.");
      }
    } catch (err) {
      alert("Error validating CSV data.");
    }
  };

  const handleMassSubmit = async () => {
    setMassSubmitting(true);
    try {
      await api.post("/instructor/submit-mass-grades", {
        course_id: massGradingCourse.course_id,
        instructor_id: user.id,
        grades: validationResults.valid_rows,
      });
      alert("Grades uploaded successfully");
      setMassGradingCourse(null);
      setCsvData([]);
      setValidationResults(null);
      setIsValidated(false);
    } catch (err) {
      alert("Failed to submit mass grades.");
    } finally {
      setMassSubmitting(false);
    }
  };

  if (!isSessionValid) return <div className="p-8 text-red-600 font-bold">Session expired</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-black">Award Grades</h2>

      {!selectedCourse && !massGradingCourse && (
        <div className="flex mb-6 bg-white border border-gray-300 w-fit">
          <button
            onClick={() => setGradingMode("individual")}
            className={`px-6 py-2 text-sm transition-all ${gradingMode === "individual" ? "bg-black text-white font-semibold" : "text-black hover:bg-gray-100"}`}
          >
            Individual Grading
          </button>
          <button
            onClick={() => setGradingMode("mass")}
            className={`px-6 py-2 text-sm transition-all ${gradingMode === "mass" ? "bg-black text-white font-semibold" : "text-black hover:bg-gray-100"}`}
          >
            Mass Allocation (CSV)
          </button>
        </div>
      )}

      {/* INDIVIDUAL GRADING */}
      {gradingMode === "individual" && (
        <>
          {!selectedCourse ? (
            <CourseTable courses={courses} onSelect={setSelectedCourse} />
          ) : (
            <div className="bg-white border border-gray-300 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setSelectedCourse(null)} className="text-sm font-semibold hover:underline">
                  ← Back
                </button>
                <h3 className="text-xl font-bold text-black">{selectedCourse.course_code}: {selectedCourse.title}</h3>
              </div>
              <div className="border border-gray-300 overflow-hidden rounded-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-300 text-black">
                    <tr>
                      <th className="p-2 text-left font-semibold border-r border-gray-300">Student Name</th>
                      <th className="p-2 text-left font-semibold border-r border-gray-300">Email</th>
                      <th className="p-2 text-left font-semibold">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map(s => (
                      <tr key={s.enrollment_id} className="border-b border-gray-200">
                        <td className="p-2 border-r border-gray-200">{s.student?.full_name}</td>
                        <td className="p-2 border-r border-gray-200">{s.student?.email}</td>
                        <td className="p-2">
                          <select
                            value={grades[s.enrollment_id]}
                            onChange={e => handleGradeChange(s.enrollment_id, e.target.value)}
                            className="w-full border border-gray-300 px-2 py-1 outline-none focus:border-black"
                          >
                            <option value="">Select</option>
                            {GRADING_SCHEME.map(g => (<option key={g.grade} value={g.grade}>{g.display}</option>))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleSubmitGrades} disabled={submitting} className="mt-6 bg-black text-white px-6 py-2 text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50">
                {submitting ? "Submitting..." : "Award Grades"}
              </button>
            </div>
          )}
        </>
      )}

      {/* MASS ALLOCATION */}
      {gradingMode === "mass" && (
        <>
          {!massGradingCourse ? (
            <CourseTable courses={courses} onSelect={setMassGradingCourse} />
          ) : (
            <div className="bg-white border border-gray-300 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setMassGradingCourse(null)} className="text-sm font-semibold hover:underline">
                  ← Back
                </button>
                <h3 className="text-xl font-bold text-black">Mass Allocation: {massGradingCourse.course_code}</h3>
              </div>

              <div className="mb-6 p-4 border-2 border-dashed border-gray-300 bg-gray-50 flex items-center gap-4">
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800" />
              </div>

              {csvData.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-bold mb-3 text-sm uppercase text-gray-500">CSV Preview:</h4>
                  <div className="border border-gray-300 max-h-80 overflow-y-auto mb-6 rounded-sm">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-300 sticky top-0 z-10">
                        <tr>
                          <th className="p-2 border-r border-gray-300 text-left font-semibold">Name</th>
                          <th className="p-2 border-r border-gray-300 text-left font-semibold">Email</th>
                          <th className="p-2 border-r border-gray-300 text-left font-semibold">Grade</th>
                          <th className="p-2 text-center font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.map((row) => {
                          const isInvalid = isValidated && validationResults?.invalid_rows?.some(invalid => {
                            if (!invalid?.email || !row?.email) return false;
                            return invalid.email.trim().toLowerCase() === row.email.trim().toLowerCase();
                          });

                          return (
                            <tr key={row.id} className={`border-b border-gray-200 transition-colors ${isInvalid ? "bg-red-100" : "even:bg-gray-50"}`}>
                              <td className={`p-2 border-r border-gray-200 ${isInvalid ? "text-red-800" : ""}`}>{row.name}</td>
                              <td className={`p-2 border-r border-gray-200 ${isInvalid ? "text-red-800 font-semibold" : ""}`}>{row.email}</td>
                              <td className={`p-2 border-r border-gray-200 ${isInvalid ? "text-red-800 font-bold" : "font-medium"}`}>{row.grade}</td>
                              <td className="p-2 text-center">
                                <button 
                                  onClick={() => removeRow(row.id)}
                                  className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase hover:bg-red-700"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleValidateCSV} className="bg-white border-2 border-black px-5 py-2 text-sm font-bold hover:bg-black hover:text-white transition">
                      Validate CSV
                    </button>
                    {isValidated && (
                      <button 
                        disabled={massSubmitting || (validationResults?.invalid_rows?.length > 0)} 
                        onClick={handleMassSubmit} 
                        className="bg-black text-white px-6 py-2 text-sm font-bold hover:bg-gray-800 transition disabled:opacity-40"
                      >
                        {massSubmitting ? "Uploading..." : "Submit Grades"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CourseTable({ courses, onSelect }) {
  return (
    <div className="border border-gray-300 bg-white shadow-sm overflow-hidden rounded-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-300">
          <tr className="text-black">
            <th className="p-3 text-left font-semibold border-r border-gray-300">Course Code</th>
            <th className="p-3 text-left font-semibold border-r border-gray-300">Course Title</th>
            <th className="p-3 text-center font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(c => (
            <tr key={c.course_id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              <td className="p-3 border-r border-gray-200 font-bold text-black">{c.course_code}</td>
              <td className="p-3 border-r border-gray-200 text-gray-700">{c.title}</td>
              <td className="p-3 text-center">
                <button
                  onClick={() => onSelect(c)}
                  className="px-6 py-1.5 border-2 border-black text-black text-xs font-bold hover:bg-black hover:text-white uppercase transition-all"
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