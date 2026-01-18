const router = require('express').Router();
const {
  searchCourses,
  getCourseMembers
} = require('../controllers/courseController');


router.get('/search', searchCourses);
router.get('/:courseId/members', getCourseMembers);

module.exports = router;
