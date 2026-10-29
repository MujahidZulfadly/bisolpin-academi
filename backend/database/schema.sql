-- =====================================================================
-- DATABASE SCHEMA: SISTEM INFORMASI BIMBINGAN BELAJAR BISOLPIN ACADEMY
-- Relational Database Engine: MySQL (InnoDB)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `bisolpin_academy` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `bisolpin_academy`;

-- ---------------------------------------------------------------------
-- 1. TABEL: CABANG
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `penilaian`;
DROP TABLE IF EXISTS `materi`;
DROP TABLE IF EXISTS `absensi_siswa`;
DROP TABLE IF EXISTS `absensi_karyawan`;
DROP TABLE IF EXISTS `sesi_siswa`;
DROP TABLE IF EXISTS `sesi_bimbingan`;
DROP TABLE IF EXISTS `transaksi`;
DROP TABLE IF EXISTS `paket_kursus`;
DROP TABLE IF EXISTS `layanan_kursus`;
DROP TABLE IF EXISTS `siswa`;
DROP TABLE IF EXISTS `orang_tua`;
DROP TABLE IF EXISTS `karyawan`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `cabang`;

CREATE TABLE `cabang` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_cabang` VARCHAR(100) NOT NULL,
  `alamat` TEXT NOT NULL,
  `kontak` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. TABEL: USERS (Akun Utama dengan Role-Based Access Control)
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'staff', 'mentor', 'siswa', 'orang_tua') NOT NULL,
  `cabang_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_cabang` FOREIGN KEY (`cabang_id`) REFERENCES `cabang` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. TABEL: KARYAWAN (Detail Data Karyawan: Staff & Guru/Mentor)
-- ---------------------------------------------------------------------
CREATE TABLE `karyawan` (
  `id_user` INT PRIMARY KEY,
  `nip` VARCHAR(50) NOT NULL UNIQUE,
  `nama` VARCHAR(100) NOT NULL,
  `tipe_karyawan` ENUM('staff', 'guru') NOT NULL,
  `no_hp` VARCHAR(25) NOT NULL,
  `spesialisasi` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_karyawan_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. TABEL: ORANG_TUA (Detail Data Orang Tua Siswa)
-- ---------------------------------------------------------------------
CREATE TABLE `orang_tua` (
  `id_user` INT PRIMARY KEY,
  `nama_ortu` VARCHAR(100) NOT NULL,
  `no_hp` VARCHAR(25) NOT NULL,
  `pekerjaan` VARCHAR(100) NULL,
  `alamat` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_orang_tua_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. TABEL: SISWA (Detail Data Siswa & Relasi ke Orang Tua)
-- ---------------------------------------------------------------------
CREATE TABLE `siswa` (
  `id_user` INT PRIMARY KEY,
  `orang_tua_id` INT NULL,
  `nama_siswa` VARCHAR(100) NOT NULL,
  `asal_sekolah` VARCHAR(100) NULL,
  `tanggal_lahir` DATE NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_siswa_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_siswa_orang_tua` FOREIGN KEY (`orang_tua_id`) REFERENCES `orang_tua` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. TABEL: LAYANAN_KURSUS (Kategori/Bidang Kursus)
-- ---------------------------------------------------------------------
CREATE TABLE `layanan_kursus` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_layanan` VARCHAR(100) NOT NULL,
  `deskripsi` TEXT NULL,
  `harga_dasar` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. TABEL: PAKET_KURSUS (Paket Bimbingan Belajar Spesifik)
-- ---------------------------------------------------------------------
CREATE TABLE `paket_kursus` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `layanan_id` INT NOT NULL,
  `nama_paket` VARCHAR(100) NOT NULL,
  `jumlah_pertemuan` INT NOT NULL DEFAULT 1,
  `harga_paket` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `deskripsi` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_paket_layanan` FOREIGN KEY (`layanan_id`) REFERENCES `layanan_kursus` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. TABEL: TRANSAKSI (Registrasi & Pembayaran Siswa)
-- ---------------------------------------------------------------------
CREATE TABLE `transaksi` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `siswa_id` INT NOT NULL,
  `paket_id` INT NOT NULL,
  `tanggal_bayar` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `nominal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `status_pembayaran` ENUM('lunas', 'cicilan') NOT NULL DEFAULT 'lunas',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_transaksi_siswa` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_transaksi_paket` FOREIGN KEY (`paket_id`) REFERENCES `paket_kursus` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. TABEL: SESI_BIMBINGAN (Jadwal Pertemuan Kelas/Sesi Belajar)
-- ---------------------------------------------------------------------
CREATE TABLE `sesi_bimbingan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `paket_id` INT NOT NULL,
  `mentor_id` INT NOT NULL,
  `waktu_mulai` DATETIME NOT NULL,
  `waktu_selesai` DATETIME NOT NULL,
  `status` ENUM('terjadwal', 'berlangsung', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'terjadwal',
  `ruangan_link` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sesi_paket` FOREIGN KEY (`paket_id`) REFERENCES `paket_kursus` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sesi_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `karyawan` (`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. TABEL: SESI_SISWA (Pivot: Siswa yang Terdaftar di Sesi Bimbingan)
-- ---------------------------------------------------------------------
CREATE TABLE `sesi_siswa` (
  `sesi_id` INT NOT NULL,
  `siswa_id` INT NOT NULL,
  PRIMARY KEY (`sesi_id`, `siswa_id`),
  CONSTRAINT `fk_sesi_siswa_sesi` FOREIGN KEY (`sesi_id`) REFERENCES `sesi_bimbingan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sesi_siswa_siswa` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. TABEL: ABSENSI_KARYAWAN (Presensi Harian Staff & Guru)
-- ---------------------------------------------------------------------
CREATE TABLE `absensi_karyawan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `tanggal` DATE NOT NULL,
  `jam_masuk` TIME NULL,
  `jam_pulang` TIME NULL,
  `status` ENUM('hadir', 'izin', 'sakit', 'alpa') NOT NULL DEFAULT 'hadir',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_absen_harian_karyawan` (`user_id`, `tanggal`),
  CONSTRAINT `fk_absen_karyawan_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. TABEL: ABSENSI_SISWA (Presensi Siswa per Sesi Belajar)
-- ---------------------------------------------------------------------
CREATE TABLE `absensi_siswa` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sesi_id` INT NOT NULL,
  `siswa_id` INT NOT NULL,
  `status` ENUM('Hadir', 'Izin', 'Sakit', 'Alpa') NOT NULL DEFAULT 'Hadir',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_absen_sesi_siswa` (`sesi_id`, `siswa_id`),
  CONSTRAINT `fk_absen_siswa_sesi` FOREIGN KEY (`sesi_id`) REFERENCES `sesi_bimbingan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_absen_siswa_siswa` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. TABEL: MATERI (Materi & Modul Pembelajaran per Sesi)
-- ---------------------------------------------------------------------
CREATE TABLE `materi` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sesi_id` INT NOT NULL,
  `mentor_id` INT NOT NULL,
  `judul` VARCHAR(200) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_materi_sesi` FOREIGN KEY (`sesi_id`) REFERENCES `sesi_bimbingan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_materi_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `karyawan` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. TABEL: PENILAIAN (Nilai & Evaluasi Siswa per Sesi Bimbingan)
-- ---------------------------------------------------------------------
CREATE TABLE `penilaian` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sesi_id` INT NOT NULL,
  `siswa_id` INT NOT NULL,
  `nilai` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `catatan` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_nilai_sesi_siswa` (`sesi_id`, `siswa_id`),
  CONSTRAINT `fk_penilaian_sesi` FOREIGN KEY (`sesi_id`) REFERENCES `sesi_bimbingan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_penilaian_siswa` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

