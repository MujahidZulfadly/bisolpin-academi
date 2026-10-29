const express = require('express');
const router = express.Router();
const absensiController = require('../controllers/absensiKaryawanController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Endpoint Kehadiran Pribadi Karyawan (Staff, Guru/Mentor, Admin)
router.post('/clock-in', verifyToken, checkRole('admin', 'staff', 'mentor'), absensiController.clockIn);
router.post('/clock-out', verifyToken, checkRole('admin', 'staff', 'mentor'), absensiController.clockOut);
router.get('/status-hari-ini', verifyToken, checkRole('admin', 'staff', 'mentor'), absensiController.getStatusHariIni);

// Laporan Rekap Kehadiran (Admin & Staff)
router.get('/laporan', verifyToken, checkRole('admin', 'staff'), absensiController.getLaporanAbsensi);

module.exports = router;

