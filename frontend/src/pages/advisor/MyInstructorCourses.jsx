/* file: frontend/src/pages/advisor/MyInstructorCourses.jsx */
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function MyInstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      try {
        const res = await api.get("/advisor/my-instructor-courses", {
          params: { advisor_id: user.user_id || user.id },
        });
        setCourses(res.data);
      } catch (err) {
        console.error("Failed to fetch instructor courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED": return "bg-red-100 text-red-800 border-red-200";
      case "PENDING_ADMIN_APPROVAL": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Loading courses...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My Instructor's Courses</h2>
      <p className="text-gray-600 mb-6">
        Courses floated by instructors assigned to your advisorship.
      </p>

      {courses.length === 0 ? (
        <div className="p-8 bg-white border border-gray-200 rounded text-center text-gray-500">
          No courses found for your assigned instructors.
        </div>
      ) : (
        <div className="bg-white border rounded shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Course Info</th>
                <th className="p-4 font-semibold text-gray-600">Instructor</th>
                <th className="p-4 font-semibold text-gray-600">Department</th>
                <th className="p-4 font-semibold text-gray-600">Slot</th>
                <th className="p-4 font-semibold text-gray-600">Enrollment</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((c) => (
                <tr key={c.course_id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{c.title}</div>
                    <div className="text-xs text-gray-500">{c.course_code} ({c.credits} Credits)</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-gray-800">{c.instructor?.full_name || "Unknown"}</div>
                    <div className="text-xs text-gray-500">{c.instructor?.email}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{c.department}</td>
                  <td className="p-4 text-sm text-gray-600">{c.slot || "-"}</td>
                  <td className="p-4 text-sm text-gray-600">
                    <span className="font-medium">{c.enrolled_count}</span>
                    <span className="text-gray-400"> / {c.capacity}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded border ${getStatusColor(c.status)}`}>
                      {c.status.replace(/_/g, " ")}
                    </span>
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