import { useEffect, useState } from "react";
import api from "../services/api";
import AdvisorApprovals from "./advisor/AdvisorApprovals";
import AllCourses from "./advisor/AllCourses";
import AdvisorProfile from "./advisor/AdvisorProfile"; // ✅ NEW IMPORT

export default function AdvisorDashboard() {
  const [activeTab, setActiveTab] = useState("students");

  const [pendingCourses, setPendingCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user"));

  const logout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  const fetchPendingCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/advisor/pending-courses", {
        params: { advisor_id: user.id },
      });
      setPendingCourses(res.data || []);
    } catch {
      setPendingCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "courses") fetchPendingCourses();
  }, [activeTab]);

  const handleCourseAction = async (course_id, action) => {
    await api.post("/advisor/approve-course", {
      course_id,
      action,
      advisor_id: user.id,
    });

    setPendingCourses((prev) =>
      prev.filter((c) => c.course_id !== course_id)
    );
  };

  const filteredCourses = pendingCourses.filter((c) => {
    const q = courseSearch.toLowerCase();
    return (
      c.course_code?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.instructor?.full_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ================= SIDEBAR ================= */}
      <nav className="fixed top-0 left-0 h-screen w-64 bg-neutral-900 text-neutral-200 shadow-lg flex flex-col justify-between">
        <div>
          <h1 className="text-lg font-semibold px-6 py-5 border-b border-neutral-700 tracking-wide">
            Advisor Portal
          </h1>

          <div className="flex flex-col mt-4">
            <NavBtn active={activeTab === "students"} onClick={() => setActiveTab("students")}>
              Student Approvals
            </NavBtn>

            <NavBtn active={activeTab === "courses"} onClick={() => setActiveTab("courses")}>
              Course Approvals
            </NavBtn>

            <NavBtn active={activeTab === "all-courses"} onClick={() => setActiveTab("all-courses")}>
              All Offerings
            </NavBtn>

            <NavBtn active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
              Profile
            </NavBtn>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-700">
          <p className="text-sm text-neutral-400 mb-3">
            {user?.name || "Advisor"}
          </p>
          <button
            onClick={logout}
            className="w-full bg-neutral-700 hover:bg-neutral-600 px-3 py-2 rounded-md text-sm text-white"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="ml-64 p-6 min-h-screen overflow-y-auto">
        {activeTab === "students" && (
          <AdvisorApprovals searchQuery={courseSearch} />
        )}

        {activeTab === "courses" && (
          <div className="max-w-5xl">
            <input
              type="text"
              placeholder="Search by course code, title, instructor"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="border rounded-lg px-4 py-2 mb-4 w-80"
            />

            {loading && <p>Loading...</p>}

            {filteredCourses.map((c) => (
              <div key={c.course_id} className="bg-white border p-4 mb-3">
                <p className="font-semibold">
                  {c.course_code} — {c.title}
                </p>
                <p className="text-sm text-gray-600">
                  Instructor: {c.instructor?.full_name}
                </p>

                <div className="mt-2">
                  <button
                    onClick={() => handleCourseAction(c.course_id, "APPROVE")}
                    className="bg-green-600 text-white px-3 py-1 mr-2"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleCourseAction(c.course_id, "REJECT")}
                    className="bg-red-600 text-white px-3 py-1"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "all-courses" && <AllCourses />}

        {/* ✅ DOCUMENT-STYLE PROFILE */}
        {activeTab === "profile" && <AdvisorProfile />}
      </main>
    </div>
  );
}

/* ================= HELPERS ================= */

function NavBtn({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`text-left px-6 py-3 text-sm ${
        active
          ? "bg-neutral-800 text-white font-medium"
          : "text-neutral-300 hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}
