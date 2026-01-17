const router = require('express').Router();
const { applyForCourse, dropCourse } = require('../controllers/studentController');

router.post('/apply', applyForCourse);
router.post('/drop', dropCourse);

module.exports = router;
