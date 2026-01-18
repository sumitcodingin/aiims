require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes');
const advisorRoutes = require('./routes/advisorRoutes'); // ✅ NEW

const app = express();

// ============================
// MIDDLEWARES
// ============================
app.use(cors());
app.use(express.json());

// ============================
// ROUTES
// ============================
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/advisor', advisorRoutes); // ✅ NEW
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);

// ============================
// HEALTH CHECK (OPTIONAL)
// ============================
app.get('/', (req, res) => {
  res.send('AIMS-Lite Backend is running 🚀');
});

// ============================
// SERVER START
// ============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
