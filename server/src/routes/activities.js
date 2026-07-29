const express = require('express');
const router = express.Router();
const { getAll, getRecent } = require('../controllers/activityController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAll);
router.get('/recent', getRecent);

module.exports = router;
