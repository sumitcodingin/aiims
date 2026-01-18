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
    return <p className="text-gray-600">Loading profile...</p>;
  }

  return (
    <div className="max-w-2xl bg-white shadow rounded p-6">
      <h2 className="text-2xl font-bold mb-6">Student Profile</h2>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <ProfileItem label="Full Name" value={profile.full_name} />
        <ProfileItem label="Email" value={profile.email} />
        <ProfileItem label="Role" value={profile.role} />
        <ProfileItem label="Department" value={profile.department || "—"} />
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
          label="Account Created"
          value={new Date(profile.created_at).toLocaleDateString()}
        />
      </div>
    </div>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
