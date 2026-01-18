import { useEffect, useState } from "react";
import api from "../services/api";

export default function InstructorDashboard() {
  const [apps, setApps] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    api.get("/instructor/applications/1").then(res => setApps(res.data));
  }, []);

  const approve = async (id, action) => {
    await api.post("/instructor/approve-request", {
      enrollmentId: id,
      action,
      instructor_id: user.id
    });
    alert("Updated");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">👨‍🏫 Instructor Dashboard</h1>

      {apps.map(a => (
        <div key={a.enrollment_id} className="bg-white p-4 shadow rounded mb-3">
          <p>{a.student.full_name}</p>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => approve(a.enrollment_id, "ACCEPT")}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Approve
            </button>
            <button
              onClick={() => approve(a.enrollment_id, "REJECT")}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
