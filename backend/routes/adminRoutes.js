/* file: backend/routes/adminRoutes.js */
const router = require('express').Router();
const { 
  resetEnrollments, 
  getUsers, 
  updateUserStatus, 
  deleteUser,
  getSystemSettings,
  toggleCourseRegistration,
  toggleGradeSubmission,
  getPendingCourses, // NEW
  approveCourse      // NEW
} = require('../controllers/adminController');

router.delete('/reset-enrollments', resetEnrollments);
router.get('/users', getUsers);            
router.post('/user-status', updateUserStatus); 
router.post('/delete-user', deleteUser);       

// New System Control Routes
router.get('/system-settings', getSystemSettings);
router.post('/toggle-registration', toggleCourseRegistration);
router.post('/toggle-grading', toggleGradeSubmission);

// NEW: Course Approval Routes
router.get('/pending-courses', getPendingCourses);
router.post('/approve-course', approveCourse);

module.exports = router;