const prisma = require('../prisma');

const getByTask = async (req, res) => {
  try {
    const logs = await prisma.timeLog.findMany({
      where: { taskId: req.params.taskId },
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil time log' });
  }
};

const create = async (req, res) => {
  try {
    const { hours, note, date, taskId } = req.body;

    const log = await prisma.timeLog.create({
      data: {
        hours: parseFloat(hours),
        note,
        date: date ? new Date(date) : new Date(),
        taskId,
        userId: req.user.id,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    const totalLogged = await prisma.timeLog.aggregate({
      where: { taskId },
      _sum: { hours: true },
    });

    await prisma.task.update({
      where: { id: taskId },
      data: { loggedHours: totalLogged._sum.hours || 0 },
    });

    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mencatat waktu' });
  }
};

const remove = async (req, res) => {
  try {
    const log = await prisma.timeLog.findUnique({ where: { id: req.params.id } });
    if (!log) return res.status(404).json({ error: 'Log tidak ditemukan' });

    await prisma.timeLog.delete({ where: { id: req.params.id } });

    const totalLogged = await prisma.timeLog.aggregate({
      where: { taskId: log.taskId },
      _sum: { hours: true },
    });

    await prisma.task.update({
      where: { id: log.taskId },
      data: { loggedHours: totalLogged._sum.hours || 0 },
    });

    res.json({ message: 'Time log dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus time log' });
  }
};

module.exports = { getByTask, create, remove };
