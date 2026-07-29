const express = require('express');
const router = express.Router();
const { getByTask, create, remove } = require('../controllers/timeLogController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/task/:taskId', getByTask);
router.post('/', create);
router.delete('/:id', remove);

module.exports = router;
