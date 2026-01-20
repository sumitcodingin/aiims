import { useState } from "react";
import api from "../../services/api";

export default function FloatCourse() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  
  // 🚀 Added 'credits' to the initial state
  const [form, setForm] = useState({
    course_code: "",
    title: "",
    department: "",
    acad_session: "",
    credits: "",        // <--- NEW FIELD
    capacity: "",
    advisor_id: "",
  });

  const submit = async () => {
    // Basic validation
    if (!form.course_code || !form.title || !form.credits || !form.capacity) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      await api.post("/instructor/float-course", {
        ...form,
        instructor_id: user.id,
        capacity: Number(form.capacity), // Convert to number
        credits: Number(form.credits),   // 🚀 Convert to number and send
      });

      alert("Course floated. Awaiting advisor approval.");
      
      // Reset form
      setForm({
        course_code: "",
        title: "",
        department: "",
        acad_session: "",
        credits: "",
        capacity: "",
        advisor_id: "",
      });
    } catch (error) {
      console.error("Float course error:", error);
      alert(error.response?.data?.error || "Failed to float course.");
    }
  };

  return (
    <div className="max-w-xl bg-white p-6 shadow rounded">
      <h2 className="text-xl font-bold mb-4">Float New Course</h2>

      {Object.keys(form).map((key) => (
        <div key={key} className="mb-3">
            <label className="block text-sm font-bold text-gray-700 mb-1">
                {key.replace(/_/g, " ").toUpperCase()}
            </label>
            <input
            placeholder={`Enter ${key.replace(/_/g, " ")}`}
            value={form[key]}
            type={key === 'capacity' || key === 'credits' ? 'number' : 'text'} // Number inputs for capacity/credits
            onChange={(e) =>
                setForm({ ...form, [key]: e.target.value })
            }
            className="w-full border p-2 rounded"
            />
        </div>
      ))}

      <button
        onClick={submit}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
      >
        Float Course
      </button>
    </div>
  );
}