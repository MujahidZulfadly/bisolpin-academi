const db = require('../config/db');

/**
 * Controller: Daftar Seluruh Transaksi
 * GET /api/transaksi
 */
const getAllTransaksi = async (req, res) => {
  const { status, cabang_id, search } = req.query;

  try {
    let query = `
      SELECT t.*, 
             s.nama_siswa, s.asal_sekolah,
             ortu.nama_ortu, ortu.no_hp as no_hp_ortu,
             p.nama_paket, p.harga_paket, p.jumlah_pertemuan,
             l.nama_layanan,
             c.nama_cabang
      FROM transaksi t
      JOIN siswa s ON t.siswa_id = s.id_user
      JOIN users u ON s.id_user = u.id
      LEFT JOIN cabang c ON u.cabang_id = c.id
      LEFT JOIN orang_tua ortu ON s.orang_tua_id = ortu.id_user
      JOIN paket_kursus p ON t.paket_id = p.id
      JOIN layanan_kursus l ON p.layanan_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND t.status_pembayaran = ?';
      params.push(status);
    }

    if (cabang_id) {
      query += ' AND u.cabang_id = ?';
      params.push(cabang_id);
    }

    if (search) {
      query += ' AND (s.nama_siswa LIKE ? OR p.nama_paket LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY t.tanggal_bayar DESC';

    const [rows] = await db.query(query, params);
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Detail Transaksi
 * GET /api/transaksi/:id
 */
const getTransaksiById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT t.*, 
             s.nama_siswa, s.asal_sekolah,
             ortu.nama_ortu, ortu.no_hp as no_hp_ortu,
             p.nama_paket, p.harga_paket, p.jumlah_pertemuan,
             l.nama_layanan,
             c.nama_cabang, c.alamat as alamat_cabang, c.kontak as kontak_cabang
      FROM transaksi t
      JOIN siswa s ON t.siswa_id = s.id_user
      JOIN users u ON s.id_user = u.id
      LEFT JOIN cabang c ON u.cabang_id = c.id
      LEFT JOIN orang_tua ortu ON s.orang_tua_id = ortu.id_user
      JOIN paket_kursus p ON t.paket_id = p.id
      JOIN layanan_kursus l ON p.layanan_id = l.id
      WHERE t.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Transaksi tidak ditemukan.' });
    }

    return res.json({ status: 'success', data: rows[0] });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Input Transaksi Pembayaran / Pendaftaran Siswa Baru
 * POST /api/transaksi
 */
const createTransaksi = async (req, res) => {
  const { siswa_id, paket_id, nominal, status_pembayaran, tanggal_bayar } = req.body;

  if (!siswa_id || !paket_id || nominal === undefined) {
    return res.status(400).json({ status: 'error', message: 'Siswa, Paket, dan Nominal wajib diisi.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verifikasi siswa ada
    const [siswa] = await conn.query('SELECT nama_siswa FROM siswa WHERE id_user = ?', [siswa_id]);
    if (siswa.length === 0) {
      await conn.rollback();
      return res.status(404).json({ status: 'error', message: 'Data siswa tidak ditemukan.' });
    }

    // Verifikasi paket ada
    const [paket] = await conn.query('SELECT * FROM paket_kursus WHERE id = ?', [paket_id]);
    if (paket.length === 0) {
      await conn.rollback();
      return res.status(404).json({ status: 'error', message: 'Data paket kursus tidak ditemukan.' });
    }

    const tgl = tanggal_bayar ? new Date(tanggal_bayar) : new Date();
    const statusBayar = status_pembayaran || (parseFloat(nominal) >= parseFloat(paket[0].harga_paket) ? 'lunas' : 'cicilan');

    // 1. Simpan Transaksi
    const [result] = await conn.query(
      `INSERT INTO transaksi (siswa_id, paket_id, tanggal_bayar, nominal, status_pembayaran)
       VALUES (?, ?, ?, ?, ?)`,
      [siswa_id, paket_id, tgl, nominal, statusBayar]
    );

    const transaksiId = result.insertId;

    // 2. Daftarkan siswa secara otomatis ke sesi bimbingan yang aktif untuk paket ini (jika ada)
    const [sesiAktif] = await conn.query(
      'SELECT id FROM sesi_bimbingan WHERE paket_id = ? AND status = "terjadwal"',
      [paket_id]
    );

    for (const sesi of sesiAktif) {
      await conn.query(
        'INSERT INTO sesi_siswa (sesi_id, siswa_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE sesi_id = sesi_id',
        [sesi.id, siswa_id]
      );
    }

    await conn.commit();
    return res.status(201).json({
      status: 'success',
      message: 'Transaksi berhasil dicatat dan siswa telah terdaftar ke paket kursus.',
      data: {
        id: transaksiId,
        siswa: siswa[0].nama_siswa,
        paket: paket[0].nama_paket,
        nominal,
        status_pembayaran: statusBayar,
        sesi_terdaftar: sesiAktif.length
      }
    });

  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    conn.release();
  }
};

/**
 * Controller: Update Status Pembayaran
 * PUT /api/transaksi/:id/status
 */
const updateStatusTransaksi = async (req, res) => {
  const { id } = req.params;
  const { status_pembayaran, nominal } = req.body;

  try {
    let query = 'UPDATE transaksi SET ';
    const params = [];

    if (status_pembayaran) {
      query += 'status_pembayaran = ?, ';
      params.push(status_pembayaran);
    }

    if (nominal !== undefined) {
      query += 'nominal = ?, ';
      params.push(nominal);
    }

    query += 'updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    params.push(id);

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Transaksi tidak ditemukan.' });
    }

    return res.json({ status: 'success', message: 'Status transaksi berhasil diperbarui.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getAllTransaksi,
  getTransaksiById,
  createTransaksi,
  updateStatusTransaksi
};

