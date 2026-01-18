import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentRecords() {
  const [records, setRecords] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  const CURRENT_SESSION = "2025-II"; // 🔴 change later if needed

  useEffect(() => {
    api
      .get("/student/records", {
        params: {
          student_id: user.id,
          session: CURRENT_SESSION
        }
      })
      .then((res) => setRecords(res.data));
  }, [user.id]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        Academic Records ({CURRENT_SESSION})
      </h2>

      {records.length === 0 ? (
        <p className="text-gray-600">
          No courses taken this semester.
        </p>
      ) : (
        <table className="w-full bg-white shadow rounded overflow-hidden">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Course Code</th>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-center">Status</th>
              <th className="p-2 text-center">Grade</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.enrollment_id} className="border-t">
                <td className="p-2">{r.courses.course_code}</td>
                <td className="p-2">{r.courses.title}</td>
                <td className="p-2 text-center">{r.status}</td>
                <td className="p-2 text-center">
                  {r.grade || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
