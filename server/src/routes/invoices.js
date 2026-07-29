const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, recordPayment, updateStatus, remove } = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/payment', recordPayment);
router.patch('/:id/status', updateStatus);
router.delete('/:id', remove);

module.exports = router;
