import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentRecords() {
  const [records, setRecords] = useState([]);
  const [sgpa, setSgpa] = useState("0.00");
  const [allRecordsData, setAllRecordsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("current");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");

  const user = JSON.parse(localStorage.getItem("user"));
  const CURRENT_SESSION = "2025-II";

  useEffect(() => {
    if (!user || !user.id) return;

    setLoading(true);
    Promise.all([
      api.get("/student/records", {
        params: { student_id: user.id, session: CURRENT_SESSION },
      }),
      api.get("/student/all-records", {
        params: { student_id: user.id },
      }),
    ])
      .then(([recordsRes, allRes]) => {
        const recordsData = recordsRes.data.records || recordsRes.data;
        const sgpaValue = recordsRes.data.sgpa || "0.00";
        setRecords(Array.isArray(recordsData) ? recordsData : []);
        setSgpa(sgpaValue);
        setAllRecordsData(allRes.data);
      })
      .catch(() => {
        setRecords([]);
        setSgpa("0.00");
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

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

  const filteredRecords = (Array.isArray(records) ? records : []).filter((r) => {
    if (!r.courses) return false;

    const matchesSearch =
      r.courses.course_code.toLowerCase().includes(search.toLowerCase()) ||
      r.courses.title.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!user) return <p>Loading session...</p>;

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6">
        Academics for Credit Courses
      </h1>

      {/* View Toggle */}
      <div className="mb-6">
        <button
          onClick={() => {
            setViewMode("current");
            setSearch("");
            setStatusFilter("ALL");
          }}
          className={`px-4 py-2 border ${
            viewMode === "current" ? "bg-black text-white" : "bg-gray-100"
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
          className={`px-4 py-2 border ml-2 ${
            viewMode === "all" ? "bg-black text-white" : "bg-gray-100"
          }`}
        >
          All Semesters
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search course"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-1 w-64"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-3 py-1"
        >
          <option value="ALL">All Status</option>
          <option value="ENROLLED">Enrolled</option>
          <option value="PENDING_INSTRUCTOR_APPROVAL">Pending Instructor</option>
          <option value="PENDING_ADVISOR_APPROVAL">Pending Advisor</option>
          <option value="DROPPED_BY_STUDENT">Dropped</option>
        </select>

        {viewMode === "all" && allRecordsData && (
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="border px-3 py-1"
          >
            <option value="ALL">All Semesters</option>
            {Object.keys(allRecordsData.sessions).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p>Loading records...</p>
      ) : (
        <>
          {/* CURRENT SEMESTER */}
          {viewMode === "current" && (
            <>
              <div className="bg-gray-900 text-white px-4 py-2 text-sm mb-1">
                Academic session: {CURRENT_SESSION} &nbsp;|&nbsp;
                SGPA: {sgpa} &nbsp;|&nbsp;
                Credits registered: {records.length}
              </div>

              <table className="w-full text-sm border-collapse">
                <tbody>
                  {filteredRecords.map((r, i) => (
                    <tr
                      key={r.enrollment_id}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-200"}
                    >
                      <td className="px-3 py-2 w-10">{i + 1}</td>
                      <td className="px-3 py-2">
                        <b>{r.courses.course_code}</b> – {r.courses.title}
                      </td>
                      <td className="px-3 py-2">Credit</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${statusColor(
                            r.status
                          )}`}
                        >
                          {statusText(r.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-semibold">
                        {r.grade || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ALL SEMESTERS */}
          {viewMode === "all" &&
            allRecordsData &&
            Object.entries(allRecordsData.sessions)
              .filter(
                ([session]) =>
                  semesterFilter === "ALL" || session === semesterFilter
              )
              .map(([session, data]) => {
                // Apply search and status filters to each semester's records
                const filteredSemesterRecords = (data.records || []).filter((r) => {
                  if (!r.courses) return false;

                  const matchesSearch =
                    r.courses.course_code.toLowerCase().includes(search.toLowerCase()) ||
                    r.courses.title.toLowerCase().includes(search.toLowerCase());

                  const matchesStatus =
                    statusFilter === "ALL" || r.status === statusFilter;

                  return matchesSearch && matchesStatus;
                });

                return (
                <div key={session} className="mb-8">
                  <div className="bg-gray-900 text-white px-4 py-2 text-sm">
                    Academic session: {session} &nbsp;|&nbsp;
                    SGPA: {data.sgpa} &nbsp;|&nbsp;
                    Credits registered: {data.credits_registered} &nbsp;|&nbsp;
                    Earned Credits: {data.credits_earned} &nbsp;|&nbsp;
                    CGPA: {allRecordsData.cgpa}
                  </div>

                  <table className="w-full text-sm border-collapse">
                    <tbody>
                      {filteredSemesterRecords.length > 0 ? (
                        filteredSemesterRecords.map((r, i) => (
                          <tr
                            key={r.enrollment_id}
                            className={i % 2 === 0 ? "bg-white" : "bg-gray-200"}
                          >
                            <td className="px-3 py-2 w-10">{i + 1}</td>
                            <td className="px-3 py-2">
                              <b>{r.courses.course_code}</b> – {r.courses.title}
                            </td>
                            <td className="px-3 py-2">Credit</td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-1 text-xs rounded ${statusColor(
                                  r.status
                                )}`}
                              >
                                {statusText(r.status)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center font-semibold">
                              {r.grade || "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-3 py-2 text-center text-gray-500">
                            No records found matching the filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
              })}
        </>
      )}
    </div>
  );
}
