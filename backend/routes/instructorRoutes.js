const router = require("express").Router();
const {
  getInstructorCourses,
  getCourseApplications,
  approveByInstructor,
  awardGrade,
  floatCourse,
  getInstructorFeedback,
} = require("../controllers/instructorController");

router.get("/courses", getInstructorCourses);
router.get("/applications", getCourseApplications);
router.get("/feedback", getInstructorFeedback);
router.post("/approve-request", approveByInstructor);
router.post("/award-grade", awardGrade);
router.post("/float-course", floatCourse);

module.exports = router;
