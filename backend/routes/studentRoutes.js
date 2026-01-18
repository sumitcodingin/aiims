const router = require('express').Router();
const {
  applyForCourse,
  dropCourse,
  getStudentRecords,
  getStudentProfile,
} = require('../controllers/studentController');

router.post('/apply', applyForCourse);
router.post('/drop', dropCourse);
router.get('/records', getStudentRecords);
router.get('/profile', getStudentProfile);

module.exports = router;
