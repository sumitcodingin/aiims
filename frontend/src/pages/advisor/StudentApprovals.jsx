
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentApprovals() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents] = useState([]);

  // Fetch courses that have pending students
  useEffect(() => {
    api.get("/advisor/courses", {
      params: { advisor_id: user.id }
    }).then(res => setCourses(res.data || []));
  }, [user.id]);

  // Fetch students for selected course
  useEffect(() => {
    if (!selectedCourse) return;

    api.get("/advisor/pending-students", {
      params: {
        advisor_id: user.id,
        course_id: selectedCourse
      }
    }).then(res => setStudents(res.data || []));
  }, [selectedCourse, user.id]);

  const handleAction = async (enrollmentId, action) => {
    await api.post("/advisor/approve-request", {
      enrollmentId,
      action,
      advisor_id: user.id
    });

    setStudents(prev =>
      prev.filter(s => s.enrollment_id !== enrollmentId)
    );
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold mb-4">
        Student Enrollment Approvals
      </h2>

      {/* COURSE SELECT */}
      <select
        className="border px-3 py-2 rounded w-full mb-4"
        value={selectedCourse}
        onChange={(e) => setSelectedCourse(e.target.value)}
      >
        <option value="">-- Select Course --</option>
        {courses.map(c => (
          <option key={c.course_id} value={c.course_id}>
            {c.course_code} - {c.title}
          </option>
        ))}
      </select>

      {!selectedCourse ? (
        <p className="text-gray-600">Select a course to view students.</p>
      ) : students.length === 0 ? (
        <p className="text-gray-600">No students pending approval.</p>
      ) : (
        students.map(s => (
          <div
            key={s.enrollment_id}
            className="bg-white p-4 shadow rounded mb-3 flex justify-between"
          >
            <div>
              <p className="font-semibold">{s.student.full_name}</p>
              <p className="text-sm text-gray-600">{s.student.email}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAction(s.enrollment_id, "ACCEPT")}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Accept
              </button>
              <button
                onClick={() => handleAction(s.enrollment_id, "REJECT")}
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
