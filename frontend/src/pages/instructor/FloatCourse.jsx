import { useState } from "react";
import api from "../../services/api";

const DEPARTMENTS = [
  "Computer Science",
  "Math",
  "HSS",
  "Electrical",
  "Civil",
  "Artificial Intelligence",
];

export default function FloatCourse({ onSuccess }) {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [form, setForm] = useState({
    course_code: "",
    title: "",
    department: "",
    acad_session: "2025-II",
    credits: "",
    capacity: "",
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= SUBMIT HANDLER ================= */
  const submit = () => {
    if (
      !form.course_code ||
      !form.title ||
      !form.department ||
      !form.credits ||
      !form.capacity
    ) {
      alert("Please fill all required fields.");
      return;
    }

    setShowConfirm(true);
  };

  /* ================= FINAL CONFIRM ================= */
  const confirmSubmit = async () => {
    try {
      setLoading(true);

      await api.post("/instructor/float-course", {
        ...form,
        instructor_id: user.id,
        credits: Number(form.credits),
        capacity: Number(form.capacity),
      });

      setShowConfirm(false);
      alert("✅ Course floated successfully. Awaiting advisor approval.");

      // Reset form
      setForm({
        course_code: "",
        title: "",
        department: "",
        acad_session: "2025-II",
        credits: "",
        capacity: "",
      });

      // Redirect to approvals
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to float course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ================= MAIN CARD ================= */}
      <div className="max-w-4xl bg-white shadow-xl rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Float New Course</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Course Code"
            value={form.course_code}
            onChange={(v) => setForm({ ...form, course_code: v })}
            placeholder="CS301"
          />

          <Input
            label="Course Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="Operating Systems"
          />

          <Select
            label="Department"
            value={form.department}
            onChange={(v) => setForm({ ...form, department: v })}
            options={DEPARTMENTS}
          />

          <Select
            label="Academic Session"
            value={form.acad_session}
            onChange={() => {}}
            options={["2025-II"]}
            disabled
          />

          <Input
            label="Credits"
            type="number"
            value={form.credits}
            onChange={(v) => setForm({ ...form, credits: v })}
            placeholder="3"
          />

          <Input
            label="Capacity"
            type="number"
            value={form.capacity}
            onChange={(v) => setForm({ ...form, capacity: v })}
            placeholder="60"
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={submit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Float Course
          </button>
        </div>
      </div>

      {/* ================= CONFIRMATION MODAL ================= */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4">
              Confirm Course Details
            </h3>

            <div className="space-y-2 text-sm">
              <ConfirmRow label="Course Code" value={form.course_code} />
              <ConfirmRow label="Title" value={form.title} />
              <ConfirmRow label="Department" value={form.department} />
              <ConfirmRow label="Academic Session" value={form.acad_session} />
              <ConfirmRow label="Credits" value={form.credits} />
              <ConfirmRow label="Capacity" value={form.capacity} />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={confirmSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
              >
                {loading ? "Submitting..." : "Confirm & Float"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, disabled }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function ConfirmRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
