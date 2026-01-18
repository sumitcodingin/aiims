import { useEffect, useState } from "react";
import api from "../../services/api";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [appliedMap, setAppliedMap] = useState({});
  const user = JSON.parse(sessionStorage.getItem("user"));

  // Fetch approved courses
  useEffect(() => {
    api.get("/courses/search", { params: {} })
.then((res) => setCourses(res.data));
  }, []);

  // Apply for course
  const apply = async (course_id) => {
    try {
      await api.post("/student/apply", {
        student_id: user.id,
        course_id,
      });

      // Optimistic UI update
      setAppliedMap((prev) => ({
        ...prev,
        [course_id]: "PENDING_INSTRUCTOR_APPROVAL",
      }));

      alert("Application submitted. Awaiting instructor approval.");
    } catch (err) {
      alert(err.response?.data?.message || "Already applied for this course.");
    }
  };

  // Status label
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
      default:
        return "";
    }
  };

  // Status badge color
  const statusColor = (status) => {
    switch (status) {
      case "ENROLLED":
        return "bg-green-100 text-green-700";
      case "PENDING_INSTRUCTOR_APPROVAL":
      case "PENDING_ADVISOR_APPROVAL":
        return "bg-yellow-100 text-yellow-700";
      case "INSTRUCTOR_REJECTED":
      case "ADVISOR_REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "";
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Available Courses</h2>

      {courses.length === 0 ? (
        <p className="text-gray-600">No courses available right now.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((c) => {
            const status = appliedMap[c.course_id];

            return (
              <div
                key={c.course_id}
                className="bg-white p-4 shadow rounded border"
              >
                <h3 className="font-bold text-lg">{c.title}</h3>
                <p className="text-sm text-gray-600">{c.course_code}</p>
                <p className="text-sm text-gray-700">
                  Instructor: {c.instructor?.full_name || "—"}
                </p>

                {/* STATUS OR APPLY */}
                {status ? (
                  <span
                    className={`inline-block mt-3 px-3 py-1 text-sm rounded ${statusColor(
                      status
                    )}`}
                  >
                    {statusText(status)}
                  </span>
                ) : (
                  <button
                    onClick={() => apply(c.course_id)}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
                  >
                    Apply
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
