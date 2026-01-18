import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentRecords() {
  const [records, setRecords] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    api.get(`/student/records`, {
      params: { student_id: user.id }
    }).then(res => setRecords(res.data));
  }, [user.id]);

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Academic Records</h2>

      <table className="w-full bg-white shadow rounded overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 text-left">Course</th>
            <th className="p-2">Status</th>
            <th className="p-2">Grade</th>
          </tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr key={r.enrollment_id} className="border-t">
              <td className="p-2">{r.course.title}</td>
              <td className="p-2 text-center">{r.status}</td>
              <td className="p-2 text-center">
                {r.grade || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
