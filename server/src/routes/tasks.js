const express = require('express');
const router = express.Router();
const { getAll, getByProject, create, update, updateStatus, remove } = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAll);
router.get('/project/:projectId', getByProject);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/status', updateStatus);
router.delete('/:id', remove);

module.exports = router;
