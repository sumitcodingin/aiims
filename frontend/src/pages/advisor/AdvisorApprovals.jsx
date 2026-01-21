import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdvisorApprovals() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH COURSES ================= */
  // Only courses with PENDING students for this advisor's department
  const fetchCourses = async () => {
    try {
      const res = await api.get("/advisor/courses", {
        params: { advisor_id: user.id },
      });
      setCourses(res.data || []);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  /* ================= FETCH STUDENTS FOR SELECTED COURSE ================= */
  useEffect(() => {
    if (!selectedCourse) return;

    setLoading(true);
    api
      .get("/advisor/students", {
        params: {
          advisor_id: user.id,
          course_id: selectedCourse.course_id,
        },
      })
      .then((res) => setStudents(res.data || []))
      .catch((err) => {
        console.error("Failed to fetch students:", err);
        setStudents([]);
      })
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  /* ================= APPROVE / REJECT ================= */
  const handleAction = async (enrollmentId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this student?`)) return;

    try {
      await api.post("/advisor/approve-student", {
        enrollmentId,
        action,
        advisor_id: user.id,
      });

      // Remove the processed student from the list
      setStudents((prev) => prev.filter((s) => s.enrollment_id !== enrollmentId));
      
      // Update seat count locally if Accepted
      if (action === "ACCEPT") {
        setCourses(prev => prev.map(c => 
          c.course_id === selectedCourse.course_id 
          ? { ...c, enrolled_count: (c.enrolled_count || 0) + 1 }
          : c
        ));
      }

      // If no students left, clear selected course and refresh list
      if (students.length === 1) {
        setSelectedCourse(null);
        fetchCourses();
      }
    } catch (err) {
      alert("Action failed.");
    }
  };

  return (
    <div className="max-w-5xl">
      
      {!selectedCourse && (
        <>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Pending Student Approvals</h2>
          
          {courses.length === 0 ? (
            <div className="bg-white p-8 rounded shadow text-center text-gray-500">
              <p>No pending approvals found for your department.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {courses.map((c) => (
                <div 
                  key={c.course_id}
                  className="bg-white p-6 shadow rounded-lg border hover:shadow-lg transition cursor-pointer"
                  onClick={() => setSelectedCourse(c)}
                >
                  <h3 className="font-bold text-lg text-blue-900">{c.course_code}</h3>
                  <p className="text-gray-700 font-medium mb-2">{c.title}</p>
                  
                  {/* 🚀 ADDED SESSION & DEPARTMENT */}
                  <div className="text-sm text-gray-600 space-y-1">
                     <p><span className="font-semibold">Department:</span> {c.department}</p>
                     <p><span className="font-semibold">Session:</span> {c.acad_session}</p>
                     <p><span className="font-semibold text-blue-700">Seats:</span> {c.enrolled_count || 0} / {c.capacity}</p>
                  </div>

                  <button className="mt-4 w-full bg-blue-50 text-blue-700 py-2 rounded text-sm font-semibold border border-blue-200 hover:bg-blue-100">
                    Review Students
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedCourse && (
        <>
          <button 
            onClick={() => setSelectedCourse(null)}
            className="text-blue-600 mb-4 hover:underline flex items-center gap-1"
          >
            ← Back to Courses
          </button>

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold">{selectedCourse.course_code} — {selectedCourse.title}</h3>
            
            {/* 🚀 ADDED DETAILS HERE TOO */}
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <p>Department: {selectedCourse.department}</p>
              <p>Session: {selectedCourse.acad_session}</p>
              <p className="font-semibold text-blue-700">
                Enrollment: {selectedCourse.enrolled_count || 0} / {selectedCourse.capacity}
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading students...</p>
          ) : (
            <div className="space-y-4">
              {students.map((s) => (
                <div key={s.enrollment_id} className="bg-white shadow p-4 rounded-lg flex justify-between items-center border-l-4 border-yellow-400">
                  <div>
                    <p className="font-bold text-gray-800">{s.student?.full_name}</p>
                    <p className="text-sm text-gray-600">{s.student?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-xs font-bold rounded text-gray-600">
                      {s.student?.department}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(s.enrollment_id, "ACCEPT")}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm shadow transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(s.enrollment_id, "REJECT")}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm shadow transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}