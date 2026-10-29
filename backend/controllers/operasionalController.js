const db = require('../config/db');
const path = require('path');

/**
 * Controller: Daftar Sesi Mengajar Mentor
 * GET /api/operasional/sesi-mengajar
 */
const getSesiMengajarMentor = async (req, res) => {
  const mentorId = req.user.id;
  const isAdminOrStaff = ['admin', 'staff'].includes(req.user.role);

  try {
    let query = `
      SELECT sb.*, 
             p.nama_paket, p.jumlah_pertemuan,
             l.nama_layanan,
             k.nama as nama_mentor,
             (SELECT COUNT(*) FROM sesi_siswa WHERE sesi_id = sb.id) as total_siswa,
             (SELECT COUNT(*) FROM materi WHERE sesi_id = sb.id) as total_materi
      FROM sesi_bimbingan sb
      JOIN paket_kursus p ON sb.paket_id = p.id
      JOIN layanan_kursus l ON p.layanan_id = l.id
      JOIN karyawan k ON sb.mentor_id = k.id_user
    `;
    const params = [];

    if (!isAdminOrStaff) {
      query += ' WHERE sb.mentor_id = ?';
      params.push(mentorId);
    }

    query += ' ORDER BY sb.waktu_mulai ASC';

    const [rows] = await db.query(query, params);
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Detail Sesi (Daftar Siswa, Status Absensi Siswa, Nilai, Materi)
 * GET /api/operasional/sesi/:id/detail
 */
const getDetailSesi = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Data Sesi
    const [sesi] = await db.query(
      `SELECT sb.*, p.nama_paket, l.nama_layanan, k.nama as nama_mentor 
       FROM sesi_bimbingan sb
       JOIN paket_kursus p ON sb.paket_id = p.id
       JOIN layanan_kursus l ON p.layanan_id = l.id
       JOIN karyawan k ON sb.mentor_id = k.id_user
       WHERE sb.id = ?`,
      [id]
    );

    if (sesi.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Sesi bimbingan tidak ditemukan.' });
    }

    // 2. Daftar Siswa terdaftar pada sesi ini beserta status kehadiran & nilainya
    const [siswaList] = await db.query(
      `SELECT ss.siswa_id, 
              s.nama_siswa, s.asal_sekolah,
              o.nama_ortu, o.no_hp as no_hp_ortu,
              ab.status as status_kehadiran,
              pn.nilai, pn.catatan as catatan_nilai
       FROM sesi_siswa ss
       JOIN siswa s ON ss.siswa_id = s.id_user
       LEFT JOIN orang_tua o ON s.orang_tua_id = o.id_user
       LEFT JOIN absensi_siswa ab ON ab.sesi_id = ss.sesi_id AND ab.siswa_id = ss.siswa_id
       LEFT JOIN penilaian pn ON pn.sesi_id = ss.sesi_id AND pn.siswa_id = ss.siswa_id
       WHERE ss.sesi_id = ?
       ORDER BY s.nama_siswa ASC`,
      [id]
    );

    // 3. Daftar Materi yang telah diunggah untuk sesi ini
    const [materiList] = await db.query(
      `SELECT m.*, k.nama as diunggah_oleh 
       FROM materi m 
       JOIN karyawan k ON m.mentor_id = k.id_user 
       WHERE m.sesi_id = ? 
       ORDER BY m.created_at DESC`,
      [id]
    );

    return res.json({
      status: 'success',
      data: {
        sesi: sesi[0],
        peserta: siswaList,
        materi: materiList
      }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Input / Simpan Absensi Siswa per Sesi
 * POST /api/operasional/sesi/:id/absen-siswa
 * Body: { presensi: [ { siswa_id: 5, status: 'Hadir' }, ... ] }
 */
const inputAbsensiSiswa = async (req, res) => {
  const { id } = req.params; // sesi_id
  const { presensi } = req.body;

  if (!Array.isArray(presensi) || presensi.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Data presensi siswa harus berupa array.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const item of presensi) {
      const siswaId = item.siswa_id;
      const statusAbsen = item.status || 'Hadir';

      await conn.query(
        `INSERT INTO absensi_siswa (sesi_id, siswa_id, status)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), created_at = CURRENT_TIMESTAMP`,
        [id, siswaId, statusAbsen]
      );
    }

    await conn.commit();
    return res.json({
      status: 'success',
      message: `Presensi ${presensi.length} siswa berhasil disimpan.`
    });

  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    conn.release();
  }
};

/**
 * Controller: Upload Materi Pembelajaran Sesi
 * POST /api/operasional/sesi/:id/materi
 */
const uploadMateri = async (req, res) => {
  const { id } = req.params; // sesi_id
  const { judul } = req.body;
  const mentorId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'File materi wajib diunggah.' });
  }

  if (!judul || judul.trim() === '') {
    return res.status(400).json({ status: 'error', message: 'Judul materi wajib diisi.' });
  }

  const relativePath = `/uploads/materi/${req.file.filename}`;

  try {
    const [result] = await db.query(
      'INSERT INTO materi (sesi_id, mentor_id, judul, file_path) VALUES (?, ?, ?, ?)',
      [id, mentorId, judul.trim(), relativePath]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Materi berhasil diunggah.',
      data: {
        id: result.insertId,
        sesi_id: parseInt(id, 10),
        mentor_id: mentorId,
        judul: judul.trim(),
        file_path: relativePath
      }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Input Penilaian Siswa per Sesi
 * POST /api/operasional/sesi/:id/nilai
 * Body: { penilaian: [ { siswa_id: 5, nilai: 85.5, catatan: 'Sangat baik' }, ... ] }
 */
const inputPenilaian = async (req, res) => {
  const { id } = req.params; // sesi_id
  const { penilaian } = req.body;

  if (!Array.isArray(penilaian) || penilaian.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Data penilaian siswa harus berupa array.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const item of penilaian) {
      const siswaId = item.siswa_id;
      const nilai = parseFloat(item.nilai) || 0;
      const catatan = item.catatan || '';

      await conn.query(
        `INSERT INTO penilaian (sesi_id, siswa_id, nilai, catatan)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nilai = VALUES(nilai), catatan = VALUES(catatan)`,
        [id, siswaId, nilai, catatan]
      );
    }

    await conn.commit();
    return res.json({
      status: 'success',
      message: `Penilaian ${penilaian.length} siswa berhasil disimpan.`
    });

  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ status: 'error', message: error.message });
  } finally {
    conn.release();
  }
};

module.exports = {
  getSesiMengajarMentor,
  getDetailSesi,
  inputAbsensiSiswa,
  uploadMateri,
  inputPenilaian
};

