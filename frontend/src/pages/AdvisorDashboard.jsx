import { useState } from "react";
import api from "../services/api";

export default function AdvisorDashboard() {
  const [activeTab, setActiveTab] = useState("approvals");
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const approveSample = async () => {
    await api.post("/advisor/approve-request", {
      enrollmentId: 1,
      action: "ACCEPT",
      advisor_id: user.id,
    });
    alert("Enrollment approved");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🔵 BLUE NAVBAR */}
      <nav className="bg-blue-600 text-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          Advisor Dashboard
        </h1>

        <div className="flex gap-6 items-center">
          <button
            onClick={() => setActiveTab("approvals")}
            className={`font-medium ${
              activeTab === "approvals" && "underline"
            }`}
          >
            Approvals
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`font-medium ${
              activeTab === "profile" && "underline"
            }`}
          >
            Profile
          </button>

          <span className="opacity-90">{user?.name}</span>

          <button
            onClick={logout}
            className="bg-red-500 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="p-6">
        {activeTab === "approvals" && (
          <div className="bg-white p-6 shadow rounded max-w-xl">
            <h2 className="text-lg font-bold mb-4">
              Pending Student Approvals
            </h2>

            <p className="text-gray-600 mb-4">
              Pending enrollments assigned to you will appear here.
            </p>

            <button
              onClick={approveSample}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Approve Sample Enrollment
            </button>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white p-6 shadow rounded max-w-xl">
            <h2 className="text-lg font-bold mb-4">
              Advisor Profile
            </h2>

            <ProfileItem label="Name" value={user?.name} />
            <ProfileItem label="Role" value={user?.role} />
            <ProfileItem label="User ID" value={user?.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div className="mb-3">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
