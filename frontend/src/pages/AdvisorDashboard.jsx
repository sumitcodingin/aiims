import { useEffect, useState } from "react";
import api from "../services/api";
import AdvisorApprovals from "./advisor/AdvisorApprovals";

export default function AdvisorDashboard() {
  const [activeTab, setActiveTab] = useState("students");

  // COURSE APPROVAL STATE
  const [pendingCourses, setPendingCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user"));

  const logout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  /* ================= COURSE APPROVAL FLOW ================= */

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
    if (activeTab === "courses") {
      fetchPendingCourses();
    }
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

  /* ================= COURSE FILTER ================= */

  const filteredCourses = pendingCourses.filter((c) => {
    const q = courseSearch.toLowerCase();
    return (
      c.course_code?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.instructor?.full_name?.toLowerCase().includes(q)
    );
  });

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ================= SIDEBAR ================= */}
      <nav className="fixed top-0 left-0 h-screen w-64 bg-blue-600 text-white flex flex-col justify-between shadow">
        <div>
          <h1 className="text-2xl font-bold px-6 py-5 border-b border-blue-500">
            Advisor Portal
          </h1>

          <div className="flex flex-col mt-4">
            <NavBtn
              active={activeTab === "students"}
              onClick={() => setActiveTab("students")}
            >
              Student Approvals
            </NavBtn>

            <NavBtn
              active={activeTab === "courses"}
              onClick={() => setActiveTab("courses")}
            >
              Course Approvals
            </NavBtn>

            <NavBtn
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </NavBtn>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-blue-500">
          <p className="text-sm mb-3">{user?.name || "Advisor"}</p>
          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 py-2 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="ml-64 p-6 min-h-screen overflow-y-auto">
        {/* ================= STUDENT APPROVALS ================= */}
        {activeTab === "students" && (
          <div className="max-w-6xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Student Enrollment Approvals
              </h2>

              <input
                type="text"
                placeholder="Search by course code, title, instructor"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="border rounded-lg px-4 py-2 w-80"
              />
            </div>

            {/* 🔹 SEARCH FILTER APPLIES TO COURSES */}
            <AdvisorApprovals searchQuery={courseSearch} />
          </div>
        )}

        {/* ================= COURSE APPROVALS ================= */}
        {activeTab === "courses" && (
          <div className="max-w-5xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Course Approvals</h2>

              <input
                type="text"
                placeholder="Search by course code, title, instructor"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="border rounded-lg px-4 py-2 w-80"
              />
            </div>

            {loading && <p className="text-gray-600">Loading...</p>}

            {!loading && filteredCourses.length === 0 && (
              <p className="text-gray-600">No matching pending courses.</p>
            )}

            <div className="space-y-4">
              {filteredCourses.map((c) => (
                <div
                  key={c.course_id}
                  className="bg-white shadow rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {c.course_code} — {c.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      Instructor: {c.instructor?.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Department: {c.department} • Session: {c.acad_session}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleCourseAction(c.course_id, "APPROVE")
                      }
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        handleCourseAction(c.course_id, "REJECT")
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= PROFILE ================= */}
        {activeTab === "profile" && (
          <div className="bg-gray-100">
            <div className="bg-indigo-600 h-40 rounded-2xl"></div>

            <div className="bg-white max-w-5xl mx-auto rounded-2xl shadow -mt-20 p-8">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-white">
                  {user?.name?.[0] || "A"}
                </div>

                <div>
                  <h2 className="text-2xl font-bold">{user?.name}</h2>
                  <p className="text-gray-600">
                    {user?.department || "Computer Science"} • Advisor
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <ProfileCard title="Contact Info">
                  <ProfileRow label="Email" value={user?.email} />
                  <ProfileRow label="Department" value={user?.department} />
                  <ProfileRow label="Room No" value="—" />
                </ProfileCard>

                <ProfileCard title="Details">
                  <InputLike label="Research Interests" value="—" />
                  <InputLike label="Experience" value="—" />
                </ProfileCard>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ================= HELPERS ================= */

function NavBtn({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`text-left px-6 py-3 transition ${
        active ? "bg-blue-500 font-medium" : "hover:bg-blue-500"
      }`}
    >
      {children}
    </button>
  );
}

function ProfileCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex justify-between mb-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function InputLike({ label, value }) {
  return (
    <div className="mb-4">
      <label className="text-sm text-gray-500 block mb-1">{label}</label>
      <div className="border rounded-lg px-3 py-2 bg-gray-50">
        {value || "—"}
      </div>
    </div>
  );
}
