# BISOLPIN ACADEMY - SISTEM INFORMASI MANAJEMEN BIMBINGAN BELAJAR (ERP / LMS)

Sistem Informasi Manajemen Bimbingan Belajar berskala Enterprise (ERP & LMS) dengan tech stack **Node.js, Express.js, MySQL (Relational Database)**, serta frontend modern **HTML5, CSS3, Vanilla JavaScript, dan Lucide Icons**.

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat
- Node.js (v18+)
- MySQL Server (XAMPP / MariaDB / Standalone MySQL) berjalan pada port `3306`.

### 2. Konfigurasi Database
Pastikan variabel di file [backend/.env](file:///d:/bisolpin-academy/backend/.env) sudah sesuai:
```ini
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=bisolpin_academy
JWT_SECRET=bisolpin_super_secret_jwt_key_2026_erp_lms_token
```

### 3. Setup & Seeder Otomatis
```bash
# Masuk ke direktori backend
cd backend

# Pasang dependensi
npm install

# Jalankan seeder database (otomatis membuat schema DDL 14 tabel & data dummy)
npm run seed

# Jalankan server aplikasi
npm start
```

Aplikasi web dapat langsung diakses melalui browser di:
👉 **`http://localhost:5000`**

---

## 🔑 Akun Demo Pengujian (Semua Password: `password123`)

Pada halaman login tersedia tombol **1-Click Login Demo** untuk setiap role:

| Role | Username | Nama Akun | Fitur Menu Utama |
|---|---|---|---|
| **Admin** | `admin` | Administrator Utama | Kelola Seluruh Cabang, Karyawan, Siswa, Layanan, Paket, Transaksi, Laporan Absensi, & Bulk Import |
| **Staff** | `staff_budi` | Budi Prasetyo, S.Kom | Kelola Master Data, Pendaftaran Siswa & Transaksi, Import Data, Presensi Harian |
| **Mentor (Guru)** | `mentor_siti` | Siti Rahmawati, M.Pd | Jadwal Mengajar, Input Presensi Siswa, Upload Modul Materi, Input Nilai & Evaluasi, Clock-in/out |
| **Siswa** | `siswa_andi` | Andi Santoso | Jadwal Belajar, Unduh Modul Materi, Rapor Nilai & Presensi, Riwayat Pembayaran |
| **Orang Tua** | `ortu_andi` | Bambang Santoso, S.E. | Pantau Kehadiran Anak, Pantau Nilai & Catatan Guru, Jadwal Belajar Anak, Riwayat Tagihan |

---

## 📁 Struktur Arsitektur Proyek

```
bisolpin-academy/
├── backend/
│   ├── config/
│   │   └── db.js                 # Pool koneksi MySQL (mysql2/promise)
│   ├── controllers/
│   │   ├── authController.js     # Login & profil (JWT)
│   │   ├── masterController.js   # CRUD Cabang, Layanan, Paket, Karyawan, Siswa, Ortu, Sesi
│   │   ├── importController.js   # Fitur Bulk Import data CSV/Excel via Multer + XLSX
│   │   ├── transaksiController.js# Registrasi paket kursus & input pembayaran
│   │   ├── absensiKaryawanController.js # Clock-in / clock-out harian staf & guru
│   │   ├── operasionalController.js     # Jadwal mentor, absen siswa, upload materi, nilai
│   │   └── portalController.js   # Portal khusus siswa & orang tua
│   ├── middleware/
│   │   └── authMiddleware.js     # Validasi JWT Bearer token & Role-Based Access Control (RBAC)
│   ├── routes/                   # Routing modular REST API
│   ├── database/
│   │   └── schema.sql            # DDL 14 entitas relasional lengkap
│   ├── seeders/
│   │   └── seed.js               # Database seeder dengan enkripsi password Bcrypt
│   ├── uploads/
│   │   ├── materi/               # Penyimpanan modul bimbingan
│   │   └── imports/              # Penyimpanan sementara upload berkas
│   ├── server.js                 # Entry point Express.js backend & static frontend server
│   ├── test-auth.js              # Unit test otomatis Autentikasi & RBAC
│   └── test-phase3.js            # Unit test otomatis seluruh API & Bulk Import
├── frontend/
│   ├── css/
│   │   └── style.css             # Design system modern (Plus Jakarta Sans, responsif)
│   ├── js/
│   │   └── app.js                # Core Single Page Application (SPA) client
│   └── index.html                # Kerangka UI & mount point Lucide icons
└── README.md
```

---

## 📊 Entitas Relasional Database (14 Tabel)

1. `cabang`: Data cabang operasional bimbingan belajar.
2. `users`: Kredensial akun dengan Role (`admin`, `staff`, `mentor`, `siswa`, `orang_tua`).
3. `karyawan`: Detail staf operasional dan guru/mentor pengampu mata pelajaran.
4. `orang_tua`: Profil orang tua/wali siswa.
5. `siswa`: Profil siswa beserta relasi ke orang tua.
6. `layanan_kursus`: Bidang bimbingan (UTBK-SNBT, Olimpiade Sains, Reguler).
7. `paket_kursus`: Paket belajar (jumlah sesi pertemuan dan tarif kursus).
8. `transaksi`: Pendaftaran & pembayaran paket kursus (lunas / cicilan).
9. `sesi_bimbingan`: Jadwal sesi kelas dan ruang belajar / link online meeting.
10. `sesi_siswa`: Tabel pivot pendaftaran siswa di tiap sesi bimbingan.
11. `absensi_karyawan`: Presensi harian staf dan guru (jam masuk & jam pulang).
12. `absensi_siswa`: Presensi siswa per sesi bimbingan belajar (`Hadir`, `Izin`, `Sakit`, `Alpa`).
13. `materi`: Modul & dokumen pembelajaran per sesi bimbingan.
14. `penilaian`: Nilai hasil belajar dan catatan evaluasi perkembangan siswa.
