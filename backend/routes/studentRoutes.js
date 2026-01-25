/* file: backend/routes/studentRoutes.js */
const router = require('express').Router();
const authSession = require('../middleware/authSession');

// Import all functions from the controller
const {
  applyForCourse,
  dropCourse,
  getStudentRecords,
  getAllStudentRecords,
  getStudentProfile,
  getFeedbackOptions,
  submitInstructorFeedback,
  // NEW IMPORTS
  applyForProgram,
  getStudentPrograms
} = require('../controllers/studentController');

/* ==================================
   🔐 PROTECT ALL STUDENT ROUTES
================================== */
router.use(authSession);

/* ==================================
   STUDENT ROUTES
================================== */

// Course Management
router.post('/apply', applyForCourse);
router.post('/drop', dropCourse);

// Records & Profile
router.get('/records', getStudentRecords);
router.get('/all-records', getAllStudentRecords);
router.get('/profile', getStudentProfile);

// Feedback
router.get('/feedback/options', getFeedbackOptions);
router.post('/feedback/submit', submitInstructorFeedback);

// NEW: Degree Programs (Minor, Concentration, etc.)
router.post('/apply-program', applyForProgram);
router.get('/my-programs', getStudentPrograms);

module.exports = router;