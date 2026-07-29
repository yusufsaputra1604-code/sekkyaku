const prisma = require('../prisma');
const { log } = require('./activityController');

const getAll = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { deals: true, projects: true } } },
    });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data klien' });
  }
};

const getById = async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        deals: { orderBy: { createdAt: 'desc' } },
        projects: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!client) return res.status(404).json({ error: 'Klien tidak ditemukan' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data klien' });
  }
};

const create = async (req, res) => {
  try {
    const { name, company, email, phone, industry, address, notes, tags } = req.body;
    const client = await prisma.client.create({
      data: { name, company, email, phone, industry, address, notes, tags },
    });
    await log(req.user.id, 'create', 'client', client.id, name, `Menambahkan klien baru: ${name}`);
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat klien' });
  }
};

const update = async (req, res) => {
  try {
    const { name, company, email, phone, industry, address, notes, tags } = req.body;
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { name, company, email, phone, industry, address, notes, tags },
    });
    await log(req.user.id, 'update', 'client', client.id, name, `Mengupdate klien: ${name}`);
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update klien' });
  }
};

const remove = async (req, res) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } });
    await prisma.client.delete({ where: { id: req.params.id } });
    await log(req.user.id, 'delete', 'client', req.params.id, client?.name, `Menghapus klien: ${client?.name}`);
    res.json({ message: 'Klien berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus klien' });
  }
};

module.exports = { getAll, getById, create, update, remove };
