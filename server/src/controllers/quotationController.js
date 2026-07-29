const prisma = require('../prisma');
const { log } = require('./activityController');

const generateQuoteNo = async () => {
  const count = await prisma.quotation.count();
  const year = new Date().getFullYear();
  const num = String(count + 1).padStart(4, '0');
  return `QT-${year}-${num}`;
};

const getAll = async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
        items: true,
      },
    });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data quotation' });
  }
};

const getById = async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        items: true,
      },
    });
    if (!quotation) return res.status(404).json({ error: 'Quotation tidak ditemukan' });
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data quotation' });
  }
};

const create = async (req, res) => {
  try {
    const { clientId, projectId, validUntil, tax, discount, notes, items } = req.body;
    const quoteNo = await generateQuoteNo();

    let subtotal = 0;
    const quoteItems = (items || []).map((item) => {
      const amount = (item.quantity || 1) * (item.unitPrice || 0);
      subtotal += amount;
      return {
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        amount,
      };
    });

    const taxAmount = (subtotal * (tax || 0)) / 100;
    const total = subtotal + taxAmount - (discount || 0);

    const quotation = await prisma.quotation.create({
      data: {
        quoteNo,
        clientId,
        projectId: projectId || null,
        validUntil: new Date(validUntil),
        subtotal,
        tax: tax || 0,
        discount: discount || 0,
        total,
        notes,
        items: { create: quoteItems },
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
        items: true,
      },
    });

    await log(req.user.id, 'create', 'quotation', quotation.id, quoteNo, `Membuat quotation: ${quoteNo}`);
    res.json(quotation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat quotation' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        client: { select: { id: true, name: true, company: true } },
        items: true,
      },
    });
    await log(req.user.id, 'status_change', 'quotation', quotation.id, quotation.quoteNo, `Quotation ${quotation.quoteNo} status: ${status}`);
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update status' });
  }
};

const convertToInvoice = async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!quotation) return res.status(404).json({ error: 'Quotation tidak ditemukan' });

    const invoiceCount = await prisma.invoice.count();
    const year = new Date().getFullYear();
    const invoiceNo = `INV-${year}-${String(invoiceCount + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        clientId: quotation.clientId,
        projectId: quotation.projectId,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: quotation.subtotal,
        tax: quotation.tax,
        discount: quotation.discount,
        total: quotation.total,
        notes: `Dari quotation ${quotation.quoteNo}`,
        items: {
          create: quotation.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        },
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        items: true,
      },
    });

    await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status: 'converted' },
    });

    await log(req.user.id, 'convert', 'quotation', quotation.id, quotation.quoteNo, `Convert quotation ${quotation.quoteNo} ke invoice ${invoiceNo}`);
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal convert ke invoice' });
  }
};

const remove = async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    await prisma.quotation.delete({ where: { id: req.params.id } });
    await log(req.user.id, 'delete', 'quotation', req.params.id, quotation?.quoteNo, `Menghapus quotation: ${quotation?.quoteNo}`);
    res.json({ message: 'Quotation dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus quotation' });
  }
};

module.exports = { getAll, getById, create, updateStatus, convertToInvoice, remove };
