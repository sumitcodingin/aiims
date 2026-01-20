export default function AdvisorProfile() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      {/* Top Banner */}
      <div className="bg-indigo-600 h-40 rounded-2xl"></div>

      {/* Profile Card */}
      <div className="bg-white max-w-5xl mx-auto rounded-2xl shadow -mt-20 p-8">
        {/* Header */}
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-white">
            {user?.name?.[0] || "A"}
          </div>

          {/* Name & Role */}
          <div>
            <h2 className="text-2xl font-bold">
              {user?.name || "—"}
            </h2>
            <p className="text-gray-600 mt-1">
              {user?.department || "Computer Science"} • Advisor
            </p>
          </div>
        </div>

        {/* Info Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Contact Info */}
          <ProfileCard title="Contact Info">
            <ProfileRow label="Email" value={user?.email} />
            <ProfileRow
              label="Department"
              value={user?.department || "Computer Science"}
            />
            <ProfileRow label="Room No" value={user?.roomNo || "—"} />
          </ProfileCard>

          {/* Details */}
          <ProfileCard title="Details">
            <InputLike
              label="Research Interests"
              value={user?.research || "—"}
            />
            <InputLike
              label="Experience"
              value={user?.experience || "—"}
            />
          </ProfileCard>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */

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
      <label className="text-sm text-gray-500 block mb-1">
        {label}
      </label>
      <div className="border rounded-lg px-3 py-2 bg-gray-50">
        {value || "—"}
      </div>
    </div>
  );
}
