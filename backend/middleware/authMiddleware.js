const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'bisolpin_super_secret_jwt_key_2026_erp_lms_token';

/**
 * Middleware untuk memvalidasi JWT Token pada header Authorization
 * Format: Bearer <token>
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Akses ditolak. Token autentikasi tidak ditemukan.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Menyimpan payload token ke req.user
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Sesi token telah kedaluwarsa. Silakan login kembali.'
      });
    }
    return res.status(401).json({
      status: 'error',
      message: 'Token tidak valid.'
    });
  }
};

/**
 * Middleware untuk membatasi akses endpoint berdasarkan Role pengguna
 * Contoh pemakaian: checkRole('admin', 'staff')
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        status: 'error',
        message: 'Akses terlarang. Data otorisasi pengguna tidak lengkap.'
      });
    }

    // Role admin selalu memiliki privilege penuh kecuali dibatasi khusus
    if (allowedRoles.includes(req.user.role) || req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: `Akses ditolak. Endpoint ini hanya dapat diakses oleh role: [${allowedRoles.join(', ')}]. Role Anda: ${req.user.role}`
    });
  };
};

module.exports = {
  verifyToken,
  checkRole
};

