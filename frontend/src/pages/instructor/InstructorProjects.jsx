import { useEffect, useState } from "react";
import api from "../../services/api";

export default function InstructorProjects() {
  /* ================= STATE ================= */
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // View details state
  const [viewProject, setViewProject] = useState(null);

  // Requests management
  const [requestsModal, setRequestsModal] = useState(false);
  const [currentProjectRequests, setCurrentProjectRequests] = useState([]);
  const [currentProjectMembers, setCurrentProjectMembers] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);

  const initialForm = {
    title: "",
    summary: "",
    description: "",
    domain: "",
    visibility: "PRIVATE",
    student_mode: "NO_STUDENTS",
    student_slots: "",
    required_skills: "",
    preferred_background: "",
    expected_outcomes: "",
    duration: "",
    weekly_commitment: "",
  };

  const [form, setForm] = useState(initialForm);

  /* ================= FETCH PROJECTS ================= */
  const fetchProjects = async () => {
    try {
      const res = await api.get("/instructor/projects");
      setProjects(res.data || []);
    } catch {
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  /* ================= REQUESTS ================= */
  const handleViewRequests = async (projectId) => {
    setActiveProjectId(projectId);
    setRequestsModal(true);
    setLoadingRequests(true);

    try {
      const res = await api.get(
        `/instructor/projects/requests?project_id=${projectId}`
      );

      if (res.data && !Array.isArray(res.data)) {
        setCurrentProjectRequests(res.data.requests || []);
        setCurrentProjectMembers(res.data.members || []);
      } else {
        setCurrentProjectRequests(res.data || []);
        setCurrentProjectMembers([]);
      }
    } catch {
      alert("Failed to fetch project data");
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      await api.post("/instructor/projects/respond", {
        request_id: requestId,
        action,
      });

      handleViewRequests(activeProjectId);
      if (action === "ACCEPT") fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || "Action failed");
    }
  };

  /* ================= FORM ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetAndClose = () => {
    setForm(initialForm);
    setShowModal(false);
  };

  const createProject = async () => {
    if (!form.title || !form.summary || !form.description || !form.domain) {
      return alert("Fill all required fields");
    }

    if (
      form.student_mode === "LIMITED_SLOTS" &&
      (!form.student_slots || Number(form.student_slots) <= 0)
    ) {
      return alert("Invalid student slots");
    }

    try {
      await api.post("/instructor/projects", {
        ...form,
        student_slots:
          form.student_mode === "LIMITED_SLOTS"
            ? Number(form.student_slots)
            : null,
        required_skills:
          form.student_mode === "NO_STUDENTS" ? null : form.required_skills,
        preferred_background:
          form.student_mode === "NO_STUDENTS"
            ? null
            : form.preferred_background,
        weekly_commitment:
          form.student_mode === "NO_STUDENTS"
            ? null
            : form.weekly_commitment,
      });

      resetAndClose();
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create project");
    }
  };

  const studentModeLabel = (p) => {
    if (p.student_mode === "NO_STUDENTS") return "Not Accepting";
    if (p.student_mode === "OPEN") return "Open";
    if (p.student_mode === "LIMITED_SLOTS")
      return `Limited (${p.student_slots})`;
    return p.student_mode;
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

        <div className="border mt-4">
          <DetailRow label="Domain" value={viewProject.domain} />
          <DetailRow
            label="Visibility"
            value={viewProject.visibility.replace(/_/g, " ")}
          />
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
      </div>
    );
  }

  /* ================= LIST VIEW ================= */
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Research Projects</h2>
        <button
          onClick={() => setShowModal(true)}
          className="border px-4 py-1 text-sm hover:bg-gray-100"
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-600">No projects created.</p>
      ) : (
        <div className="border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Domain</th>
                <th className="px-3 py-2 text-left">Visibility</th>
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
                  <td className="px-3 py-2">{p.domain}</td>
                  <td className="px-3 py-2">
                    {p.visibility.replace(/_/g, " ")}
                  </td>
                  <td className="px-3 py-2">{studentModeLabel(p)}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      onClick={() => setViewProject(p)}
                      className="border px-3 py-1 text-xs hover:bg-gray-100"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleViewRequests(p.project_id)}
                      className="border px-3 py-1 text-xs hover:bg-gray-100"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showModal && (
        <Modal title="Create Project" onClose={resetAndClose}>
          <Input label="Title *" name="title" value={form.title} onChange={handleChange} />
          <Input label="Summary *" name="summary" value={form.summary} onChange={handleChange} />
          <Textarea label="Description *" name="description" value={form.description} onChange={handleChange} />
          <Input label="Domain *" name="domain" value={form.domain} onChange={handleChange} />

          <Select
            label="Visibility"
            name="visibility"
            value={form.visibility}
            onChange={handleChange}
            options={[
              ["PRIVATE", "Private"],
              ["FACULTY_ONLY", "Faculty Only"],
              ["INSTITUTE_PUBLIC", "Institute Public"],
            ]}
          />

          <Select
            label="Student Mode"
            name="student_mode"
            value={form.student_mode}
            onChange={handleChange}
            options={[
              ["NO_STUDENTS", "Not Accepting"],
              ["LIMITED_SLOTS", "Limited Slots"],
              ["OPEN", "Open (Unlimited)"],
            ]}
          />

          {form.student_mode === "LIMITED_SLOTS" && (
            <Input
              type="number"
              label="Student Slots *"
              name="student_slots"
              value={form.student_slots}
              onChange={handleChange}
            />
          )}

          {form.student_mode !== "NO_STUDENTS" && (
            <>
              <Textarea label="Required Skills" name="required_skills" value={form.required_skills} onChange={handleChange} />
              <Textarea label="Preferred Background" name="preferred_background" value={form.preferred_background} onChange={handleChange} />
              <Input label="Weekly Commitment" name="weekly_commitment" value={form.weekly_commitment} onChange={handleChange} />
            </>
          )}

          <Input label="Expected Duration" name="duration" value={form.duration} onChange={handleChange} />
          <Textarea label="Expected Outcomes" name="expected_outcomes" value={form.expected_outcomes} onChange={handleChange} />

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button onClick={resetAndClose} className="border px-4 py-1 text-sm">
              Cancel
            </button>
            <button onClick={createProject} className="border px-4 py-1 text-sm bg-gray-100">
              Create
            </button>
          </div>
        </Modal>
      )}

      {/* REQUESTS MODAL */}
      {requestsModal && (
        <Modal title="Project Management" onClose={() => setRequestsModal(false)}>
          {loadingRequests ? (
            <p>Loading...</p>
          ) : (
            <>
              <h4 className="font-semibold mb-2">Pending Requests</h4>
              {currentProjectRequests.length === 0 ? (
                <p className="text-sm text-gray-500">None</p>
              ) : (
                currentProjectRequests.map((r) => (
                  <div key={r.request_id} className="border p-2 mb-2">
                    <p className="font-medium">{r.student?.full_name}</p>
                    <p className="text-xs text-gray-500">{r.student?.email}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => handleRequestAction(r.request_id, "REJECT")} className="border px-2 py-1 text-xs">
                        Reject
                      </button>
                      <button onClick={() => handleRequestAction(r.request_id, "ACCEPT")} className="border px-2 py-1 text-xs bg-gray-100">
                        Accept
                      </button>
                    </div>
                  </div>
                ))
              )}

              <h4 className="font-semibold mt-4 mb-2">Enrolled Students</h4>
              {currentProjectMembers.length === 0 ? (
                <p className="text-sm text-gray-500">None</p>
              ) : (
                currentProjectMembers.map((m) => (
                  <div key={m.project_member_id} className="border p-2 mb-2">
                    <p className="font-medium">{m.student?.full_name}</p>
                    <p className="text-xs text-gray-500">{m.student?.email}</p>
                  </div>
                ))
              )}
            </>
          )}
        </Modal>
      )}
    </>
  );
}

/* ================= HELPERS ================= */

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-3 border-b">
      <div className="bg-gray-50 px-4 py-2 font-medium text-sm">{label}</div>
      <div className="col-span-2 px-4 py-2 text-sm">{value}</div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
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

function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input {...props} className="w-full border px-2 py-1 text-sm" />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <textarea {...props} rows={3} className="w-full border px-2 py-1 text-sm" />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <select {...props} className="w-full border px-2 py-1 text-sm">
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
