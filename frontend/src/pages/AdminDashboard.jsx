import { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("");   
  const [filterStatus, setFilterStatus] = useState("PENDING"); 

  const fetchUsers = async () => {
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;

      const res = await api.get("/admin/users", { params });
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterStatus]);

  // Handle Approve, Reject, Block
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

  // Handle Remove (Delete)
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">👑 Admin Dashboard</h1>
        <button onClick={handleReset} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow">
          ⚠ Reset Enrollments
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded shadow mb-6 flex gap-4 items-center">
        <span className="font-bold text-gray-700">Filter:</span>
        <select 
          className="border p-2 rounded" 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="PENDING">Pending (New Requests)</option>
          <option value="ACTIVE">Active (Approved Users)</option>
          <option value="BLOCKED">Blocked Users</option>
          <option value="REJECTED">Rejected Users</option>
        </select>

        <select 
          className="border p-2 rounded" 
          value={filterRole} 
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="Student">Student</option>
          <option value="Instructor">Instructor</option>
          <option value="Advisor">Advisor</option>
        </select>
        
        <button onClick={fetchUsers} className="text-blue-600 underline text-sm ml-auto">Refresh</button>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">User Details</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="4" className="p-6 text-center text-gray-500">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-bold">{u.full_name}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                    <div className="text-xs text-gray-400">{u.department || "-"}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold">{u.role}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold 
                      ${u.account_status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                        u.account_status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {u.account_status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    
                    {/* 🚀 CASE 1: PENDING USERS (Accept / Reject) */}
                    {u.account_status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleAction(u.user_id, 'APPROVE')}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleAction(u.user_id, 'REJECT')}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {/* 🚀 CASE 2: ACTIVE USERS (Block / Remove) */}
                    {u.account_status === 'ACTIVE' && (
                      <>
                        <button 
                          onClick={() => handleAction(u.user_id, 'BLOCK')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Block
                        </button>
                        <button 
                          onClick={() => handleRemove(u.user_id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Remove
                        </button>
                      </>
                    )}

                    {/* 🚀 CASE 3: BLOCKED/REJECTED (Option to Restore or Delete) */}
                    {(u.account_status === 'BLOCKED' || u.account_status === 'REJECTED') && (
                      <>
                        <button 
                          onClick={() => handleAction(u.user_id, 'APPROVE')}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Re-Approve
                        </button>
                        <button 
                          onClick={() => handleRemove(u.user_id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Remove
                        </button>
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