import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    api
      .get("/student/profile", {
        params: { student_id: user.id },
      })
      .then((res) => setProfile(res.data));
  }, [user.id]);

  if (!profile) {
    return (
      <p className="text-gray-600">
        Loading profile...
      </p>
    );
  }

  return (
    <div className="max-w-3xl bg-white shadow rounded-lg p-6">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
          {profile.full_name?.[0]}
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            {profile.full_name}
          </h2>
          <p className="text-gray-600">
            {profile.email}
          </p>
        </div>
      </div>

      {/* DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <ProfileItem label="Role" value={profile.role} />
        <ProfileItem
          label="Department"
          value={profile.department || "—"}
        />
        <ProfileItem
          label="Batch"
          value={profile.student_profile?.batch || "—"}
        />
        <ProfileItem
          label="Entry Number"
          value={profile.student_profile?.entry_no || "—"}
        />
        <ProfileItem
          label="Advisor"
          value={profile.advisor?.full_name || "Not Assigned"}
        />
        <ProfileItem
          label="Advisor Email"
          value={profile.advisor?.email || "—"}
        />
        <ProfileItem
          label="Account Created"
          value={new Date(profile.created_at).toLocaleDateString()}
        />
      </div>
    </div>
  );
}

/* ---------------------------
   Profile Field Component
---------------------------- */
function ProfileItem({ label, value }) {
  return (
    <div className="border rounded p-3">
      <p className="text-gray-500 text-xs mb-1">
        {label}
      </p>
      <p className="font-medium">
        {value}
      </p>
    </div>
  );
}
