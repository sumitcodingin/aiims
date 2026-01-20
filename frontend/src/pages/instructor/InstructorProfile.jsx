export default function InstructorProfile() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow rounded-b-2xl overflow-hidden">
        {/* Purple Banner */}
        <div className="h-36 bg-indigo-600"></div>

        {/* Profile Content */}
        <div className="relative px-8 pb-6">
          {/* Avatar */}
          <div className="absolute -top-12">
            <div className="h-24 w-24 rounded-full bg-indigo-600 border-4 border-white flex items-center justify-center text-white text-3xl font-bold shadow-md">
              {user?.name?.[0] || "P"}
            </div>
          </div>

          {/* Name & Role */}
          <div className="pt-16">
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.name || "—"}
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.department || "Computer Science"} • Instructor
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="px-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Info</h2>

          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Department" value={user?.department || "Computer Science"} />
          <InfoRow label="Account Created" value={user?.createdAt || "—"} />
        </div>

        {/* Personal Details */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Personal Details</h2>

          <InputLike label="Batch" value={user?.batch} />
          <InputLike label="Entry Number" value={user?.entryNumber} />
          <InputLike label="Advisor" value={user?.advisor || "Not Assigned"} />
          <InputLike label="Advisor Email" value={user?.advisorEmail} />
        </div>
      </div>
    </div>
  );
}

/* Reusable Components */

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center mb-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value || "—"}</span>
    </div>
  );
}

function InputLike({ label, value }) {
  return (
    <div className="mb-4">
      <label className="text-sm text-gray-500 block mb-1">
        {label}
      </label>
      <div className="border rounded-lg px-3 py-2 bg-gray-50 font-medium text-gray-800">
        {value || "—"}
      </div>
    </div>
  );
}
