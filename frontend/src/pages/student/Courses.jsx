import { useEffect, useState } from "react";
import api from "../../services/api";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    api.get("/courses/search").then(res => setCourses(res.data));
  }, []);

  const apply = async (course_id) => {
    try {
      await api.post("/student/apply", {
        student_id: user.id,
        course_id
      });
      alert("Applied successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Already applied");
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Available Courses</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {courses.map(c => (
          <div key={c.course_id} className="bg-white p-4 shadow rounded">
            <h3 className="font-bold">{c.title}</h3>
            <p className="text-sm text-gray-600">{c.course_code}</p>
            <p className="text-sm">{c.instructor?.full_name}</p>

            <button
              onClick={() => apply(c.course_id)}
              className="mt-3 bg-blue-600 text-white px-4 py-1 rounded"
            >
              Apply
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
