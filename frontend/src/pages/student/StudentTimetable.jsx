import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentTimetable() {
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("personal"); // "generic" or "personal"

  // CHANGED: sessionStorage -> localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const CURRENT_SESSION = "2025-II";

  // Time slots
  const TIMES = [
    { label: "8:00-8:50", value: "8:00-8:50", isTutorial: true },
    { label: "9:00-9:50", value: "9:00-9:50", isTutorial: false },
    { label: "10:00-10:50", value: "10:00-10:50", isTutorial: false },
    { label: "11:00-11:50", value: "11:00-11:50", isTutorial: false },
    { label: "12:00-12:50", value: "12:00-12:50", isTutorial: false },
    { label: "Lunch Break", value: "lunch", isTutorial: false },
    { label: "2:00-2:50", value: "2:00-2:50", isTutorial: false },
    { label: "3:00-3:50", value: "3:00-3:50", isTutorial: false },
    { label: "4:00-4:50", value: "4:00-4:50", isTutorial: false },
    { label: "5:00-5:50", value: "5:00-5:50", isTutorial: false },
    { label: "6:00-6:50", value: "6:00-6:50", isTutorial: true },
  ];

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Generic timetable structure (template) based on IIT Ropar schedule
  const GENERIC_TIMETABLE = {
    "Monday-8:00-8:50": "PCE-1",
    "Monday-9:00-9:50": "PC-1",
    "Monday-10:00-10:50": "PC-2",
    "Monday-11:00-11:50": "PC-3",
    "Monday-12:00-12:50": "PC-4",
    "Monday-2:00-2:50": "—",
    "Monday-3:00-3:50": "—",
    "Monday-4:00-4:50": "PCE-1",
    "Monday-5:00-5:50": "PCE-2",
    "Monday-6:00-6:50": "PC-1",

    "Tuesday-8:00-8:50": "PCE-3",
    "Tuesday-9:00-9:50": "PC-1",
    "Tuesday-10:00-10:50": "PC-2",
    "Tuesday-11:00-11:50": "PC-3",
    "Tuesday-12:00-12:50": "HSPE",
    "Tuesday-2:00-2:50": "PCE-1 LAB",
    "Tuesday-3:00-3:50": "PCE-1 LAB",
    "Tuesday-4:00-4:50": "PCE-3",
    "Tuesday-5:00-5:50": "PCE-4",
    "Tuesday-6:00-6:50": "PC-2",

    "Wednesday-8:00-8:50": "PCE-4",
    "Wednesday-9:00-9:50": "PC-1",
    "Wednesday-10:00-10:50": "PC-2",
    "Wednesday-11:00-11:50": "PC-3",
    "Wednesday-12:00-12:50": "PCE-3",
    "Wednesday-2:00-2:50": "PCE-4 LAB",
    "Wednesday-3:00-3:50": "PCE-4 LAB",
    "Wednesday-4:00-4:50": "HSME",
    "Wednesday-5:00-5:50": "PCE-4",
    "Wednesday-6:00-6:50": "PC-3",

    "Thursday-8:00-8:50": "PCE-2",
    "Thursday-9:00-9:50": "PCE-3 LAB",
    "Thursday-10:00-10:50": "PCE-3 LAB",
    "Thursday-11:00-11:50": "PC-4",
    "Thursday-12:00-12:50": "HSPE",
    "Thursday-2:00-2:50": "HSME",
    "Thursday-3:00-3:50": "PCE-1",
    "Thursday-4:00-4:50": "PCE-2",
    "Thursday-5:00-5:50": "PCE-4",
    "Thursday-6:00-6:50": "PC-4",

    "Friday-8:00-8:50": "HSME",
    "Friday-9:00-9:50": "PCE-2 LAB",
    "Friday-10:00-10:50": "PCE-2 LAB",
    "Friday-11:00-11:50": "PC-4",
    "Friday-12:00-12:50": "HSPE",
    "Friday-2:00-2:50": "HSME",
    "Friday-3:00-3:50": "PCE-1",
    "Friday-4:00-4:50": "PCE-2",
    "Friday-5:00-5:50": "PCE-3",
    "Friday-6:00-6:50": "HSPE",
  };

  useEffect(() => {
    if (!user || !user.id) return;
    setLoading(true);
    api
      .get("/student/records", {
        params: {
          student_id: user.id,
          session: CURRENT_SESSION,
        },
      })
      .then((res) => {
        const data = res.data.records || res.data;
        
        // Filter only ENROLLED courses
        const enrolledCourses = (Array.isArray(data) ? data : []).filter(
          (r) => r.status === "ENROLLED"
        );
        
        setEnrolled(enrolledCourses);
      })
      .catch((err) => {
        console.error("❌ Error fetching timetable:", err);
        setError("Failed to load timetable");
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Get course at specific day and time (for personal timetable)
  const getStudentCourseAtSlot = (day, timeValue) => {
    // Skip lunch break
    if (timeValue === "lunch") return null;
    
    const slotKey = `${day}-${timeValue}`;
    
    // Find any enrolled course that has a slot matching this day-time position
    const course = enrolled.find((course) => {
      const studentSlot = course.courses?.slot;
      if (!studentSlot) return false;
      
      // Look up what slot code should be at this day-time
      const expectedSlotAtThisTime = GENERIC_TIMETABLE[slotKey];
      
      // Check if the course's slot matches (handle lab slots)
      const baseSlot = studentSlot.split(" ")[0];
      const expectedBaseSlot = expectedSlotAtThisTime?.split(" ")[0];
      
      const matches = baseSlot === expectedBaseSlot;
      
      return matches;
    });
    
    return course;
  };

  if (!user) return <p>Loading session...</p>;

  if (loading) {
    return <p className="text-gray-600">Loading timetable...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">📅 Timetable</h2>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-lg shadow-lg mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm opacity-90">Enrolled Courses</p>
            <p className="text-3xl font-bold">{enrolled.length}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Session</p>
            <p className="text-xl font-bold">{CURRENT_SESSION}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Status</p>
            <p className="text-xl font-bold">Active</p>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setViewMode("generic")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            viewMode === "generic"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          📋 General Timetable
        </button>
        <button
          onClick={() => setViewMode("personal")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            viewMode === "personal"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          📅 My Timetable
        </button>
      </div>

      {/* ============================================================ */}
      {/* GENERIC TIMETABLE (Template) */}
      {/* ============================================================ */}
      {viewMode === "generic" && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800">IIT Ropar General Timetable</h3>
            <p className="text-sm text-gray-600 mt-1">
              Standard timetable structure showing all available time slots and room codes. <span className="font-semibold">(Tut) = Tutorial Slot</span>
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg overflow-x-auto border border-blue-200">
            <table className="w-full border-collapse text-sm">
              {/* Header */}
              <thead>
                <tr>
                  <th className="bg-gray-900 text-white p-3 text-left font-semibold border">Timings</th>
                  {DAYS.map((day) => (
                    <th key={day} className="bg-blue-600 text-white p-3 text-center font-semibold border">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {TIMES.map((timeObj) => (
                  <tr key={timeObj.value}>
                    {/* Time slot column */}
                    <td className={`p-3 font-semibold border text-left whitespace-nowrap ${
                      timeObj.isTutorial ? "bg-orange-50" : "bg-gray-100"
                    }`}>
                      <span className="text-xs md:text-sm">
                        {timeObj.label}
                        {timeObj.isTutorial && <span className="text-orange-600 font-bold"> (Tut)</span>}
                      </span>
                    </td>

                    {/* Day columns - Generic slots */}
                    {DAYS.map((day) => {
                      const slotKey = `${day}-${timeObj.value}`;
                      const slotValue = GENERIC_TIMETABLE[slotKey];
                      
                      return (
                        <td
                          key={`generic-${day}-${timeObj.value}`}
                          className={`p-2 border text-center text-xs md:text-sm font-semibold ${
                            timeObj.value === "lunch"
                              ? "bg-yellow-50 text-yellow-700"
                              : slotValue === "—"
                              ? "bg-gray-50 text-gray-300"
                              : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {slotValue === "—" ? "—" : slotValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PERSONAL TIMETABLE */}
      {/* ============================================================ */}
      {viewMode === "personal" && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800">My Enrolled Courses</h3>
            <p className="text-sm text-gray-600 mt-1">
              Your enrolled courses are highlighted below. Empty slots show "—".
            </p>
          </div>
        
        {enrolled.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-300 p-12 rounded-lg text-center shadow-sm">
            <p className="text-2xl">🎓</p>
            <p className="text-gray-700 font-bold text-lg mt-3">No Enrolled Courses</p>
            <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
              Your class schedule will appear here once you enroll in courses. Visit the <span className="font-semibold">Courses</span> section to register for classes.
            </p>
          </div>
        ) : (
          <>
          <div className="bg-white rounded-lg shadow-lg overflow-x-auto border border-blue-200 mb-6">
            <table className="w-full border-collapse text-sm">
              {/* Header */}
              <thead>
                <tr>
                  <th className="bg-gray-900 text-white p-3 text-left font-semibold border">Timings</th>
                  {DAYS.map((day) => (
                    <th key={day} className="bg-blue-600 text-white p-3 text-center font-semibold border">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {TIMES.map((timeObj) => (
                  <tr key={timeObj.value}>
                    {/* Time slot column */}
                    <td className={`p-3 font-semibold border text-left whitespace-nowrap ${
                      timeObj.isTutorial ? "bg-orange-50" : "bg-gray-100"
                    }`}>
                      <span className="text-xs md:text-sm">
                        {timeObj.label}
                        {timeObj.isTutorial && <span className="text-orange-600 font-bold"> (Tut)</span>}
                      </span>
                    </td>

                    {/* Day columns - Student courses */}
                    {DAYS.map((day) => {
                      const course = getStudentCourseAtSlot(day, timeObj.value);
                      const slotKey = `${day}-${timeObj.value}`;
                      const expectedSlot = GENERIC_TIMETABLE[slotKey];
                      
                      return (
                        <td
                          key={`${day}-${timeObj.value}`}
                          className={`p-3 border text-center font-semibold transition ${
                            course
                              ? "bg-blue-100 text-blue-900 border-blue-400"
                              : timeObj.value === "lunch"
                              ? "bg-yellow-50 text-yellow-700"
                              : expectedSlot === "—"
                              ? "bg-gray-50 text-gray-300"
                              : "bg-white text-gray-400"
                          }`}
                        >
                          {course ? (
                            <div className="text-xs md:text-sm">
                              <div className="font-bold">{course.courses?.course_code}</div>
                              <div className="text-xs opacity-75">{course.courses?.slot}</div>
                            </div>
                          ) : timeObj.value === "lunch" ? (
                            "🍽️"
                          ) : expectedSlot === "—" ? (
                            "—"
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          {enrolled.length > 0 && (
            <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md border border-blue-200">
              <h3 className="text-lg font-bold text-blue-900 mb-5 flex items-center gap-2">
                <span>📚</span> Your Enrolled Courses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrolled.map((course, idx) => (
                  <div 
                    key={course.enrollment_id} 
                    className="flex items-start gap-3 bg-white p-4 rounded-lg border-l-4 border-blue-600 shadow-sm hover:shadow-md transition duration-200 hover:border-indigo-600"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-blue-900 text-sm">{course.courses?.course_code}</div>
                      <div className="text-xs text-gray-600 truncate mt-1">{course.courses?.title}</div>
                      <div className="text-xs text-gray-700 mt-2">
                        <span className="font-semibold text-gray-800">Slot: </span>
                        <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded inline-block font-semibold">
                          {course.courses?.slot}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
        )}
      </div> 
      )} 
    </div>
  );
}