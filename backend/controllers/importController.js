const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * Helper untuk membaca file Excel (.xlsx, .xls) atau CSV dari buffer multer
 */
const parseSpreadsheet = (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return xlsx.utils.sheet_to_json(worksheet, { defval: '' });
};

// =====================================================================
// 1. IMPORT DATA SISWA
// Format Kolom: username, password, nama_siswa, asal_sekolah, tanggal_lahir (YYYY-MM-DD), orang_tua_username, cabang_id
// =====================================================================
const importSiswa = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'File CSV atau Excel wajib diunggah.' });
  }

  try {
    const rows = parseSpreadsheet(req.file.buffer);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'File kosong atau format tidak sesuai.' });
    }

    const defaultPassword = 'password123';
    let suksesCount = 0;
    let gagalCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const username = String(row.username || '').trim();
      const nama_siswa = String(row.nama_siswa || '').trim();

      if (!username || !nama_siswa) {
        gagalCount++;
        errors.push(`Baris ${i + 2}: Username dan Nama Siswa wajib diisi.`);
        continue;
      }

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // Cek duplikasi username
        const [existing] = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
          gagalCount++;
          errors.push(`Baris ${i + 2}: Username "${username}" sudah digunakan.`);
          await conn.rollback();
          conn.release();
          continue;
        }

        // Cari ID orang tua jika disediakan username ortu
        let orangTuaId = null;
        if (row.orang_tua_username) {
          const [ortu] = await conn.query(
            'SELECT id FROM users WHERE username = ? AND role = "orang_tua"',
            [String(row.orang_tua_username).trim()]
          );
          if (ortu.length > 0) orangTuaId = ortu[0].id;
        } else if (row.orang_tua_id) {
          orangTuaId = parseInt(row.orang_tua_id, 10) || null;
        }

        const rawPassword = row.password ? String(row.password).trim() : defaultPassword;
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const cabangId = row.cabang_id ? parseInt(row.cabang_id, 10) : (req.user.cabang_id || 1);

        const [userResult] = await conn.query(
          'INSERT INTO users (username, password, role, cabang_id) VALUES (?, ?, "siswa", ?)',
          [username, hashedPassword, cabangId]
        );

        const userId = userResult.insertId;

        // Tanggal Lahir formatting
        let tglLahir = null;
        if (row.tanggal_lahir) {
          if (row.tanggal_lahir instanceof Date) {
            tglLahir = row.tanggal_lahir.toISOString().split('T')[0];
          } else {
            tglLahir = String(row.tanggal_lahir).trim();
          }
        }

        await conn.query(
          'INSERT INTO siswa (id_user, orang_tua_id, nama_siswa, asal_sekolah, tanggal_lahir) VALUES (?, ?, ?, ?, ?)',
          [userId, orangTuaId, nama_siswa, String(row.asal_sekolah || '').trim(), tglLahir]
        );

        await conn.commit();
        suksesCount++;
      } catch (err) {
        await conn.rollback();
        gagalCount++;
        errors.push(`Baris ${i + 2}: ${err.message}`);
      } finally {
        conn.release();
      }
    }

    return res.json({
      status: 'success',
      message: `Bulk import Siswa selesai: ${suksesCount} berhasil, ${gagalCount} gagal.`,
      summary: { total: rows.length, berhasil: suksesCount, gagal: gagalCount, errors }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Gagal memproses file: ' + error.message });
  }
};

// =====================================================================
// 2. IMPORT DATA KARYAWAN (Staff / Mentor)
// Format: username, password, nip, nama, tipe_karyawan, role, no_hp, spesialisasi, cabang_id
// =====================================================================
const importKaryawan = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'File CSV atau Excel wajib diunggah.' });
  }

  try {
    const rows = parseSpreadsheet(req.file.buffer);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'File kosong atau format tidak sesuai.' });
    }

    const defaultPassword = 'password123';
    let suksesCount = 0;
    let gagalCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const username = String(row.username || '').trim();
      const nip = String(row.nip || '').trim();
      const nama = String(row.nama || '').trim();
      const no_hp = String(row.no_hp || '').trim();
      let tipe_karyawan = String(row.tipe_karyawan || 'guru').trim().toLowerCase();
      let role = String(row.role || (tipe_karyawan === 'guru' ? 'mentor' : 'staff')).trim().toLowerCase();

      if (!username || !nip || !nama) {
        gagalCount++;
        errors.push(`Baris ${i + 2}: Username, NIP, dan Nama Karyawan wajib diisi.`);
        continue;
      }

      if (!['staff', 'guru'].includes(tipe_karyawan)) tipe_karyawan = 'guru';
      if (!['staff', 'mentor'].includes(role)) role = (tipe_karyawan === 'guru' ? 'mentor' : 'staff');

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const [existing] = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
          gagalCount++;
          errors.push(`Baris ${i + 2}: Username "${username}" sudah digunakan.`);
          await conn.rollback();
          conn.release();
          continue;
        }

        const [existingNip] = await conn.query('SELECT id_user FROM karyawan WHERE nip = ?', [nip]);
        if (existingNip.length > 0) {
          gagalCount++;
          errors.push(`Baris ${i + 2}: NIP "${nip}" sudah digunakan.`);
          await conn.rollback();
          conn.release();
          continue;
        }

        const rawPassword = row.password ? String(row.password).trim() : defaultPassword;
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const cabangId = row.cabang_id ? parseInt(row.cabang_id, 10) : (req.user.cabang_id || 1);

        const [userResult] = await conn.query(
          'INSERT INTO users (username, password, role, cabang_id) VALUES (?, ?, ?, ?)',
          [username, hashedPassword, role, cabangId]
        );

        const userId = userResult.insertId;

        await conn.query(
          'INSERT INTO karyawan (id_user, nip, nama, tipe_karyawan, no_hp, spesialisasi) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, nip, nama, tipe_karyawan, no_hp, String(row.spesialisasi || '').trim()]
        );

        await conn.commit();
        suksesCount++;
      } catch (err) {
        await conn.rollback();
        gagalCount++;
        errors.push(`Baris ${i + 2}: ${err.message}`);
      } finally {
        conn.release();
      }
    }

    return res.json({
      status: 'success',
      message: `Bulk import Karyawan selesai: ${suksesCount} berhasil, ${gagalCount} gagal.`,
      summary: { total: rows.length, berhasil: suksesCount, gagal: gagalCount, errors }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Gagal memproses file: ' + error.message });
  }
};

// =====================================================================
// 3. IMPORT DATA ORANG TUA
// Format: username, password, nama_ortu, no_hp, pekerjaan, alamat, cabang_id
// =====================================================================
const importOrangTua = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'File CSV atau Excel wajib diunggah.' });
  }

  try {
    const rows = parseSpreadsheet(req.file.buffer);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'File kosong atau format tidak sesuai.' });
    }

    const defaultPassword = 'password123';
    let suksesCount = 0;
    let gagalCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const username = String(row.username || '').trim();
      const nama_ortu = String(row.nama_ortu || '').trim();
      const no_hp = String(row.no_hp || '').trim();

      if (!username || !nama_ortu) {
        gagalCount++;
        errors.push(`Baris ${i + 2}: Username dan Nama Orang Tua wajib diisi.`);
        continue;
      }

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const [existing] = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
          gagalCount++;
          errors.push(`Baris ${i + 2}: Username "${username}" sudah digunakan.`);
          await conn.rollback();
          conn.release();
          continue;
        }

        const rawPassword = row.password ? String(row.password).trim() : defaultPassword;
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const cabangId = row.cabang_id ? parseInt(row.cabang_id, 10) : (req.user.cabang_id || 1);

        const [userResult] = await conn.query(
          'INSERT INTO users (username, password, role, cabang_id) VALUES (?, ?, "orang_tua", ?)',
          [username, hashedPassword, cabangId]
        );

        const userId = userResult.insertId;

        await conn.query(
          'INSERT INTO orang_tua (id_user, nama_ortu, no_hp, pekerjaan, alamat) VALUES (?, ?, ?, ?, ?)',
          [userId, nama_ortu, no_hp, String(row.pekerjaan || '').trim(), String(row.alamat || '').trim()]
        );

        await conn.commit();
        suksesCount++;
      } catch (err) {
        await conn.rollback();
        gagalCount++;
        errors.push(`Baris ${i + 2}: ${err.message}`);
      } finally {
        conn.release();
      }
    }

    return res.json({
      status: 'success',
      message: `Bulk import Orang Tua selesai: ${suksesCount} berhasil, ${gagalCount} gagal.`,
      summary: { total: rows.length, berhasil: suksesCount, gagal: gagalCount, errors }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Gagal memproses file: ' + error.message });
  }
};

// =====================================================================
// 4. IMPORT DATA LAYANAN KURSUS
// Format: nama_layanan, deskripsi, harga_dasar
// =====================================================================
const importLayanan = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'File CSV atau Excel wajib diunggah.' });
  }

  try {
    const rows = parseSpreadsheet(req.file.buffer);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'File kosong atau format tidak sesuai.' });
    }

    let suksesCount = 0;
    let gagalCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nama_layanan = String(row.nama_layanan || '').trim();
      const deskripsi = String(row.deskripsi || '').trim();
      const harga_dasar = parseFloat(row.harga_dasar) || 0;

      if (!nama_layanan) {
        gagalCount++;
        errors.push(`Baris ${i + 2}: Nama Layanan wajib diisi.`);
        continue;
      }

      try {
        await db.query(
          'INSERT INTO layanan_kursus (nama_layanan, deskripsi, harga_dasar) VALUES (?, ?, ?)',
          [nama_layanan, deskripsi, harga_dasar]
        );
        suksesCount++;
      } catch (err) {
        gagalCount++;
        errors.push(`Baris ${i + 2}: ${err.message}`);
      }
    }

    return res.json({
      status: 'success',
      message: `Bulk import Layanan selesai: ${suksesCount} berhasil, ${gagalCount} gagal.`,
      summary: { total: rows.length, berhasil: suksesCount, gagal: gagalCount, errors }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Gagal memproses file: ' + error.message });
  }
};

module.exports = {
  importSiswa,
  importKaryawan,
  importOrangTua,
  importLayanan
};

