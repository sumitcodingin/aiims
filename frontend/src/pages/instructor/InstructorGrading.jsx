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

  // Main mode: "individual" or "mass"
  const [gradingMode, setGradingMode] = useState("individual");

  // Individual grading state
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [grades, setGrades] = useState({});

  // Mass grading state
  const [massGradingCourse, setMassGradingCourse] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [massSubmitting, setMassSubmitting] = useState(false);

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

  /* ================= HANDLE MODE CHANGE ================= */
  const handleModeChange = (mode) => {
    setGradingMode(mode);
    // Clear any selected course when switching modes
    setSelectedCourse(null);
    setMassGradingCourse(null);
    setEnrolledStudents([]);
    setGrades({});
    setCsvData([]);
    setValidationResults(null);
  };

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

      // Update the enrolledStudents with the new grades
      const updatedStudents = enrolledStudents.map((student) => ({
        ...student,
        grade: grades[student.enrollment_id],
      }));
      setEnrolledStudents(updatedStudents);

      // Clear the "New Grade" dropdowns
      setGrades({});

      alert("✅ Grades awarded successfully!");
    } catch (err) {
      console.error("Failed to award grades:", err);
      alert("Failed to award grades. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= MASS GRADING: PARSE CSV ================= */
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.trim().split("\n");
        
        if (lines.length < 2) {
          alert("CSV file must have at least header row and one data row.");
          return;
        }

        // Parse CSV (simple parser - assumes no commas in data)
        const rows = lines.map((line) => line.split(",").map((cell) => cell.trim()));
        const header = rows[0];

        // Validate header
        if (header[0].toLowerCase() !== "student name" || 
            header[1].toLowerCase() !== "email" || 
            header[2].toLowerCase() !== "grade") {
          alert("Invalid CSV format. Expected columns: Student Name, Email, Grade");
          return;
        }

        // Extract data rows
        const data = rows.slice(1).map((row) => ({
          name: row[0],
          email: row[1],
          grade: row[2],
        }));

        setCsvData(data);
        setValidationResults(null); // Reset validation
      } catch (err) {
        alert("Error parsing CSV file. Please ensure it's properly formatted.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  /* ================= MASS GRADING: VALIDATE CSV ================= */
  const handleValidateCSV = async () => {
    if (!massGradingCourse) {
      alert("Please select a course first.");
      return;
    }

    if (csvData.length === 0) {
      alert("No data to validate.");
      return;
    }

    try {
      const response = await api.post("/instructor/validate-grades-csv", {
        course_id: massGradingCourse.course_id,
        instructor_id: user.id,
        data: csvData,
        valid_grades: GRADING_SCHEME.map((g) => g.grade),
      });

      setValidationResults(response.data);
    } catch (err) {
      console.error("Validation error:", err);
      alert("Error validating CSV data.");
    }
  };

  /* ================= MASS GRADING: SUBMIT VALIDATED DATA ================= */
  const handleMassGradeSubmit = async () => {
    if (!validationResults || validationResults.invalid_rows.length > 0) {
      alert("Cannot submit. There are validation errors.");
      return;
    }

    if (!window.confirm(`Award grades to ${validationResults.valid_rows.length} students?`)) {
      return;
    }

    setMassSubmitting(true);
    try {
      await api.post("/instructor/submit-mass-grades", {
        course_id: massGradingCourse.course_id,
        instructor_id: user.id,
        grades: validationResults.valid_rows,
      });

      alert("✅ Grades uploaded successfully!");
      setCsvData([]);
      setValidationResults(null);
      setMassGradingCourse(null);
    } catch (err) {
      console.error("Failed to submit grades:", err);
      alert("Failed to submit grades.");
    } finally {
      setMassSubmitting(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-8 py-2">
      <div className="border-b pb-6">
        <h1 className="text-4xl font-bold text-gray-900">Award Grades</h1>
        <p className="text-gray-600 mt-2">Manage and assign grades to your students</p>
      </div>

      {/* ================= MODE SELECTOR - ONLY SHOW WHEN NO COURSE SELECTED ================= */}
      {!selectedCourse && !massGradingCourse && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-1 flex w-fit">
          <button
            onClick={() => handleModeChange("individual")}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              gradingMode === "individual"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Individual Grading
          </button>
          <button
            onClick={() => handleModeChange("mass")}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              gradingMode === "mass"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Mass Grading (CSV)
          </button>
        </div>
      )}

      {/* ================= INDIVIDUAL GRADING MODE - COURSE SELECTOR ================= */}
      {gradingMode === "individual" && !selectedCourse && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Select a Course to Begin Grading</h2>
          
          {courses.length === 0 ? (
            <p className="text-gray-500 font-medium">No courses available for grading</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <button
                  key={course.course_id}
                  onClick={() => setSelectedCourse(course)}
                  className="p-5 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition">
                      {course.course_code}
                    </h3>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded group-hover:bg-blue-100 group-hover:text-blue-700 transition">
                      {course.enrolled_count}/{course.capacity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 group-hover:text-gray-900 transition">
                    {course.title}
                  </p>
                  <div className="space-y-1 text-xs">
                    <p className="text-gray-500">
                      <span className="font-semibold text-gray-700">Department:</span> {course.department}
                    </p>
                    <p className="text-gray-500">
                      <span className="font-semibold text-gray-700">Session:</span> {course.acad_session}
                    </p>
                  </div>
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
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition flex items-center gap-1"
          >
            ← Return to Course Selection
          </button>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCourse.course_code}
            </h2>
            <p className="text-gray-600 mt-1">{selectedCourse.title}</p>
            <div className="mt-4 flex gap-8 text-sm">
              <div>
                <span className="font-semibold text-gray-900">Department:</span>
                <p className="text-gray-600">{selectedCourse.department}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-900">Session:</span>
                <p className="text-gray-600">{selectedCourse.acad_session}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-900">Enrolled Students:</span>
                <p className="text-gray-600">{selectedCourse.enrolled_count}/{selectedCourse.capacity}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600 font-medium">Loading enrolled students...</p>
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500 font-medium">No enrolled students in this course</p>
            </div>
          ) : (
            <>
              {/* ================= STUDENTS TABLE ================= */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900">
                    Assign Grades to {enrolledStudents.length} Student(s)
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Select a grade for each student below</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">
                          STUDENT NAME
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">
                          EMAIL
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">
                          CURRENT GRADE
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">
                          NEW GRADE
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {enrolledStudents.map((student) => (
                        <tr
                          key={student.enrollment_id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-8 py-4">
                            <p className="font-semibold text-gray-900">
                              {student.student?.full_name}
                            </p>
                          </td>
                          <td className="px-8 py-4 text-sm text-gray-600">
                            {student.student?.email}
                          </td>
                          <td className="px-8 py-4 text-sm">
                            <span className={`font-semibold px-3 py-1 rounded ${
                              student.grade 
                                ? "bg-blue-50 text-blue-700" 
                                : "bg-gray-100 text-gray-500"
                            }`}>
                              {student.grade || "—"}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-sm">
                            <select
                              value={grades[student.enrollment_id] || ""}
                              onChange={(e) =>
                                handleGradeChange(
                                  student.enrollment_id,
                                  e.target.value
                                )
                              }
                              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 text-sm font-medium"
                            >
                              <option value="">Select Grade</option>
                              {GRADING_SCHEME.map((item) => (
                                <option
                                  key={item.grade}
                                  value={item.grade}
                                >
                                  {item.display}
                                  {item.points !== null ? ` (${item.points} pts)` : ""}
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
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                <h4 className="text-sm font-bold text-gray-900 tracking-wide mb-4 uppercase">
                  Grading Scheme Reference
                </h4>
                <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {GRADING_SCHEME.map((item) => (
                    <div
                      key={item.grade}
                      className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-center hover:bg-gray-100 transition"
                    >
                      <span className="font-bold text-gray-900 text-sm">
                        {item.display}
                      </span>
                      {item.points !== null && (
                        <div className="text-gray-600 text-xs mt-1 font-medium">
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
                  className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-900 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitGrades}
                  disabled={submitting}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Processing..." : "Award Grades"}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* ================= MASS GRADING MODE ================= */}
      {gradingMode === "mass" && (
        <>
          {/* Step 1: Select Course */}
          {!massGradingCourse && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Select Course for Mass Grading</h2>
                <p className="text-sm text-gray-600 mt-1">Upload grades for multiple students via CSV file</p>
              </div>
              {courses.length === 0 ? (
                <div className="px-8 py-12 text-center">
                  <p className="text-gray-500 font-medium">No courses available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">COURSE CODE</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">TITLE</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">DEPARTMENT</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">SESSION</th>
                        <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 tracking-wide">ENROLLED</th>
                        <th className="px-8 py-4 text-center text-sm font-semibold text-gray-900 tracking-wide">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {courses.map((course) => (
                        <tr key={course.course_id} className="hover:bg-gray-50 transition">
                          <td className="px-8 py-4">
                            <p className="font-semibold text-gray-900">{course.course_code}</p>
                          </td>
                          <td className="px-8 py-4">
                            <p className="text-sm text-gray-900">{course.title}</p>
                          </td>
                          <td className="px-8 py-4 text-sm text-gray-600">{course.department}</td>
                          <td className="px-8 py-4 text-sm text-gray-600">{course.acad_session}</td>
                          <td className="px-8 py-4 text-sm font-medium text-gray-900">
                            {course.enrolled_count}/{course.capacity}
                          </td>
                          <td className="px-8 py-4 text-center">
                            <button
                              onClick={() => setMassGradingCourse(course)}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition"
                            >
                              Select
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

          {/* Step 2: Upload CSV */}
          {massGradingCourse && (
            <>
              <button
                onClick={() => setMassGradingCourse(null)}
                className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition flex items-center gap-1"
              >
                ← Return to Course Selection
              </button>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {massGradingCourse.course_code}
                </h2>
                <p className="text-gray-600 mt-1">{massGradingCourse.title}</p>
                <div className="mt-4 flex gap-8 text-sm">
                  <div>
                    <span className="font-semibold text-gray-900">Department:</span>
                    <p className="text-gray-600">{massGradingCourse.department}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Session:</span>
                    <p className="text-gray-600">{massGradingCourse.acad_session}</p>
                  </div>
                </div>
              </div>

              {/* CSV Upload */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Upload CSV File</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Upload a CSV file with exactly three columns: <span className="font-semibold text-gray-900">Student Name</span>, <span className="font-semibold text-gray-900">Email</span>, and <span className="font-semibold text-gray-900">Grade</span>
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Select File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100 transition cursor-pointer"
                  />
                </div>

                {csvData.length > 0 && (
                  <>
                    <p className="text-sm font-semibold text-gray-900 mb-4">
                      ✓ {csvData.length} row(s) parsed from CSV file
                    </p>
                    <button
                      onClick={handleValidateCSV}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                    >
                      Validate Data
                    </button>
                  </>
                )}
              </div>

              {/* Validation Results */}
              {validationResults && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Validation Results</h3>

                  {validationResults.valid_rows.length > 0 && (
                    <div className="mb-8">
                      <p className="text-sm font-bold text-blue-700 mb-4 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full text-blue-700">✓</span>
                        Valid: {validationResults.valid_rows.length} row(s)
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-blue-100 border-b border-blue-200">
                              <th className="px-6 py-4 text-left font-semibold text-gray-900">Student Name</th>
                              <th className="px-6 py-4 text-left font-semibold text-gray-900">Email</th>
                              <th className="px-6 py-4 text-left font-semibold text-gray-900">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-blue-200">
                            {validationResults.valid_rows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-blue-100 transition">
                                <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                                <td className="px-6 py-4 text-gray-600">{row.email}</td>
                                <td className="px-6 py-4 font-semibold text-gray-900">{row.grade}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {validationResults.invalid_rows.length > 0 && (
                    <div className="mb-8">
                      <p className="text-sm font-bold text-red-700 mb-4 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 rounded-full text-red-700">✕</span>
                        Invalid: {validationResults.invalid_rows.length} row(s)
                      </p>
                      <div className="bg-red-50 border border-red-200 rounded-lg overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-red-100 border-b border-red-200">
                              <th className="px-6 py-4 text-left font-semibold text-gray-900">Row #</th>
                              <th className="px-6 py-4 text-left font-semibold text-gray-900">Error</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-red-200">
                            {validationResults.invalid_rows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-red-100 transition">
                                <td className="px-6 py-4 font-medium text-gray-900">{row.row_number}</td>
                                <td className="px-6 py-4 text-red-700 font-medium">{row.error}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {validationResults.invalid_rows.length === 0 && (
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setCsvData([]);
                          setValidationResults(null);
                        }}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-900 transition"
                      >
                        Upload Different File
                      </button>
                      <button
                        onClick={handleMassGradeSubmit}
                        disabled={massSubmitting}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {massSubmitting ? "Processing..." : "Submit Grades"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
