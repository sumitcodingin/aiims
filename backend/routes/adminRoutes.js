const router = require('express').Router();
const { resetEnrollments } = require('../controllers/adminController');

router.delete('/reset-enrollments', resetEnrollments);

module.exports = router;
