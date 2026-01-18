export default function InstructorProfile() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="max-w-xl bg-white p-6 shadow rounded">
      <h2 className="text-xl font-bold mb-4">Instructor Profile</h2>

      <ProfileItem label="Name" value={user?.name} />
      <ProfileItem label="Email" value={user?.email} />
      <ProfileItem label="Role" value={user?.role} />
      <ProfileItem label="User ID" value={user?.id} />
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
