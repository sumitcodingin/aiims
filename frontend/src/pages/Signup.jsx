import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/images/iit_ropar_logo.jpg";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    role: "Student",
    department: "",
    batch: "",
    entry_no: ""
  });

  const sendOtp = async () => {
    const isStudent = form.role === "Student";
    if (
      !form.email ||
      !form.full_name ||
      !form.department ||
      (isStudent && (!form.batch || !form.entry_no))
    ) {
      alert("Please fill all required fields");
      return;
    }

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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gray-100">

      {/* ================= LEFT BRANDING PANEL ================= */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-white border-r border-gray-300 px-12">
        <img src={logo} alt="IIT Ropar Logo" className="w-40 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          Indian Institute of Technology Ropar
        </h1>
        <p className="text-gray-600 mt-4 text-center max-w-md">
          Academic Management Portal
        </p>
      </div>

      {/* ================= RIGHT SIGNUP FORM ================= */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl bg-white border border-gray-300 p-10">

          {/* Header */}
          <h2 className="text-2xl font-bold mb-1">Create Account</h2>
          <p className="text-sm text-gray-600 mb-8">
            Sign up using your institute credentials
          </p>

          {/* ================= BASIC DETAILS ================= */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="border border-gray-300 px-3 py-2 text-sm"
                placeholder="Full Name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />

              <input
                type="email"
                className="border border-gray-300 px-3 py-2 text-sm"
                placeholder="Institute Email (@iitrpr.ac.in)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <select
                className="border border-gray-300 px-3 py-2 text-sm bg-white"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="Student">Student</option>
                <option value="Instructor">Instructor</option>
                <option value="Advisor">Advisor</option>
              </select>

              <select
                className="border border-gray-300 px-3 py-2 text-sm bg-white"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Electrical">Electrical</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="Chemical">Chemical</option>
                <option value="Math">Math</option>
                <option value="Physics">Physics</option>
                <option value="Metallurgy">Metallurgy</option>
                <option value="HSS">HSS</option>
              </select>
            </div>
          </div>

          {/* ================= STUDENT DETAILS ================= */}
          {form.role === "Student" && (
            <div className="mb-10 border border-gray-200 bg-gray-50 p-6">
              <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
                Student Academic Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Batch (e.g. 2023)"
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                />

                <input
                  className="border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Entry Number (e.g. 2023CSB1001)"
                  value={form.entry_no}
                  onChange={(e) => setForm({ ...form, entry_no: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ================= LOGIN LINK (CENTERED) ================= */}
          <div className="text-center mb-4">
            <span className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Login here
              </button>
            </span>
          </div>

          {/* ================= ACTION ================= */}
          <div className="flex justify-center">
            <button
              onClick={sendOtp}
              className="px-12 py-2 bg-black text-white text-sm font-semibold hover:bg-gray-900 transition"
            >
              Send OTP
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
