const express = require('express');
const router = express.Router();
const { generateToken, getPortalData, approveAsset, requestRevision, downloadAsset } = require('../controllers/portalController');
const authMiddleware = require('../middleware/auth');

router.post('/generate/:clientId', authMiddleware, generateToken);
router.get('/:token', getPortalData);
router.get('/:token/assets/:assetId/download', downloadAsset);
router.post('/:token/assets/:assetId/approve', approveAsset);
router.post('/:token/assets/:assetId/revision', requestRevision);

module.exports = router;
