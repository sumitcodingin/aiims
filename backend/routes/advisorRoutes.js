/* file: backend/routes/advisorRoutes.js */
const express = require('express');
const router = express.Router();
const advisorController = require('../controllers/advisorController');

// Course Approval Routes
router.get('/pending-courses', advisorController.getFloatedCourses); 
router.post('/approve-course', advisorController.approveCourse); 

// NEW: My Instructor Courses
router.get('/my-instructor-courses', advisorController.getAdvisorInstructorCourses); 

// Student Approval Routes
router.get('/student-courses', advisorController.getAdvisorStudentCourses); 
router.get('/course-students', advisorController.getAdvisorStudentsForCourse); 
router.post('/approve-student', advisorController.approveByAdvisor); 

// Student Management Routes
router.get("/all-students", advisorController.getAllAdvisorStudents);
router.get("/student-details", advisorController.getAdvisorStudentDetails);
router.post("/send-student-email", advisorController.sendEmailToStudent);

// Meeting Route
router.post("/schedule-meeting", advisorController.scheduleMeeting);

module.exports = router;