import { useEffect, useState } from "react";
import api from "../../services/api";

export default function InstructorApprovals() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH COURSES ================= */
  useEffect(() => {
    if (!user?.id) return;
    
    api
      .get("/instructor/courses", {
        params: { instructor_id: user.id },
      })
      .then((res) => setCourses(res.data || []))
      .catch((err) => {
        console.error("Failed to fetch courses:", err);
        setCourses([]);
      });
  }, [user.id]);

  /* ================= FETCH APPLICATIONS & ENROLLED ================= */
  useEffect(() => {
    if (!selectedCourse) return;

    setLoading(true);
    api
      .get("/instructor/applications", {
        params: { course_id: selectedCourse.course_id },
      })
      .then((res) => setApplications(res.data || []))
      .catch((err) => {
        console.error("Failed to fetch applications:", err);
        setApplications([]);
      })
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  /* ================= ACTIONS: APPROVE / REJECT / REMOVE ================= */
  const handleAction = async (enrollmentId, action) => {
    // Confirmation for Removal
    if (action === "REMOVE" && !window.confirm("Are you sure you want to remove this student?")) {
      return;
    }

    try {
      await api.post("/instructor/approve-request", {
        enrollmentId,
        action, // 'ACCEPT', 'REJECT', or 'REMOVE'
        instructor_id: user.id,
      });

      // Remove the processed student from the local list
      setApplications((prev) =>
        prev.filter((a) => a.enrollment_id !== enrollmentId)
      );
      
      // OPTIONAL: Update local state to reflect count change instantly
      if (action === "REMOVE") {
         setCourses(prevCourses => prevCourses.map(c => 
            c.course_id === selectedCourse.course_id 
             ? { ...c, enrolled_count: Math.max(0, (c.enrolled_count || 0) - 1) } 
             : c
         ));
         setSelectedCourse(prev => ({
             ...prev,
             enrolled_count: Math.max(0, (prev.enrolled_count || 0) - 1)
         }));
      }

    } catch (err) {
      alert("Failed to update student status.");
    }
  };

  /* ================= SEPARATE LISTS ================= */
  const pendingStudents = applications.filter(
    (a) => a.status === "PENDING_INSTRUCTOR_APPROVAL"
  );
  const enrolledStudents = applications.filter(
    (a) => a.status === "ENROLLED"
  );

  /* ================= FILTER COURSES ================= */
  const filteredCourses = courses.filter(
    (c) =>
      c.course_code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= UI ================= */
  return (
    <div className="max-w-6xl">
      {/* ================= COURSES VIEW ================= */}
      {!selectedCourse && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Courses</h2>

            <input
              type="text"
              placeholder="Search by course code or title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-4 py-2 w-72"
            />
          </div>

          {filteredCourses.length === 0 ? (
            <p className="text-gray-600">No courses found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.course_id}
                  course={course}
                  onView={() => setSelectedCourse(course)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= COURSE DETAILS VIEW ================= */}
      {selectedCourse && (
        <>
          <button
            onClick={() => {
              setSelectedCourse(null);
              setApplications([]);
            }}
            className="text-blue-600 mb-4 hover:underline"
          >
            ← Back to My Courses
          </button>

          <div className="bg-white shadow rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold">
              {selectedCourse.course_code} — {selectedCourse.title}
            </h3>
            <div className="text-sm text-gray-700 mt-2 space-y-1">
              <p><span className="font-semibold">Department:</span> {selectedCourse.department}</p>
              <p><span className="font-semibold">Session:</span> {selectedCourse.acad_session}</p>
              <p><span className="font-semibold text-blue-700">Seats:</span> {selectedCourse.enrolled_count || 0} / {selectedCourse.capacity}</p>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading students...</p>
          ) : (
            <div className="space-y-8">
              
              {/* === SECTION 1: PENDING APPLICATIONS === */}
              <div>
                <h4 className="text-lg font-bold mb-3 text-yellow-700 border-b pb-2">Pending Applications</h4>
                {pendingStudents.length === 0 ? (
                  <p className="text-gray-500 italic">No pending applications.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingStudents.map((a) => (
                      <StudentRow 
                        key={a.enrollment_id} 
                        application={a} 
                        onAccept={() => handleAction(a.enrollment_id, "ACCEPT")}
                        onReject={() => handleAction(a.enrollment_id, "REJECT")}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* === SECTION 2: ENROLLED STUDENTS === */}
              <div>
                <h4 className="text-lg font-bold mb-3 text-green-700 border-b pb-2">Enrolled Students</h4>
                {enrolledStudents.length === 0 ? (
                  <p className="text-gray-500 italic">No enrolled students yet.</p>
                ) : (
                  <div className="space-y-3">
                    {enrolledStudents.map((a) => (
                      <StudentRow 
                        key={a.enrollment_id} 
                        application={a}
                        isEnrolled={true}
                        onRemove={() => handleAction(a.enrollment_id, "REMOVE")}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */

function StudentRow({ application, onAccept, onReject, onRemove, isEnrolled }) {
  return (
    <div className="bg-white shadow rounded-lg p-4 flex justify-between items-center border-l-4 border-gray-200">
      <div>
        <p className="font-semibold text-gray-900">{application.student?.full_name}</p>
        <p className="text-sm text-gray-600">{application.student?.email}</p>
        <p className="text-xs text-gray-500 uppercase font-bold mt-1">
          {application.student?.department}
        </p>
      </div>

      <div className="flex gap-2">
        {isEnrolled ? (
          <button
            onClick={onRemove}
            className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-1.5 rounded text-sm font-semibold transition"
          >
            Remove Student
          </button>
        ) : (
          <>
            <button
              onClick={onAccept}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm font-semibold transition"
            >
              Accept
            </button>
            <button
              onClick={onReject}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm font-semibold transition"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, onView }) {
  return (
    <div className="bg-white shadow rounded-xl p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold mb-1">{course.course_code}</h3>
        <p className="text-gray-700 font-medium">{course.title}</p>

        <div className="text-sm text-gray-600 mt-3 space-y-1">
          <p><span className="font-semibold text-gray-800">Department:</span> {course.department}</p>
          <p><span className="font-semibold text-gray-800">Session:</span> {course.acad_session}</p>
          <p><span className="font-semibold text-blue-700">Seats:</span> {course.enrolled_count || 0} / {course.capacity}</p>
        </div>
      </div>

      <button
        onClick={onView}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
      >
        View Details
      </button>
    </div>
  );
}