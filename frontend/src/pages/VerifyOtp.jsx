import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import logo from "../assets/images/iit_ropar_logo.jpg";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  const emailFromState = location.state?.email;
  const [email, setEmail] = useState(emailFromState || "");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  const inputsRef = useRef([]);

  /* ===============================
     Persist email (refresh safe)
  =============================== */
  useEffect(() => {
    if (emailFromState) {
      sessionStorage.setItem("otp_email", emailFromState);
    } else {
      const savedEmail = sessionStorage.getItem("otp_email");
      if (savedEmail) setEmail(savedEmail);
    }
  }, [emailFromState]);

  /* ===============================
     OTP resend timer
  =============================== */
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  /* ===============================
     Missing email fallback
  =============================== */
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 border border-gray-300 text-center">
          <p className="text-red-600 font-semibold mb-4">
            Session expired. Please login again.
          </p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="bg-black text-white px-6 py-2"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  /* ===============================
     OTP Input Handlers
  =============================== */
  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  /* ===============================
     VERIFY OTP
  =============================== */
  const verifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      alert("Please enter complete 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        email,
        otp: otpValue,
      });

      const { sessionId, user } = res.data;

      sessionStorage.setItem("sessionId", sessionId);
      sessionStorage.setItem("userId", user.id);
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.removeItem("otp_email");

      api.defaults.headers.common["x-session-id"] = sessionId;
      api.defaults.headers.common["x-user-id"] = user.id;

      navigate("/dashboard", { replace: true });
    } catch (err) {
      alert(err.response?.data?.error || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     RESEND OTP
  =============================== */
  const resendOtp = async () => {
    try {
      await api.post("/auth/request-otp", { email });
      setTimer(30);
      alert("New OTP sent to your email!");
    } catch {
      alert("Failed to resend OTP");
    }
  };

  /* ===============================
     UI
  =============================== */
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gray-100">

      {/* LEFT BRAND PANEL */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-white border-r border-gray-300 px-12">
        <img src={logo} alt="IIT Ropar Logo" className="w-40 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          Indian Institute of Technology Ropar
        </h1>
        <p className="text-gray-600 mt-4 text-center">
          Academic Management Portal
        </p>
      </div>

      {/* RIGHT OTP PANEL */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl bg-white border border-gray-300 p-10">

          <h2 className="text-2xl font-bold mb-1">Verify OTP</h2>
          <p className="text-sm text-gray-600 mb-8">
            Enter the 6-digit code sent to <b>{email}</b>
          </p>

          {/* OTP BOXES */}
          <div className="flex justify-between gap-3 mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-14 h-14 border border-gray-400 text-center text-xl font-bold focus:outline-none focus:border-black"
              />
            ))}
          </div>

          {/* VERIFY BUTTON */}
          <div className="flex justify-center mb-6">
            <button
              onClick={verifyOtp}
              disabled={loading}
              className="px-12 py-2 bg-black text-white font-semibold hover:bg-gray-900 transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
          </div>

          {/* RESEND */}
          <div className="flex justify-between text-sm mb-6">
            <span className="text-gray-600">Didn’t receive OTP?</span>
            <button
              onClick={resendOtp}
              disabled={timer > 0}
              className={`font-semibold ${
                timer > 0 ? "text-gray-400" : "text-blue-600 hover:underline"
              }`}
            >
              {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
            </button>
          </div>

          {/* CHANGE EMAIL */}
          <button
            onClick={() => navigate("/", { replace: true })}
            className="w-full border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Change Email
          </button>

        </div>
      </div>
    </div>
  );
}
