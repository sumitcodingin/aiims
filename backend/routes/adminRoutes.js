const router = require('express').Router();
const { 
  resetEnrollments, 
  getUsers, 
  updateUserStatus, 
  deleteUser 
} = require('../controllers/adminController');

router.delete('/reset-enrollments', resetEnrollments);
router.get('/users', getUsers);            // Fetch users
router.post('/user-status', updateUserStatus); // Approve/Block
router.post('/delete-user', deleteUser);       // Remove user

module.exports = router;