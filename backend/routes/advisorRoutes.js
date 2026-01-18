const router = require("express").Router();

const {
  approveByAdvisor,
  getAdvisorCourses,
  getPendingStudentsForCourse,
  approveCourse,
  getPendingCourses
} = require("../controllers/advisorController");

/* ===============================
   STUDENT ENROLLMENT APPROVAL
================================ */

// POST /api/advisor/approve-request
router.post("/approve-request", approveByAdvisor);

// GET /api/advisor/courses?advisor_id=
router.get("/courses", getAdvisorCourses);

// GET /api/advisor/pending-students?advisor_id=&course_id=
router.get("/pending-students", getPendingStudentsForCourse);

/* ===============================
   COURSE APPROVAL
================================ */
router.get("/pending-courses", getPendingCourses);

// POST /api/advisor/approve-course
router.post("/approve-course", approveCourse);

module.exports = router;
