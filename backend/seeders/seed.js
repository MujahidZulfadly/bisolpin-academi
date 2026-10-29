const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'bisolpin_academy';

async function runSeeder() {
  console.log('================================================================');
  console.log('🚀 MEMULAI SEEDER DATABASE: BISOLPIN ACADEMY');
  console.log('================================================================');
  console.log(`[Config] Host: ${DB_HOST}:${DB_PORT} | User: ${DB_USER} | DB: ${DB_NAME}`);

  let connection;
  try {
    // 1. Koneksi awal tanpa database spesifik untuk memastikan database ada
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      multipleStatements: true
    });

    console.log('[1/4] Membuat database jika belum ada...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${DB_NAME}\`;`);

    // 2. Baca file schema DDL dan eksekusi
    console.log('[2/4] Mengeksekusi DDL schema.sql...');
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Filter statement agar aman dijalankan
    await connection.query(schemaSql);
    console.log('[2/4] ✅ Tabel DDL berhasil dibuat/diperbarui.');

    // 3. Persiapan Data Dummy dengan Bcrypt Password
    console.log('[3/4] Melakukan enkripsi password untuk data seeder...');
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 4. Seeding Data untuk ke-14 Tabel
    console.log('[4/4] Memasukkan data awal (14 Entitas)...');

    // 1. Cabang
    await connection.query(`
      INSERT INTO \`cabang\` (\`id\`, \`nama_cabang\`, \`alamat\`, \`kontak\`) VALUES
      (1, 'Bisolpin Pusat Jakarta', 'Jl. Jenderal Sudirman No. 45, Senayan, Jakarta Pusat', '021-5551234 / 081122334455'),
      (2, 'Bisolpin Cabang Bandung', 'Jl. Ir. H. Juanda No. 12, Dago, Bandung', '022-7778899 / 081122334466')
      ON DUPLICATE KEY UPDATE \`nama_cabang\` = VALUES(\`nama_cabang\`);
    `);

    // 2. Users (Admin, Staff, Mentor, Orang Tua, Siswa)
    await connection.query(`
      INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`role\`, \`cabang_id\`) VALUES
      (1, 'admin', ?, 'admin', 1),
      (2, 'staff_budi', ?, 'staff', 1),
      (3, 'mentor_siti', ?, 'mentor', 1),
      (4, 'ortu_andi', ?, 'orang_tua', 1),
      (5, 'siswa_andi', ?, 'siswa', 1)
      ON DUPLICATE KEY UPDATE \`password\` = VALUES(\`password\`), \`role\` = VALUES(\`role\`);
    `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword]);

    // 3. Karyawan (Staff & Guru)
    await connection.query(`
      INSERT INTO \`karyawan\` (\`id_user\`, \`nip\`, \`nama\`, \`tipe_karyawan\`, \`no_hp\`, \`spesialisasi\`) VALUES
      (2, 'KRY-2026-001', 'Budi Prasetyo, S.Kom', 'staff', '08123456701', 'Administrasi & Keuangan Akademik'),
      (3, 'GUR-2026-001', 'Siti Rahmawati, M.Pd', 'guru', '08123456702', 'Master Penalaran Matematika & TPS Kuantitatif')
      ON DUPLICATE KEY UPDATE \`nama\` = VALUES(\`nama\`), \`spesialisasi\` = VALUES(\`spesialisasi\`);
    `);

    // 4. Orang Tua
    await connection.query(`
      INSERT INTO \`orang_tua\` (\`id_user\`, \`nama_ortu\`, \`no_hp\`, \`pekerjaan\`, \`alamat\`) VALUES
      (4, 'Bambang Santoso, S.E.', '081298765432', 'Wiraswasta / Direktur PT Berdikari', 'Jl. Melati Indah No. 8, Kebayoran Baru, Jakarta Selatan')
      ON DUPLICATE KEY UPDATE \`nama_ortu\` = VALUES(\`nama_ortu\`), \`alamat\` = VALUES(\`alamat\`);
    `);

    // 5. Siswa
    await connection.query(`
      INSERT INTO \`siswa\` (\`id_user\`, \`orang_tua_id\`, \`nama_siswa\`, \`asal_sekolah\`, \`tanggal_lahir\`) VALUES
      (5, 4, 'Andi Santoso', 'SMA Negeri 1 Jakarta', '2008-07-15')
      ON DUPLICATE KEY UPDATE \`nama_siswa\` = VALUES(\`nama_siswa\`), \`asal_sekolah\` = VALUES(\`asal_sekolah\`);
    `);

    // 6. Layanan Kursus
    await connection.query(`
      INSERT INTO \`layanan_kursus\` (\`id\`, \`nama_layanan\`, \`deskripsi\`, \`harga_dasar\`) VALUES
      (1, 'Bimbingan Intensif UTBK-SNBT 2026', 'Program terpadu persiapan UTBK dengan modul penalaran kuantitatif, literasi bahasa, dan drill soal harian.', 1500000.00),
      (2, 'Olimpiade Sains Nasional (OSN) Matematika', 'Pelatihan intensif tingkat lanjut untuk persiapan OSN-K, OSN-P hingga tingkat Nasional.', 2000000.00),
      (3, 'Reguler SMA Kelas 12 Kurikulum Merdeka', 'Pendampingan belajar tuntas materi semester 1 & 2 beserta tryout pemantapan nilai rapor berkala.', 1200000.00)
      ON DUPLICATE KEY UPDATE \`nama_layanan\` = VALUES(\`nama_layanan\`);
    `);

    // 7. Paket Kursus
    await connection.query(`
      INSERT INTO \`paket_kursus\` (\`id\`, \`layanan_id\`, \`nama_paket\`, \`jumlah_pertemuan\`, \`harga_paket\`, \`deskripsi\`) VALUES
      (1, 1, 'Paket Super Camp SNBT (12 Sesi)', 12, 2500000.00, '12 sesi interaktif tatap muka/online + 5x Tryout Nasional CBT + Modul Eksklusif'),
      (2, 2, 'Paket Juara OSN Matematika (8 Sesi)', 8, 1800000.00, '8 sesi bimbingan grup kecil privat bersama mentor peraih medali olimpiade sains'),
      (3, 3, 'Paket Semester Genap Kelas 12 (16 Sesi)', 16, 2200000.00, '16 sesi komprehensif pendampingan ujian sekolah dan ujian praktik')
      ON DUPLICATE KEY UPDATE \`nama_paket\` = VALUES(\`nama_paket\`);
    `);

    // 8. Transaksi
    await connection.query(`
      INSERT INTO \`transaksi\` (\`id\`, \`siswa_id\`, \`paket_id\`, \`tanggal_bayar\`, \`nominal\`, \`status_pembayaran\`) VALUES
      (1, 5, 1, NOW(), 2500000.00, 'lunas')
      ON DUPLICATE KEY UPDATE \`nominal\` = VALUES(\`nominal\`);
    `);

    // 9. Sesi Bimbingan
    await connection.query(`
      INSERT INTO \`sesi_bimbingan\` (\`id\`, \`paket_id\`, \`mentor_id\`, \`waktu_mulai\`, \`waktu_selesai\`, \`status\`, \`ruangan_link\`) VALUES
      (1, 1, 3, '2026-11-01 09:00:00', '2026-11-01 11:00:00', 'terjadwal', 'Ruang Galileo 201 / Zoom: https://meet.bisolpin.ac/galileo-201'),
      (2, 1, 3, '2026-11-03 13:30:00', '2026-11-03 15:30:00', 'terjadwal', 'Ruang Newton 102')
      ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);
    `);

    // 10. Sesi Siswa (Pivot Kelas)
    await connection.query(`
      INSERT INTO \`sesi_siswa\` (\`sesi_id\`, \`siswa_id\`) VALUES
      (1, 5),
      (2, 5)
      ON DUPLICATE KEY UPDATE \`siswa_id\` = VALUES(\`siswa_id\`);
    `);

    // 11. Absensi Karyawan
    await connection.query(`
      INSERT INTO \`absensi_karyawan\` (\`id\`, \`user_id\`, \`tanggal\`, \`jam_masuk\`, \`jam_pulang\`, \`status\`) VALUES
      (1, 2, '2026-10-28', '07:55:00', '16:05:00', 'hadir'),
      (2, 3, '2026-10-28', '08:30:00', '15:45:00', 'hadir')
      ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);
    `);

    // 12. Absensi Siswa
    await connection.query(`
      INSERT INTO \`absensi_siswa\` (\`id\`, \`sesi_id\`, \`siswa_id\`, \`status\`) VALUES
      (1, 1, 5, 'Hadir')
      ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);
    `);

    // 13. Materi
    await connection.query(`
      INSERT INTO \`materi\` (\`id\`, \`sesi_id\`, \`mentor_id\`, \`judul\`, \`file_path\`) VALUES
      (1, 1, 3, 'Modul 01: Fondasi Penalaran Matematika & Trik Cepat TPS', '/uploads/materi/modul_01_tps_matematika.pdf')
      ON DUPLICATE KEY UPDATE \`judul\` = VALUES(\`judul\`);
    `);

    // 14. Penilaian
    await connection.query(`
      INSERT INTO \`penilaian\` (\`id\`, \`sesi_id\`, \`siswa_id\`, \`nilai\`, \`catatan\`) VALUES
      (1, 1, 5, 88.50, 'Pemahaman konsep dasar aljabar & matriks sangat baik, tingkatkan ketelitian pada soal jebakan waktu.')
      ON DUPLICATE KEY UPDATE \`nilai\` = VALUES(\`nilai\`);
    `);

    console.log('----------------------------------------------------------------');
    console.log('✅ SEEDING BERHASIL! Seluruh 14 tabel telah terisi data dummy.');
    console.log('----------------------------------------------------------------');
    console.log('📋 AKUN DUMMY UNTUK TESTING (Semua password: password123):');
    console.log('  1. Admin     : username = "admin"');
    console.log('  2. Staff     : username = "staff_budi"');
    console.log('  3. Mentor    : username = "mentor_siti"');
    console.log('  4. Orang Tua : username = "ortu_andi"');
    console.log('  5. Siswa     : username = "siswa_andi"');
    console.log('================================================================');

  } catch (err) {
    console.error('❌ Gagal menjalankan seeder:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSeeder();

