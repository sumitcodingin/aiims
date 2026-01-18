const router = require("express").Router();
const {
  getInstructorCourses,
  getCourseApplications,
  approveByInstructor,
  awardGrade,
  floatCourse,
} = require("../controllers/instructorController");

router.get("/courses", getInstructorCourses);
router.get("/applications", getCourseApplications);
router.post("/approve-request", approveByInstructor);
router.post("/award-grade", awardGrade);
router.post("/float-course", floatCourse);

module.exports = router;
