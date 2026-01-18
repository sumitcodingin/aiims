import api from "../services/api";

export default function AdminDashboard() {
  const reset = async () => {
    if (!window.confirm("Are you sure?")) return;
    await api.delete("/admin/reset-enrollments");
    alert("Enrollments reset");
  };

  return (
    <div className="p-6 flex justify-center">
      <div className="bg-white p-8 shadow rounded">
        <h2 className="text-xl font-bold mb-4">👑 Admin Panel</h2>
        <button
          onClick={reset}
          className="bg-red-600 text-white px-6 py-2 rounded"
        >
          Reset Enrollments
        </button>
      </div>
    </div>
  );
}
