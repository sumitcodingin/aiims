import { useEffect, useState } from "react";
import api from "../../services/api";

export default function InstructorProjects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const initialForm = {
    title: "",
    summary: "",
    description: "",
    domain: "",
    visibility: "INSTITUTE_PUBLIC", // ✅ FIXED ENUM
    student_mode: "NO_STUDENTS",
    student_slots: "",
    required_skills: "",
    preferred_background: "",
    expected_outcomes: "",
    duration: "",
    weekly_commitment: "",
  };

  const [form, setForm] = useState(initialForm);

  /* ================= FETCH ================= */
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

  /* ================= HANDLERS ================= */
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
      return alert("Student slots must be greater than 0.");
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
          form.student_mode === "LIMITED_SLOTS"
            ? form.required_skills
            : null,
        preferred_background:
          form.student_mode === "LIMITED_SLOTS"
            ? form.preferred_background
            : null,
        weekly_commitment:
          form.student_mode === "LIMITED_SLOTS"
            ? form.weekly_commitment
            : null,
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
          <div key={p.project_id} className="bg-white border p-4 rounded">
            <h3 className="font-semibold text-lg">{p.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{p.summary}</p>

            <div className="text-xs text-gray-500 mt-3 space-y-1">
              <p><b>Domain:</b> {p.domain}</p>
              <p><b>Visibility:</b> {p.visibility.replace(/_/g, " ")}</p>
              <p>
                <b>Students:</b>{" "}
                {p.student_mode === "NO_STUDENTS"
                  ? "Not accepting"
                  : `${p.student_slots} slots`}
              </p>
              <p><b>Status:</b> {p.status}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl p-6 rounded shadow overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-semibold mb-4">
              Create Research Project
            </h3>

            <Section title="Basic Information">
              <Input name="title" label="Project Title *" value={form.title} onChange={handleChange} />
              <Input name="summary" label="Short Summary *" value={form.summary} onChange={handleChange} />
              <Textarea name="description" label="Detailed Description *" value={form.description} onChange={handleChange} />
              <Input name="domain" label="Domain *" value={form.domain} onChange={handleChange} />
            </Section>

            <Section title="Student Participation">
              <Select
                name="student_mode"
                label="Student Participation Mode"
                value={form.student_mode}
                onChange={handleChange}
                options={[
                  ["NO_STUDENTS", "Not accepting students"],
                  ["LIMITED_SLOTS", "Limited slots"],
                ]}
              />

              {form.student_mode === "LIMITED_SLOTS" && (
                <>
                  <Input
                    type="number"
                    name="student_slots"
                    label="Number of Student Slots *"
                    value={form.student_slots}
                    onChange={handleChange}
                  />
                  <Textarea
                    name="required_skills"
                    label="Required Skills"
                    value={form.required_skills}
                    onChange={handleChange}
                  />
                  <Textarea
                    name="preferred_background"
                    label="Preferred Background"
                    value={form.preferred_background}
                    onChange={handleChange}
                  />
                  <Input
                    name="weekly_commitment"
                    label="Weekly Commitment"
                    value={form.weekly_commitment}
                    onChange={handleChange}
                  />
                </>
              )}
            </Section>

            <Section title="Project Details">
              <Input name="duration" label="Expected Duration" value={form.duration} onChange={handleChange} />
              <Textarea name="expected_outcomes" label="Expected Outcomes" value={form.expected_outcomes} onChange={handleChange} />
            </Section>

            <Section title="Visibility">
              <Select
                name="visibility"
                label="Project Visibility"
                value={form.visibility}
                onChange={handleChange}
                options={[
                  ["INSTITUTE_PUBLIC", "Institute Public"],
                  ["FACULTY_ONLY", "Faculty Only"],
                  ["PRIVATE", "Private"],
                ]}
              />
            </Section>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={resetAndClose} className="px-4 py-2 border rounded">
                Cancel
              </button>
              <button
                onClick={createProject}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              >
                Create Project
              </button>
            </div>
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
      <h4 className="font-semibold mb-3 border-b pb-1">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input {...props} className="w-full border p-2 mt-1" />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <textarea {...props} className="w-full border p-2 mt-1" rows={3} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <select {...props} className="w-full border p-2 mt-1">
        {options.map(([val, text]) => (
          <option key={val} value={val}>{text}</option>
        ))}
      </select>
    </div>
  );
}
