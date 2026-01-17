const router = require('express').Router();
const { searchCourses } = require('../controllers/courseController');

router.get('/search', searchCourses);

module.exports = router;
