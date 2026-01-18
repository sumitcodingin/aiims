const router = require('express').Router();
const {
  getCourseApplications,
  awardGrade,
  approveByInstructor,
  floatCourse
} = require('../controllers/instructorController');



// GET: /api/instructor/applications/:courseId
router.get('/applications/:courseId', getCourseApplications);

// POST: /api/instructor/award-grade
router.post('/award-grade', awardGrade);

// POST: /api/instructor/approve-request
router.post('/approve-request', approveByInstructor);

// POST: /api/instructor/float-course
router.post('/float-course', floatCourse);

module.exports = router;
