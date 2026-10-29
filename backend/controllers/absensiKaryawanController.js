const db = require('../config/db');

/**
 * Helper: Format Tanggal YYYY-MM-DD
 */
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Controller: Clock-In Harian Karyawan (Staff & Guru)
 * POST /api/absensi/clock-in
 */
const clockIn = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.body; // hadir, izin, sakit
  const today = getTodayDateString();

  try {
    // Cek apakah sudah absen hari ini
    const [existing] = await db.query(
      'SELECT * FROM absensi_karyawan WHERE user_id = ? AND tanggal = ?',
      [userId, today]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Anda sudah melakukan clock-in untuk hari ini.',
        data: existing[0]
      });
    }

    const absenStatus = status || 'hadir';

    const [result] = await db.query(
      `INSERT INTO absensi_karyawan (user_id, tanggal, jam_masuk, status) 
       VALUES (?, ?, CURRENT_TIME(), ?)`,
      [userId, today, absenStatus]
    );

    const [inserted] = await db.query('SELECT * FROM absensi_karyawan WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      status: 'success',
      message: `Clock-in berhasil (${absenStatus.toUpperCase()}).`,
      data: inserted[0]
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Clock-Out Harian Karyawan (Staff & Guru)
 * POST /api/absensi/clock-out
 */
const clockOut = async (req, res) => {
  const userId = req.user.id;
  const today = getTodayDateString();

  try {
    const [existing] = await db.query(
      'SELECT * FROM absensi_karyawan WHERE user_id = ? AND tanggal = ?',
      [userId, today]
    );

    if (existing.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Anda belum melakukan clock-in hari ini.'
      });
    }

    if (existing[0].jam_pulang) {
      return res.status(400).json({
        status: 'error',
        message: 'Anda sudah melakukan clock-out sebelumnya.',
        data: existing[0]
      });
    }

    await db.query(
      'UPDATE absensi_karyawan SET jam_pulang = CURRENT_TIME() WHERE id = ?',
      [existing[0].id]
    );

    const [updated] = await db.query('SELECT * FROM absensi_karyawan WHERE id = ?', [existing[0].id]);

    return res.json({
      status: 'success',
      message: 'Clock-out berhasil dicatat.',
      data: updated[0]
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Status Kehadiran Hari Ini (Untuk Dashboard Karyawan)
 * GET /api/absensi/status-hari-ini
 */
const getStatusHariIni = async (req, res) => {
  const userId = req.user.id;
  const today = getTodayDateString();

  try {
    const [rows] = await db.query(
      'SELECT * FROM absensi_karyawan WHERE user_id = ? AND tanggal = ?',
      [userId, today]
    );

    if (rows.length === 0) {
      return res.json({
        status: 'success',
        clockedIn: false,
        clockedOut: false,
        data: null
      });
    }

    return res.json({
      status: 'success',
      clockedIn: true,
      clockedOut: !!rows[0].jam_pulang,
      data: rows[0]
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Laporan Rekap Absensi Karyawan (Admin & Staff)
 * GET /api/absensi/laporan
 */
const getLaporanAbsensi = async (req, res) => {
  const { tanggal, start_date, end_date, cabang_id, tipe_karyawan } = req.query;

  try {
    let query = `
      SELECT ak.*, 
             k.nip, k.nama, k.tipe_karyawan, k.spesialisasi,
             u.username,
             c.nama_cabang
      FROM absensi_karyawan ak
      JOIN users u ON ak.user_id = u.id
      JOIN karyawan k ON u.id = k.id_user
      LEFT JOIN cabang c ON u.cabang_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (tanggal) {
      query += ' AND ak.tanggal = ?';
      params.push(tanggal);
    } else if (start_date && end_date) {
      query += ' AND ak.tanggal BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (cabang_id) {
      query += ' AND u.cabang_id = ?';
      params.push(cabang_id);
    }

    if (tipe_karyawan) {
      query += ' AND k.tipe_karyawan = ?';
      params.push(tipe_karyawan);
    }

    query += ' ORDER BY ak.tanggal DESC, ak.jam_masuk DESC';

    const [rows] = await db.query(query, params);
    return res.json({ status: 'success', data: rows });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  clockIn,
  clockOut,
  getStatusHariIni,
  getLaporanAbsensi
};

