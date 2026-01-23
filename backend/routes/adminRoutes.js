const router = require('express').Router();
const { 
  resetEnrollments, 
  getUsers, 
  updateUserStatus, 
  deleteUser,
  getSystemSettings,
  toggleCourseRegistration,
  toggleGradeSubmission
} = require('../controllers/adminController');

router.delete('/reset-enrollments', resetEnrollments);
router.get('/users', getUsers);            
router.post('/user-status', updateUserStatus); 
router.post('/delete-user', deleteUser);       

// New System Control Routes
router.get('/system-settings', getSystemSettings);
router.post('/toggle-registration', toggleCourseRegistration);
router.post('/toggle-grading', toggleGradeSubmission);

module.exports = router;