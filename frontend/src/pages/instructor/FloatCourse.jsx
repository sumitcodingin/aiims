import { useState } from "react";
import api from "../../services/api";

export default function FloatCourse() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [form, setForm] = useState({
    course_code: "",
    title: "",
    department: "",
    acad_session: "",
    capacity: "",
    advisor_id: "",
  });

  const submit = async () => {
    await api.post("/instructor/float-course", {
      ...form,
      instructor_id: user.id,
      capacity: Number(form.capacity),
    });

    alert("Course floated. Awaiting advisor approval.");
    setForm({
      course_code: "",
      title: "",
      department: "",
      acad_session: "",
      capacity: "",
      advisor_id: "",
    });
  };

  return (
    <div className="max-w-xl bg-white p-6 shadow rounded">
      <h2 className="text-xl font-bold mb-4">Float New Course</h2>

      {Object.keys(form).map((key) => (
        <input
          key={key}
          placeholder={key.replace("_", " ").toUpperCase()}
          value={form[key]}
          onChange={(e) =>
            setForm({ ...form, [key]: e.target.value })
          }
          className="w-full border p-2 mb-3 rounded"
        />
      ))}

      <button
        onClick={submit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Float Course
      </button>
    </div>
  );
}
