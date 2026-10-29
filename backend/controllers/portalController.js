const db = require('../config/db');

/**
 * Helper: Mendapatkan ID Siswa yang berhak diakses oleh user saat ini
 */
const resolveSiswaId = async (req) => {
  const { role, id } = req.user;

  if (role === 'siswa') {
    return { siswaId: id, error: null };
  }

  if (role === 'orang_tua') {
    // Cari daftar anak dari orang tua ini
    const [anak] = await db.query(
      'SELECT id_user, nama_siswa FROM siswa WHERE orang_tua_id = ?',
      [id]
    );

    if (anak.length === 0) {
      return { siswaId: null, error: 'Belum ada data siswa yang tertaut dengan akun Orang Tua Anda.' };
    }

    // Jika ada query param siswa_id, pastikan milik orang tua ini
    if (req.query.siswa_id) {
      const targetId = parseInt(req.query.siswa_id, 10);
      const isOwner = anak.some(a => a.id_user === targetId);
      if (!isOwner) {
        return { siswaId: null, error: 'Akses ditolak: Siswa ini bukan anak binaan Anda.' };
      }
      return { siswaId: targetId, error: null, daftarAnak: anak };
    }

    // Default ke anak pertama
    return { siswaId: anak[0].id_user, error: null, daftarAnak: anak };
  }

  if (['admin', 'staff', 'mentor'].includes(role)) {
    if (req.query.siswa_id) {
      return { siswaId: parseInt(req.query.siswa_id, 10), error: null };
    }
  }

  return { siswaId: null, error: 'Siswa ID wajib disediakan untuk role ini.' };
};

/**
 * Controller: Jadwal Kursus / Sesi Belajar Siswa
 * GET /api/portal/jadwal
 */
const getJadwal = async (req, res) => {
  const { siswaId, error, daftarAnak } = await resolveSiswaId(req);
  if (error) {
    return res.status(403).json({ status: 'error', message: error });
  }

  try {
    const [rows] = await db.query(
      `SELECT sb.*, 
              p.nama_paket, 
              l.nama_layanan, 
              k.nama as nama_mentor, k.no_hp as no_hp_mentor,
              ab.status as status_absen,
              pn.nilai as nilai_sesi
       FROM sesi_siswa ss
       JOIN sesi_bimbingan sb ON ss.sesi_id = sb.id
       JOIN paket_kursus p ON sb.paket_id = p.id
       JOIN layanan_kursus l ON p.layanan_id = l.id
       JOIN karyawan k ON sb.mentor_id = k.id_user
       LEFT JOIN absensi_siswa ab ON ab.sesi_id = sb.id AND ab.siswa_id = ss.siswa_id
       LEFT JOIN penilaian pn ON pn.sesi_id = sb.id AND pn.siswa_id = ss.siswa_id
       WHERE ss.siswa_id = ?
       ORDER BY sb.waktu_mulai ASC`,
      [siswaId]
    );

    return res.json({
      status: 'success',
      data: {
        siswa_id: siswaId,
        daftar_anak: daftarAnak || null,
        jadwal: rows
      }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Riwayat Transaksi & Tagihan Kursus
 * GET /api/portal/transaksi
 */
const getTagihanTransaksi = async (req, res) => {
  const { siswaId, error, daftarAnak } = await resolveSiswaId(req);
  if (error) {
    return res.status(403).json({ status: 'error', message: error });
  }

  try {
    const [rows] = await db.query(
      `SELECT t.*, 
              p.nama_paket, p.harga_paket, p.jumlah_pertemuan,
              l.nama_layanan
       FROM transaksi t
       JOIN paket_kursus p ON t.paket_id = p.id
       JOIN layanan_kursus l ON p.layanan_id = l.id
       WHERE t.siswa_id = ?
       ORDER BY t.tanggal_bayar DESC`,
      [siswaId]
    );

    return res.json({
      status: 'success',
      data: {
        siswa_id: siswaId,
        daftar_anak: daftarAnak || null,
        transaksi: rows
      }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Riwayat Nilai & Rekap Presensi Siswa
 * GET /api/portal/riwayat
 */
const getRiwayatNilaiDanAbsensi = async (req, res) => {
  const { siswaId, error, daftarAnak } = await resolveSiswaId(req);
  if (error) {
    return res.status(403).json({ status: 'error', message: error });
  }

  try {
    // 1. Data Presensi per sesi
    const [absensi] = await db.query(
      `SELECT ab.*, 
              sb.waktu_mulai, sb.ruangan_link,
              p.nama_paket, l.nama_layanan,
              k.nama as nama_mentor
       FROM absensi_siswa ab
       JOIN sesi_bimbingan sb ON ab.sesi_id = sb.id
       JOIN paket_kursus p ON sb.paket_id = p.id
       JOIN layanan_kursus l ON p.layanan_id = l.id
       JOIN karyawan k ON sb.mentor_id = k.id_user
       WHERE ab.siswa_id = ?
       ORDER BY sb.waktu_mulai DESC`,
      [siswaId]
    );

    // 2. Data Penilaian & Evaluasi
    const [penilaian] = await db.query(
      `SELECT pn.*, 
              sb.waktu_mulai,
              p.nama_paket, l.nama_layanan,
              k.nama as nama_mentor
       FROM penilaian pn
       JOIN sesi_bimbingan sb ON pn.sesi_id = sb.id
       JOIN paket_kursus p ON sb.paket_id = p.id
       JOIN layanan_kursus l ON p.layanan_id = l.id
       JOIN karyawan k ON sb.mentor_id = k.id_user
       WHERE pn.siswa_id = ?
       ORDER BY sb.waktu_mulai DESC`,
      [siswaId]
    );

    // 3. Ringkasan Statistik
    const totalSesiHadir = absensi.filter(a => a.status === 'Hadir').length;
    const totalSesiAbsen = absensi.length;
    const persentaseKehadiran = totalSesiAbsen > 0 ? Math.round((totalSesiHadir / totalSesiAbsen) * 100) : 0;

    const totalNilai = penilaian.reduce((acc, curr) => acc + parseFloat(curr.nilai || 0), 0);
    const rataRataNilai = penilaian.length > 0 ? (totalNilai / penilaian.length).toFixed(2) : 0;

    return res.json({
      status: 'success',
      data: {
        siswa_id: siswaId,
        daftar_anak: daftarAnak || null,
        statistik: {
          total_pertemuan_tercatat: totalSesiAbsen,
          hadir: totalSesiHadir,
          persentase_kehadiran: `${persentaseKehadiran}%`,
          rata_rata_nilai: parseFloat(rataRataNilai),
          total_evaluasi: penilaian.length
        },
        riwayat_absensi: absensi,
        riwayat_penilaian: penilaian
      }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Controller: Download / Akses Materi Bimbingan Siswa
 * GET /api/portal/materi
 */
const getMateriBelajar = async (req, res) => {
  const { siswaId, error } = await resolveSiswaId(req);
  if (error) {
    return res.status(403).json({ status: 'error', message: error });
  }

  try {
    const [materi] = await db.query(
      `SELECT m.*, 
              sb.waktu_mulai, sb.ruangan_link,
              p.nama_paket,
              k.nama as nama_mentor
       FROM materi m
       JOIN sesi_bimbingan sb ON m.sesi_id = sb.id
       JOIN sesi_siswa ss ON ss.sesi_id = sb.id
       JOIN paket_kursus p ON sb.paket_id = p.id
       JOIN karyawan k ON m.mentor_id = k.id_user
       WHERE ss.siswa_id = ?
       ORDER BY m.created_at DESC`,
      [siswaId]
    );

    return res.json({
      status: 'success',
      data: materi
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getJadwal,
  getTagihanTransaksi,
  getRiwayatNilaiDanAbsensi,
  getMateriBelajar
};

