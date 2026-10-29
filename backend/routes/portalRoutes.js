const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portalController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Akses portal untuk Siswa, Orang Tua, dan Manajemen (Admin/Staff)
router.use(verifyToken, checkRole('siswa', 'orang_tua', 'admin', 'staff'));

router.get('/jadwal', portalController.getJadwal);
router.get('/transaksi', portalController.getTagihanTransaksi);
router.get('/riwayat', portalController.getRiwayatNilaiDanAbsensi);
router.get('/materi', portalController.getMateriBelajar);

module.exports = router;

