import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  // Email from router state OR sessionStorage
  const emailFromState = location.state?.email;
  const [email, setEmail] = useState(emailFromState || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Persist email so refresh doesn't break
  useEffect(() => {
    if (emailFromState) {
      sessionStorage.setItem("otp_email", emailFromState);
    } else {
      const savedEmail = sessionStorage.getItem("otp_email");
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  }, [emailFromState]);

  // If email is missing completely
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded shadow text-center">
          <p className="text-red-600 font-semibold mb-4">
            Session expired. Please login again.
          </p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ============================
  // VERIFY OTP HANDLER
  // ============================
  const verifyOtp = async () => {
    if (!otp) {
      alert("Please enter OTP");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/verify-otp", {
        email,
        otp,
      });

      // Save logged-in user
      sessionStorage.setItem("user", JSON.stringify(res.data.user));
      sessionStorage.removeItem("otp_email");

      // Navigate to dashboard (ProtectedRoute will allow)
      navigate("/dashboard", { replace: true });
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-xl font-bold mb-2 text-center">Verify OTP</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          OTP sent to <b>{email}</b>
        </p>

        <input
          type="text"
          placeholder="Enter 6-digit OTP"
          className="w-full border p-2 mb-4 rounded text-center tracking-widest"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          onClick={verifyOtp}
          disabled={loading}
          className={`w-full text-white py-2 rounded ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Verifying..." : "Verify & Login"}
        </button>
      </div>
    </div>
  );
}
