import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await api.get("/student/projects/browse");
      setProjects(res.data || []);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleRequestClick = (project) => {
    setSelectedProject(project);
    setMessage("");
  };

  const submitRequest = async () => {
    if (!selectedProject) return;

    try {
      await api.post("/student/projects/request", {
        project_id: selectedProject.project_id,
        message: message,
      });
      alert("Request sent successfully!");
      setSelectedProject(null);
      fetchProjects(); // Refresh to update status
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to send request.");
    }
  };

  /* Helper to render the correct button based on status */
  const renderActionButton = (project) => {
    const { student_mode, my_status } = project;

    // 1. Status: Enrolled
    if (my_status === "ACCEPTED") {
      return (
        <button disabled className="bg-green-100 text-green-700 text-sm px-4 py-2 rounded font-semibold cursor-default">
          ✓ Accepted
        </button>
      );
    }

    // 2. Status: Rejected
    if (my_status === "REJECTED") {
       return (
        <button disabled className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded font-semibold cursor-default">
          ✕ Rejected
        </button>
      );
    }

    // 3. Status: Pending Request
    if (my_status === "PENDING") {
      return (
        <button disabled className="bg-yellow-100 text-yellow-800 text-sm px-4 py-2 rounded font-semibold cursor-default">
          ⏳ Requested
        </button>
      );
    }

    // 4. Status: Not Accepting
    if (student_mode === "NO_STUDENTS") {
      return (
        <button disabled className="text-gray-400 text-sm cursor-not-allowed">
          Not Accepting Students
        </button>
      );
    }

    // 5. Default: Open to Apply
    return (
      <button
        onClick={() => handleRequestClick(project)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded transition"
      >
        Request to Join
      </button>
    );
  };

  if (loading) return <div className="p-4">Loading projects...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Research Opportunities</h2>

      {projects.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow text-gray-500">
          No research projects are currently open for students.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {projects.map((p) => (
          <div key={p.project_id} className="bg-white p-5 rounded-lg shadow hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-indigo-700">{p.title}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-1 inline-block">
                  {p.domain}
                </span>
              </div>
              {/* Status Badge */}
              <Badge mode={p.student_mode} slots={p.student_slots} />
            </div>

            <p className="text-sm text-gray-600 mt-3 line-clamp-3">{p.summary}</p>

            <div className="mt-4 text-sm text-gray-700 space-y-1">
              <p><strong>Instructor:</strong> {p.instructor?.full_name}</p>
              <p><strong>Duration:</strong> {p.duration || "Not specified"}</p>
              <p><strong>Commitment:</strong> {p.weekly_commitment || "Not specified"}</p>
            </div>

            {/* Action Button */}
            <div className="mt-5 border-t pt-4 flex justify-end">
              {renderActionButton(p)}
            </div>
          </div>
        ))}
      </div>

      {/* REQUEST MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold mb-2">
              Apply for {selectedProject.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Send a message to Prof. {selectedProject.instructor?.full_name} explaining why you want to join.
            </p>

            <textarea
              className="w-full border p-3 rounded focus:ring-2 focus:ring-indigo-500 mb-4"
              rows={4}
              placeholder="I am interested in this project because..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={submitRequest}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Helper Badge Component */
function Badge({ mode, slots }) {
  if (mode === "NO_STUDENTS") {
    return <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">Closed</span>;
  }
  // Workaround: Database stores OPEN as LIMITED_SLOTS with 10000 slots
  if (mode === "OPEN" || (mode === "LIMITED_SLOTS" && slots >= 9999)) {
    return <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Open</span>;
  }
  if (mode === "LIMITED_SLOTS") {
    const isFull = slots <= 0;
    return (
      <span className={`${isFull ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"} text-xs font-bold px-2 py-1 rounded`}>
        {isFull ? "Full" : `${slots} Slots Left`}
      </span>
    );
  }
  return null;
}