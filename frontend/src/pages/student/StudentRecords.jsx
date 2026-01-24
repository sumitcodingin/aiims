import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentRecords() {
  const [records, setRecords] = useState([]);
  const [sgpa, setSgpa] = useState("0.00");
  const [allRecordsData, setAllRecordsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("current"); // "current" or "all"

  // 🔍 Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");

  // CHANGED: sessionStorage -> localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const CURRENT_SESSION = "2025-II";

  useEffect(() => {
    if (!user || !user.id) return;
    
    setLoading(true);
    Promise.all([
      api.get("/student/records", {
        params: {
          student_id: user.id,
          session: CURRENT_SESSION,
        },
      }),
      api.get("/student/all-records", {
        params: {
          student_id: user.id,
        },
      })
    ])
    .then(([recordsRes, allRes]) => {
      // Handle response structure
      const recordsData = recordsRes.data.records || recordsRes.data;
      const sgpaValue = recordsRes.data.sgpa || "0.00";
      
      setRecords(Array.isArray(recordsData) ? recordsData : []);
      setSgpa(sgpaValue);
      setAllRecordsData(allRes.data);
    })
    .catch((err) => {
      console.error("Error fetching records:", err);
      setRecords([]);
      setSgpa("0.00");
    })
    .finally(() => setLoading(false));
  }, [user?.id]);

  // -------------------------
  // Status helpers
  // -------------------------
  const statusText = (status) => {
    switch (status) {
      case "PENDING_INSTRUCTOR_APPROVAL":
        return "Pending Instructor Approval";
      case "PENDING_ADVISOR_APPROVAL":
        return "Pending Advisor Approval";
      case "ENROLLED":
        return "Enrolled";
      case "INSTRUCTOR_REJECTED":
        return "Rejected by Instructor";
      case "ADVISOR_REJECTED":
        return "Rejected by Advisor";
      case "DROPPED_BY_STUDENT":
        return "Dropped";
      default:
        return status;
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "ENROLLED":
        return "bg-green-100 text-green-700";
      case "PENDING_INSTRUCTOR_APPROVAL":
      case "PENDING_ADVISOR_APPROVAL":
        return "bg-yellow-100 text-yellow-700";
      case "INSTRUCTOR_REJECTED":
      case "ADVISOR_REJECTED":
      case "DROPPED_BY_STUDENT":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // -------------------------
  // Filtering Logic
  // -------------------------
  const filteredRecords = (Array.isArray(records) ? records : []).filter((r) => {
    if (!r.courses) return false;
    
    const matchesSearch =
      r.courses.course_code.toLowerCase().includes(search.toLowerCase()) ||
      r.courses.title.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!user) return <p>Loading session...</p>;

  // -------------------------
  // UI
  // -------------------------
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Academic Records
        </h2>
        
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewMode("current");
              setSearch("");
              setStatusFilter("ALL");
            }}
            className={`px-4 py-2 rounded font-semibold transition ${
              viewMode === "current"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Current Semester
          </button>
          <button
            onClick={() => {
              setViewMode("all");
              setSearch("");
              setStatusFilter("ALL");
              setSemesterFilter("ALL");
            }}
            className={`px-4 py-2 rounded font-semibold transition ${
              viewMode === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All Semesters
          </button>
        </div>
      </div>

      {/* CGPA Summary Card - Only show for All Semesters view */}
      {viewMode === "all" && allRecordsData && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-lg shadow-lg mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-90">CGPA</p>
              <p className="text-3xl font-bold">{allRecordsData.cgpa}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Total Credits Earned</p>
              <p className="text-3xl font-bold">{allRecordsData.totalCumulativeCredits}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Total Semesters</p>
              <p className="text-3xl font-bold">{Object.keys(allRecordsData.sessions).length}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Overall</p>
              <p className="text-xl font-bold">Academic Record</p>
            </div>
          </div>
        </div>
      )}

      {/* SGPA Summary Card - Only show for Current Semester view */}
      {viewMode === "current" && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-lg shadow-lg mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-90">SGPA</p>
              <p className="text-3xl font-bold">{sgpa}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Session</p>
              <p className="text-xl font-bold">{CURRENT_SESSION}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Enrolled Courses</p>
              <p className="text-3xl font-bold">{records.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Filter Bar */}
      <div className="bg-white p-4 rounded shadow mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by course code or title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded focus:outline-none focus:ring"
        />

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-1/4 px-4 py-2 border rounded bg-white focus:outline-none focus:ring"
        >
          <option value="ALL">All Status</option>
          <option value="ENROLLED">Enrolled</option>
          <option value="PENDING_INSTRUCTOR_APPROVAL">Pending Instructor</option>
          <option value="PENDING_ADVISOR_APPROVAL">Pending Advisor</option>
          <option value="DROPPED_BY_STUDENT">Dropped</option>
        </select>

        {/* Semester Filter - Only for All view */}
        {viewMode === "all" && allRecordsData && (
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="w-full md:w-1/4 px-4 py-2 border rounded bg-white focus:outline-none focus:ring"
          >
            <option value="ALL">All Semesters</option>
            {Object.keys(allRecordsData.sessions).map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Current Semester View */}
      {viewMode === "current" && (
        <>
          {loading ? (
            <p className="text-gray-600">Loading records...</p>
          ) : filteredRecords.length === 0 ? (
            <p className="text-gray-600">
              No courses match your filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white shadow rounded overflow-hidden">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-3 text-left">Course Code</th>
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-center">Credits</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r) => (
                    <tr
                      key={r.enrollment_id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-3 font-medium">
                        {r.courses.course_code}
                      </td>
                      <td className="p-3">{r.courses.title}</td>
                      <td className="p-3 text-center">
                        {r.courses.credits || "—"}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-3 py-1 text-sm rounded ${statusColor(
                            r.status
                          )}`}
                        >
                          {statusText(r.status)}
                        </span>
                      </td>
                      <td className="p-3 text-center font-semibold">
                        {r.grade || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* All Semesters View */}
      {viewMode === "all" && allRecordsData && (
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-6">All Academic Sessions</h3>
          {Object.entries(allRecordsData.sessions)
            .filter(([session]) => 
              semesterFilter === "ALL" || session === semesterFilter
            )
            .map(([session, data]) => (
              <div key={session} className="mb-8">
                {/* Session Header */}
                <div className="bg-gray-900 text-white p-4 rounded-t font-semibold flex justify-between items-center">
                  <span>Academic session: {session}</span>
                  <div className="flex gap-6 text-sm">
                    <span>SGPA: {data.sgpa}</span>
                    <span>Credits registered: {data.credits_registered}</span>
                    <span>Earned Credits: {data.credits_earned}</span>
                  </div>
                </div>

                {/* Session Courses Table */}
                <div className="overflow-x-auto">
                  <table className="w-full bg-white shadow-md rounded-b">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left">Course Code</th>
                        <th className="p-3 text-left">Title</th>
                        <th className="p-3 text-center">Credits</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.records
                        .filter((r) => {
                          if (!r.courses) return false;
                          const matchesSearch =
                            r.courses.course_code
                              .toLowerCase()
                              .includes(search.toLowerCase()) ||
                            r.courses.title
                              .toLowerCase()
                              .includes(search.toLowerCase());
                          const matchesStatus =
                            statusFilter === "ALL" ||
                            r.status === statusFilter;
                          return matchesSearch && matchesStatus;
                        })
                        .map((r) => (
                          <tr key={r.enrollment_id} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-medium">
                              {r.courses.course_code}
                            </td>
                            <td className="p-3">{r.courses.title}</td>
                            <td className="p-3 text-center">
                              {r.courses.credits || "—"}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-3 py-1 text-sm rounded ${statusColor(
                                  r.status
                                )}`}
                              >
                                {statusText(r.status)}
                              </span>
                            </td>
                            <td className="p-3 text-center font-semibold">
                              {r.grade || "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}