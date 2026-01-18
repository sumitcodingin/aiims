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
    try {
      await api.post("/instructor/float-course", {
        ...form,
        instructor_id: user.id,
      });
      alert("Course floated. Waiting for advisor approval.");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to float course");
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-xl">
      <h2 className="text-lg font-bold mb-4">Float a Course</h2>

      {Object.keys(form).map((key) => (
        <input
          key={key}
          placeholder={key.replace("_", " ").toUpperCase()}
          className="border p-2 w-full mb-3"
          onChange={(e) =>
            setForm({ ...form, [key]: e.target.value })
          }
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
