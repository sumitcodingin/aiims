import { useEffect, useState } from "react";
import api from "../../services/api";

export default function InstructorProjects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Requests Management State
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

  /* ================= FETCH REQUESTS & MEMBERS ================= */
  const handleViewRequests = async (projectId) => {
    setActiveProjectId(projectId);
    setRequestsModal(true);
    setLoadingRequests(true);
    try {
      const res = await api.get(`/instructor/projects/requests?project_id=${projectId}`);
      // Handle the new object response { requests, members }
      if (res.data && !Array.isArray(res.data)) {
         setCurrentProjectRequests(res.data.requests || []);
         setCurrentProjectMembers(res.data.members || []);
      } else {
         // Fallback for old API style
         setCurrentProjectRequests(res.data || []);
         setCurrentProjectMembers([]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch data.");
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      await api.post("/instructor/projects/respond", {
        request_id: requestId,
        action: action, // "ACCEPT" or "REJECT"
      });
      
      alert(`Request ${action === "ACCEPT" ? "Accepted" : "Rejected"}`);
      
      // Refresh list to move student from requested to enrolled (if accepted)
      handleViewRequests(activeProjectId);
      
      // Refresh projects to update slot counts
      if(action === "ACCEPT") fetchProjects();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Action failed");
    }
  };

  /* ================= FORM HANDLERS ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetAndClose = () => {
    setForm(initialForm);
    setShowModal(false);
  };

  const createProject = async () => {
    if (!form.title || !form.summary || !form.description || !form.domain) {
      return alert("Please fill all required fields.");
    }

    if (
      form.student_mode === "LIMITED_SLOTS" &&
      (!form.student_slots || Number(form.student_slots) <= 0)
    ) {
      return alert("Student slots must be greater than 0 for limited mode.");
    }

    try {
      await api.post("/instructor/projects", {
        title: form.title,
        summary: form.summary,
        description: form.description,
        domain: form.domain,
        visibility: form.visibility,
        student_mode: form.student_mode,
        student_slots:
          form.student_mode === "LIMITED_SLOTS"
            ? Number(form.student_slots)
            : null,
        required_skills:
          form.student_mode !== "NO_STUDENTS" ? form.required_skills : null,
        preferred_background:
          form.student_mode !== "NO_STUDENTS"
            ? form.preferred_background
            : null,
        weekly_commitment:
          form.student_mode !== "NO_STUDENTS" ? form.weekly_commitment : null,
        expected_outcomes: form.expected_outcomes,
        duration: form.duration,
      });

      resetAndClose();
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create project");
    }
  };

  /* ================= UI HELPERS ================= */
  const getStudentModeDisplay = (mode, slots) => {
    if (mode === "NO_STUDENTS") return "Not Accepting";
    if (mode === "LIMITED_SLOTS" && slots >= 9999) return "Open (Unlimited)";
    if (mode === "LIMITED_SLOTS") return `Limited (${slots} slots)`;
    if (mode === "OPEN") return "Open (Unlimited)";
    return mode;
  };

  /* ================= UI ================= */
  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Research Projects</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          + New Project
        </button>
      </div>

      {/* PROJECT LIST */}
      {projects.length === 0 && (
        <div className="bg-white p-6 border rounded text-gray-600">
          No research projects created yet.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <div key={p.project_id} className="bg-white border p-4 rounded shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg">{p.title}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.summary}</p>

              <div className="text-xs text-gray-500 mt-3 space-y-1">
                <p>
                  <span className="font-medium text-gray-700">Domain:</span> {p.domain}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Visibility:</span>{" "}
                  {p.visibility.replace(/_/g, " ")}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Student Mode:</span>{" "}
                  {getStudentModeDisplay(p.student_mode, p.student_slots)}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-4 pt-3 border-t flex justify-end">
              <button 
                onClick={() => handleViewRequests(p.project_id)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Manage Students & Requests
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE PROJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl p-6 rounded shadow-lg overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-semibold mb-4">Create Research Project</h3>
            <Section title="Basic Information">
              <Input name="title" label="Project Title *" value={form.title} onChange={handleChange} />
              <Input name="summary" label="Short Summary *" value={form.summary} onChange={handleChange} />
              <Textarea name="description" label="Detailed Description *" value={form.description} onChange={handleChange} />
              <Input name="domain" label="Domain *" value={form.domain} onChange={handleChange} />
            </Section>
            <Section title="Visibility & Access">
              <Select name="visibility" label="Who can see this project?" value={form.visibility} onChange={handleChange}
                options={[
                  ["PRIVATE", "Private (Only Me)"],
                  ["FACULTY_ONLY", "Faculty Only (All Instructors)"],
                  ["INSTITUTE_PUBLIC", "Institute (Everyone)"],
                ]}
              />
            </Section>
            <Section title="Student Participation">
              <Select name="student_mode" label="Can students apply?" value={form.student_mode} onChange={handleChange}
                options={[
                  ["NO_STUDENTS", "No - Not accepting students"],
                  ["LIMITED_SLOTS", "Yes - Limited Slots"],
                  ["OPEN", "Yes - Open (Unlimited students)"],
                ]}
              />
              {form.student_mode === "LIMITED_SLOTS" && (
                <Input type="number" name="student_slots" label="Number of Student Slots *" value={form.student_slots} onChange={handleChange} />
              )}
              {form.student_mode !== "NO_STUDENTS" && (
                <>
                  <Textarea name="required_skills" label="Required Skills" value={form.required_skills} onChange={handleChange} />
                  <Textarea name="preferred_background" label="Preferred Background" value={form.preferred_background} onChange={handleChange} />
                  <Input name="weekly_commitment" label="Weekly Commitment" value={form.weekly_commitment} onChange={handleChange} />
                </>
              )}
            </Section>
            <Section title="Additional Details">
              <Input name="duration" label="Expected Duration" value={form.duration} onChange={handleChange} />
              <Textarea name="expected_outcomes" label="Expected Outcomes" value={form.expected_outcomes} onChange={handleChange} />
            </Section>
            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
              <button onClick={resetAndClose} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={createProject} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">Create Project</button>
            </div>
          </div>
        </div>
      )}

      {/* REQUESTS & MEMBERS MODAL */}
      {requestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl p-6 rounded shadow-lg overflow-y-auto max-h-[85vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Project Management</h3>
              <button onClick={() => setRequestsModal(false)} className="text-gray-500 hover:text-black text-xl">✕</button>
            </div>

            {loadingRequests ? (
              <p className="text-center py-8">Loading...</p>
            ) : (
              <div className="space-y-6">
                
                {/* 1. PENDING REQUESTS SECTION */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                    Pending Requests <span className="text-gray-500 font-normal">({currentProjectRequests.length})</span>
                  </h4>
                  {currentProjectRequests.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No pending requests.</p>
                  ) : (
                    <div className="space-y-3">
                      {currentProjectRequests.map((req) => (
                        <div key={req.request_id} className="border p-3 rounded bg-yellow-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm">{req.student?.full_name || "Unknown"}</p>
                              <p className="text-xs text-gray-600">{req.student?.email} • {req.student?.department}</p>
                            </div>
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Pending</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded border border-gray-100 italic">
                            "{req.message}"
                          </p>
                          <div className="flex gap-2 mt-3 justify-end">
                            <button 
                              onClick={() => handleRequestAction(req.request_id, "REJECT")}
                              className="text-xs px-3 py-1 border border-red-300 text-red-600 hover:bg-red-50 rounded"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleRequestAction(req.request_id, "ACCEPT")}
                              className="text-xs px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded"
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. ENROLLED STUDENTS SECTION */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                    Enrolled Students <span className="text-gray-500 font-normal">({currentProjectMembers.length})</span>
                  </h4>
                  {currentProjectMembers.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No students currently enrolled.</p>
                  ) : (
                    <div className="space-y-2">
                      {currentProjectMembers.map((mem) => (
                        <div key={mem.project_member_id} className="flex justify-between items-center border p-3 rounded bg-green-50">
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{mem.student?.full_name || "Unknown"}</p>
                            <p className="text-xs text-gray-600">{mem.student?.email} • {mem.student?.department}</p>
                          </div>
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Enrolled</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= REUSABLE UI ================= */

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h4 className="font-semibold mb-3 border-b pb-1 text-gray-700">{title}</h4>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Input({ label, type = "text", ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
      <input type={type} {...props} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
      <textarea {...props} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" rows={3} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
      <select {...props} className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
        {options.map(([val, text]) => <option key={val} value={val}>{text}</option>)}
      </select>
    </div>
  );
}