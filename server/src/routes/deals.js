const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, updateStage, remove } = require('../controllers/dealController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/stage', updateStage);
router.delete('/:id', remove);

module.exports = router;
