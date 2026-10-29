/**
 * BISOLPIN ACADEMY - SCRIPT LOGIN & REDIRECT ROLE
 * Mengirim data login ke POST /api/auth/login dan menyimpan JWT token ke localStorage
 */

// Helper untuk routing dashboard berdasarkan role
function redirectByRole(role) {
  switch (role) {
    case 'admin':
    case 'staff':
      window.location.href = 'dashboard-admin.html';
      break;
    case 'mentor':
      window.location.href = 'dashboard-mentor.html';
      break;
    case 'siswa':
      window.location.href = 'dashboard-siswa.html';
      break;
    case 'orang_tua':
      window.location.href = 'dashboard-ortu.html';
      break;
    default:
      console.warn('Role tidak dikenali:', role);
      window.location.href = 'dashboard-siswa.html';
  }
}

// Cek apakah pengguna sudah memiliki token di localStorage saat membuka halaman login
document.addEventListener('DOMContentLoaded', () => {
  const existingToken = localStorage.getItem('token');
  const existingRole = localStorage.getItem('role');

  if (existingToken && existingRole) {
    console.log('Sesi aktif ditemukan, mengalihkan ke dashboard...');
    redirectByRole(existingRole);
  }
});

// Helper 1-Click Demo Login
function fillDemo(username, password) {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  if (usernameInput && passwordInput) {
    usernameInput.value = username;
    passwordInput.value = password;
    // Otomatis submit form untuk kemudahan pengujian
    document.getElementById('login-form').dispatchEvent(new Event('submit'));
  }
}

// Event Handler Form Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const btnSubmit = document.getElementById('btn-login');
    const btnText = document.getElementById('btn-text');
    const errorBox = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      errorText.innerText = 'Username dan kata sandi wajib diisi.';
      errorBox.style.display = 'flex';
      return;
    }

    // Set UI Loading state
    btnSubmit.disabled = true;
    btnText.innerText = 'Memverifikasi...';
    errorBox.style.display = 'none';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || 'Login gagal. Silakan periksa kembali kredensial Anda.');
      }

      // Ambil token dan data user dari payload API
      const token = result.data.token;
      const user = result.data.user;
      const role = user.role;

      // Simpan ke localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(user));

      console.log(`Login berhasil sebagai ${role} (${user.nama}). Mengalihkan...`);

      // Arahkan ke dashboard yang sesuai
      redirectByRole(role);

    } catch (err) {
      console.error('Login Error:', err.message);
      errorText.innerText = err.message;
      errorBox.style.display = 'flex';
      lucide.createIcons();
    } finally {
      btnSubmit.disabled = false;
      btnText.innerText = 'Masuk ke Sistem';
    }
  });
}

