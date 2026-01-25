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
  getPendingCourses, 
  approveCourse,
  // NEW IMPORTS
  getProgramRequests,
  updateProgramStatus
} = require('../controllers/adminController');

// User Management
router.delete('/reset-enrollments', resetEnrollments);
router.get('/users', getUsers);            
router.post('/user-status', updateUserStatus); 
router.post('/delete-user', deleteUser);       

// System Control Routes
router.get('/system-settings', getSystemSettings);
router.post('/toggle-registration', toggleCourseRegistration);
router.post('/toggle-grading', toggleGradeSubmission);

// Course Approval Routes
router.get('/pending-courses', getPendingCourses);
router.post('/approve-course', approveCourse);

// NEW: Program Application Management
router.get('/program-requests', getProgramRequests);
router.post('/update-program-status', updateProgramStatus);

module.exports = router;