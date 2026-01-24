import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentTimetable() {
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("personal");

  // ✅ FIX 1: use localStorage consistently
  const user = JSON.parse(localStorage.getItem("user"));
  const CURRENT_SESSION = "2025-II";

  const TIMES = [
    { label: "8:00-8:50", value: "8:00-8:50", isTutorial: true },
    { label: "9:00-9:50", value: "9:00-9:50" },
    { label: "10:00-10:50", value: "10:00-10:50" },
    { label: "11:00-11:50", value: "11:00-11:50" },
    { label: "12:00-12:50", value: "12:00-12:50" },
    { label: "Lunch Break", value: "lunch" },
    { label: "2:00-2:50", value: "2:00-2:50" },
    { label: "3:00-3:50", value: "3:00-3:50" },
    { label: "4:00-4:50", value: "4:00-4:50" },
    { label: "5:00-5:50", value: "5:00-5:50" },
    { label: "6:00-6:50", value: "6:00-6:50", isTutorial: true },
  ];

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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

  // ✅ FIX 2: safe fetch + no infinite loading
  useEffect(() => {
    if (!user || !user.id) {
      setLoading(false);
      setError("Session expired. Please login again.");
      return;
    }

    setLoading(true);
    api
      .get("/student/records", {
        params: { student_id: user.id, session: CURRENT_SESSION },
      })
      .then((res) => {
        const records = res.data?.records || [];
        setEnrolled(records.filter(r => r.status === "ENROLLED"));
        setError(null);
      })
      .catch(() => {
        setError("Failed to load timetable");
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const getStudentCourseAtSlot = (day, time) => {
    if (time === "lunch") return null;
    const expected = GENERIC_TIMETABLE[`${day}-${time}`];
    return enrolled.find(r => {
      const slot = r.courses?.slot;
      return slot && expected && slot.split(" ")[0] === expected.split(" ")[0];
    });
  };

  if (loading) {
    return <div className="p-10 text-gray-500">Loading academic records...</div>;
  }

  if (error) {
    return <div className="p-10 text-red-600 font-bold">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold">INDIAN INSTITUTE OF TECHNOLOGY ROPAR</h1>
        <h2 className="font-semibold">
          Academic Timetable {CURRENT_SESSION} for UG / PG / PhD (continuing batch)
        </h2>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-white border rounded">
          <button
            onClick={() => setViewMode("personal")}
            className={`px-4 py-2 text-sm font-semibold border-r ${
              viewMode === "personal" ? "bg-gray-800 text-white" : ""
            }`}
          >
            My Timetable
          </button>
          <button
            onClick={() => setViewMode("generic")}
            className={`px-4 py-2 text-sm font-semibold ${
              viewMode === "generic" ? "bg-gray-800 text-white" : ""
            }`}
          >
            General Template
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full border border-black text-sm">
          <thead>
            <tr className="font-bold text-center">
              <th className="border border-black p-2 text-left">Timings</th>
              {DAYS.map(day => (
                <th key={day} className="border border-black p-2">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map(t => (
              <tr key={t.value}>
                <td className="border border-black p-2 font-semibold">
                  {t.label}{t.isTutorial ? " (Tut)" : ""}
                </td>
                {DAYS.map(day => {
                  const course = getStudentCourseAtSlot(day, t.value);
                  const generic = GENERIC_TIMETABLE[`${day}-${t.value}`];
                  return (
                    <td key={day + t.value} className="border border-black p-2 text-center">
                      {t.value === "lunch"
                        ? "Break"
                        : viewMode === "personal"
                        ? course ? course.courses.course_code : "—"
                        : generic || "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
