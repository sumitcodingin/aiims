const router = require('express').Router();
const authSession = require('../middleware/authSession');

const {
  applyForCourse,
  dropCourse,
  getStudentRecords,
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
router.get('/profile', getStudentProfile);
router.get('/feedback/options', getFeedbackOptions);
router.post('/feedback/submit', submitInstructorFeedback);

module.exports = router;
