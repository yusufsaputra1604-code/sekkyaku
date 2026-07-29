const prisma = require('../prisma');

const getStats = async (req, res) => {
  try {
    const totalClients = await prisma.client.count();

    const totalDeals = await prisma.deal.count();
    const activeDeals = await prisma.deal.count({
      where: { stage: { notIn: ['won', 'lost'] } },
    });
    const wonDeals = await prisma.deal.count({ where: { stage: 'won' } });

    const pipelineValue = await prisma.deal.aggregate({
      _sum: { value: true },
      where: { stage: { notIn: ['won', 'lost'] } },
    });

    const wonValue = await prisma.deal.aggregate({
      _sum: { value: true },
      where: { stage: 'won' },
    });

    const totalProjects = await prisma.project.count();
    const activeProjects = await prisma.project.count({ where: { status: 'active' } });

    const recentDeals = await prisma.deal.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        client: { select: { name: true, company: true } },
      },
    });

    const dealsByStage = await prisma.deal.groupBy({
      by: ['stage'],
      _count: { id: true },
      _sum: { value: true },
    });

    const totalInvoices = await prisma.invoice.count();
    const unpaidInvoices = await prisma.invoice.aggregate({
      _sum: { total: true, paidAmount: true },
      where: { status: { in: ['unpaid', 'partial'] } },
    });
    const paidInvoices = await prisma.invoice.aggregate({
      _sum: { total: true },
      where: { status: 'paid' },
    });

    res.json({
      totalClients,
      totalDeals,
      activeDeals,
      wonDeals,
      pipelineValue: pipelineValue._sum.value || 0,
      wonValue: wonValue._sum.value || 0,
      totalProjects,
      activeProjects,
      recentDeals,
      dealsByStage,
      totalInvoices,
      unpaidTotal: (unpaidInvoices._sum.total || 0) - (unpaidInvoices._sum.paidAmount || 0),
      paidTotal: paidInvoices._sum.total || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data dashboard' });
  }
};

module.exports = { getStats };
