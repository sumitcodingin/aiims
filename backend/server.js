require("dotenv").config();
const express = require("express");
const cors = require("cors");

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
