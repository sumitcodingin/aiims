const router = require('express').Router();
const {
  getCourseApplications,
  awardGrade,
  approveByInstructor
} = require('../controllers/instructorController');

// GET: /api/instructor/applications/:courseId
router.get('/applications/:courseId', getCourseApplications);

// POST: /api/instructor/award-grade
router.post('/award-grade', awardGrade);

// POST: /api/instructor/approve-request
router.post('/approve-request', approveByInstructor);

module.exports = router;
