const prisma = require('../prisma');

const getRevenueReport = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status: 'paid' },
      include: { client: { select: { name: true, company: true } } },
      orderBy: { issueDate: 'asc' },
    });

    const monthlyRevenue = {};
    const clientRevenue = {};

    invoices.forEach((inv) => {
      const month = new Date(inv.issueDate).toISOString().slice(0, 7);
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + inv.total;

      const clientName = inv.client?.name || 'Unknown';
      clientRevenue[clientName] = (clientRevenue[clientName] || 0) + inv.total;
    });

    const monthlyData = Object.entries(monthlyRevenue)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const clientData = Object.entries(clientRevenue)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    res.json({ monthlyData, clientData });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil laporan revenue' });
  }
};

const getPipelineReport = async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      include: { client: { select: { name: true } } },
    });

    const totalDeals = deals.length;
    const wonDeals = deals.filter((d) => d.stage === 'won').length;
    const lostDeals = deals.filter((d) => d.stage === 'lost').length;
    const activeDeals = deals.filter((d) => !['won', 'lost'].includes(d.stage)).length;
    const winRate = totalDeals > 0 ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) : 0;

    const stageData = {};
    deals.forEach((d) => {
      if (!stageData[d.stage]) {
        stageData[d.stage] = { count: 0, value: 0 };
      }
      stageData[d.stage].count++;
      stageData[d.stage].value += d.value;
    });

    const avgDealValue = totalDeals > 0 ? Math.round(deals.reduce((sum, d) => sum + d.value, 0) / totalDeals) : 0;

    res.json({
      totalDeals,
      wonDeals,
      lostDeals,
      activeDeals,
      winRate,
      avgDealValue,
      stageData,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil laporan pipeline' });
  }
};

const getProjectReport = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: true,
        client: { select: { name: true } },
      },
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;

    let onTimeCount = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    projects.forEach((p) => {
      if (p.status === 'completed' && p.endDate && p.updatedAt <= p.endDate) {
        onTimeCount++;
      }
      totalTasks += p.tasks.length;
      completedTasks += p.tasks.filter((t) => t.status === 'done').length;
    });

    const onTimeRate = completedProjects > 0 ? Math.round((onTimeCount / completedProjects) * 100) : 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      totalProjects,
      activeProjects,
      completedProjects,
      onTimeRate,
      totalTasks,
      completedTasks,
      taskCompletionRate,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil laporan proyek' });
  }
};

const getClientReport = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        deals: true,
        projects: true,
        invoices: true,
      },
    });

    const clientData = clients.map((c) => {
      const totalDealValue = c.deals.reduce((sum, d) => sum + d.value, 0);
      const wonDeals = c.deals.filter((d) => d.stage === 'won').length;
      const totalInvoiced = c.invoices.reduce((sum, i) => sum + i.total, 0);
      const totalPaid = c.invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);

      return {
        id: c.id,
        name: c.name,
        company: c.company,
        totalDeals: c.deals.length,
        wonDeals,
        totalDealValue,
        totalProjects: c.projects.length,
        totalInvoiced,
        totalPaid,
      };
    });

    clientData.sort((a, b) => b.totalPaid - a.totalPaid);

    res.json(clientData);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil laporan klien' });
  }
};

module.exports = { getRevenueReport, getPipelineReport, getProjectReport, getClientReport };
