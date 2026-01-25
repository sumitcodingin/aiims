/* file: backend/routes/instructorRoutes.js */
const router = require('express').Router();
const { 
  getInstructorCourses, 
  getCourseApplications, 
  approveByInstructor, 
  awardGrade, 
  floatCourse, // ✅ IMPORTED
  getInstructorFeedback,
  getEnrolledStudentsForCourse,
  validateGradesCSV,
  submitMassGrades
} = require('../controllers/instructorController');

// 1. Get Courses & Applications
router.get('/courses', getInstructorCourses);
router.get('/applications', getCourseApplications);

// 2. Manage Students (Approve/Reject)
router.post('/approve-student', approveByInstructor);

// 3. Float New Course
router.post('/float-course', floatCourse); 

// 4. Grading
router.post('/award-grade', awardGrade);
router.post('/validate-grades', validateGradesCSV);
router.post('/submit-mass-grades', submitMassGrades);

// 5. Feedback & Utils
router.get('/feedback', getInstructorFeedback);
router.get('/course-students/:course_id', getEnrolledStudentsForCourse);

module.exports = router;