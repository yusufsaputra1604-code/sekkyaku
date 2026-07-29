const prisma = require('../prisma');
const path = require('path');
const fs = require('fs');

const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads');

const getByProject = async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { id: true, name: true } } },
    });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data asset' });
  }
};

const upload = async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('File:', req.file);
    console.log('Body:', req.body);
    console.log('User:', req.user);

    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    const { projectId, notes } = req.body;

    if (!projectId) {
      console.log('No projectId');
      return res.status(400).json({ error: 'Project ID wajib' });
    }

    console.log('Creating asset in DB...');
    const asset = await prisma.asset.create({
      data: {
        name: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        projectId,
        uploaderId: req.user.id,
        notes: notes || null,
      },
      include: { uploader: { select: { id: true, name: true } } },
    });

    console.log('Asset created:', asset.id);
    res.json(asset);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Gagal upload file: ' + err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: { status, notes },
      include: { uploader: { select: { id: true, name: true } } },
    });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update status asset' });
  }
};

const download = async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) {
      return res.status(404).json({ error: 'Asset tidak ditemukan' });
    }

    const filePath = path.join(uploadsDir, asset.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File tidak ditemukan di server' });
    }

    res.setHeader('Content-Type', asset.fileType);
    res.setHeader('Content-Disposition', `inline; filename="${asset.name}"`);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: 'Gagal download file' });
  }
};

const remove = async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) return res.status(404).json({ error: 'Asset tidak ditemukan' });

    const filePath = path.join(uploadsDir, asset.fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.asset.delete({ where: { id: req.params.id } });
    res.json({ message: 'Asset berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus asset' });
  }
};

module.exports = { getByProject, upload, updateStatus, download, remove };
