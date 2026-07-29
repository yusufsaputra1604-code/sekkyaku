const express = require('express');
const router = express.Router();
const { getAll, getUpcoming, create, updateStatus, remove, sendInvoiceReminders, sendTaskReminders } = require('../controllers/reminderController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAll);
router.get('/upcoming', getUpcoming);
router.post('/', create);
router.patch('/:id/status', updateStatus);
router.delete('/:id', remove);
router.post('/send-invoice-reminders', sendInvoiceReminders);
router.post('/send-task-reminders', sendTaskReminders);

module.exports = router;
