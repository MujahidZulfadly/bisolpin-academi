const db = require('../config/db');
const bcrypt = require('bcryptjs');

// =====================================================================
// 1. MASTER CABANG
// =====================================================================
const getCabang = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cabang ORDER BY id ASC');
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const createCabang = async (req, res) => {
  const { nama_cabang, alamat, kontak } = req.body;
  if (!nama_cabang || !alamat || !kontak) {
    return res.status(400).json({ status: 'error', message: 'Semua kolom cabang wajib diisi.' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO cabang (nama_cabang, alamat, kontak) VALUES (?, ?, ?)',
      [nama_cabang, alamat, kontak]
    );
    return res.status(201).json({
      status: 'success',
      message: 'Cabang berhasil ditambahkan.',
      data: { id: result.insertId, nama_cabang, alamat, kontak }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateCabang = async (req, res) => {
  const { id } = req.params;
  const { nama_cabang, alamat, kontak } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE cabang SET nama_cabang = ?, alamat = ?, kontak = ? WHERE id = ?',
      [nama_cabang, alamat, kontak, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Cabang tidak ditemukan.' });
    }
    return res.json({ status: 'success', message: 'Cabang berhasil diperbarui.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const deleteCabang = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM cabang WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Cabang tidak ditemukan.' });
    }
    return res.json({ status: 'success', message: 'Cabang berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// =====================================================================
// 2. MASTER LAYANAN KURSUS
// =====================================================================
const getLayanan = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM layanan_kursus ORDER BY id ASC');
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const createLayanan = async (req, res) => {
  const { nama_layanan, deskripsi, harga_dasar } = req.body;
  if (!nama_layanan || harga_dasar === undefined) {
    return res.status(400).json({ status: 'error', message: 'Nama layanan dan harga dasar wajib diisi.' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO layanan_kursus (nama_layanan, deskripsi, harga_dasar) VALUES (?, ?, ?)',
      [nama_layanan, deskripsi || '', harga_dasar]
    );
    return res.status(201).json({
      status: 'success',
      message: 'Layanan kursus berhasil ditambahkan.',
      data: { id: result.insertId, nama_layanan, deskripsi, harga_dasar }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateLayanan = async (req, res) => {
  const { id } = req.params;
  const { nama_layanan, deskripsi, harga_dasar } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE layanan_kursus SET nama_layanan = ?, deskripsi = ?, harga_dasar = ? WHERE id = ?',
      [nama_layanan, deskripsi || '', harga_dasar, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Layanan kursus tidak ditemukan.' });
    }
    return res.json({ status: 'success', message: 'Layanan kursus berhasil diperbarui.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const deleteLayanan = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM layanan_kursus WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Layanan kursus tidak ditemukan.' });
    }
    return res.json({ status: 'success', message: 'Layanan kursus berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// =====================================================================
// 3. MASTER PAKET KURSUS
// =====================================================================
const getPaket = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, l.nama_layanan, l.harga_dasar 
       FROM paket_kursus p 
       JOIN layanan_kursus l ON p.layanan_id = l.id 
       ORDER BY p.id ASC`
    );
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const createPaket = async (req, res) => {
  const { layanan_id, nama_paket, jumlah_pertemuan, harga_paket, deskripsi } = req.body;
  if (!layanan_id || !nama_paket || !jumlah_pertemuan || harga_paket === undefined) {
    return res.status(400).json({ status: 'error', message: 'Data paket kursus tidak lengkap.' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO paket_kursus (layanan_id, nama_paket, jumlah_pertemuan, harga_paket, deskripsi) VALUES (?, ?, ?, ?, ?)',
      [layanan_id, nama_paket, jumlah_pertemuan, harga_paket, deskripsi || '']
    );
    return res.status(201).json({
      status: 'success',
      message: 'Paket kursus berhasil ditambahkan.',
      data: { id: result.insertId, layanan_id, nama_paket, jumlah_pertemuan, harga_paket, deskripsi }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const updatePaket = async (req, res) => {
  const { id } = req.params;
  const { layanan_id, nama_paket, jumlah_pertemuan, harga_paket, deskripsi } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE paket_kursus SET layanan_id = ?, nama_paket = ?, jumlah_pertemuan = ?, harga_paket = ?, deskripsi = ? WHERE id = ?',
      [layanan_id, nama_paket, jumlah_pertemuan, harga_paket, deskripsi || '', id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Paket kursus tidak ditemukan.' });
    }
    return res.json({ status: 'success', message: 'Paket kursus berhasil diperbarui.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const deletePaket = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM paket_kursus WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Paket kursus tidak ditemukan.' });
    }
    return res.json({ status: 'success', message: 'Paket kursus berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// =====================================================================
// 4. MASTER KARYAWAN (Staff / Mentor)
// =====================================================================
const getKaryawan = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT k.*, u.username, u.role, u.cabang_id, c.nama_cabang 
       FROM karyawan k 
       JOIN users u ON k.id_user = u.id 
       LEFT JOIN cabang c ON u.cabang_id = c.id 
       ORDER BY k.id_user ASC`
    );
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const createKaryawan = async (req, res) => {
  const { username, password, role, cabang_id, nip, nama, tipe_karyawan, no_hp, spesialisasi } = req.body;

  if (!username || !password || !role || !nip || !nama || !tipe_karyawan || !no_hp) {
    return res.status(400).json({ status: 'error', message: 'Data karyawan belum lengkap.' });
  }

  if (!['staff', 'mentor'].includes(role)) {
    return res.status(400).json({ status: 'error', message: 'Role harus berupa "staff" atau "mentor".' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Cek apakah username atau NIP sudah terdaftar
    const [existing] = await conn.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ status: 'error', message: 'Username sudah digunakan.' });
    }

    const [existingNip] = await conn.query('SELECT id_user FROM karyawan WHERE nip = ?', [nip.trim()]);
    if (existingNip.length > 0) {
      await conn.rollback();
      return res.status(400).json({ status: 'error', message: 'NIP sudah digunakan.' });
    }

    // 1. Insert ke tabel users
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      'INSERT INTO users (username, password, role, cabang_id) VALUES (?, ?, ?, ?)',
      [username.trim(), hashedPassword, role, cabang_id || null]
    );

    const userId = userResult.insertId;

    // 2. Insert ke tabel karyawan
    await conn.query(
      'INSERT INTO karyawan (id_user, nip, nama, tipe_karyawan, no_hp, spesialisasi) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, nip.trim(), nama.trim(), tipe_karyawan, no_hp.trim(), spesialisasi || '']
    );

    await conn.commit();
    return res.status(201).json({
      status: 'success',
      message: 'Karyawan berhasil didaftarkan.',
      data: { id_user: userId, username, role, nip, nama, tipe_karyawan, no_hp, spesialisasi }
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    conn.release();
  }
};

const updateKaryawan = async (req, res) => {
  const { id } = req.params; // id_user
  const { nama, tipe_karyawan, no_hp, spesialisasi, cabang_id, password } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    if (cabang_id !== undefined) {
      await conn.query('UPDATE users SET cabang_id = ? WHERE id = ?', [cabang_id, id]);
    }

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await conn.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    }

    const [result] = await conn.query(
      'UPDATE karyawan SET nama = ?, tipe_karyawan = ?, no_hp = ?, spesialisasi = ? WHERE id_user = ?',
      [nama, tipe_karyawan, no_hp, spesialisasi || '', id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ status: 'error', message: 'Data karyawan tidak ditemukan.' });
    }

    await conn.commit();
    return res.json({ status: 'success', message: 'Data karyawan berhasil diperbarui.' });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    conn.release();
  }
};

const deleteKaryawan = async (req, res) => {
  const { id } = req.params; // id_user
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Karyawan tidak ditemukan.' });
    }
    return res.json({ status: 'success', message: 'Karyawan beserta akunnya berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// =====================================================================
// 5. MASTER ORANG TUA
// =====================================================================
const getOrangTua = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*, u.username, u.cabang_id, c.nama_cabang,
        (SELECT COUNT(*) FROM siswa WHERE orang_tua_id = o.id_user) as total_anak
       FROM orang_tua o 
       JOIN users u ON o.id_user = u.id 
       LEFT JOIN cabang c ON u.cabang_id = c.id 
       ORDER BY o.id_user ASC`
    );
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const createOrangTua = async (req, res) => {
  const { username, password, cabang_id, nama_ortu, no_hp, pekerjaan, alamat } = req.body;

  if (!username || !password || !nama_ortu || !no_hp) {
    return res.status(400).json({ status: 'error', message: 'Data orang tua tidak lengkap.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ status: 'error', message: 'Username sudah digunakan.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      'INSERT INTO users (username, password, role, cabang_id) VALUES (?, ?, "orang_tua", ?)',
      [username.trim(), hashedPassword, cabang_id || null]
    );

    const userId = userResult.insertId;

    await conn.query(
      'INSERT INTO orang_tua (id_user, nama_ortu, no_hp, pekerjaan, alamat) VALUES (?, ?, ?, ?, ?)',
      [userId, nama_ortu.trim(), no_hp.trim(), pekerjaan || '', alamat || '']
    );

    await conn.commit();
    return res.status(201).json({
      status: 'success',
      message: 'Data orang tua berhasil ditambahkan.',
      data: { id_user: userId, username, nama_ortu, no_hp, pekerjaan, alamat }
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    conn.release();
  }
};

const updateOrangTua = async (req, res) => {
  const { id } = req.params;
  const { nama_ortu, no_hp, pekerjaan, alamat, cabang_id, password } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    if (cabang_id !== undefined) {
      await conn.query('UPDATE users SET cabang_id = ? WHERE id = ?', [cabang_id, id]);
    }

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await conn.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    }

    const [result] = await conn.query(
      'UPDATE orang_tua SET nama_ortu = ?, no_hp = ?, pekerjaan = ?, alamat = ? WHERE id_user = ?',
      [nama_ortu, no_hp, pekerjaan || '', alamat || '', id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ status: 'error', message: 'Data orang tua tidak ditemukan.' });
    }

    await conn.commit();
    return res.json({ status: 'success', message: 'Data orang tua berhasil diperbarui.' });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    conn.release();
  }
};

const deleteOrangTua = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Data orang tua tidak ditemukan.' });
    }
    return res.json({ status: 'success', message: 'Data orang tua berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// =====================================================================
// 6. MASTER SISWA
// =====================================================================
const getSiswa = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.username, u.cabang_id, c.nama_cabang, o.nama_ortu, o.no_hp as no_hp_ortu 
       FROM siswa s 
       JOIN users u ON s.id_user = u.id 
       LEFT JOIN cabang c ON u.cabang_id = c.id 
       LEFT JOIN orang_tua o ON s.orang_tua_id = o.id_user 
       ORDER BY s.id_user ASC`
    );
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const createSiswa = async (req, res) => {
  const { username, password, cabang_id, orang_tua_id, nama_siswa, asal_sekolah, tanggal_lahir } = req.body;

  if (!username || !password || !nama_siswa) {
    return res.status(400).json({ status: 'error', message: 'Data siswa belum lengkap.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ status: 'error', message: 'Username sudah digunakan.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      'INSERT INTO users (username, password, role, cabang_id) VALUES (?, ?, "siswa", ?)',
      [username.trim(), hashedPassword, cabang_id || null]
    );

    const userId = userResult.insertId;

    await conn.query(
      'INSERT INTO siswa (id_user, orang_tua_id, nama_siswa, asal_sekolah, tanggal_lahir) VALUES (?, ?, ?, ?, ?)',
      [userId, orang_tua_id || null, nama_siswa.trim(), asal_sekolah || '', tanggal_lahir || null]
    );

    await conn.commit();
    return res.status(201).json({
      status: 'success',
      message: 'Siswa berhasil didaftarkan.',
      data: { id_user: userId, username, nama_siswa, orang_tua_id, asal_sekolah, tanggal_lahir }
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    conn.release();
  }
};

const updateSiswa = async (req, res) => {
  const { id } = req.params;
  const { nama_siswa, orang_tua_id, asal_sekolah, tanggal_lahir, cabang_id, password } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    if (cabang_id !== undefined) {
      await conn.query('UPDATE users SET cabang_id = ? WHERE id = ?', [cabang_id, id]);
    }

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await conn.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    }

    const [result] = await conn.query(
      'UPDATE siswa SET nama_siswa = ?, orang_tua_id = ?, asal_sekolah = ?, tanggal_lahir = ? WHERE id_user = ?',
      [nama_siswa, orang_tua_id || null, asal_sekolah || '', tanggal_lahir || null, id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ status: 'error', message: 'Data siswa tidak ditemukan.' });
    }

    await conn.commit();
    return res.json({ status: 'success', message: 'Data siswa berhasil diperbarui.' });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    conn.release();
  }
};

const deleteSiswa = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Siswa tidak ditemukan.' });
    }
    return res.json({ status: 'success', message: 'Data siswa berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// =====================================================================
// 7. MANAJEMEN SESI BIMBINGAN (Jadwal Kelas Master)
// =====================================================================
const getSesi = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT sb.*, p.nama_paket, l.nama_layanan, k.nama as nama_mentor,
        (SELECT COUNT(*) FROM sesi_siswa WHERE sesi_id = sb.id) as total_siswa
       FROM sesi_bimbingan sb 
       JOIN paket_kursus p ON sb.paket_id = p.id 
       JOIN layanan_kursus l ON p.layanan_id = l.id 
       JOIN karyawan k ON sb.mentor_id = k.id_user 
       ORDER BY sb.waktu_mulai DESC`
    );
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const createSesi = async (req, res) => {
  const { paket_id, mentor_id, waktu_mulai, waktu_selesai, status, ruangan_link, siswa_ids } = req.body;

  if (!paket_id || !mentor_id || !waktu_mulai || !waktu_selesai) {
    return res.status(400).json({ status: 'error', message: 'Data sesi belum lengkap.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO sesi_bimbingan (paket_id, mentor_id, waktu_mulai, waktu_selesai, status, ruangan_link) VALUES (?, ?, ?, ?, ?, ?)',
      [paket_id, mentor_id, waktu_mulai, waktu_selesai, status || 'terjadwal', ruangan_link || '']
    );

    const sesiId = result.insertId;

    // Jika ada daftar siswa yang langsung didaftarkan ke sesi
    if (Array.isArray(siswa_ids) && siswa_ids.length > 0) {
      for (const siswaId of siswa_ids) {
        await conn.query(
          'INSERT INTO sesi_siswa (sesi_id, siswa_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE sesi_id = sesi_id',
          [sesiId, siswaId]
        );
      }
    }

    await conn.commit();
    return res.status(201).json({
      status: 'success',
      message: 'Sesi bimbingan berhasil dibuat.',
      data: { id: sesiId, paket_id, mentor_id, waktu_mulai, waktu_selesai, status }
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    conn.release();
  }
};

const updateSesi = async (req, res) => {
  const { id } = req.params;
  const { paket_id, mentor_id, waktu_mulai, waktu_selesai, status, ruangan_link } = req.body;
  try {
    const [result] = await db.query(
      `UPDATE sesi_bimbingan 
       SET paket_id = ?, mentor_id = ?, waktu_mulai = ?, waktu_selesai = ?, status = ?, ruangan_link = ? 
       WHERE id = ?`,
      [paket_id, mentor_id, waktu_mulai, waktu_selesai, status, ruangan_link, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Sesi tidak ditemukan.' });
    }
    return res.json({ status: 'success', message: 'Sesi bimbingan berhasil diperbarui.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const deleteSesi = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM sesi_bimbingan WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Sesi tidak ditemukan.' });
    }
    return res.json({ status: 'success', message: 'Sesi bimbingan berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const addSiswaToSesi = async (req, res) => {
  const { id } = req.params; // sesi_id
  const { siswa_id } = req.body;

  if (!siswa_id) {
    return res.status(400).json({ status: 'error', message: 'ID Siswa wajib disediakan.' });
  }

  try {
    await db.query(
      'INSERT INTO sesi_siswa (sesi_id, siswa_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE sesi_id = sesi_id',
      [id, siswa_id]
    );
    return res.json({ status: 'success', message: 'Siswa berhasil dimasukkan ke sesi bimbingan.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  // Cabang
  getCabang,
  createCabang,
  updateCabang,
  deleteCabang,
  // Layanan
  getLayanan,
  createLayanan,
  updateLayanan,
  deleteLayanan,
  // Paket
  getPaket,
  createPaket,
  updatePaket,
  deletePaket,
  // Karyawan
  getKaryawan,
  createKaryawan,
  updateKaryawan,
  deleteKaryawan,
  // Orang Tua
  getOrangTua,
  createOrangTua,
  updateOrangTua,
  deleteOrangTua,
  // Siswa
  getSiswa,
  createSiswa,
  updateSiswa,
  deleteSiswa,
  // Sesi
  getSesi,
  createSesi,
  updateSesi,
  deleteSesi,
  addSiswaToSesi
};

