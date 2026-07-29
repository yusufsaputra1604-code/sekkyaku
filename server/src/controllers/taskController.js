const prisma = require('../prisma');

const getAll = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data task' });
  }
};

const getByProject = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: 'desc' },
      include: { assignee: { select: { id: true, name: true } } },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data task' });
  }
};

const create = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body;
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
      },
      include: { assignee: { select: { id: true, name: true } } },
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat task' });
  }
};

const update = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
      },
      include: { assignee: { select: { id: true, name: true } } },
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update task' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status },
      include: { assignee: { select: { id: true, name: true } } },
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update status task' });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus task' });
  }
};

module.exports = { getAll, getByProject, create, update, updateStatus, remove };
