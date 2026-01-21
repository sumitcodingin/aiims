import { useEffect, useState } from "react";
import api from "../../services/api";

export default function CourseApprovals() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const [courses, setCourses] = useState([]);
  
  // STATE for Detailed View
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch Pending AND Approved floated courses
  const fetchCourses = async () => {
    try {
      const res = await api.get("/advisor/pending-courses", {
        params: { advisor_id: user.id },
      });
      // Sort so PENDING courses appear first
      const sorted = (res.data || []).sort((a, b) => 
        a.status === 'PENDING_ADVISOR_APPROVAL' ? -1 : 1
      );
      setCourses(sorted);
    } catch (err) {
      console.error("Failed to fetch floated courses", err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAction = async (courseId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this course?`)) return;

    try {
      await api.post("/advisor/approve-course", {
        course_id: courseId,
        action, 
        advisor_id: user.id,
      });
      
      // 1. Refresh list
      await fetchCourses();
      // 2. Close detail view to reset UI state
      setSelectedCourse(null);
    } catch (err) {
      alert("Action failed. Please try again.");
    }
  };

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Instructor Course Proposals</h2>
      
      {/* === LIST VIEW === */}
      {!selectedCourse && (
        <>
          {courses.length === 0 ? (
            <div className="bg-white p-8 rounded shadow text-center text-gray-500">
              <p>No course proposals found from your assigned instructors.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {courses.map(c => (
                <div 
                  key={c.course_id} 
                  onClick={() => setSelectedCourse(c)}
                  className={`bg-white p-6 rounded shadow border-l-4 cursor-pointer hover:shadow-lg transition relative
                    ${c.status === 'APPROVED' ? 'border-green-500 bg-gray-50' : 'border-yellow-500 bg-white'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{c.course_code}</h3>
                      <p className="text-gray-700 font-medium">{c.title}</p>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <p>By: {c.instructor?.full_name}</p>
                        <p>Session: {c.acad_session}</p>
                      </div>

                      <div className="mt-3">
                        <span className={`inline-block px-2 py-1 text-xs font-bold rounded uppercase
                          ${c.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {c.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 🚀 VISUAL CUE: Different text based on status */}
                  <p className={`mt-4 text-sm font-semibold underline text-center ${c.status === 'APPROVED' ? 'text-gray-500' : 'text-blue-600'}`}>
                    {c.status === 'APPROVED' ? 'View Details (Read Only)' : 'Review & Take Action'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* === DETAIL VIEW (When clicked) === */}
      {selectedCourse && (
        <div className="bg-white shadow rounded-lg p-8 relative">
          <button 
            onClick={() => setSelectedCourse(null)}
            className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl font-bold"
          >
            &times; Close
          </button>

          <button 
            onClick={() => setSelectedCourse(null)} 
            className="text-blue-600 mb-4 hover:underline"
          >
            ← Back to Proposals
          </button>

          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedCourse.course_code}: {selectedCourse.title}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8 text-gray-700 border-b pb-6">
            <div>
              <p className="mb-2"><span className="font-semibold">Instructor:</span> {selectedCourse.instructor?.full_name}</p>
              <p className="mb-2"><span className="font-semibold">Email:</span> {selectedCourse.instructor?.email}</p>
              <p className="mb-2"><span className="font-semibold">Department:</span> {selectedCourse.department}</p>
            </div>
            <div>
              <p className="mb-2"><span className="font-semibold">Session:</span> {selectedCourse.acad_session}</p>
              <p className="mb-2"><span className="font-semibold">Credits:</span> {selectedCourse.credits}</p>
              <p className="mb-2"><span className="font-semibold">Capacity:</span> {selectedCourse.capacity}</p>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-3">Status</h4>
            
            {/* 🚀 BUG FIX: IF APPROVED, RENDER ZERO BUTTONS. */}
            {selectedCourse.status === 'APPROVED' ? (
              <div className="bg-green-50 p-6 rounded border border-green-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">✅</span>
                  <div>
                    <h5 className="text-green-800 font-bold text-xl">Course Approved</h5>
                    <p className="text-green-700 text-sm mt-1">
                      You have already accepted this course. It is now active for student enrollment.
                    </p>
                  </div>
                </div>
                {/* ABSOLUTELY NO BUTTONS HERE */}
              </div>
            ) : (
              <div className="bg-yellow-50 p-6 rounded border border-yellow-200">
                <p className="mb-4 text-yellow-800 font-medium">
                  This course is pending approval. Select an action below:
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleAction(selectedCourse.course_id, 'APPROVE')} 
                    className="bg-green-600 text-white px-6 py-3 rounded shadow hover:bg-green-700 font-bold transition"
                  >
                    Accept Course
                  </button>
                  <button 
                    onClick={() => handleAction(selectedCourse.course_id, 'REJECT')} 
                    className="bg-red-600 text-white px-6 py-3 rounded shadow hover:bg-red-700 font-bold transition"
                  >
                    Reject Course
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}