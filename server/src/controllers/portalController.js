const prisma = require('../prisma');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const generateToken = async (req, res) => {
  try {
    const { clientId } = req.params;
    const token = crypto.randomBytes(16).toString('hex');

    const client = await prisma.client.update({
      where: { id: clientId },
      data: { portalToken: token },
    });

    res.json({ token, link: `/portal/${token}` });
  } catch (err) {
    res.status(500).json({ error: 'Gagal generate token' });
  }
};

const getPortalData = async (req, res) => {
  try {
    const { token } = req.params;

    const client = await prisma.client.findUnique({
      where: { portalToken: token },
      include: {
        projects: {
          orderBy: { updatedAt: 'desc' },
          include: {
            tasks: {
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            },
            assets: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                name: true,
                fileType: true,
                fileSize: true,
                status: true,
                notes: true,
                createdAt: true,
              },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNo: true,
            status: true,
            total: true,
            paidAmount: true,
            dueDate: true,
            issueDate: true,
          },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            quoteNo: true,
            status: true,
            total: true,
            validUntil: true,
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Portal tidak ditemukan' });
    }

    res.json({
      client: {
        name: client.name,
        company: client.company,
      },
      projects: client.projects,
      invoices: client.invoices,
      quotations: client.quotations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data portal' });
  }
};

const approveAsset = async (req, res) => {
  try {
    const { token, assetId } = req.params;

    const client = await prisma.client.findUnique({
      where: { portalToken: token },
    });

    if (!client) {
      return res.status(404).json({ error: 'Portal tidak ditemukan' });
    }

    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        project: { clientId: client.id },
      },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset tidak ditemukan' });
    }

    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: { status: 'approved' },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal approve asset' });
  }
};

const requestRevision = async (req, res) => {
  try {
    const { token, assetId } = req.params;
    const { notes } = req.body;

    const client = await prisma.client.findUnique({
      where: { portalToken: token },
    });

    if (!client) {
      return res.status(404).json({ error: 'Portal tidak ditemukan' });
    }

    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        project: { clientId: client.id },
      },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset tidak ditemukan' });
    }

    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: { status: 'revision', notes: notes || 'Klien meminta revisi' },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal request revisi' });
  }
};

const downloadAsset = async (req, res) => {
  try {
    const { token, assetId } = req.params;

    const client = await prisma.client.findUnique({
      where: { portalToken: token },
    });

    if (!client) {
      return res.status(404).json({ error: 'Portal tidak ditemukan' });
    }

    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        project: { clientId: client.id },
      },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset tidak ditemukan' });
    }

    const uploadsDir = path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadsDir, asset.fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File tidak ditemukan' });
    }

    res.setHeader('Content-Type', asset.fileType);
    res.setHeader('Content-Disposition', `inline; filename="${asset.name}"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: 'Gagal download file' });
  }
};

module.exports = { generateToken, getPortalData, approveAsset, requestRevision, downloadAsset };
