import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import EmailOtp from "./pages/EmailOtp";
import VerifyOtp from "./pages/VerifyOtp";
import Home from "./pages/Home";
import StudentDashboard from "./pages/StudentDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmailOtp />} />
        <Route path="/verify" element={<VerifyOtp />} />
        <Route path="/home" element={<Home />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/instructor" element={<InstructorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
