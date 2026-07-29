const prisma = require('../prisma');
const { sendInvoiceReminder, sendTaskReminder } = require('../services/emailService');

const getAll = async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: req.user.id },
      orderBy: { dueDate: 'asc' },
    });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil reminder' });
  }
};

const getUpcoming = async (req, res) => {
  try {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const reminders = await prisma.reminder.findMany({
      where: {
        userId: req.user.id,
        status: 'pending',
        dueDate: { gte: now, lte: weekLater },
      },
      orderBy: { dueDate: 'asc' },
    });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil reminder' });
  }
};

const create = async (req, res) => {
  try {
    const { title, dueDate, entityType, entityId } = req.body;
    const reminder = await prisma.reminder.create({
      data: {
        title,
        dueDate: new Date(dueDate),
        entityType: entityType || null,
        entityId: entityId || null,
        userId: req.user.id,
      },
    });
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat reminder' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update reminder' });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.reminder.delete({ where: { id: req.params.id } });
    res.json({ message: 'Reminder dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus reminder' });
  }
};

const sendInvoiceReminders = async (req, res) => {
  try {
    const dueIn3Days = new Date();
    dueIn3Days.setDate(dueIn3Days.getDate() + 3);

    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['unpaid', 'partial'] },
        dueDate: { lte: dueIn3Days },
      },
      include: { client: true },
    });

    let sent = 0;
    for (const invoice of invoices) {
      if (invoice.client?.email) {
        const result = await sendInvoiceReminder(invoice.client, invoice);
        if (result) sent++;
      }
    }

    res.json({ total: invoices.length, sent });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengirim reminder' });
  }
};

const sendTaskReminders = async (req, res) => {
  try {
    const dueTomorrow = new Date();
    dueTomorrow.setDate(dueTomorrow.getDate() + 1);
    dueTomorrow.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await prisma.task.findMany({
      where: {
        status: { notIn: ['done'] },
        dueDate: { gte: today, lte: dueTomorrow },
        assigneeId: { not: null },
      },
      include: { assignee: true },
    });

    let sent = 0;
    for (const task of tasks) {
      if (task.assignee?.email) {
        const result = await sendTaskReminder(task.assignee, task);
        if (result) sent++;
      }
    }

    res.json({ total: tasks.length, sent });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengirim reminder' });
  }
};

module.exports = { getAll, getUpcoming, create, updateStatus, remove, sendInvoiceReminders, sendTaskReminders };
