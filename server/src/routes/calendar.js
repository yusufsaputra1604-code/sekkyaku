const express = require('express');
const router = express.Router();
const { getEvents } = require('../controllers/calendarController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/events', getEvents);

module.exports = router;
