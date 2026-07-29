const express = require('express');
const router = express.Router();
const { getRevenueReport, getPipelineReport, getProjectReport, getClientReport } = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/revenue', getRevenueReport);
router.get('/pipeline', getPipelineReport);
router.get('/projects', getProjectReport);
router.get('/clients', getClientReport);

module.exports = router;
