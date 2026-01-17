import { useEffect, useState } from "react";
import api from "../services/api";

export default function InstructorDashboard() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    api.get("/instructor/applications/1").then((res) => setApps(res.data));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Instructor Dashboard</h2>
      {apps.map((a) => (
        <div key={a.enrollment_id} className="border p-3 mb-2 rounded">
          <p>{a.users.full_name}</p>
          <button className="bg-green-600 text-white px-3 py-1 rounded">
            Award Grade
          </button>
        </div>
      ))}
    </div>
  );
}
