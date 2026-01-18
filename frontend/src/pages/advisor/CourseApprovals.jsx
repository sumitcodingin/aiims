import { useEffect, useState } from "react";
import api from "../../services/api";

export default function CourseApprovals() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get("/advisor/pending-courses", {
      params: { advisor_id: user.id }
    }).then(res => setCourses(res.data || []));
  }, [user.id]);

  const handleAction = async (course_id, action) => {
    await api.post("/advisor/approve-course", {
      course_id,
      action,
      advisor_id: user.id
    });

    setCourses(prev => prev.filter(c => c.course_id !== course_id));
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold mb-4">
        Course Approvals
      </h2>

      {courses.length === 0 ? (
        <p className="text-gray-600">No pending course approvals.</p>
      ) : (
        courses.map(c => (
          <div
            key={c.course_id}
            className="bg-white p-4 shadow rounded mb-3 flex justify-between"
          >
            <div>
              <p className="font-semibold">
                {c.course_code} - {c.title}
              </p>
              <p className="text-sm text-gray-600">
                Instructor: {c.instructor?.full_name}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAction(c.course_id, "APPROVE")}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction(c.course_id, "REJECT")}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
