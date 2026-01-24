import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/images/iit_ropar_logo.jpg";

export default function EmailOtp() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /* =========================================================
     ✅ AUTO-LOGIN CHECK
     If user exists in storage, redirect to dashboard immediately
  ========================================================= */
  
  useEffect(() => {
    
    const user = localStorage.getItem("user");
    
    if (user) {
      
      navigate("/dashboard", { replace: true });
    }
    
  }, [navigate]);

  const sendOtp = async () => {
    if (!email) {
      alert("Please enter your institute email");
      return;
    }

    if (!email.endsWith("@iitrpr.ac.in")) {
      alert("Email must be from IIT Ropar domain (@iitrpr.ac.in)");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/request-otp", { email });
      navigate("/verify", { state: { email } });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gray-100">
      
      {/* ================= LEFT PANEL ================= */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-white border-r border-gray-300 px-12">
        <img src={logo} alt="IIT Ropar Logo" className="w-40 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          Indian Institute of Technology Ropar
        </h1>
        <p className="text-gray-600 mt-4 text-center max-w-md">
          Academic Management Portal
        </p>
      </div>

      {/* ================= RIGHT FORM ================= */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl bg-white border border-gray-300 p-10">
          <h2 className="text-2xl font-bold mb-1">Login</h2>
          <p className="text-sm text-gray-600 mb-8">Sign in using your institute email</p>

          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
              Institute Login
            </h3>
            <input
              type="email"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition"
              placeholder="Institute Email (@iitrpr.ac.in)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="text-center mb-6 text-sm text-gray-600">
            Don’t have an account?{" "}
            <span
              onClick={() => !loading && navigate("/signup")}
              className={`text-blue-600 cursor-pointer hover:underline font-medium ${loading ? 'pointer-events-none opacity-50' : ''}`}
            >
              Create an account
            </span>
          </div>

          <div className="flex justify-center">
            <button
              onClick={sendOtp}
              disabled={loading}
              className={`px-12 py-2 text-white text-sm font-semibold transition flex items-center gap-2
                ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-black hover:bg-gray-900"}
              `}
            >
              {loading ? (
                <>
                  <span>Sending...</span>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}