const router = require("express").Router();
const { getAdvisors } = require("../controllers/userController");

router.get("/advisors", getAdvisors);

module.exports = router;
