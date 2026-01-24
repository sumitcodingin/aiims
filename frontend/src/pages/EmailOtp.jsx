import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/images/iit_ropar_logo.jpg";

export default function EmailOtp() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const sendOtp = async () => {
    if (!email) {
      alert("Please enter your institute email");
      return;
    }

    if (!email.endsWith("@iitrpr.ac.in")) {
      alert("Email must be from IIT Ropar domain (@iitrpr.ac.in)");
      return;
    }

    try {
      await api.post("/auth/request-otp", { email });
      navigate("/verify", { state: { email } });
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Failed to send OTP. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gray-100">
      
      {/* ================= LEFT BRANDING PANEL ================= */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-white border-r border-gray-300 px-12">
        <img
          src={logo}
          alt="IIT Ropar Logo"
          className="w-40 mb-6"
        />
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          Indian Institute of Technology Ropar
        </h1>
        <p className="text-gray-600 mt-4 text-center max-w-md">
          Academic Management Portal
        </p>
      </div>

      {/* ================= RIGHT LOGIN FORM ================= */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl bg-white border border-gray-300 p-10">
          
          {/* Header */}
          <h2 className="text-2xl font-bold mb-1">
            Login
          </h2>
          <p className="text-sm text-gray-600 mb-8">
            Sign in using your institute email
          </p>

          {/* ================= LOGIN DETAILS ================= */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
              Institute Login
            </h3>

            <input
              type="email"
              className="w-full border border-gray-300 px-3 py-2 text-sm"
              placeholder="Institute Email (@iitrpr.ac.in)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* ================= NAVIGATION ================= */}
          <div className="text-center mb-6 text-sm text-gray-600">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-blue-600 cursor-pointer hover:underline font-medium"
            >
              Create an account
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
