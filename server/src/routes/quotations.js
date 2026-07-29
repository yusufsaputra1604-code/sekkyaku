const express = require('express');
const router = express.Router();
const { getAll, getById, create, updateStatus, convertToInvoice, remove } = require('../controllers/quotationController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id/status', updateStatus);
router.post('/:id/convert', convertToInvoice);
router.delete('/:id', remove);

module.exports = router;
