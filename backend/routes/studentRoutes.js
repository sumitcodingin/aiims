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
} = require('../controllers/studentController');

/* ==================================
   🔐 PROTECT ALL STUDENT ROUTES
================================== */
router.use(authSession);

/* ==================================
   STUDENT ROUTES
================================== */

router.post('/apply', applyForCourse);
router.post('/drop', dropCourse);
router.get('/records', getStudentRecords);
router.get('/all-records', getAllStudentRecords);
router.get('/profile', getStudentProfile);
router.get('/feedback/options', getFeedbackOptions);
router.post('/feedback/submit', submitInstructorFeedback);

module.exports = router;