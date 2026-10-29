const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const operasionalController = require('../controllers/operasionalController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Setup storage untuk berkas materi
const materiDir = path.resolve(__dirname, '../uploads/materi');
if (!fs.existsSync(materiDir)) {
  fs.mkdirSync(materiDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, materiDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    cb(null, `materi-${Date.now()}-${sanitizedName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

// Endpoint operasional bimbingan belajar: dapat diakses oleh Mentor, Admin, dan Staff
router.use(verifyToken, checkRole('mentor', 'admin', 'staff'));

router.get('/sesi-mengajar', operasionalController.getSesiMengajarMentor);
router.get('/sesi/:id/detail', operasionalController.getDetailSesi);
router.post('/sesi/:id/absen-siswa', operasionalController.inputAbsensiSiswa);
router.post('/sesi/:id/materi', upload.single('file'), operasionalController.uploadMateri);
router.post('/sesi/:id/nilai', operasionalController.inputPenilaian);

module.exports = router;

