const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'bisolpin_super_secret_jwt_key_2026_erp_lms_token';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Controller: Login Pengguna
 * POST /api/auth/login
 * Body: { username, password }
 */
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Username dan password wajib diisi.'
    });
  }

  try {
    // 1. Ambil data akun dari tabel users + info cabang
    const [users] = await db.query(
      `SELECT u.id, u.username, u.password, u.role, u.cabang_id, c.nama_cabang 
       FROM users u 
       LEFT JOIN cabang c ON u.cabang_id = c.id 
       WHERE u.username = ? LIMIT 1`,
      [username.trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Kombinasi username atau password salah.'
      });
    }

    const user = users[0];

    // 2. Verifikasi hash password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Kombinasi username atau password salah.'
      });
    }

    // 3. Ambil detail data profil spesifik berdasarkan Role
    let profileData = {};
    let namaLengkap = user.username;

    if (user.role === 'admin' || user.role === 'staff' || user.role === 'mentor') {
      const [karyawan] = await db.query(
        'SELECT nip, nama, tipe_karyawan, no_hp, spesialisasi FROM karyawan WHERE id_user = ?',
        [user.id]
      );
      if (karyawan.length > 0) {
        profileData = karyawan[0];
        namaLengkap = karyawan[0].nama;
      }
    } else if (user.role === 'siswa') {
      const [siswa] = await db.query(
        `SELECT s.nama_siswa, s.asal_sekolah, s.tanggal_lahir, s.orang_tua_id, ortu.nama_ortu 
         FROM siswa s 
         LEFT JOIN orang_tua ortu ON s.orang_tua_id = ortu.id_user 
         WHERE s.id_user = ?`,
        [user.id]
      );
      if (siswa.length > 0) {
        profileData = siswa[0];
        namaLengkap = siswa[0].nama_siswa;
      }
    } else if (user.role === 'orang_tua') {
      const [ortu] = await db.query(
        'SELECT nama_ortu, no_hp, pekerjaan, alamat FROM orang_tua WHERE id_user = ?',
        [user.id]
      );
      if (ortu.length > 0) {
        profileData = ortu[0];
        namaLengkap = ortu[0].nama_ortu;
      }
    }

    // 4. Siapkan payload JWT
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      cabang_id: user.cabang_id,
      nama: namaLengkap
    };

    // 5. Generate JWT Token
    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    return res.status(200).json({
      status: 'success',
      message: 'Login berhasil.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          nama: namaLengkap,
          cabang_id: user.cabang_id,
          nama_cabang: user.nama_cabang || 'Kantor Pusat',
          profile: profileData
        }
      }
    });

  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat proses login.',
      error: error.message
    });
  }
};

/**
 * Controller: Cek Profil Pengguna yang Sedang Login
 * GET /api/auth/me
 * Header: Authorization Bearer <token>
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      `SELECT u.id, u.username, u.role, u.cabang_id, u.created_at, c.nama_cabang, c.alamat as alamat_cabang 
       FROM users u 
       LEFT JOIN cabang c ON u.cabang_id = c.id 
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Pengguna tidak ditemukan.'
      });
    }

    const user = users[0];
    let profileData = null;

    if (user.role === 'admin' || user.role === 'staff' || user.role === 'mentor') {
      const [karyawan] = await db.query('SELECT * FROM karyawan WHERE id_user = ?', [userId]);
      if (karyawan.length > 0) profileData = karyawan[0];
    } else if (user.role === 'siswa') {
      const [siswa] = await db.query(
        `SELECT s.*, ortu.nama_ortu, ortu.no_hp as no_hp_ortu 
         FROM siswa s 
         LEFT JOIN orang_tua ortu ON s.orang_tua_id = ortu.id_user 
         WHERE s.id_user = ?`,
        [userId]
      );
      if (siswa.length > 0) profileData = siswa[0];
    } else if (user.role === 'orang_tua') {
      const [ortu] = await db.query('SELECT * FROM orang_tua WHERE id_user = ?', [userId]);
      if (ortu.length > 0) {
        // Cari juga daftar anak/siswa dari orang tua ini
        const [anak] = await db.query('SELECT id_user, nama_siswa, asal_sekolah FROM siswa WHERE orang_tua_id = ?', [userId]);
        profileData = { ...ortu[0], anak };
      }
    }

    return res.status(200).json({
      status: 'success',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        cabang: {
          id: user.cabang_id,
          nama: user.nama_cabang || 'Kantor Pusat',
          alamat: user.alamat_cabang
        },
        profile: profileData
      }
    });

  } catch (error) {
    console.error('[GetMe Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil profil pengguna.',
      error: error.message
    });
  }
};

module.exports = {
  login,
  getMe
};

