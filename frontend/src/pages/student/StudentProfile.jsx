import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    api
      .get("/student/profile", {
        params: { student_id: user.id },
      })
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, [user.id]);

  if (!profile) {
    return <p className="text-gray-600">Loading profile...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* ================= PROFILE HEADER ================= */}
      <div className="bg-white rounded-2xl shadow overflow-hidden mb-6">
        {/* Banner */}
        <div className="h-32 bg-indigo-600 relative">
          {/* Avatar */}
          <div className="absolute left-8 -bottom-12">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow">
              <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold">
                {profile.full_name?.[0]}
              </div>
            </div>
          </div>
        </div>

        {/* Name + Info */}
        <div className="pt-16 px-8 pb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {profile.full_name}
          </h2>
          <p className="text-gray-600">
            {profile.department || "Department"} • Student
          </p>
        </div>
      </div>

      {/* ================= DETAILS SECTION ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Contact Info
          </h3>

          <div className="space-y-3 text-sm">
            <InfoRow label="Email" value={profile.email} />
            <InfoRow
              label="Department"
              value={profile.department || "—"}
            />
            <InfoRow
              label="Account Created"
              value={new Date(profile.created_at).toLocaleDateString()}
            />
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Personal Details
          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <DetailBox
              label="Batch"
              value={profile.student_profile?.batch || "—"}
            />
            <DetailBox
              label="Entry Number"
              value={profile.student_profile?.entry_no || "—"}
            />
            <DetailBox
              label="Advisor"
              value={profile.advisor?.full_name || "Not Assigned"}
            />
            <DetailBox
              label="Advisor Email"
              value={profile.advisor?.email || "—"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-gray-700">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="bg-gray-50 border rounded-lg px-3 py-2 font-medium">
        {value}
      </div>
    </div>
  );
}
