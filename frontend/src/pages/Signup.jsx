import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    role: "Student",
    department: ""
  });

  const sendOtp = async () => {
    const isStudent = form.role === "Student";
    if (!form.email || !form.full_name || !form.department || (isStudent && (!form.batch || !form.entry_no))) {
      alert("Please fill all required fields");
      return;
    }

    // Validate email domain
    if (!form.email.endsWith("@iitrpr.ac.in")) {
      alert("Email must be from IIT Ropar domain (@iitrpr.ac.in)");
      return;
    }

    try {
      await api.post("/auth/signup/request-otp", form);
      navigate("/verify-signup", { state: form });
    } catch (err) {
      alert(err.response?.data?.error || "Signup OTP failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4 text-center">
          Create Account
        </h2>

        {/* Full Name */}
        <input
          className="w-full border p-2 mb-3"
          placeholder="Full Name"
          value={form.full_name}
          onChange={(e) =>
            setForm({ ...form, full_name: e.target.value })
          }
        />

        {/* Email */}
        <input
          type="email"
          className="w-full border p-2 mb-3"
          placeholder="Email (@iitrpr.ac.in)"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        {/* Role */}
        <select
          className="w-full border p-2 mb-3"
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          <option value="Student">Student</option>
          <option value="Instructor">Instructor</option>
          <option value="Advisor">Advisor</option>
        </select>

        {form.role === "Student" && (
          <div className="animate-in fade-in duration-300">
            <input className="w-full border p-2 mb-3" placeholder="Batch (e.g., 2023)" 
                   value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
            <input className="w-full border p-2 mb-3" placeholder="Entry Number (e.g., 2023CSB1001)" 
                   value={form.entry_no} onChange={(e) => setForm({ ...form, entry_no: e.target.value })} />
          </div>
        )}

        {/* Department Dropdown */}
        <select
          className="w-full border p-2 mb-4"
          value={form.department}
          onChange={(e) =>
            setForm({ ...form, department: e.target.value })
          }
        >
          <option value="">Select Department</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Artificial Intelligence">
            Artificial Intelligence
          </option>
          <option value="Electrical">Electrical</option>
          <option value="Mechanical">Mechanical</option>
          <option value="Civil">Civil</option>
          <option value="Chemical">Chemical</option>
          <option value="Math">Math</option>
          <option value="Physics">Physics</option>
          <option value="Metallurgy">Metallurgy</option>
          <option value="HSS">HSS</option>
        </select>

        {/* Send OTP */}
        <button
          onClick={sendOtp}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Send OTP
        </button>
      </div>
    </div>
  );
}
