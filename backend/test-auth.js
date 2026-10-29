const http = require('http');
const app = require('./server');

const PORT = 5001; // Port uji coba khusus
let server;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

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

async function runTests() {
  console.log('================================================================');
  console.log('🧪 PENGUJIAN OTOMATIS: FASE 2 (AUTENTIKASI & RBAC)');
  console.log('================================================================');

  server = app.listen(PORT, async () => {
    try {
      // 1. Test Login Salah Password
      console.log('\n[Test 1] Login dengan password salah:');
      const failRes = await request('POST', '/api/auth/login', { username: 'admin', password: 'wrongpassword' });
      console.log(`Status: ${failRes.status} | Pesan: ${failRes.body.message}`);
      if (failRes.status !== 401) throw new Error('Harusnya 401 Unauthorized');
      console.log('✅ PASS: Password salah ditolak dengan benar.');

      // 2. Test Login 5 Role Pengguna
      const accounts = [
        { role: 'admin', username: 'admin', pass: 'password123' },
        { role: 'staff', username: 'staff_budi', pass: 'password123' },
        { role: 'mentor', username: 'mentor_siti', pass: 'password123' },
        { role: 'orang_tua', username: 'ortu_andi', pass: 'password123' },
        { role: 'siswa', username: 'siswa_andi', pass: 'password123' }
      ];

      const tokens = {};

      console.log('\n[Test 2] Login untuk seluruh 5 Role pengguna:');
      for (const acc of accounts) {
        const res = await request('POST', '/api/auth/login', { username: acc.username, password: acc.pass });
        if (res.status !== 200 || !res.body.data.token) {
          throw new Error(`Login gagal untuk ${acc.username}`);
        }
        tokens[acc.role] = res.body.data.token;
        console.log(`✅ [${acc.role.toUpperCase()}] ${acc.username} -> Token berhasil didapat (Nama: ${res.body.data.user.nama}, Cabang: ${res.body.data.user.nama_cabang})`);
      }

      // 3. Test Profil /me dengan Token
      console.log('\n[Test 3] Verifikasi endpoint GET /api/auth/me (Profil lengkap):');
      for (const [role, token] of Object.entries(tokens)) {
        const meRes = await request('GET', '/api/auth/me', null, { Authorization: `Bearer ${token}` });
        if (meRes.status !== 200) throw new Error(`GET /me gagal untuk role ${role}`);
        console.log(`✅ [${role}] Profil valid -> ID: ${meRes.body.data.id}, Role: ${meRes.body.data.role}, Cabang: ${meRes.body.data.cabang.nama}`);
      }

      // 4. Test Role-Based Access Control (RBAC)
      console.log('\n[Test 4] Verifikasi Middleware Role Access Control:');

      // Admin & Staff akses endpoint staff
      const adminStaffRes = await request('GET', '/api/auth/test/admin-staff', null, { Authorization: `Bearer ${tokens['staff']}` });
      console.log(`Staff akses /test/admin-staff -> Status: ${adminStaffRes.status} (Harus 200)`);
      if (adminStaffRes.status !== 200) throw new Error('Staff seharusnya dapat mengakses');

      // Mentor mencoba akses endpoint staff (Harus 403)
      const mentorForbiddenRes = await request('GET', '/api/auth/test/admin-staff', null, { Authorization: `Bearer ${tokens['mentor']}` });
      console.log(`Mentor akses /test/admin-staff -> Status: ${mentorForbiddenRes.status} (Harus 403 Forbidden: "${mentorForbiddenRes.body.message}")`);
      if (mentorForbiddenRes.status !== 403) throw new Error('Mentor seharusnya diblokir dari endpoint staff');

      // Mentor akses endpoint mentor (Harus 200)
      const mentorOkRes = await request('GET', '/api/auth/test/mentor', null, { Authorization: `Bearer ${tokens['mentor']}` });
      console.log(`Mentor akses /test/mentor -> Status: ${mentorOkRes.status} (Harus 200)`);
      if (mentorOkRes.status !== 200) throw new Error('Mentor seharusnya dapat mengakses /test/mentor');

      // Siswa akses endpoint siswa (Harus 200)
      const siswaOkRes = await request('GET', '/api/auth/test/siswa', null, { Authorization: `Bearer ${tokens['siswa']}` });
      console.log(`Siswa akses /test/siswa -> Status: ${siswaOkRes.status} (Harus 200)`);
      if (siswaOkRes.status !== 200) throw new Error('Siswa seharusnya dapat mengakses /test/siswa');

      // Siswa mencoba akses endpoint orang-tua (Harus 403)
      const siswaForbiddenRes = await request('GET', '/api/auth/test/orang-tua', null, { Authorization: `Bearer ${tokens['siswa']}` });
      console.log(`Siswa akses /test/orang-tua -> Status: ${siswaForbiddenRes.status} (Harus 403 Forbidden: "${siswaForbiddenRes.body.message}")`);
      if (siswaForbiddenRes.status !== 403) throw new Error('Siswa seharusnya diblokir dari endpoint orang tua');

      // Tanpa Token (Harus 401)
      const noTokenRes = await request('GET', '/api/auth/me');
      console.log(`Akses tanpa token -> Status: ${noTokenRes.status} (Harus 401: "${noTokenRes.body.message}")`);
      if (noTokenRes.status !== 401) throw new Error('Permintaan tanpa token harus 401');

      console.log('\n================================================================');
      console.log('🎉 SEMUA PENGUJIAN FASE 2 BERHASIL 100%!');
      console.log('================================================================\n');

    } catch (err) {
      console.error('❌ Uji coba gagal:', err.message);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runTests();

