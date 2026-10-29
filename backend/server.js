const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const masterRoutes = require('./routes/masterRoutes');
const importRoutes = require('./routes/importRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const absensiRoutes = require('./routes/absensiKaryawanRoutes');
const operasionalRoutes = require('./routes/operasionalRoutes');
const portalRoutes = require('./routes/portalRoutes');
const portalController = require('./controllers/portalController');
const { verifyToken } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Root Endpoint Health Check
app.get('/api/health', async (req, res) => {
  try {
    const [result] = await db.query('SELECT 1 + 1 AS health_check');
    return res.json({
      status: 'success',
      message: 'API Bisolpin Academy ERP/LMS Berjalan Normal',
      dbStatus: result[0].health_check === 2 ? 'Connected' : 'Error',
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Koneksi database gagal',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/import', importRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/absensi', absensiRoutes);
app.use('/api/operasional', operasionalRoutes);
app.use('/api/portal', portalRoutes);

// Alias endpoint untuk jadwal sesi siswa
app.get('/api/sesi/siswa', verifyToken, portalController.getJadwal);

// Redirect /login.html ke root / (index.html form login)
app.get('/login.html', (req, res) => res.redirect('/'));

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(` BISOLPIN ACADEMY ERP & LMS SERVER`);
    console.log(` Server berjalan pada: http://localhost:${PORT}`);
    console.log(` Endpoint Cek Status: http://localhost:${PORT}/api/health`);
    console.log(`================================================================`);
  });
}

module.exports = app;

