const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/requestController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadImage, uploadFile } = require('../middleware/upload');

// IMPORTANT: /sorted and /upload must come BEFORE /:id
router.get('/sorted',       ctrl.getSortedRequests);
router.post('/upload',      protect, authorizeRoles('NGO', 'Admin'), uploadFile.single('file'), ctrl.uploadRequests);
router.get('/',             ctrl.getAllRequests);
router.get('/:id',          ctrl.getRequestById);
router.post('/',            protect, authorizeRoles('NGO', 'Admin'), uploadImage.single('image'), ctrl.createRequest);
router.patch('/:id/status', protect, authorizeRoles('Admin', 'NGO'), ctrl.updateRequestStatus);

module.exports = router;
