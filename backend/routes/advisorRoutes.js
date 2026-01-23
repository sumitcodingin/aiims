const express = require('express');
const router = express.Router();
const advisorController = require('../controllers/advisorController');

// Course Approval Routes
router.get('/pending-courses', advisorController.getFloatedCourses); // Fetches Pending & Approved
router.post('/approve-course', advisorController.approveCourse);     // Handles Accept/Reject logic

// Student Approval Routes
router.get('/student-courses', advisorController.getAdvisorStudentCourses); // The "Union" list
router.get('/course-students', advisorController.getAdvisorStudentsForCourse); // Students for a card
router.post('/approve-student', advisorController.approveByAdvisor); // Accept/Reject/Remove
// advisorRoutes.js
router.get("/all-students", advisorController.getAllAdvisorStudents);
router.get("/student-details", advisorController.getAdvisorStudentDetails);
router.post("/send-student-email", advisorController.sendEmailToStudent);



module.exports = router;