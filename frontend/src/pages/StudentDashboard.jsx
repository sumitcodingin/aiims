import { useEffect, useState } from "react";
import api from "../services/api";

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get("/courses/search").then((res) => setCourses(res.data));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Student Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <div key={c.course_id} className="border p-4 rounded shadow">
            <h3 className="font-bold">{c.title}</h3>
            <p>{c.course_code}</p>
            <button className="mt-2 bg-blue-600 text-white px-4 py-1 rounded">
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
