import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdvisorApprovals() {
  const [requests, setRequests] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    // NOTE:
    // If later you add a GET endpoint, replace this.
    // For now we mock empty until backend provides list.
    setRequests([]);
  }, []);

  const handleAction = async (enrollmentId, action) => {
    try {
      await api.post("/advisor/approve-request", {
        enrollmentId,
        action,
        advisor_id: user.id,
      });

      setRequests(
        requests.filter(r => r.enrollment_id !== enrollmentId)
      );
    } catch (err) {
      alert(
        err.response?.data?.error ||
        "Failed to update approval"
      );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">
        Pending Advisor Approvals
      </h2>

      {requests.length === 0 ? (
        <p className="text-gray-600">
          No pending approvals.
        </p>
      ) : (
        requests.map(req => (
          <div
            key={req.enrollment_id}
            className="bg-white p-4 rounded shadow mb-3 flex justify-between"
          >
            <div>
              <p className="font-semibold">
                {req.student_name}
              </p>
              <p className="text-sm text-gray-600">
                {req.course_title}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleAction(req.enrollment_id, "ACCEPT")
                }
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Accept
              </button>

              <button
                onClick={() =>
                  handleAction(req.enrollment_id, "REJECT")
                }
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
