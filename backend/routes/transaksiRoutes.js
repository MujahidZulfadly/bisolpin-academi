const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksiController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Akses data transaksi dibatasi untuk Admin dan Staff
router.use(verifyToken, checkRole('admin', 'staff'));

router.get('/', transaksiController.getAllTransaksi);
router.get('/:id', transaksiController.getTransaksiById);
router.post('/', transaksiController.createTransaksi);
router.put('/:id/status', transaksiController.updateStatusTransaksi);

module.exports = router;

