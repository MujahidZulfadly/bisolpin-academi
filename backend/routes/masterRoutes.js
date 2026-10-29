const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Semua master data dibatasi untuk Admin dan Staff
router.use(verifyToken, checkRole('admin', 'staff'));

// 1. Cabang
router.get('/cabang', masterController.getCabang);
router.post('/cabang', masterController.createCabang);
router.put('/cabang/:id', masterController.updateCabang);
router.delete('/cabang/:id', masterController.deleteCabang);

// 2. Layanan Kursus
router.get('/layanan', masterController.getLayanan);
router.post('/layanan', masterController.createLayanan);
router.put('/layanan/:id', masterController.updateLayanan);
router.delete('/layanan/:id', masterController.deleteLayanan);

// 3. Paket Kursus
router.get('/paket', masterController.getPaket);
router.post('/paket', masterController.createPaket);
router.put('/paket/:id', masterController.updatePaket);
router.delete('/paket/:id', masterController.deletePaket);

// 4. Karyawan (Staff / Guru)
router.get('/karyawan', masterController.getKaryawan);
router.post('/karyawan', masterController.createKaryawan);
router.put('/karyawan/:id', masterController.updateKaryawan);
router.delete('/karyawan/:id', masterController.deleteKaryawan);

// 5. Orang Tua
router.get('/orang-tua', masterController.getOrangTua);
router.post('/orang-tua', masterController.createOrangTua);
router.put('/orang-tua/:id', masterController.updateOrangTua);
router.delete('/orang-tua/:id', masterController.deleteOrangTua);

// 6. Siswa
router.get('/siswa', masterController.getSiswa);
router.post('/siswa', masterController.createSiswa);
router.put('/siswa/:id', masterController.updateSiswa);
router.delete('/siswa/:id', masterController.deleteSiswa);

// 7. Sesi Bimbingan
router.get('/sesi', masterController.getSesi);
router.post('/sesi', masterController.createSesi);
router.put('/sesi/:id', masterController.updateSesi);
router.delete('/sesi/:id', masterController.deleteSesi);
router.post('/sesi/:id/tambah-siswa', masterController.addSiswaToSesi);

module.exports = router;

