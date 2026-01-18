import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  const CURRENT_SESSION = "2025-II"; // 🔴 can be dynamic later

  useEffect(() => {
    setLoading(true);
    api
      .get("/student/records", {
        params: {
          student_id: user.id,
          session: CURRENT_SESSION,
        },
      })
      .then((res) => setRecords(res.data))
      .finally(() => setLoading(false));
  }, [user.id]);

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
  // UI
  // -------------------------
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        Academic Records ({CURRENT_SESSION})
      </h2>

      {loading ? (
        <p className="text-gray-600">Loading records...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-600">
          No courses taken this semester.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white shadow rounded overflow-hidden">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Course Code</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.enrollment_id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3 font-medium">
                    {r.courses.course_code}
                  </td>
                  <td className="p-3">{r.courses.title}</td>
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
    </div>
  );
}
