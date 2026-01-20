const router = require('express').Router();
const {
  applyForCourse,
  dropCourse,
  getStudentRecords,
  getStudentProfile,
  getFeedbackOptions,
  submitInstructorFeedback,
} = require('../controllers/studentController');

router.post('/apply', applyForCourse);
router.post('/drop', dropCourse);
router.get('/records', getStudentRecords);
router.get('/profile', getStudentProfile);
router.get('/feedback/options', getFeedbackOptions);
router.post('/feedback/submit', submitInstructorFeedback);

module.exports = router;
