const prisma = require('../prisma');

const getAll = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
};

module.exports = { getAll };
