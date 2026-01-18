const router = require('express').Router();

const {
  requestOTP,
  verifyOTP,
  requestSignupOTP,
  verifySignupOTP
} = require('../controllers/authController');

/* ======================
   LOGIN (EXISTING USERS)
====================== */
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);

/* ======================
   SIGNUP (NEW USERS)
====================== */
router.post('/signup/request-otp', requestSignupOTP);
router.post('/signup/verify-otp', verifySignupOTP);

module.exports = router;
