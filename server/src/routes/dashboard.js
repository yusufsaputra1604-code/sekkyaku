const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getStats);

module.exports = router;
