const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/requestController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadImage, uploadFile } = require('../middleware/upload');

router.get('/',          ctrl.getAllRequests);
router.get('/sorted',    ctrl.getSortedRequests);
router.get('/:id',       ctrl.getRequestById);
router.post('/',         protect, authorizeRoles('NGO', 'Admin'), uploadImage.single('image'), ctrl.createRequest);
router.patch('/:id/status', protect, authorizeRoles('Admin', 'NGO'), ctrl.updateRequestStatus);
router.post('/upload',   protect, authorizeRoles('NGO', 'Admin'), uploadFile.single('file'), ctrl.uploadRequests);

module.exports = router;
