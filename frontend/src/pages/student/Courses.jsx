import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [appliedMap, setAppliedMap] = useState({});

  // 🔹 NEW FILTER STATE
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [search, setSearch] = useState({
    code: "",
    dept: "",
    session: "2025-II",
    title: "",
    instructor: "",
  });

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollmentList, setEnrollmentList] = useState([]);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  const [viewingEnrollmentMeta, setViewingEnrollmentMeta] = useState({
    title: "",
    enrolledCount: 0,
    capacity: 0,
  });

  const user = JSON.parse(sessionStorage.getItem("user"));
  const CURRENT_SESSION = "2025-II";

  const fetchData = useCallback(async () => {
    try {
      const coursesRes = await api.get("/courses/search", {
        params: search,
      });
      setCourses(coursesRes.data || []);

      const recordsRes = await api.get("/student/records", {
        params: { student_id: user.id, session: CURRENT_SESSION },
      });

      const mapping = {};
      recordsRes.data.forEach((r) => {
        mapping[r.courses.course_id] = r;
      });
      setAppliedMap(mapping);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }, [user.id, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e) => {
    setSearch({ ...search, [e.target.name]: e.target.value });
  };

  /* ================= FILTERED COURSES (NEW) ================= */

  const filteredCourses = courses.filter((c) => {
    const enrollment = appliedMap[c.course_id];
    const status = enrollment?.status;

    // 🔹 STATUS FILTER
    if (statusFilter === "ENROLLED" && status !== "ENROLLED") return false;

    if (
      statusFilter === "PENDING_INSTRUCTOR" &&
      status !== "PENDING_INSTRUCTOR_APPROVAL"
    )
      return false;

    if (
      statusFilter === "PENDING_ADVISOR" &&
      status !== "PENDING_ADVISOR_APPROVAL"
    )
      return false;

    if (statusFilter === "AVAILABLE") {
      if (
        enrollment &&
        ![
          "DROPPED_BY_STUDENT",
          "INSTRUCTOR_REJECTED",
          "ADVISOR_REJECTED",
        ].includes(status)
      )
        return false;
    }

    return true;
  });

  /* ================= EXISTING ACTIONS (UNCHANGED) ================= */

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
      alert(
        err.response?.data?.message ||
          "You already have an active request for this course."
      );
    }
  };

  const drop = async (enrollmentId) => {
    if (!window.confirm("Are you sure you want to drop this course?")) return;

    try {
      await api.post("/student/drop", { enrollmentId });
      alert("Course dropped successfully.");
      fetchData();
      setSelectedCourse(null);
    } catch {
      alert("Drop failed.");
    }
  };

  const handleShowEnrollments = async (e, course) => {
    e.stopPropagation();
    try {
      const res = await api.get(
        `/courses/${course.course_id}/public-enrollments`
      );
      const list = res.data || [];
      const enrolled = list.filter((r) => r.status === "ENROLLED").length;

      setEnrollmentList(list);
      setViewingEnrollmentMeta({
        title: course.title,
        enrolledCount: enrolled,
        capacity: course.capacity,
      });
      setShowEnrollmentModal(true);
    } catch {
      alert("Failed to fetch enrollment list.");
    }
  };

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
      case "DROPPED_BY_STUDENT":
        return "Dropped";
      default:
        return "";
    }
  };

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
        return "bg-gray-100 text-gray-700";
    }
  };

  const getCourseActions = (course) => {
    const enrollment = appliedMap[course.course_id];
    const status = enrollment?.status;

    const canApply =
      !enrollment ||
      status === "DROPPED_BY_STUDENT" ||
      status === "INSTRUCTOR_REJECTED" ||
      status === "ADVISOR_REJECTED";

    const canDrop =
      enrollment &&
      status !== "DROPPED_BY_STUDENT" &&
      status !== "INSTRUCTOR_REJECTED" &&
      status !== "ADVISOR_REJECTED" &&
      enrollment.grade === null;

    return { enrollment, status, canApply, canDrop };
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Available Courses</h2>

      {/* 🔹 STATUS FILTER (NEW) */}
      <div className="mb-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 text-sm bg-white"
        >
          <option value="ALL">All Courses</option>
          <option value="ENROLLED">Enrolled Courses</option>
          <option value="PENDING_INSTRUCTOR">
            Pending Instructor Approval
          </option>
          <option value="PENDING_ADVISOR">Pending Advisor Approval</option>
          <option value="AVAILABLE">Available Courses</option>
        </select>
      </div>

      {/* EXISTING SEARCH BAR (UNCHANGED) */}
      <div className="bg-white p-4 shadow border mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <input name="code" placeholder="Course Code" className="border p-2 text-sm" value={search.code} onChange={handleChange} />
        <input name="title" placeholder="Course Title" className="border p-2 text-sm" value={search.title} onChange={handleChange} />
        <input name="dept" placeholder="Department" className="border p-2 text-sm" value={search.dept} onChange={handleChange} />
        <input name="instructor" placeholder="Instructor Name" className="border p-2 text-sm" value={search.instructor} onChange={handleChange} />
        <select name="session" className="border p-2 text-sm" value={search.session} onChange={handleChange}>
          <option value="2025-II">2025-II</option>
          <option value="2025-I">2025-I</option>
          <option value="2024-II">2024-II</option>
        </select>
      </div>

      {/* COURSE CARDS (UNCHANGED UI) */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredCourses.map((c) => {
          const { canApply, canDrop, enrollment } = getCourseActions(c);

          return (
            <div
              key={c.course_id}
              onClick={() => setSelectedCourse(c)}
              className="bg-white p-4 border border-gray-300 shadow-sm hover:shadow-md transition cursor-pointer rounded-none"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{c.title}</h3>
                  <p className="text-sm text-gray-500">{c.course_code}</p>
                  <p className="text-sm text-gray-700">
                    Instructor: {c.instructor?.full_name || "—"}
                  </p>
                </div>

                {enrollment && (
                  <span
                    className={`px-2 py-1 text-xs font-bold ${statusColor(
                      enrollment.status
                    )}`}
                  >
                    {statusText(enrollment.status)}
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-4 items-center">
                <button
                  onClick={(e) => handleShowEnrollments(e, c)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 text-sm border"
                >
                  Show Enrollments
                </button>

                {canApply && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      apply(c.course_id);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 text-sm"
                  >
                    Enroll
                  </button>
                )}

                {canDrop && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      drop(enrollment.enrollment_id);
                    }}
                    className="border border-red-600 text-red-600 hover:bg-red-50 px-4 py-1 text-sm"
                  >
                    Drop Course
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
