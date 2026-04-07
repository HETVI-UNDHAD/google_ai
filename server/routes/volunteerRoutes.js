const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/volunteerController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/volunteer',              protect, authorizeRoles('Volunteer'), ctrl.registerVolunteer);
router.get('/volunteers',              protect, authorizeRoles('Admin'),     ctrl.getVolunteers);
router.get('/volunteer/me',            protect, authorizeRoles('Volunteer'), ctrl.getMyProfile);
router.post('/assign',                 protect, authorizeRoles('Admin'),     ctrl.runMatching);
router.get('/assignments',             protect, authorizeRoles('Admin'),     ctrl.getAssignments);
router.get('/assignments/mine',        protect, authorizeRoles('Volunteer'), ctrl.getMyAssignments);
router.patch('/assignments/:id/respond', protect, authorizeRoles('Volunteer'), ctrl.respondToAssignment);

module.exports = router;
