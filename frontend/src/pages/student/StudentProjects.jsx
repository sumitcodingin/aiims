import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StudentProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // View details
  const [viewProject, setViewProject] = useState(null);

  // Request modal
  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await api.get("/student/projects/browse");
      setProjects(res.data || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const submitRequest = async () => {
    try {
      await api.post("/student/projects/request", {
        project_id: selectedProject.project_id,
        message,
      });
      alert("Request sent");
      setSelectedProject(null);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || "Request failed");
    }
  };

  const actionDisabled = (p) =>
    ["ACCEPTED", "REJECTED", "PENDING"].includes(p.my_status) ||
    p.student_mode === "NO_STUDENTS";

  const actionLabel = (p) => {
    if (p.my_status === "ACCEPTED") return "Accepted";
    if (p.my_status === "REJECTED") return "Rejected";
    if (p.my_status === "PENDING") return "Requested";
    if (p.student_mode === "NO_STUDENTS") return "Not Accepting";
    return "Request";
  };

  /* ================= PROJECT DETAILS VIEW ================= */
  if (viewProject) {
    return (
      <div className="bg-white border p-6">
        <button
          onClick={() => setViewProject(null)}
          className="border px-3 py-1 text-sm mb-4"
        >
          ← Back
        </button>

        <h2 className="text-xl font-bold mb-1">{viewProject.title}</h2>
        <p className="text-gray-600 mb-4">{viewProject.summary}</p>

        <div className="border">
          <DetailRow label="Instructor" value={viewProject.instructor?.full_name} />
          <DetailRow label="Domain" value={viewProject.domain} />
          <DetailRow
            label="Students"
            value={studentModeLabel(viewProject)}
          />
          <DetailRow
            label="Duration"
            value={viewProject.duration || "—"}
          />
          <DetailRow
            label="Weekly Commitment"
            value={viewProject.weekly_commitment || "—"}
          />
          <DetailRow
            label="Required Skills"
            value={viewProject.required_skills || "—"}
          />
          <DetailRow
            label="Preferred Background"
            value={viewProject.preferred_background || "—"}
          />
          <DetailRow
            label="Expected Outcomes"
            value={viewProject.expected_outcomes || "—"}
          />
          <DetailRow
            label="Description"
            value={viewProject.description}
          />
        </div>

        <div className="flex justify-end mt-4">
          <button
            disabled={actionDisabled(viewProject)}
            onClick={() => setSelectedProject(viewProject)}
            className={`border px-4 py-1 text-sm ${
              actionDisabled(viewProject)
                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
          >
            {actionLabel(viewProject)}
          </button>
        </div>
      </div>
    );
  }

  /* ================= LIST VIEW ================= */
  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Research Projects</h2>
        <p className="text-sm text-gray-600">
          Browse and apply for research opportunities
        </p>
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-600">No projects available.</p>
      ) : (
        <div className="border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Instructor</th>
                <th className="px-3 py-2 text-left">Domain</th>
                <th className="px-3 py-2 text-left">Students</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.project_id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.summary}</p>
                  </td>
                  <td className="px-3 py-2">
                    {p.instructor?.full_name}
                  </td>
                  <td className="px-3 py-2">{p.domain}</td>
                  <td className="px-3 py-2">
                    {studentModeLabel(p)}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      onClick={() => setViewProject(p)}
                      className="border px-3 py-1 text-xs hover:bg-gray-100"
                    >
                      View Details
                    </button>
                    <button
                      disabled={actionDisabled(p)}
                      onClick={() => setSelectedProject(p)}
                      className={`border px-3 py-1 text-xs ${
                        actionDisabled(p)
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {actionLabel(p)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REQUEST MODAL */}
      {selectedProject && (
        <Modal
          title={`Request to Join: ${selectedProject.title}`}
          onClose={() => setSelectedProject(null)}
        >
          <p className="text-sm text-gray-600">
            Send a message to{" "}
            <strong>{selectedProject.instructor?.full_name}</strong>
          </p>

          <Textarea
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain your interest and background..."
          />

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button
              onClick={() => setSelectedProject(null)}
              className="border px-4 py-1 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={submitRequest}
              className="border px-4 py-1 text-sm bg-gray-100"
            >
              Send Request
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ================= HELPERS ================= */

function studentModeLabel(p) {
  if (p.student_mode === "NO_STUDENTS") return "Not Accepting";
  if (p.student_mode === "OPEN") return "Open";
  if (p.student_mode === "LIMITED_SLOTS")
    return `Limited (${p.student_slots})`;
  return p.student_mode;
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-3 border-b">
      <div className="bg-gray-50 px-4 py-2 font-medium text-sm">
        {label}
      </div>
      <div className="col-span-2 px-4 py-2 text-sm">
        {value}
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-3 right-4 text-xl">
          ×
        </button>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">{title}</h3>
          <div className="space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <textarea
        {...props}
        rows={4}
        className="w-full border px-2 py-1 text-sm"
      />
    </div>
  );
}
