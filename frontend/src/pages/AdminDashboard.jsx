import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("PENDING"); // Default to Pending Users
  const user = JSON.parse(sessionStorage.getItem("user"));

  const logout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* ================= SIDEBAR ================= */}
      <nav className="fixed top-0 left-0 h-screen w-64 bg-neutral-900 text-neutral-200 shadow-lg flex flex-col justify-between z-10">
        {/* TOP */}
        <div>
          <h1 className="text-xl font-bold px-6 py-5 border-b border-neutral-700 tracking-wide text-white">
            Admin Portal
          </h1>

          <div className="flex flex-col mt-4">
            <div className="px-6 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              User Management
            </div>
            
            <NavBtn
              active={activeTab === "PENDING"}
              onClick={() => setActiveTab("PENDING")}
            >
              Pending Users
            </NavBtn>

            <NavBtn
              active={activeTab === "ACTIVE"}
              onClick={() => setActiveTab("ACTIVE")}
            >
              Active Users
            </NavBtn>

            <NavBtn
              active={activeTab === "BLOCKED"}
              onClick={() => setActiveTab("BLOCKED")}
            >
              Blocked Users
            </NavBtn>

            <NavBtn
              active={activeTab === "REJECTED"}
              onClick={() => setActiveTab("REJECTED")}
            >
              Rejected Users
            </NavBtn>

            <div className="mt-4 px-6 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Course Management
            </div>

            <NavBtn
              active={activeTab === "OFFERINGS"}
              onClick={() => setActiveTab("OFFERINGS")}
            >
              All Offerings
            </NavBtn>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="px-6 py-4 border-t border-neutral-700 bg-neutral-900">
          <p className="text-sm text-neutral-400 mb-3">
            {user?.full_name || "Administrator"}
          </p>

          <button
            onClick={logout}
            className="w-full bg-red-700 hover:bg-red-600 px-3 py-2 rounded-md text-sm text-white transition font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <main className="ml-64 p-8 min-h-screen overflow-y-auto">
        {/* Render User List for Status Tabs */}
        {["PENDING", "ACTIVE", "BLOCKED", "REJECTED"].includes(activeTab) && (
          <UserList status={activeTab} />
        )}

        {/* Render Course Management */}
        {activeTab === "OFFERINGS" && <AdminCourseList />}
      </main>
    </div>
  );
}

/* =========================================================
   COMPONENT 1: USER LIST (Logic adapted from original AdminDashboard)
   ========================================================= */
function UserList({ status }) {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("");   
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch Users based on prop status and local role filter
  const fetchUsers = useCallback(async () => {
    try {
      const params = { status };
      if (filterRole) params.role = filterRole;

      const res = await api.get("/admin/users", { params });
      setUsers(res.data || []);
      setSelectedIds([]); // Clear selection on tab/filter change
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }, [status, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- Actions ---

  const handleAction = async (userId, action) => {
    if(!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await api.post("/admin/user-status", { userId, action });
      alert(`User ${action}ED`);
      fetchUsers();
    } catch (err) {
      alert("Action failed");
    }
  };

  const handleRemove = async (userId) => {
    if(!window.confirm("Are you sure you want to PERMANENTLY REMOVE this user?")) return;
    try {
      await api.post("/admin/delete-user", { userId });
      alert("User Removed");
      fetchUsers();
    } catch (err) {
      alert("Remove failed");
    }
  };

  const handleReset = async () => {
    if (!window.confirm("DANGER: Wipe all enrollments?")) return;
    try {
      await api.delete("/admin/reset-enrollments");
      alert("Enrollments reset.");
    } catch (err) {
      alert("Reset failed.");
    }
  };

  // --- Bulk Actions ---

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(prevId => prevId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]); 
    } else {
      setSelectedIds(users.map(u => u.user_id)); 
    }
  };

  const handleBulkAction = async (action) => {
    if (!window.confirm(`Are you sure you want to ${action} ${selectedIds.length} selected users?`)) return;
    try {
      await Promise.all(
        selectedIds.map(id => api.post("/admin/user-status", { userId: id, action }))
      );
      alert(`Selected users ${action}ED successfully.`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Some actions failed. Check console.");
    }
  };

  const handleBulkRemove = async () => {
    if (!window.confirm(`PERMANENTLY DELETE ${selectedIds.length} users? This cannot be undone.`)) return;
    try {
      await Promise.all(
        selectedIds.map(id => api.post("/admin/delete-user", { userId: id }))
      );
      alert("Selected users removed.");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Bulk remove failed.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {status.charAt(0) + status.slice(1).toLowerCase()} Users
        </h2>
        
        <button 
          onClick={handleReset} 
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow text-sm font-medium"
        >
          Reset All Enrollments
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded shadow mb-6 flex flex-wrap gap-4 items-center border border-gray-200">
        <span className="font-bold text-gray-700">Filter Role:</span>
        <select 
          className="border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="Student">Student</option>
          <option value="Instructor">Instructor</option>
          <option value="Advisor">Advisor</option>
        </select>
        
        <button onClick={fetchUsers} className="text-blue-600 hover:text-blue-800 underline text-sm ml-auto font-medium">
          Refresh Data
        </button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4 flex items-center justify-between animate-fade-in shadow-sm">
          <span className="font-bold text-blue-800">
            {selectedIds.length} Users Selected
          </span>
          <div className="flex gap-2">
            {status === 'PENDING' && (
              <>
                <button onClick={() => handleBulkAction('APPROVE')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 font-medium">
                  Approve Selected
                </button>
                <button onClick={() => handleBulkAction('REJECT')} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 font-medium">
                  Reject Selected
                </button>
              </>
            )}

            {status === 'ACTIVE' && (
              <>
                <button onClick={() => handleBulkAction('BLOCK')} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 font-medium">
                  Block Selected
                </button>
                <button onClick={handleBulkRemove} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 font-medium">
                  Remove Selected
                </button>
              </>
            )}

            {(status === 'BLOCKED' || status === 'REJECTED') && (
               <>
                <button onClick={() => handleBulkAction('APPROVE')} className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 font-medium">
                  Re-Approve Selected
                </button>
                <button onClick={handleBulkRemove} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 font-medium">
                  Remove Selected
                </button>
               </>
            )}
            
            <button onClick={() => setSelectedIds([])} className="text-gray-500 hover:text-gray-700 ml-2 font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-4 w-10 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 cursor-pointer"
                  checked={users.length > 0 && selectedIds.length === users.length}
                  onChange={toggleSelectAll}
                  disabled={users.length === 0}
                />
              </th>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase">User Details</th>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Role</th>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500 italic">No users found in this category.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(u.user_id) ? 'bg-blue-50' : ''}`}>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 cursor-pointer"
                      checked={selectedIds.includes(u.user_id)}
                      onChange={() => toggleSelect(u.user_id)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{u.full_name}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{u.department || "No Dept"}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-bold text-gray-600">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    {/* ACTION BUTTONS */}
                    {status === 'PENDING' && (
                      <>
                        <button onClick={() => handleAction(u.user_id, 'APPROVE')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition">Accept</button>
                        <button onClick={() => handleAction(u.user_id, 'REJECT')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition">Reject</button>
                      </>
                    )}
                    {status === 'ACTIVE' && (
                      <>
                        <button onClick={() => handleAction(u.user_id, 'BLOCK')} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium transition">Block</button>
                        <button onClick={() => handleRemove(u.user_id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition">Remove</button>
                      </>
                    )}
                    {(status === 'BLOCKED' || status === 'REJECTED') && (
                      <>
                        <button onClick={() => handleAction(u.user_id, 'APPROVE')} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs font-medium transition">Re-Approve</button>
                        <button onClick={() => handleRemove(u.user_id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition">Remove</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENT 2: ADMIN COURSE LIST (Adapted from AllCourses.jsx)
   ========================================================= */
function AdminCourseList() {
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
  const [viewingEnrollmentMeta, setViewingEnrollmentMeta] = useState({ title: "", enrolledCount: 0, capacity: 0 });

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

  const handleRemoveCourse = async (e, courseId) => {
    e.stopPropagation();
    if (!window.confirm("Confirm delete this course? This action cannot be undone.")) return;
    
    try {
        // Assuming a standard delete endpoint exists based on CRUD patterns
        await api.delete(`/courses/${courseId}`); 
        alert("Course deleted successfully.");
        fetchData(); // Refresh list
    } catch (err) {
        console.error("Delete failed", err);
        alert("Failed to delete course.");
    }
  };

  const statusClass = (status) => {
    if (status === "ENROLLED") return "text-green-700";
    if (status.includes("PENDING")) return "text-yellow-700";
    return "text-gray-600";
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">All Course Offerings</h2>

      {/* Search Bar */}
      <div className="border border-gray-300 p-4 mb-6 bg-white rounded shadow-sm">
        <div className="grid md:grid-cols-5 gap-3">
          <input name="code" placeholder="Course Code" className="border px-3 py-2 text-sm rounded" value={search.code} onChange={handleChange} />
          <input name="title" placeholder="Course Title" className="border px-3 py-2 text-sm rounded" value={search.title} onChange={handleChange} />
          <input name="dept" placeholder="Department" className="border px-3 py-2 text-sm rounded" value={search.dept} onChange={handleChange} />
          <input name="instructor" placeholder="Instructor" className="border px-3 py-2 text-sm rounded" value={search.instructor} onChange={handleChange} />
          <select name="session" className="border px-3 py-2 text-sm rounded bg-white" value={search.session} onChange={handleChange}>
            <option value="2025-II">2025-II</option>
            <option value="2025-I">2025-I</option>
            <option value="2024-II">2024-II</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {courses.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No courses found matching criteria.</p>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 shadow rounded">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Course</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Instructor</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Department</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Session</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Enrolled</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courses.map((c) => (
                <tr
                  key={c.course_id}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedCourse(c)}
                >
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-800">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.course_code}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.instructor?.full_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.department}</td>
                  <td className="px-4 py-3 text-gray-600">{c.acad_session}</td>
                  <td className="px-4 py-3 text-gray-600 font-medium">
                    {c.enrolled_count}/{c.capacity}
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button
                      onClick={(e) => handleShowEnrollments(e, c)}
                      className="border border-gray-300 px-3 py-1 rounded text-xs hover:bg-gray-100 transition"
                    >
                      View
                    </button>
                    {/* DELETE BUTTON FOR ADMIN */}
                    <button
                      onClick={(e) => handleRemoveCourse(e, c.course_id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <Modal onClose={() => setSelectedCourse(null)} title="Course Details">
          <Detail label="Course" value={`${selectedCourse.course_code} – ${selectedCourse.title}`} />
          <Detail label="Instructor" value={selectedCourse.instructor?.full_name || "—"} />
          <Detail label="Department" value={selectedCourse.department} />
          <Detail label="Session" value={selectedCourse.acad_session} />
          <Detail label="Seats" value={`${selectedCourse.enrolled_count}/${selectedCourse.capacity}`} />
          <Detail label="Description" value={selectedCourse.description || "No description provided."} />
        </Modal>
      )}

      {/* Enrollments Modal */}
      {showEnrollmentModal && (
        <Modal onClose={() => setShowEnrollmentModal(false)} title="Enrollment List">
          <div className="mb-4 pb-4 border-b">
            <p className="font-bold text-lg text-gray-800">{viewingEnrollmentMeta.title}</p>
            <p className="text-sm text-gray-600">
              Enrolled: {viewingEnrollmentMeta.enrolledCount} / {viewingEnrollmentMeta.capacity}
            </p>
          </div>

          {enrollmentList.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No enrollments yet.</p>
          ) : (
            <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
              {enrollmentList.map((r, i) => (
                <li key={i} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-700">{r.student?.full_name || "—"}</p>
                    <p className="text-xs text-gray-500">{r.student?.department}</p>
                  </div>
                  <span className={`font-bold text-xs px-2 py-1 rounded border bg-white ${statusClass(r.status)}`}>
                    {r.status.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   HELPERS & UI COMPONENTS
   ========================================================= */

function NavBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-6 py-3 text-sm transition-colors w-full border-l-4
        ${
          active
            ? "bg-neutral-800 text-white font-medium border-blue-500"
            : "text-neutral-400 border-transparent hover:bg-neutral-800 hover:text-white"
        }`}
    >
      {children}
    </button>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full relative animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none">
          &times;
        </button>
        <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex flex-col mb-3">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}