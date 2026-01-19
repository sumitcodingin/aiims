import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [appliedMap, setAppliedMap] = useState({});
  const user = JSON.parse(sessionStorage.getItem("user"));

  const CURRENT_SESSION = "2025-II";

  // Fetch approved courses
  const fetchData = useCallback(async () => {
    try {
      // Fetch all available courses
      const coursesRes = await api.get("/courses/search");
      setCourses(coursesRes.data || []);

      // Fetch student's current enrollment records for this session
      const recordsRes = await api.get("/student/records", {
        params: { student_id: user.id, session: CURRENT_SESSION }
      });

      // Create a map of course_id -> enrollment details
      const mapping = {};
      recordsRes.data.forEach(r => {
        mapping[r.courses.course_id] = r;
      });
      setAppliedMap(mapping);
    } catch (err) {
      console.error("Failed to fetch courses or records:", err);
    }
  }, [user.id]); // Dependency for useCallback

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply for course
  const apply = async (course_id) => {
    try {
      await api.post("/student/apply", {
        student_id: user.id,
        course_id,
      });
      alert("Application submitted.");
      fetchData(); // Refresh data to update status and get enrollment_id
    } catch (err) {
      alert(err.response?.data?.message || "Already applied for this course.");
    }
  };

  // drop course
  const drop = async (enrollmentId) => {
    if (!window.confirm("Are you sure you want to drop this course?")) return;

    try {
      // Using your specified endpoint
      await api.post("/student/drop", { enrollmentId });
      alert("Course dropped successfully.");
      fetchData(); // Refresh to clear the map so "Apply" shows again
    } catch (err) {
      alert(err.response?.data?.error || "Drop failed.");
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
            const enrollment = appliedMap[c.course_id];
            const status = enrollment?.status;

            // Logic: Show Apply if never enrolled OR if they dropped
            const canApply = !enrollment || status === "DROPPED_BY_STUDENT";

            // Logic: Show Drop if applied and not rejected and not already dropped
            const canDrop = enrollment && 
                            status !== "DROPPED_BY_STUDENT" && 
                            status !== "INSTRUCTOR_REJECTED" && 
                            status !== "ADVISOR_REJECTED" &&
                            enrollment.grade === null;

            return (
              <div key={c.course_id} className="bg-white p-4 shadow rounded border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{c.title}</h3>
                    <p className="text-sm text-gray-500">{c.course_code}</p>
                    <p className="text-sm text-gray-700">Instructor: {c.instructor?.full_name || "—"}</p>
                  </div>
                  {/* 🚀 Status Reflected Here */}
                  {enrollment && (
                    <span className={`px-2 py-1 text-xs font-bold rounded ${statusColor(status)}`}>
                      {statusText(status)}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  {canApply && (
                    <button onClick={() => apply(c.course_id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm transition">
                      Apply
                    </button>
                  )}

                  {canDrop && (
                    <button onClick={() => drop(enrollment.enrollment_id)}
                      className="border border-red-600 text-red-600 hover:bg-red-50 px-4 py-1 rounded text-sm transition">
                      Drop Course
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
