const prisma = require('../prisma');

const getAll = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, company: true } },
        _count: { select: { tasks: true } },
      },
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data proyek' });
  }
};

const getById = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { id: true, name: true, company: true, email: true } },
        tasks: {
          orderBy: { createdAt: 'desc' },
          include: { assignee: { select: { id: true, name: true } } },
        },
      },
    });
    if (!project) return res.status(404).json({ error: 'Proyek tidak ditemukan' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data proyek' });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, status, startDate, endDate, budget, clientId } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || 'active',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        clientId,
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
      },
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat proyek' });
  }
};

const update = async (req, res) => {
  try {
    const { name, description, status, startDate, endDate, budget, clientId } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        clientId,
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
      },
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update proyek' });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Proyek berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus proyek' });
  }
};

module.exports = { getAll, getById, create, update, remove };
