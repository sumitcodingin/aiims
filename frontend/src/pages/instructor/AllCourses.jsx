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

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollmentList, setEnrollmentList] = useState([]);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  const [viewingEnrollmentMeta, setViewingEnrollmentMeta] = useState({
    title: "",
    enrolledCount: 0,
    capacity: 0
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/courses/search", { params: search });
      setCourses(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e) => {
    setSearch({ ...search, [e.target.name]: e.target.value });
  };

  const handleShowEnrollments = async (e, course) => {
    e.stopPropagation();
    try {
      const res = await api.get(`/courses/${course.course_id}/public-enrollments`);
      const list = res.data || [];
      const enrolled = list.filter(r => r.status === "ENROLLED").length;

      setEnrollmentList(list);
      setViewingEnrollmentMeta({
        title: course.title,
        enrolledCount: enrolled,
        capacity: course.capacity
      });

      setShowEnrollmentModal(true);
    } catch {
      alert("Failed to fetch enrollment list.");
    }
  };

  const statusClass = (status) => {
    if (status === "ENROLLED") return "text-green-700";
    if (status.includes("PENDING")) return "text-yellow-700";
    return "text-gray-600";
  };

  return (
    <>
      <h2 className="text-xl font-bold mb-6">All Available Courses</h2>

      {/* SEARCH */}
      <div className="border border-gray-400 p-4 mb-6 bg-white">
        <div className="grid md:grid-cols-5 gap-3">
          <input name="code" placeholder="Course Code" className="border px-2 py-1 text-sm" value={search.code} onChange={handleChange} />
          <input name="title" placeholder="Course Title" className="border px-2 py-1 text-sm" value={search.title} onChange={handleChange} />
          <input name="dept" placeholder="Department" className="border px-2 py-1 text-sm" value={search.dept} onChange={handleChange} />
          <input name="instructor" placeholder="Instructor" className="border px-2 py-1 text-sm" value={search.instructor} onChange={handleChange} />
          <select name="session" className="border px-2 py-1 text-sm" value={search.session} onChange={handleChange}>
            <option value="2025-II">2025-II</option>
            <option value="2025-I">2025-I</option>
            <option value="2024-II">2024-II</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      {courses.length === 0 ? (
        <p className="text-gray-600">No courses found.</p>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-400">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-400">
              <tr>
                <th className="px-3 py-2 text-left">Course</th>
                <th className="px-3 py-2 text-left">Instructor</th>
                <th className="px-3 py-2 text-left">Department</th>
                <th className="px-3 py-2 text-left">Session</th>
                <th className="px-3 py-2 text-left">Enrolled</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr
                  key={c.course_id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedCourse(c)}
                >
                  <td className="px-3 py-2">
                    <p className="font-semibold">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.course_code}</p>
                  </td>
                  <td className="px-3 py-2">{c.instructor?.full_name || "—"}</td>
                  <td className="px-3 py-2">{c.department}</td>
                  <td className="px-3 py-2">{c.acad_session}</td>
                  <td className="px-3 py-2">
                    {c.enrolled_count}/{c.capacity}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={(e) => handleShowEnrollments(e, c)}
                      className="border px-3 py-1 text-xs hover:bg-gray-100"
                    >
                      View Enrollments
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* COURSE DETAILS MODAL */}
      {selectedCourse && (
        <Modal onClose={() => setSelectedCourse(null)} title="Course Details">
          <Detail label="Course" value={`${selectedCourse.course_code} – ${selectedCourse.title}`} />
          <Detail label="Instructor" value={selectedCourse.instructor?.full_name || "—"} />
          <Detail label="Department" value={selectedCourse.department} />
          <Detail label="Session" value={selectedCourse.acad_session} />
          <Detail label="Seats" value={`${selectedCourse.enrolled_count}/${selectedCourse.capacity}`} />
        </Modal>
      )}

      {/* ENROLLMENTS MODAL */}
      {showEnrollmentModal && (
        <Modal onClose={() => setShowEnrollmentModal(false)} title="Enrollment List">
          <p className="text-sm font-semibold mb-2">
            {viewingEnrollmentMeta.title}
          </p>
          <p className="text-sm mb-4">
            Enrolled: {viewingEnrollmentMeta.enrolledCount}/{viewingEnrollmentMeta.capacity}
          </p>

          {enrollmentList.length === 0 ? (
            <p className="text-sm text-gray-600">No enrollments yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {enrollmentList.map((r, i) => (
                <li key={i} className="border p-2 flex justify-between">
                  <div>
                    <p className="font-medium">{r.student?.full_name || "—"}</p>
                    <p className="text-xs text-gray-500">{r.student?.department}</p>
                  </div>
                  <span className={`font-semibold ${statusClass(r.status)}`}>
                    {r.status.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </>
  );
}

/* ================= HELPERS ================= */

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white border border-gray-400 p-6 max-w-lg w-full relative">
        <button onClick={onClose} className="absolute top-3 right-4 text-xl font-bold">
          ×
        </button>
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between border-b py-2 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <span>{value}</span>
    </div>
  );
}
