import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdvisorApprovals() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]); 
  const [loading, setLoading] = useState(false);

  // 1. Fetch Union of Courses (Pending + Enrolled) for MY students
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/advisor/student-courses", {
        params: { advisor_id: user.id },
      });
      setCourses(res.data || []);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // 2. Fetch Students when a course is selected
  useEffect(() => {
    if (!selectedCourse) return;
    setLoading(true);
    
    api.get("/advisor/course-students", {
      params: { advisor_id: user.id, course_id: selectedCourse.course_id }
    })
    .then(res => setStudents(res.data || []))
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
  }, [selectedCourse]);

  // 3. Handle Action (Accept / Reject / Remove)
  const handleAction = async (enrollmentId, action) => {
    if(!window.confirm(`Are you sure you want to ${action}?`)) return;

    try {
      await api.post("/advisor/approve-student", {
        enrollmentId, action, advisor_id: user.id
      });
      
      // Update local list
      setStudents(prev => prev.filter(s => s.enrollment_id !== enrollmentId));
      
      // Update seat count on the card locally
      if(action === 'ACCEPT' || action === 'REMOVE') {
         const delta = action === 'ACCEPT' ? 1 : -1;
         setCourses(prev => prev.map(c => 
            c.course_id === selectedCourse.course_id 
            ? { ...c, enrolled_count: Math.max(0, (c.enrolled_count||0) + delta) }
            : c
         ));
      }
    } catch (err) {
      alert("Action failed.");
    }
  };

  const pendingStudents = students.filter(s => s.status === 'PENDING_ADVISOR_APPROVAL');
  const enrolledStudents = students.filter(s => s.status === 'ENROLLED');

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My Students' Enrollments</h2>

      {!selectedCourse && (
        <>
          {courses.length === 0 ? (
            <div className="bg-white p-8 rounded shadow text-center text-gray-500">
              <p>No student activity found.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(c => (
                <div 
                  key={c.course_id}
                  onClick={() => setSelectedCourse(c)}
                  className="bg-white p-6 shadow rounded-lg border-l-4 border-blue-600 cursor-pointer hover:shadow-lg transition"
                >
                  <h3 className="font-bold text-lg text-blue-900">{c.course_code}</h3>
                  <p className="text-gray-700 font-medium">{c.title}</p>
                  <div className="mt-3 text-sm text-gray-600">
                    <p>Dept: {c.department}</p>
                    <p>Session: {c.acad_session}</p>
                    <p className="font-bold text-green-700 mt-1">
                      Seats: {c.enrolled_count} / {c.capacity}
                    </p>
                  </div>
                  <button className="mt-4 w-full bg-blue-50 text-blue-700 py-2 rounded text-sm font-semibold">
                    Manage Students
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedCourse && (
        <div>
          <button onClick={() => setSelectedCourse(null)} className="text-blue-600 mb-4 hover:underline">
            ← Back to Courses
          </button>
          
          <div className="bg-white p-6 rounded shadow mb-6">
             <h3 className="text-2xl font-bold text-gray-800">{selectedCourse.course_code}: {selectedCourse.title}</h3>
             <p className="text-gray-600">Department: {selectedCourse.department} | Session: {selectedCourse.acad_session}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* COLUMN 1: PENDING REQUESTS */}
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <h4 className="font-bold text-yellow-800 mb-3 border-b border-yellow-200 pb-2">Pending Requests</h4>
              {pendingStudents.length === 0 ? <p className="text-sm text-gray-500">No pending requests.</p> : (
                <ul className="space-y-3">
                  {pendingStudents.map(s => (
                    <li key={s.enrollment_id} className="bg-white p-3 rounded shadow-sm">
                      <p className="font-bold text-gray-800">{s.student?.full_name}</p>
                      <p className="text-xs text-gray-500">{s.student?.email}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleAction(s.enrollment_id, 'ACCEPT')} className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">Accept</button>
                        <button onClick={() => handleAction(s.enrollment_id, 'REJECT')} className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">Reject</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* COLUMN 2: ENROLLED STUDENTS */}
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <h4 className="font-bold text-green-800 mb-3 border-b border-green-200 pb-2">Enrolled Students</h4>
              {enrolledStudents.length === 0 ? <p className="text-sm text-gray-500">No active students.</p> : (
                <ul className="space-y-3">
                  {enrolledStudents.map(s => (
                    <li key={s.enrollment_id} className="bg-white p-3 rounded shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800">{s.student?.full_name}</p>
                        <p className="text-xs text-gray-500">{s.student?.email}</p>
                      </div>
                      <button onClick={() => handleAction(s.enrollment_id, 'REMOVE')} className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs border border-red-200 hover:bg-red-200">
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}