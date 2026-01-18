const router = require('express').Router();
const { approveByAdvisor } = require('../controllers/advisorController');

router.post('/approve-request', approveByAdvisor);

module.exports = router;
