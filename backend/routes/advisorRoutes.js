const router = require('express').Router();
const {
  approveByAdvisor,
  getPendingCourses,
  approveCourse
} = require('../controllers/advisorController');

router.post('/approve-request', approveByAdvisor);

// GET: /api/advisor/pending-courses?advisor_id=5
router.get('/pending-courses', getPendingCourses);

// POST: /api/advisor/approve-course
router.post('/approve-course', approveCourse);

module.exports = router;
