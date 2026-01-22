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

const SLOTS = [
  "Pc-1", "Pc-2", "Pc-3", "Pc-4", "Pc-5",
  "Pc-6", "Pc-7", "Pc-8", "Pc-9", "Pc-10"
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
    slot: "", // Added slot to state
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
      !form.capacity ||
      !form.slot // Validate slot
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
      alert("Course floated successfully. Awaiting advisor approval.");

      setForm({
        course_code: "",
        title: "",
        department: "",
        acad_session: "2025-II",
        credits: "",
        capacity: "",
        slot: "",
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to float course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ================= DOCUMENT CONTAINER ================= */}
      <div className="max-w-5xl mx-auto bg-white border border-gray-400 p-8">
        <h2 className="text-xl font-bold mb-8">
          Float New Course
        </h2>

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
            options={["2025-II"]}
            disabled
          />

          {/* New Slot Dropdown */}
          <Select
            label="Course Slot"
            value={form.slot}
            onChange={(v) => setForm({ ...form, slot: v })}
            options={SLOTS}
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

        {/* ACTION BAR */}
        <div className="mt-10 flex justify-end">
          <button
            onClick={submit}
            className="bg-neutral-800 hover:bg-neutral-700 text-white px-8 py-2 rounded text-sm font-medium"
          >
            Float Course
          </button>
        </div>
      </div>

      {/* ================= CONFIRM MODAL ================= */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-400 w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">
              Confirm Course Details
            </h3>

            <table className="w-full text-sm border border-gray-300 mb-6">
              <tbody>
                <ConfirmRow label="Course Code" value={form.course_code} />
                <ConfirmRow label="Title" value={form.title} />
                <ConfirmRow label="Department" value={form.department} />
                <ConfirmRow label="Academic Session" value={form.acad_session} />
                <ConfirmRow label="Slot" value={form.slot} />
                <ConfirmRow label="Credits" value={form.credits} />
                <ConfirmRow label="Capacity" value={form.capacity} />
              </tbody>
            </table>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-400 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={confirmSubmit}
                disabled={loading}
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2 text-sm"
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

/* ================= REUSABLE INPUTS ================= */

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-400 px-3 py-2 text-sm"
      />
    </div>
  );
}

function Select({ label, value, onChange = () => {}, options, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-400 px-3 py-2 text-sm bg-white"
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
    <tr className="border-b border-gray-300 last:border-b-0">
      <td className="px-3 py-2 bg-gray-100 font-medium w-1/2">
        {label}
      </td>
      <td className="px-3 py-2">{value}</td>
    </tr>
  );
}