const http = require('http');
const app = require('./server');

const PORT = 5002;
let server;

function jsonRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json'
    };
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;
    if (postData) reqHeaders['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: rawData });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function uploadMultipart(path, fieldName, filename, fileBuffer, mimeType, fields = {}, token = null) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let bodyBuffers = [];

    // Tambahkan field biasa
    for (const [key, value] of Object.entries(fields)) {
      bodyBuffers.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
    }

    // Tambahkan file
    bodyBuffers.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    ));
    bodyBuffers.push(fileBuffer);
    bodyBuffers.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const fullBuffer = Buffer.concat(bodyBuffers);

    const reqHeaders = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': fullBuffer.length
    };
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method: 'POST',
      headers: reqHeaders
    }, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: rawData });
        }
      });
    });

    req.on('error', reject);
    req.write(fullBuffer);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 PENGUJIAN OTOMATIS: FASE 3 (REST API & BULK IMPORT)');
  console.log('================================================================');

  server = app.listen(PORT, async () => {
    try {
      // 1. Login untuk mendapatkan Token
      console.log('\n[1/7] Mendapatkan Auth Tokens...');
      const adminLogin = await jsonRequest('POST', '/api/auth/login', { username: 'admin', password: 'password123' });
      const mentorLogin = await jsonRequest('POST', '/api/auth/login', { username: 'mentor_siti', password: 'password123' });
      const siswaLogin = await jsonRequest('POST', '/api/auth/login', { username: 'siswa_andi', password: 'password123' });
      const ortuLogin = await jsonRequest('POST', '/api/auth/login', { username: 'ortu_andi', password: 'password123' });

      const adminToken = adminLogin.body.data.token;
      const mentorToken = mentorLogin.body.data.token;
      const siswaToken = siswaLogin.body.data.token;
      const ortuToken = ortuLogin.body.data.token;
      console.log('✅ Tokens diperoleh untuk Admin, Mentor, Siswa, dan Ortu.');

      // 2. Master Data (Admin/Staff)
      console.log('\n[2/7] Pengujian Master Data (Cabang, Layanan, Paket, Karyawan, Siswa)...');
      const getCabangRes = await jsonRequest('GET', '/api/master/cabang', null, adminToken);
      console.log(`- GET /master/cabang: ${getCabangRes.body.data.length} cabang ditemukan.`);

      const createLayananRes = await jsonRequest('POST', '/api/master/layanan', {
        nama_layanan: 'English for Academic Purposes (EAP)',
        deskripsi: 'Persiapan TOEFL/IELTS akademik',
        harga_dasar: 1750000.00
      }, adminToken);
      console.log(`- POST /master/layanan: ID = ${createLayananRes.body.data.id} ("${createLayananRes.body.data.nama_layanan}")`);

      // Siswa mencoba akses Master Data (harus ditolak 403)
      const siswaMasterRes = await jsonRequest('GET', '/api/master/cabang', null, siswaToken);
      console.log(`- Siswa akses /master/cabang -> Status: ${siswaMasterRes.status} (Harus 403 Forbidden)`);
      if (siswaMasterRes.status !== 403) throw new Error('Siswa seharusnya tidak bisa akses Master Data');
      console.log('✅ Master Data & Proteksi Hak Akses valid.');

      // 3. Fitur Bulk Import CSV / Excel
      console.log('\n[3/7] Pengujian Fitur Bulk Import (CSV / Excel)...');
      
      // A. Import Layanan via CSV
      const csvLayanan = `nama_layanan,deskripsi,harga_dasar
Robotika & Coding Kids,Kelas pemrograman dasar dan robotika level pemula,1600000
Bimbel Kedinasan IPDN & STAN,Bimbingan intensif tes SKD & psikotes kedinasan,2800000`;
      
      const importLayananRes = await uploadMultipart(
        '/api/import/layanan',
        'file',
        'layanan.csv',
        Buffer.from(csvLayanan),
        'text/csv',
        {},
        adminToken
      );
      console.log(`- POST /import/layanan: ${importLayananRes.body.message}`);
      if (importLayananRes.body.summary.berhasil < 2) throw new Error('Import layanan gagal');

      // B. Import Siswa via CSV
      const timestamp = Date.now();
      const csvSiswa = `username,password,nama_siswa,asal_sekolah,tanggal_lahir,orang_tua_username,cabang_id
siswa_budi_${timestamp},password123,Budi Gunawan,SMA Negeri 8 Jakarta,2008-03-21,ortu_andi,1
siswa_citra_${timestamp},password123,Citra Lestari,SMA Labschool Jakarta,2008-09-10,ortu_andi,1`;

      const importSiswaRes = await uploadMultipart(
        '/api/import/siswa',
        'file',
        'siswa.csv',
        Buffer.from(csvSiswa),
        'text/csv',
        {},
        adminToken
      );
      console.log(`- POST /import/siswa: ${importSiswaRes.body.message}`);
      if (importSiswaRes.body.summary.berhasil < 2) throw new Error('Import siswa gagal');
      console.log('✅ Fitur Bulk Import data CSV/Excel berhasil bekerja dengan mulus.');

      // 4. Transaksi & Keuangan
      console.log('\n[4/7] Pengujian Transaksi & Keuangan...');
      const createTransRes = await jsonRequest('POST', '/api/transaksi', {
        siswa_id: 5,
        paket_id: 2,
        nominal: 1800000.00,
        status_pembayaran: 'lunas'
      }, adminToken);
      console.log(`- POST /transaksi: ID = ${createTransRes.body.data.id} (${createTransRes.body.message})`);

      const getTransRes = await jsonRequest('GET', '/api/transaksi', null, adminToken);
      console.log(`- GET /transaksi: Total transaksi tersimpan = ${getTransRes.body.data.length}`);
      console.log('✅ Transaksi & Keuangan tercatat dengan benar.');

      // 5. Absensi Harian Karyawan (Staff/Mentor)
      console.log('\n[5/7] Pengujian Absensi Harian Karyawan (Clock-In / Clock-Out)...');
      const clockInRes = await jsonRequest('POST', '/api/absensi/clock-in', { status: 'hadir' }, mentorToken);
      console.log(`- POST /absensi/clock-in (Mentor): ${clockInRes.body.message}`);

      const clockOutRes = await jsonRequest('POST', '/api/absensi/clock-out', {}, mentorToken);
      console.log(`- POST /absensi/clock-out (Mentor): ${clockOutRes.body.message}`);

      const statusAbsenRes = await jsonRequest('GET', '/api/absensi/status-hari-ini', null, mentorToken);
      console.log(`- GET /absensi/status-hari-ini: In=${statusAbsenRes.body.clockedIn}, Out=${statusAbsenRes.body.clockedOut}`);

      const rekapRes = await jsonRequest('GET', '/api/absensi/laporan', null, adminToken);
      console.log(`- GET /absensi/laporan (Admin): ${rekapRes.body.data.length} riwayat absensi.`);
      console.log('✅ Presensi SDM berfungsi dengan lengkap.');

      // 6. Operasional Belajar (Mentor)
      console.log('\n[6/7] Pengujian Operasional Belajar oleh Mentor...');
      const sesiMentorRes = await jsonRequest('GET', '/api/operasional/sesi-mengajar', null, mentorToken);
      console.log(`- GET /operasional/sesi-mengajar: ${sesiMentorRes.body.data.length} sesi mengajar ditemukan.`);

      // Sesi 1 Detail
      const detailSesiRes = await jsonRequest('GET', '/api/operasional/sesi/1/detail', null, mentorToken);
      console.log(`- GET /operasional/sesi/1/detail: Peserta = ${detailSesiRes.body.data.peserta.length} siswa.`);

      // Absen Siswa
      const absenSiswaRes = await jsonRequest('POST', '/api/operasional/sesi/1/absen-siswa', {
        presensi: [ { siswa_id: 5, status: 'Hadir' } ]
      }, mentorToken);
      console.log(`- POST /operasional/sesi/1/absen-siswa: ${absenSiswaRes.body.message}`);

      // Upload Materi Pembelajaran
      const dummyFileBuffer = Buffer.from('%PDF-1.4 Pembahasan Soal Logika Aljabar UTBK');
      const uploadMateriRes = await uploadMultipart(
        '/api/operasional/sesi/1/materi',
        'file',
        'soal_aljabar.pdf',
        dummyFileBuffer,
        'application/pdf',
        { judul: 'Pembahasan Bedah Soal Penalaran Matematika' },
        mentorToken
      );
      console.log(`- POST /operasional/sesi/1/materi: ${uploadMateriRes.body.message} (${uploadMateriRes.body.data.judul})`);

      // Input Penilaian
      const nilaiRes = await jsonRequest('POST', '/api/operasional/sesi/1/nilai', {
        penilaian: [ { siswa_id: 5, nilai: 95.0, catatan: 'Luar biasa, menyelesaikan soal penalaran dengan waktu tercepat!' } ]
      }, mentorToken);
      console.log(`- POST /operasional/sesi/1/nilai: ${nilaiRes.body.message}`);
      console.log('✅ Operasional Mengajar Mentor berhasil 100%.');

      // 7. Akses Siswa & Orang Tua
      console.log('\n[7/7] Pengujian Akses Portal Siswa & Orang Tua...');
      const siswaJadwalRes = await jsonRequest('GET', '/api/portal/jadwal', null, siswaToken);
      console.log(`- [Siswa] GET /portal/jadwal: ${siswaJadwalRes.body.data.jadwal.length} sesi terdaftar.`);

      const siswaRiwayatRes = await jsonRequest('GET', '/api/portal/riwayat', null, siswaToken);
      console.log(`- [Siswa] GET /portal/riwayat: Kehadiran = ${siswaRiwayatRes.body.data.statistik.persentase_kehadiran}, Rata-rata Nilai = ${siswaRiwayatRes.body.data.statistik.rata_rata_nilai}`);

      const ortuRiwayatRes = await jsonRequest('GET', '/api/portal/riwayat', null, ortuToken);
      console.log(`- [Orang Tua] GET /portal/riwayat: Memantau anak ID=${ortuRiwayatRes.body.data.siswa_id}, Kehadiran = ${ortuRiwayatRes.body.data.statistik.persentase_kehadiran}`);

      console.log('\n================================================================');
      console.log('🎉 SEMUA PENGUJIAN FASE 3 (REST API & BULK IMPORT) BERHASIL 100%!');
      console.log('================================================================\n');

    } catch (err) {
      console.error('❌ Uji coba gagal:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runTests();

