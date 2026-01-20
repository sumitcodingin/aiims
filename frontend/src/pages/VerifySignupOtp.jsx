import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function VerifySignupOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve data passed from Signup page
  const signupData = location.state; // email, full_name, role, etc.
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  // Timer Logic
  useEffect(() => {
    let interval;
    if (timer > 0) interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // If page refreshed and state is lost (Session Check)
  if (!signupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded shadow text-center">
          <p className="text-red-600 font-semibold mb-4">
            Session expired. Please signup again.
          </p>
          <button
            onClick={() => navigate("/signup", { replace: true })}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go to Signup
          </button>
        </div>
      </div>
    );
  }

  // ============================
  // VERIFY SIGNUP OTP (UPDATED)
  // ============================
  const verify = async () => {
    if (!otp) {
      alert("Please enter OTP");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/signup/verify-otp", {
        ...signupData,
        otp
      });

      // 🛑 CHANGED HERE: Do NOT log them in automatically.
      // Instead, show the success message from backend.
      alert(res.data.message || "Signup successful! Please wait for Admin approval.");

      // Redirect to Login page so they can wait for approval
      navigate("/login", { replace: true });

    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await api.post("/auth/signup/request-otp", signupData);
      setTimer(30);
      alert("New OTP sent!");
    } catch (err) {
      alert("Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-80">
        <h2 className="font-bold mb-4 text-center">Verify Signup OTP</h2>
        <p className="text-xs text-gray-500 text-center mb-4">
          Code sent to: {signupData.email}
        </p>

        <input
          className="w-full border p-2 mb-3 text-center tracking-widest text-lg"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
        />

        <button
          onClick={verify}
          disabled={loading}
          className={`w-full text-white py-2 rounded transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Verifying..." : "Verify & Create Account"}
        </button>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Didn't receive code?</span>
            <button
              onClick={resendOtp}
              disabled={timer > 0}
              className={`font-semibold ${timer > 0 ? "text-gray-400" : "text-blue-600 hover:underline"}`}
            >
              {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
            </button>
          </div>

          <button
            onClick={() => navigate("/signup", { replace: true })}
            className="w-full text-gray-600 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Back to Signup
          </button>
        </div>
      </div>
    </div>
  );
}