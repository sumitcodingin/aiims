const router = require('express').Router();
const {
  searchCourses,
  getCourseMembers,
  getPublicCourseEnrollments
} = require('../controllers/courseController');

router.get('/search', searchCourses);
router.get('/:courseId/members', getCourseMembers);
router.get('/:courseId/public-enrollments', getPublicCourseEnrollments);

module.exports = router;