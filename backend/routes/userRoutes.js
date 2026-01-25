const router = require("express").Router();
const { getAdvisors, getUsers } = require("../controllers/userController");

router.get("/", getUsers);
router.get("/advisors", getAdvisors);

module.exports = router;
