const router = require("express").Router();
const authSession = require("../middleware/authSession");

const {
  browseProjects,
  requestToJoinProject
} = require("../controllers/projectStudentController");

/* ==================================
   🔐 PROTECT ALL PROJECT ROUTES
================================== */
router.use(authSession);

/* ==================================
   STUDENT PROJECT ROUTES
================================== */

router.get("/browse", browseProjects);
router.post("/request", requestToJoinProject);

module.exports = router;