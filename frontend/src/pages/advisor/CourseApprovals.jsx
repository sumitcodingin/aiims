import { useEffect, useState } from "react";
import api from "../../services/api";

export default function CourseApprovals() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [search, setSearch] = useState("");

  /* ================= FETCH COURSES ================= */

  const fetchCourses = async () => {
    try {
      const res = await api.get("/advisor/pending-courses", {
        params: { advisor_id: user.id },
      });

      const sorted = (res.data || []).sort((a, b) =>
        a.status === "PENDING_ADVISOR_APPROVAL" ? -1 : 1
      );

      setCourses(sorted);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  /* ================= ACTION ================= */

  const handleAction = async (courseId, action) => {
    const text = action === "APPROVE" ? "Accept" : "Reject";
    if (!window.confirm(`Are you sure you want to ${text} this course?`)) return;

    await api.post("/advisor/approve-course", {
      course_id: courseId,
      action,
      advisor_id: user.id,
    });

    await fetchCourses();
    setSelectedCourse(null);
  };

  /* ================= FILTER ================= */

  const filteredCourses = courses.filter((c) =>
    `${c.course_code} ${c.title}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl">
      <h2 className="text-xl font-bold mb-4">
        Instructor Course Proposals
      </h2>

      <input
        placeholder="Search course code / title"
        className="border rounded-lg px-4 py-2 text-sm mb-4 w-full md:w-1/3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredCourses.length === 0 ? (
        <p className="text-sm text-gray-500">No course proposals found.</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3">Instructor</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((c) => (
                <tr
                  key={c.course_id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <b>{c.course_code}</b>
                    <div className="text-xs text-gray-600">
                      {c.title}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.instructor?.full_name}
                  </td>
                  <td className="px-4 py-3">
                    {c.acad_session}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedCourse(c)}
                      className="border rounded px-3 py-1 text-xs hover:bg-gray-100"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MODAL ================= */}

      {selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

/* ================= MODAL ================= */

function CourseDetailsModal({ course, onClose, onAction }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-6 relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-1">Confirm Course Details</h2>
        <p className="text-sm text-gray-600 mb-4">
          Instructor: <b>{course.instructor?.full_name}</b>
        </p>

        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <Row label="Course Code" value={course.course_code} />
              <Row label="Title" value={course.title} />
              <Row label="Department" value={course.department} />
              <Row label="Academic Session" value={course.acad_session} />
              <Row label="Credits" value={course.credits} />
              <Row label="Capacity" value={course.capacity} />
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="border px-6 py-2 rounded hover:bg-gray-100"
          >
            Cancel
          </button>

          {course.status === "PENDING_ADVISOR_APPROVAL" && (
            <>
              <button
                onClick={() => onAction(course.course_id, "REJECT")}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => onAction(course.course_id, "APPROVE")}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Confirm & Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */

function Row({ label, value }) {
  return (
    <tr className="border-t">
      <td className="bg-gray-50 px-4 py-3 font-medium w-1/2">
        {label}
      </td>
      <td className="px-4 py-3">{value}</td>
    </tr>
  );
}

function StatusBadge({ status }) {
  let cls = "px-2 py-1 text-xs font-bold rounded ";

  if (status === "APPROVED") cls += "bg-green-100 text-green-700";
  else if (status === "REJECTED") cls += "bg-red-100 text-red-700";
  else cls += "bg-yellow-100 text-yellow-700";

  return <span className={cls}>{status.replace(/_/g, " ")}</span>;
}
