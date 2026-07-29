const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAll);

module.exports = router;
