export default function AdvisorProfile() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-2xl font-bold mb-4">
        Advisor Profile
      </h2>

      <div className="bg-white shadow rounded p-4 space-y-2">
        <ProfileItem label="Name" value={user.name} />
        <ProfileItem label="Email" value={user.email || "—"} />
        <ProfileItem label="Role" value={user.role} />
      </div>
    </div>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
