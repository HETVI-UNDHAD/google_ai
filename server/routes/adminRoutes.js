const express = require('express');
const router  = express.Router();
const { getAllUsers } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/users', protect, authorizeRoles('Admin'), getAllUsers);

module.exports = router;
