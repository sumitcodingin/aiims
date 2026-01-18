import api from "../services/api";

export default function AdvisorDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const approve = async () => {
    await api.post("/advisor/approve-request", {
      enrollmentId: 1,
      action: "ACCEPT",
      advisor_id: user.id
    });
    alert("Approved");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧑‍💼 Advisor Dashboard</h1>
      <button onClick={approve} className="bg-blue-600 text-white px-4 py-2 rounded">
        Approve Enrollment
      </button>
    </div>
  );
}
