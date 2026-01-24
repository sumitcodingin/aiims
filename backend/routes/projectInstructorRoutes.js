const router = require("express").Router();
const authSession = require("../middleware/authSession");

const {
  createProject,
  getMyProjects,
  getProjectRequests,
  respondToProjectRequest,
} = require("../controllers/projectInstructorController");

/* ==================================
   🔐 PROTECT ALL PROJECT ROUTES
   Base path: /api/instructor/projects
================================== */
router.use(authSession);

/* ==================================
   PROJECT CRUD
================================== */

/**
 * Create a new research project
 * POST /api/instructor/projects
 */
router.post("/", createProject);

/**
 * Get instructor's own projects
 * GET /api/instructor/projects
 */
router.get("/", getMyProjects);

/* ==================================
   PROJECT REQUESTS
================================== */

/**
 * Get pending student requests
 * GET /api/instructor/projects/requests?project_id=UUID
 */
router.get("/requests", getProjectRequests);

/**
 * Accept / Reject a student request
 * POST /api/instructor/projects/respond
 * body: { request_id, action: "ACCEPT" | "REJECT" }
 */
router.post("/respond", respondToProjectRequest);

module.exports = router;
