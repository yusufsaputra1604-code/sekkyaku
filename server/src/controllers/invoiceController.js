const prisma = require('../prisma');

const generateInvoiceNo = async () => {
  const count = await prisma.invoice.count();
  const year = new Date().getFullYear();
  const num = String(count + 1).padStart(4, '0');
  return `INV-${year}-${num}`;
};

const getAll = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
        items: true,
      },
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data invoice' });
  }
};

const getById = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        project: { select: { id: true, name: true } },
        items: true,
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice tidak ditemukan' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data invoice' });
  }
};

const create = async (req, res) => {
  try {
    const { clientId, projectId, dueDate, tax, discount, notes, items } = req.body;

    const invoiceNo = await generateInvoiceNo();

    let subtotal = 0;
    const invoiceItems = (items || []).map((item) => {
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

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        clientId,
        projectId: projectId || null,
        dueDate: new Date(dueDate),
        subtotal,
        tax: tax || 0,
        discount: discount || 0,
        total,
        notes,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
        items: true,
      },
    });

    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat invoice' });
  }
};

const update = async (req, res) => {
  try {
    const { clientId, projectId, dueDate, tax, discount, notes, items } = req.body;

    const existing = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!existing) return res.status(404).json({ error: 'Invoice tidak ditemukan' });

    let subtotal = 0;
    const invoiceItems = (items || []).map((item) => {
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

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: req.params.id } });

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        clientId,
        projectId: projectId || null,
        dueDate: new Date(dueDate),
        subtotal,
        tax: tax || 0,
        discount: discount || 0,
        total,
        notes,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
        items: true,
      },
    });

    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal update invoice' });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });

    if (!invoice) return res.status(404).json({ error: 'Invoice tidak ditemukan' });

    const newPaidAmount = invoice.paidAmount + amount;
    let status = invoice.status;

    if (newPaidAmount >= invoice.total) {
      status = 'paid';
    } else if (newPaidAmount > 0) {
      status = 'partial';
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { paidAmount: newPaidAmount, status },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, name: true } },
        items: true,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mencatat pembayaran' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        client: { select: { id: true, name: true, company: true } },
        items: true,
      },
    });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update status' });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ message: 'Invoice berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus invoice' });
  }
};

module.exports = { getAll, getById, create, update, recordPayment, updateStatus, remove };
