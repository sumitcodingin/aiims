import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";

export default function AllCourses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState({
    code: "",
    dept: "",
    session: "2025-II",
    title: "",
    instructor: ""
  });
  
  // Modal State for Course Details
  const [selectedCourse, setSelectedCourse] = useState(null);

  // 🚀 MODAL STATE: Enrollment List & Metadata
  const [enrollmentList, setEnrollmentList] = useState([]);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  
  // 🚀 STATE: Stores Title, Enrolled Count (from list), and Capacity (from course)
  const [viewingEnrollmentMeta, setViewingEnrollmentMeta] = useState({
    title: "",
    enrolledCount: 0,
    capacity: 0
  });

  // Fetch approved courses
  const fetchData = useCallback(async () => {
    try {
      const coursesRes = await api.get("/courses/search", { params: search });
      setCourses(coursesRes.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle input changes
  const handleChange = (e) => {
    setSearch({ ...search, [e.target.name]: e.target.value });
  };

  // 🚀 Logic to show Enrolled / Capacity
  const handleShowEnrollments = async (e, course) => {
    e.stopPropagation(); 
    try {
      const res = await api.get(`/courses/${course.course_id}/public-enrollments`);
      const list = res.data || [];
      
      // Calculate how many are actually ENROLLED in the list
      const enrolled = list.filter(r => r.status === 'ENROLLED').length;

      setEnrollmentList(list);
      
      // Store Metadata
      setViewingEnrollmentMeta({
        title: course.title,
        enrolledCount: enrolled,
        capacity: course.capacity
      });
      
      setShowEnrollmentModal(true);
    } catch (err) {
      alert("Failed to fetch enrollment list.");
    }
  };

  // Helper for List Item Status Color
  const getListStatusColor = (status) => {
    if (status === 'ENROLLED') return 'text-green-600 bg-green-50 border-green-200';
    if (status.includes('PENDING')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">All Available Courses</h2>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <input name="code" placeholder="Course Code" className="border p-2 rounded text-sm" value={search.code} onChange={handleChange} />
        <input name="title" placeholder="Course Title" className="border p-2 rounded text-sm" value={search.title} onChange={handleChange} />
        <input name="dept" placeholder="Department" className="border p-2 rounded text-sm" value={search.dept} onChange={handleChange} />
        <input name="instructor" placeholder="Instructor Name" className="border p-2 rounded text-sm" value={search.instructor} onChange={handleChange} />
        <select name="session" className="border p-2 rounded text-sm" value={search.session} onChange={handleChange}>
          <option value="2025-II">2025-II</option>
          <option value="2025-I">2025-I</option>
          <option value="2024-II">2024-II</option>
        </select>
      </div>

      {courses.length === 0 ? (
        <p className="text-gray-600">No courses found matching your criteria.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <div 
              key={c.course_id} 
              onClick={() => setSelectedCourse(c)}
              className="bg-white p-4 shadow rounded border hover:shadow-lg transition cursor-pointer relative"
            >
              <div className="mb-2">
                <h3 className="font-bold text-lg text-blue-900">{c.title}</h3>
                <p className="text-sm text-gray-500">{c.course_code}</p>
                <p className="text-sm text-gray-700">Instructor: {c.instructor?.full_name || "—"}</p>
                <p className="text-xs text-gray-500 mt-1">
                    Enrolled: <span className="font-medium text-black">{c.enrolled_count}/{c.capacity}</span>
                </p>
              </div>

              <div className="flex gap-2 mt-4 items-center">
                <button
                  onClick={(e) => handleShowEnrollments(e, c)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition border border-gray-300"
                >
                  Show Enrollments
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. COURSE DETAILS MODAL */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
            <button 
              onClick={() => setSelectedCourse(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl font-bold"
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold mb-1">{selectedCourse.title}</h2>
            <p className="text-gray-500 mb-4">{selectedCourse.course_code}</p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Department:</span>
                <span>{selectedCourse.department}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Instructor:</span>
                <span>{selectedCourse.instructor?.full_name || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Session:</span>
                <span>{selectedCourse.acad_session}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Seats:</span>
                <span>{selectedCourse.enrolled_count} / {selectedCourse.capacity}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
                <button 
                    onClick={() => setSelectedCourse(null)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded transition"
                >
                    Close
                </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ENROLLMENT LIST MODAL */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative max-h-[80vh] flex flex-col">
            <button 
              onClick={() => setShowEnrollmentModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl font-bold"
            >
              &times;
            </button>

            <h3 className="text-xl font-bold mb-1">Current Enrollments</h3>
            <p className="text-sm text-gray-500">{viewingEnrollmentMeta.title}</p>
            
            <p className="text-sm font-semibold text-blue-600 mt-1 mb-4">
              Current Enrolled: {viewingEnrollmentMeta.enrolledCount}/{viewingEnrollmentMeta.capacity}
            </p>

            <div className="overflow-y-auto flex-1">
              {enrollmentList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No students have applied yet.</p>
              ) : (
                <ul className="space-y-2">
                  {enrollmentList.map((record, idx) => (
                    <li key={idx} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-800">{record.student?.full_name || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{record.student?.department || "No Dept"}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded border font-bold uppercase ${getListStatusColor(record.status)}`}>
                        {record.status.replace(/_/g, ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="mt-4 text-right">
              <button 
                onClick={() => setShowEnrollmentModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}