const prisma = require('../prisma');

const getEvents = async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start ? new Date(start) : new Date(new Date().setDate(1));
    const endDate = end ? new Date(end) : new Date(new Date().setMonth(new Date().getMonth() + 1));

    const events = [];

    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { gte: startDate, lte: endDate },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    tasks.forEach((task) => {
      events.push({
        id: task.id,
        title: task.title,
        date: task.dueDate,
        type: 'task',
        status: task.status,
        priority: task.priority,
        meta: {
          projectName: task.project?.name,
          assigneeName: task.assignee?.name,
          projectId: task.project?.id,
        },
      });
    });

    const reminders = await prisma.reminder.findMany({
      where: {
        dueDate: { gte: startDate, lte: endDate },
        userId: req.user.id,
      },
    });

    reminders.forEach((reminder) => {
      events.push({
        id: reminder.id,
        title: reminder.title,
        date: reminder.dueDate,
        type: 'reminder',
        status: reminder.status,
        meta: {},
      });
    });

    const projects = await prisma.project.findMany({
      where: {
        endDate: { gte: startDate, lte: endDate },
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    projects.forEach((project) => {
      events.push({
        id: project.id,
        title: `${project.name} - Deadline`,
        date: project.endDate,
        type: 'deadline',
        status: project.status,
        meta: {
          clientName: project.client?.name,
          clientId: project.client?.id,
        },
      });
    });

    const invoices = await prisma.invoice.findMany({
      where: {
        dueDate: { gte: startDate, lte: endDate },
        status: { in: ['unpaid', 'partial'] },
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    invoices.forEach((invoice) => {
      events.push({
        id: invoice.id,
        title: `${invoice.invoiceNo} - Jatuh Tempo`,
        date: invoice.dueDate,
        type: 'invoice',
        status: invoice.status,
        meta: {
          clientName: invoice.client?.name,
          invoiceNo: invoice.invoiceNo,
          total: invoice.total,
        },
      });
    });

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data kalender' });
  }
};

module.exports = { getEvents };
