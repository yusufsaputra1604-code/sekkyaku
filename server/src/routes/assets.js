const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getByProject, upload, updateStatus, download, remove } = require('../controllers/assetController');
const authMiddleware = require('../middleware/auth');

const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4', 'video/quicktime', 'video/x-msvideo',
    'application/zip', 'application/x-rar-compressed',
    'text/plain',
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipe file tidak didukung'), false);
  }
};

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.use(authMiddleware);

router.get('/project/:projectId', getByProject);
router.post('/upload', uploadMiddleware.single('file'), upload);
router.patch('/:id/status', updateStatus);
router.delete('/:id', remove);

module.exports = router;
