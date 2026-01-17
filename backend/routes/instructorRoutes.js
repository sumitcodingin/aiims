const router = require('express').Router();
const { getCourseApplications, awardGrade } = require('../controllers/instructorController');

router.get('/applications/:courseId', getCourseApplications);
router.post('/award-grade', awardGrade);

module.exports = router;
