const router = require('express').Router();
const {
  searchCourses,
  getCourseMembers
} = require('../controllers/courseController');

// GET: /api/courses/search
router.get('/search', searchCourses);

// GET: /api/courses/:courseId/members
router.get('/:courseId/members', getCourseMembers);

module.exports = router;
