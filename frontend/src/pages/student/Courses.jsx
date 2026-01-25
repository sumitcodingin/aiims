/* file: frontend/src/pages/student/Courses.jsx */
import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [appliedMap, setAppliedMap] = useState({});
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState({
    code: "",
    dept: "",
    session: "2025-II",
    title: "",
    instructor: ""
  });
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollmentList, setEnrollmentList] = useState([]);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [viewingEnrollmentMeta, setViewingEnrollmentMeta] = useState({ title: "", enrolledCount: 0, capacity: 0 });

  // NEW: State for credits
  const [creditsUsed, setCreditsUsed] = useState(0);
  const CREDIT_LIMIT = 24;

  const user = JSON.parse(localStorage.getItem("user"));
  const CURRENT_SESSION = "2025-II";

  const fetchDepartments = useCallback(async () => {
    try {
      const coursesRes = await api.get("/courses/search", { params: { session: CURRENT_SESSION } });
      const allCourses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
      const uniqueDepts = [...new Set(allCourses.map(c => c.department).filter(Boolean))].sort();
      setDepartments(uniqueDepts);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      const coursesRes = await api.get("/courses/search", { params: search });
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);

      const recordsRes = await api.get("/student/records", {
        params: { student_id: user.id, session: CURRENT_SESSION }
      });

      const mapping = {};
      const recordsData = recordsRes.data.records || recordsRes.data;
      
      // Update Credits Used
      if (recordsRes.data.creditsUsed !== undefined) {
          setCreditsUsed(recordsRes.data.creditsUsed);
      }

      (Array.isArray(recordsData) ? recordsData : []).forEach(r => {
        if (r?.courses?.course_id) {
          mapping[r.courses.course_id] = r;
        }
      });

      setAppliedMap(mapping);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }, [user?.id, search]);

  useEffect(() => {
    fetchDepartments();
    fetchData();
  }, [fetchData, fetchDepartments]);

  const handleChange = (e) => {
    setSearch({ ...search, [e.target.name]: e.target.value });
  };

  const apply = async (course_id) => {
    try {
      await api.post("/student/apply", {
        student_id: user.id,
        course_id,
      });
      alert("Enrollment request submitted.");
      fetchData(); 
      setSelectedCourse(null);
    } catch (err) {
      alert(err.response?.data?.error || "Application failed.");
    }
  };

  const drop = async (enrollmentId) => {
    if (!window.confirm("Are you sure you want to drop this course?")) return;
    try {
      await api.post("/student/drop", { enrollmentId });
      alert("Course dropped successfully.");
      fetchData();
      setSelectedCourse(null);
    } catch (err) {
      alert(err.response?.data?.error || "Drop failed.");
    }
  };

  const handleShowEnrollments = async (e, course) => {
    e.stopPropagation(); 
    try {
      const res = await api.get(`/courses/${course.course_id}/public-enrollments`);
      const list = Array.isArray(res.data) ? res.data : [];
      const enrolled = list.filter(r => r.status === 'ENROLLED').length;

      setEnrollmentList(list);
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

  const statusText = (status) => {
    switch (status) {
      case "PENDING_INSTRUCTOR_APPROVAL": return "Pending Instructor";
      case "PENDING_ADVISOR_APPROVAL": return "Pending Advisor";
      case "ENROLLED": return "Enrolled";
      case "INSTRUCTOR_REJECTED": return "Rejected (Inst)";
      case "ADVISOR_REJECTED": return "Rejected (Adv)";
      case "DROPPED_BY_STUDENT": return "Dropped";
      default: return "";
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "ENROLLED": return "bg-green-100 text-green-700";
      case "PENDING_INSTRUCTOR_APPROVAL":
      case "PENDING_ADVISOR_APPROVAL": return "bg-yellow-100 text-yellow-700";
      case "INSTRUCTOR_REJECTED":
      case "ADVISOR_REJECTED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getCourseActions = (course) => {
    const enrollment = appliedMap[course.course_id];
    const status = enrollment?.status;
    
    // Check if adding this course exceeds limit
    const potentialCredits = creditsUsed + (course.credits || 0);
    const limitReached = potentialCredits > CREDIT_LIMIT;

    const canApply =
      (!enrollment || status === "INSTRUCTOR_REJECTED" || status === "ADVISOR_REJECTED") &&
      !limitReached;

    const canDrop = enrollment && 
                    status !== "DROPPED_BY_STUDENT" && 
                    status !== "INSTRUCTOR_REJECTED" && 
                    status !== "ADVISOR_REJECTED" &&
                    enrollment.grade === null;

    return { enrollment, status, canApply, canDrop, limitReached };
  };

  if (!user) return <p>Loading session...</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Available Courses</h2>
        <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded text-sm">
            <span className="font-bold text-gray-700">Credits Used: </span>
            <span className={`font-bold ${creditsUsed > 24 ? 'text-red-600' : 'text-blue-600'}`}>
                {creditsUsed}
            </span>
            <span className="text-gray-500"> / {CREDIT_LIMIT}</span>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-none shadow border mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <input name="code" placeholder="Course Code" className="border p-2 rounded-none text-sm" value={search.code} onChange={handleChange} />
        <input name="title" placeholder="Course Title" className="border p-2 rounded-none text-sm" value={search.title} onChange={handleChange} />
        <select name="dept" className="border p-2 rounded-none text-sm" value={search.dept} onChange={handleChange}>
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <input name="instructor" placeholder="Instructor Name" className="border p-2 rounded-none text-sm" value={search.instructor} onChange={handleChange} />
        <select name="session" className="border p-2 rounded-none text-sm" value={search.session} onChange={handleChange}>
          <option value="2025-II">2025-II</option>
          <option value="2025-I">2025-I</option>
          <option value="2024-II">2024-II</option>
        </select>
      </div>

      {courses.length === 0 ? (
        <p className="text-gray-600">No courses available right now.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((c) => {
            const { canApply, canDrop, enrollment, status, limitReached } = getCourseActions(c);

            return (
              <div 
                key={c.course_id} 
                onClick={() => setSelectedCourse(c)}
                className="bg-white p-4 shadow rounded-none border hover:shadow-lg transition cursor-pointer relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-black">{c.title}</h3>
                    <p className="text-sm text-gray-500">{c.course_code} • {c.credits} Credits</p>
                    <p className="text-sm text-gray-700">Instructor: {c.instructor?.full_name || "—"}</p>
                  </div>
                  {enrollment && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-none ${statusColor(status)}`}>
                      {statusText(status)}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-4 items-center">
                  <button
                    onClick={(e) => handleShowEnrollments(e, c)}
                    className="bg-white hover:bg-gray-100 text-gray-700 px-3 py-1 rounded-none text-sm transition border border-gray-300"
                  >
                    View
                  </button>

                  {/* Enroll Button with Limit Logic */}
                  {!enrollment && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); if(canApply) apply(c.course_id); }}
                        disabled={!canApply}
                        className={`px-4 py-1 rounded-none text-sm transition-all font-semibold border ${
                            canApply 
                            ? "bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white" 
                            : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {limitReached ? "Limit Reached" : "Enroll"}
                      </button>
                  )}

                  {canDrop && (
                    <button onClick={(e) => { e.stopPropagation(); drop(enrollment.enrollment_id); }}
                      className="bg-white border border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-4 py-1 rounded-none text-sm transition-all font-semibold">
                      Drop
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-none shadow-xl max-w-lg w-full p-6 relative">
            <button onClick={() => setSelectedCourse(null)} className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl font-bold">&times;</button>
            <h2 className="text-2xl font-bold mb-1 text-black">{selectedCourse.title}</h2>
            <div className="space-y-3 mb-6 mt-4">
               <div className="flex justify-between border-b pb-2"><span className="font-bold">Credits:</span><span>{selectedCourse.credits}</span></div>
               <div className="flex justify-between border-b pb-2"><span className="font-bold">Instructor:</span><span>{selectedCourse.instructor?.full_name}</span></div>
               <div className="flex justify-between border-b pb-2"><span className="font-bold">Slot:</span><span>{selectedCourse.slot || "N/A"}</span></div>
            </div>
            
            <div className="flex gap-3 justify-end mt-4">
                {(() => {
                    const { canApply, canDrop, limitReached, enrollment } = getCourseActions(selectedCourse);
                    return (
                        <>
                            {!enrollment && (
                                <button 
                                    onClick={() => apply(selectedCourse.course_id)}
                                    disabled={!canApply}
                                    className={`px-6 py-2 rounded-none transition-all font-semibold border-2 ${
                                        canApply 
                                        ? "bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white" 
                                        : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                    {limitReached ? "Credit Limit Reached" : "Enroll Now"}
                                </button>
                            )}
                            {canDrop && (
                                <button onClick={() => drop(enrollment.enrollment_id)} className="bg-white border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-6 py-2 rounded-none transition-all font-semibold">Drop Course</button>
                            )}
                        </>
                    )
                })()}
            </div>
          </div>
        </div>
      )}
      
      {/* Enrollment List Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-none p-6 relative max-w-md w-full">
                <button onClick={() => setShowEnrollmentModal(false)} className="absolute top-4 right-4">&times;</button>
                <h3 className="font-bold">Current Enrollments</h3>
                <ul className="mt-4 space-y-2">
                    {enrollmentList.map((r, i) => (
                        <li key={i} className="flex justify-between text-sm bg-gray-50 p-2 border">
                            <span>{r.student?.full_name}</span>
                            <span className="text-xs font-bold text-gray-500">{r.status}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      )}
    </>
  );
}