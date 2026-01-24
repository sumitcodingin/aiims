import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentTimetable() {
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("personal"); // "generic" or "personal"

  const user = JSON.parse(sessionStorage.getItem("user")) || { id: "default" };
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
  }, [user.id]);

  const getStudentCourseAtSlot = (day, timeValue) => {
    if (timeValue === "lunch") return null;
    const slotKey = `${day}-${timeValue}`;
    return enrolled.find((course) => {
      const studentSlot = course.courses?.slot;
      if (!studentSlot) return false;
      const expectedSlotAtThisTime = GENERIC_TIMETABLE[slotKey];
      const baseSlot = studentSlot.split(" ")[0];
      const expectedBaseSlot = expectedSlotAtThisTime?.split(" ")[0];
      return baseSlot === expectedBaseSlot;
    });
  };

  if (loading) {
    return <div className="p-10 font-sans text-gray-500 italic">Loading academic records...</div>;
  }

  if (error) {
    return <div className="p-10 text-red-600 font-bold">{error}</div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 font-sans bg-white min-h-screen text-slate-900">
      
      {/* Header Section - Matching Screenshot Layout */}
      <div className="relative text-center mb-10 border-b pb-6 border-slate-200">
        <h1 className="text-2xl font-bold uppercase tracking-wide">INDIAN INSTITUTE OF TECHNOLOGY ROPAR</h1>
        <h2 className="text-lg font-semibold mt-1">
          Academic Timetable {CURRENT_SESSION} for UG / PG / PhD (continuing batch)
        </h2>
        
        {/* Mock Download Button to match Screenshot */}
        <button className="absolute right-0 top-0 bg-[#2d3436] text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-slate-700 transition">
          Download PDF
        </button>
      </div>

      {/* Navigation Toggles - Styled to match Instructor Portal tone */}
      <div className="flex gap-1 mb-8 bg-slate-100 p-1 rounded w-fit">
        <button
          onClick={() => setViewMode("personal")}
          className={`px-6 py-2 text-xs font-bold uppercase tracking-wider transition ${
            viewMode === "personal"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          My Timetable
        </button>
        <button
          onClick={() => setViewMode("generic")}
          className={`px-6 py-2 text-xs font-bold uppercase tracking-wider transition ${
            viewMode === "generic"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          General Template
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-800 text-sm">
          <thead>
            <tr>
              <th className="border border-slate-800 p-3 bg-slate-50 text-left font-bold uppercase tracking-tighter w-40">
                Timings
              </th>
              {DAYS.map((day) => (
                <th key={day} className="border border-slate-800 p-3 bg-slate-50 text-center font-bold uppercase tracking-tight">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map((timeObj) => (
              <tr key={timeObj.value} className={timeObj.value === "lunch" ? "bg-slate-50" : ""}>
                {/* Time slot column */}
                <td className={`border border-slate-800 p-3 font-semibold text-xs whitespace-nowrap ${
                  timeObj.isTutorial ? "italic text-slate-600" : ""
                }`}>
                  {timeObj.label}
                  {timeObj.isTutorial && <div className="text-[10px] text-orange-700 font-bold not-italic">TUTORIAL</div>}
                </td>

                {/* Day columns */}
                {DAYS.map((day) => {
                  const personalCourse = getStudentCourseAtSlot(day, timeObj.value);
                  const genericSlot = GENERIC_TIMETABLE[`${day}-${timeObj.value}`];
                  
                  return (
                    <td
                      key={`${day}-${timeObj.value}`}
                      className={`border border-slate-800 p-2 text-center align-middle h-16 transition-colors ${
                        personalCourse && viewMode === "personal" ? "bg-blue-50/50" : ""
                      }`}
                    >
                      {timeObj.value === "lunch" ? (
                        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Break</span>
                      ) : viewMode === "personal" ? (
                        personalCourse ? (
                          <div className="leading-tight">
                            <div className="font-bold text-blue-900 underline decoration-blue-200">{personalCourse.courses?.course_code}</div>
                            <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{personalCourse.courses?.slot}</div>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )
                      ) : (
                        <span className={`font-medium ${genericSlot === "—" ? "text-slate-300" : "text-slate-700"}`}>
                          {genericSlot || "—"}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / Legend - Clean Academic Style */}
      {viewMode === "personal" && enrolled.length > 0 && (
        <div className="mt-12 border-t-2 border-slate-800 pt-6">
          <h3 className="text-lg font-bold mb-6 uppercase tracking-wider flex items-center gap-3">
            <span className="bg-slate-800 text-white px-2 py-0.5 text-sm">List</span> 
            Enrolled Course Registry
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-slate-200">
            {enrolled.map((course, idx) => (
              <div 
                key={course.enrollment_id} 
                className="p-4 border-r border-b border-slate-200 hover:bg-slate-50 flex items-start gap-4"
              >
                <span className="text-xs font-bold text-slate-400">0{idx + 1}</span>
                <div>
                  <div className="font-bold text-slate-900 tracking-tight">{course.courses?.course_code}</div>
                  <div className="text-xs text-slate-600 line-clamp-1 mb-2">{course.courses?.title}</div>
                  <div className="inline-block bg-slate-100 border border-slate-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                    Slot: {course.courses?.slot}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {viewMode === "personal" && enrolled.length === 0 && (
        <div className="mt-12 p-12 text-center border-2 border-dashed border-slate-200 text-slate-400">
          <p className="text-sm font-medium">No courses found for session {CURRENT_SESSION}.</p>
          <p className="text-xs mt-1 italic text-slate-300">Please contact the registrar if this is an error.</p>
        </div>
      )}
    </div>
  );
}