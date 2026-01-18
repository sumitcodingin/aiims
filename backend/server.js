require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ============================
// ROUTE IMPORTS
// ============================
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const advisorRoutes = require('./routes/advisorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes'); // ✅ users API

const app = express();

// ============================
// MIDDLEWARES
// ============================
app.use(cors());
app.use(express.json());

// ============================
// API ROUTES
// ============================
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);

// ============================
// HEALTH CHECK
// ============================
app.get('/', (req, res) => {
  res.send('🚀 AIMS-Lite Backend is running');
});

// ============================
// 404 HANDLER (VERY USEFUL)
// ============================
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
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
