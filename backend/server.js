/* file: backend/server.js */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");

// ====================================================
// 🚀 CRITICAL FIX: Force IPv4 for DNS Resolution
// Fixes 4-5 minute email delay with Gmail SMTP
// ====================================================
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
    console.log("✅ DNS set to IPv4 First (Email speed fix applied)");
  }
} catch (e) {
  // Graceful fallback for older Node versions
  console.warn("⚠️ Could not set DNS result order (older Node version?)");
}

// ============================
// ROUTE IMPORTS
// ============================
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const advisorRoutes = require("./routes/advisorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const userRoutes = require("./routes/userRoutes");

// 🔹 PROJECT MODULE ROUTES
const projectInstructorRoutes = require("./routes/projectInstructorRoutes");
const projectStudentRoutes = require("./routes/projectStudentRoutes");

const app = express();

// ============================
// GLOBAL MIDDLEWARES
// ============================
app.use(cors());
app.use(express.json());

// ============================
// STATIC FILES (OPTIONAL)
// ============================
app.use(express.static("public"));

// ============================
// AUTH ROUTES
// ============================
app.use("/api/auth", authRoutes);

// ============================
// CORE MODULE ROUTES
// ============================
app.use("/api/student", studentRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/advisor", advisorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);

// ============================
// 🔹 PROJECT MODULE ROUTES
// ============================
// Instructor creates & manages projects
app.use("/api/instructor/projects", projectInstructorRoutes);

// Students view & request projects
app.use("/api/student/projects", projectStudentRoutes);

// ============================
// HEALTH CHECK
// ============================
app.get("/", (req, res) => {
  res.status(200).send("🚀 AIMS-Lite Backend is running");
});

// ============================
// GLOBAL 404 HANDLER
// ============================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// ============================
// SERVER START
// ============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});