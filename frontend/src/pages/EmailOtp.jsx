import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function EmailOtp() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const sendOtp = async () => {
    if (!email) {
      alert("Please enter your email");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-4 text-center">
          AIMS-Lite Login
        </h1>

        <input
          type="email"
          placeholder="Institute Email"
          className="w-full border p-2 rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={sendOtp}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Send OTP
        </button>

        {/* SIGNUP LINK */}
        <p className="text-sm text-center mt-4 text-gray-600">
          New user?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Create an account
          </span>
        </p>
      </div>
    </div>
  );
}
