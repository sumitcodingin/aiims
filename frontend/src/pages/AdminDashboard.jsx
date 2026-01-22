import { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("");   
  const [filterStatus, setFilterStatus] = useState("PENDING"); 
  
  // 🚀 SELECTION STATE
  const [selectedIds, setSelectedIds] = useState([]);

  // ==========================
  // 1. Logout Function
  // ==========================
  const logout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  const fetchUsers = async () => {
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;

      const res = await api.get("/admin/users", { params });
      setUsers(res.data || []);
      setSelectedIds([]); // Clear selection on filter change
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [filterRole, filterStatus]);

  /* =========================================================
     SINGLE ACTION HANDLERS
     ========================================================= */

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

  /* =========================================================
     🚀 BULK ACTION HANDLERS
     ========================================================= */
  
  // Toggle Single ID
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(prevId => prevId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Toggle All Visible
  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]); // Deselect All
    } else {
      setSelectedIds(users.map(u => u.user_id)); // Select All
    }
  };

  // Perform Bulk Status Change (Approve, Reject, Block)
  const handleBulkAction = async (action) => {
    if (!window.confirm(`Are you sure you want to ${action} ${selectedIds.length} selected users?`)) return;

    try {
      // Execute all requests in parallel
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

  // Perform Bulk Remove
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

  /* =========================================================
     SYSTEM ACTIONS
     ========================================================= */

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
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        
        <div className="flex gap-3">
          <button 
            onClick={handleReset} 
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
          >
            Reset Enrollments
          </button>
          
          <button 
            onClick={logout} 
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded shadow"
          >
            Logout
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded shadow mb-6 flex flex-wrap gap-4 items-center">
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

      {/* 🚀 BULK ACTION BAR (Only shows when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4 flex items-center justify-between animate-fade-in">
          <span className="font-bold text-blue-800">
            {selectedIds.length} Users Selected
          </span>
          <div className="flex gap-2">
            {filterStatus === 'PENDING' && (
              <>
                <button onClick={() => handleBulkAction('APPROVE')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                  Approve All Selected
                </button>
                <button onClick={() => handleBulkAction('REJECT')} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                  Reject All Selected
                </button>
              </>
            )}

            {filterStatus === 'ACTIVE' && (
              <>
                <button onClick={() => handleBulkAction('BLOCK')} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">
                  Block All Selected
                </button>
                <button onClick={handleBulkRemove} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                  Remove All Selected
                </button>
              </>
            )}

            {(filterStatus === 'BLOCKED' || filterStatus === 'REJECTED') && (
               <>
                <button onClick={() => handleBulkAction('APPROVE')} className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">
                  Re-Approve Selected
                </button>
                <button onClick={handleBulkRemove} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                  Remove Selected
                </button>
               </>
            )}
            
            <button onClick={() => setSelectedIds([])} className="text-gray-500 hover:text-gray-700 ml-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* USERS TABLE */}
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              {/* 🚀 SELECT ALL CHECKBOX */}
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 cursor-pointer"
                  checked={users.length > 0 && selectedIds.length === users.length}
                  onChange={toggleSelectAll}
                  disabled={users.length === 0}
                />
              </th>
              <th className="p-4">User Details</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="5" className="p-6 text-center text-gray-500">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className={`border-b hover:bg-gray-50 ${selectedIds.includes(u.user_id) ? 'bg-blue-50' : ''}`}>
                  {/* 🚀 INDIVIDUAL CHECKBOX */}
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 cursor-pointer"
                      checked={selectedIds.includes(u.user_id)}
                      onChange={() => toggleSelect(u.user_id)}
                    />
                  </td>
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
                    
                    {/* SINGLE ACTION BUTTONS */}
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