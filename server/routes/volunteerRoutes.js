const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/volunteerController');
const notifCtrl   = require('../controllers/notificationController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Volunteer profile
router.post('/volunteer',                       protect, authorizeRoles('Volunteer'), ctrl.registerVolunteer);
router.get('/volunteer/me',                     protect, authorizeRoles('Volunteer'), ctrl.getMyProfile);
router.patch('/volunteer/profile',              protect, authorizeRoles('Volunteer'), ctrl.updateProfile);
router.patch('/volunteer/availability',         protect, authorizeRoles('Volunteer'), ctrl.toggleAvailability);

// Live location
router.post('/volunteer/location',            protect, authorizeRoles('Volunteer'), notifCtrl.updateLocation);

// Notifications
router.get('/volunteer/notifications',        protect, authorizeRoles('Volunteer'), notifCtrl.getMyNotifications);
router.patch('/volunteer/notifications/read', protect, authorizeRoles('Volunteer'), notifCtrl.markAllRead);

// Nearby tasks (GPS based)
router.get('/volunteer/tasks',                protect, authorizeRoles('Volunteer'), ctrl.getNearbyTasks);

// Task actions
router.post('/volunteer/accept',              protect, authorizeRoles('Volunteer'), ctrl.acceptTask);
router.post('/volunteer/reject',              protect, authorizeRoles('Volunteer'), ctrl.rejectTask);
router.post('/volunteer/complete',            protect, authorizeRoles('Volunteer'), ctrl.completeTask);

// Admin — volunteer list
router.get('/volunteers/online',               protect, authorizeRoles('Admin'),     ctrl.getOnlineVolunteers);
router.get('/volunteers',                     protect, authorizeRoles('Admin'),     ctrl.getVolunteers);

// Matching
router.get('/match/preview',                  protect, authorizeRoles('Admin'),     ctrl.previewMatching);
router.post('/assign',                        protect, authorizeRoles('Admin'),     ctrl.runMatching);
router.post('/assign/manual',                 protect, authorizeRoles('Admin'),     ctrl.manualAssign);

// Assignments
router.get('/assignments',                    protect, authorizeRoles('Admin'),     ctrl.getAssignments);
router.get('/assignments/mine',               protect, authorizeRoles('Volunteer'), ctrl.getMyAssignments);
router.patch('/assignments/:id/respond',      protect, authorizeRoles('Volunteer'), ctrl.respondToAssignment);

module.exports = router;
