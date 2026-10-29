const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Endpoint Login Publik
router.post('/login', authController.login);

// Endpoint Profil (Harus terautentikasi dengan token)
router.get('/me', verifyToken, authController.getMe);

// Endpoint Uji Coba Role-Based Access Control (RBAC)
router.get('/test/admin-staff', verifyToken, checkRole('admin', 'staff'), (req, res) => {
  res.json({
    status: 'success',
    message: 'Akses Diterima: Khusus Admin dan Staff Operasional.',
    user: req.user
  });
});

router.get('/test/mentor', verifyToken, checkRole('mentor'), (req, res) => {
  res.json({
    status: 'success',
    message: 'Akses Diterima: Khusus Mentor / Guru.',
    user: req.user
  });
});

router.get('/test/siswa', verifyToken, checkRole('siswa'), (req, res) => {
  res.json({
    status: 'success',
    message: 'Akses Diterima: Khusus Siswa.',
    user: req.user
  });
});

router.get('/test/orang-tua', verifyToken, checkRole('orang_tua'), (req, res) => {
  res.json({
    status: 'success',
    message: 'Akses Diterima: Khusus Orang Tua Siswa.',
    user: req.user
  });
});

module.exports = router;

