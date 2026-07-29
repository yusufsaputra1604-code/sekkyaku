const prisma = require('../prisma');
const { log } = require('./activityController');

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const getAll = async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, company: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data deal' });
  }
};

const getById = async (req, res) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        assignee: { select: { id: true, name: true } },
      },
    });
    if (!deal) return res.status(404).json({ error: 'Deal tidak ditemukan' });
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data deal' });
  }
};

const create = async (req, res) => {
  try {
    const { title, value, stage, probability, notes, clientId, assigneeId } = req.body;
    const deal = await prisma.deal.create({
      data: { title, value, stage, probability, notes, clientId, assigneeId },
      include: {
        client: { select: { id: true, name: true, company: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    await log(req.user.id, 'create', 'deal', deal.id, title, `Membuat deal baru: ${title}`);
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat deal' });
  }
};

const update = async (req, res) => {
  try {
    const { title, value, stage, probability, notes, clientId, assigneeId } = req.body;
    const updateData = { title, value, stage, probability, notes, clientId, assigneeId };

    if (stage === 'won' || stage === 'lost') {
      updateData.closedAt = new Date();
    }

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, company: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    await log(req.user.id, 'update', 'deal', deal.id, title, `Mengupdate deal: ${title}`);
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update deal' });
  }
};

const updateStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const updateData = { stage };

    if (stage === 'won' || stage === 'lost') {
      updateData.closedAt = new Date();
    }

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, company: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    await log(req.user.id, 'stage_change', 'deal', deal.id, deal.title, `Deal "${deal.title}" dipindah ke stage: ${stage}`);
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update stage deal' });
  }
};

const remove = async (req, res) => {
  try {
    const deal = await prisma.deal.findUnique({ where: { id: req.params.id } });
    await prisma.deal.delete({ where: { id: req.params.id } });
    await log(req.user.id, 'delete', 'deal', req.params.id, deal?.title, `Menghapus deal: ${deal?.title}`);
    res.json({ message: 'Deal berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus deal' });
  }
};

module.exports = { getAll, getById, create, update, updateStage, remove };
