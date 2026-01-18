import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    // Using enrollments join to fetch profile data
    api.get("/student/profile", {
      params: { student_id: user.id }
    }).then(res => setProfile(res.data));
  }, [user.id]);

  if (!profile) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="bg-white p-6 shadow rounded max-w-xl">
      <h2 className="text-xl font-bold mb-4">Student Profile</h2>

      <div className="space-y-2">
        <p><b>Name:</b> {profile.full_name}</p>
        <p><b>Email:</b> {profile.email}</p>
        <p><b>Department:</b> {profile.department}</p>
        <p><b>Batch:</b> {profile.batch}</p>
        <p><b>Entry No:</b> {profile.entry_no}</p>
      </div>
    </div>
  );
}
