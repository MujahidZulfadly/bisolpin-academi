const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/importController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Gunakan memory storage agar tidak bergantung pada disk I/O sementara
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Max 10MB
});

// Seluruh endpoint import dibatasi untuk Admin dan Staff
router.use(verifyToken, checkRole('admin', 'staff'));

router.post('/siswa', upload.single('file'), importController.importSiswa);
router.post('/karyawan', upload.single('file'), importController.importKaryawan);
router.post('/orang-tua', upload.single('file'), importController.importOrangTua);
router.post('/layanan', upload.single('file'), importController.importLayanan);

module.exports = router;

