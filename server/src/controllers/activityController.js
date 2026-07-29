const prisma = require('../prisma');

const log = async (userId, action, entity, entityId, entityName, details) => {
  try {
    await prisma.activity.create({
      data: { userId, action, entity, entityId, entityName, details },
    });
  } catch (err) {
    console.error('Activity log error:', err);
  }
};

const getAll = async (req, res) => {
  try {
    const { entity, entityId, limit } = req.query;
    const where = {};
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) || 50,
      include: { user: { select: { id: true, name: true } } },
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil aktivitas' });
  }
};

const getRecent = async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { id: true, name: true } } },
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil aktivitas' });
  }
};

module.exports = { log, getAll, getRecent };
