const router = require("express").Router();
const authSession = require("../middleware/authSession");

const {
  getInstructorCourses,
  getCourseApplications,
  approveByInstructor,
  awardGrade,
  floatCourse,
  getInstructorFeedback,
  getEnrolledStudentsForCourse,
  validateGradesCSV,
  submitMassGrades,
} = require("../controllers/instructorController");

/* ==================================
   🔐 PROTECT ALL INSTRUCTOR ROUTES
================================== */
router.use(authSession);

/* ==================================
   INSTRUCTOR ROUTES
================================== */

router.get("/courses", getInstructorCourses);
router.get("/applications", getCourseApplications);
router.get("/feedback", getInstructorFeedback);
router.get("/enrolled-students/:course_id", getEnrolledStudentsForCourse);
router.post("/approve-request", approveByInstructor);
router.post("/award-grade", awardGrade);
router.post("/float-course", floatCourse);
router.post("/validate-grades-csv", validateGradesCSV);
router.post("/submit-mass-grades", submitMassGrades);

module.exports = router;
