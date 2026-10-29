/**
 * BISOLPIN ACADEMY - FRONTEND CLIENT APPLICATION (ERP / LMS)
 * Single Page Application (Vanilla JavaScript)
 */

const API_BASE_URL = '/api';

// State Global
const state = {
  token: localStorage.getItem('bisolpin_token') || null,
  user: JSON.parse(localStorage.getItem('bisolpin_user') || 'null'),
  currentView: 'dashboard',
  clockStatus: { clockedIn: false, clockedOut: false, data: null },
  selectedChildId: null
};

// =====================================================================
// API REQUEST HELPER
// =====================================================================
async function apiCall(endpoint, method = 'GET', body = null, isFormData = false) {
  const headers = {};
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const options = { method, headers };

  if (body) {
    if (isFormData) {
      options.body = body; // Browser sets multipart boundary automatically
    } else {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.status === 401) {
      logout('Sesi Anda telah kedaluwarsa. Silakan login kembali.');
      throw new Error(data.message || 'Sesi berakhir.');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Terjadi kesalahan pada request.');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// =====================================================================
// TOAST NOTIFICATIONS
// =====================================================================
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';

  toast.innerHTML = `
    <div class="toast-icon">
      <i data-lucide="${iconName}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// =====================================================================
// MODAL DIALOG CONTROLLER
// =====================================================================
function showModal(title, bodyHtml, footerButtons = [], isLarge = false) {
  const root = document.getElementById('modal-root');
  if (!root) return;

  let buttonsHtml = '';
  footerButtons.forEach((btn, idx) => {
    buttonsHtml += `<button class="btn ${btn.className || 'btn-secondary'}" id="modal-btn-${idx}">${btn.text}</button>`;
  });

  root.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal-dialog ${isLarge ? 'modal-lg' : ''}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close-btn" id="modal-close-x"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerButtons.length > 0 ? `<div class="modal-footer">${buttonsHtml}</div>` : ''}
      </div>
    </div>
  `;

  lucide.createIcons();

  // Event Close
  document.getElementById('modal-close-x').onclick = closeModal;
  document.getElementById('modal-backdrop').onclick = (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  };

  // Button actions
  footerButtons.forEach((btn, idx) => {
    const btnElem = document.getElementById(`modal-btn-${idx}`);
    if (btnElem && btn.onClick) {
      btnElem.onclick = () => btn.onClick(closeModal);
    }
  });
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}

// =====================================================================
// AUTHENTICATION LOGIC
// =====================================================================
async function handleLogin(username, password) {
  try {
    const res = await apiCall('/auth/login', 'POST', { username, password });
    state.token = res.data.token;
    state.user = res.data.user;
    localStorage.setItem('bisolpin_token', state.token);
    localStorage.setItem('bisolpin_user', JSON.stringify(state.user));

    showToast('Login Berhasil', `Selamat datang kembali, ${state.user.nama}!`, 'success');
    renderApp();
  } catch (err) {
    showToast('Login Gagal', err.message, 'error');
  }
}

function logout(message = 'Anda telah keluar dari sistem.') {
  state.token = null;
  state.user = null;
  localStorage.removeItem('bisolpin_token');
  localStorage.removeItem('bisolpin_user');
  if (message) showToast('Logout', message, 'info');
  renderApp();
}

// Quick Login Demo Helper
function quickFillLogin(u, p) {
  const uInput = document.getElementById('login-username');
  const pInput = document.getElementById('login-password');
  if (uInput && pInput) {
    uInput.value = u;
    pInput.value = p;
    handleLogin(u, p);
  }
}

// =====================================================================
// SCREEN 1: LOGIN VIEW
// =====================================================================
function renderLoginScreen() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-brand">
            <i data-lucide="graduation-cap"></i>
            <span>BISOLPIN ACADEMY</span>
            <span class="auth-brand-badge">ERP / LMS</span>
          </div>
          <p class="auth-subtitle">Sistem Informasi Manajemen Operasional Bimbingan Belajar</p>
        </div>
        <div class="auth-body">
          <!-- Demo Accounts Box -->
          <div class="demo-account-box">
            <div class="demo-account-title">
              <span>Akun Demo Cepat (1-Click Login):</span>
              <span class="badge badge-info">Pass: password123</span>
            </div>
            <div class="demo-buttons-grid">
              <button class="btn-demo-pill" onclick="quickFillLogin('admin', 'password123')">🔑 Admin</button>
              <button class="btn-demo-pill" onclick="quickFillLogin('staff_budi', 'password123')">📋 Staff (Budi)</button>
              <button class="btn-demo-pill" onclick="quickFillLogin('mentor_siti', 'password123')">👨‍🏫 Mentor (Siti)</button>
              <button class="btn-demo-pill" onclick="quickFillLogin('siswa_andi', 'password123')">🎓 Siswa (Andi)</button>
              <button class="btn-demo-pill" onclick="quickFillLogin('ortu_andi', 'password123')">👨‍👩‍👦 Orang Tua</button>
            </div>
          </div>

          <!-- Form Login -->
          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-username">Username Pengguna</label>
              <input type="text" id="login-username" class="form-control" placeholder="Masukkan username" required autofocus>
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Kata Sandi (Password)</label>
              <input type="password" id="login-password" class="form-control" placeholder="Masukkan password" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
              <i data-lucide="log-in"></i>
              <span>Masuk ke Sistem</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    handleLogin(u, p);
  };

  lucide.createIcons();
}

// =====================================================================
// SCREEN 2: MAIN DASHBOARD SHELL
// =====================================================================
async function renderDashboardShell() {
  const app = document.getElementById('app');
  const role = state.user.role;

  // Load clock status for staff/mentor
  if (['staff', 'mentor', 'admin'].includes(role)) {
    try {
      const res = await apiCall('/absensi/status-hari-ini');
      state.clockStatus = res;
    } catch (e) {
      console.warn('Gagal memuat status absensi:', e.message);
    }
  }

  app.innerHTML = `
    <div class="dashboard-layout">
      <!-- SIDEBAR -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo-icon">B</div>
          <div>
            <div class="sidebar-brand-name">BISOLPIN ACADEMY</div>
            <div class="sidebar-brand-sub">${state.user.nama_cabang || 'Pusat'}</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          ${getSidebarNavigationHtml(role)}
        </nav>

        <div class="sidebar-footer">
          <div class="user-badge">
            <div class="user-avatar">${(state.user.nama || state.user.username)[0].toUpperCase()}</div>
            <div class="user-info">
              <div class="user-name">${state.user.nama || state.user.username}</div>
              <div class="user-role-badge">${role}</div>
            </div>
            <button class="btn-logout" title="Keluar" onclick="logout()"><i data-lucide="log-out"></i></button>
          </div>
        </div>
      </aside>

      <!-- MAIN WRAPPER -->
      <div class="main-wrapper">
        <header class="topbar">
          <div class="topbar-left">
            <h1 class="page-title" id="page-heading">Dashboard</h1>
          </div>
          <div class="topbar-right">
            ${getTopbarActionWidgets(role)}
            <div class="user-badge" style="gap: 0.5rem;">
              <span class="badge badge-primary"><i data-lucide="building-2"></i> ${state.user.nama_cabang || 'Pusat'}</span>
            </div>
          </div>
        </header>

        <main class="page-content" id="page-content">
          <!-- Konten dinamis dirender di sini -->
          <div style="text-align:center; padding: 3rem;">Memuat data...</div>
        </main>
      </div>
    </div>
  `;

  lucide.createIcons();
  navigateTo(state.currentView || 'dashboard');
}

// =====================================================================
// SIDEBAR MENU BY ROLE
// =====================================================================
function getSidebarNavigationHtml(role) {
  if (role === 'admin' || role === 'staff') {
    return `
      <div class="sidebar-heading">Menu Utama</div>
      <a class="nav-link" data-view="dashboard"><i data-lucide="layout-dashboard" class="nav-link-icon"></i> Overview</a>
      
      <div class="sidebar-heading">Master Data & Import</div>
      <a class="nav-link" data-view="cabang"><i data-lucide="building-2" class="nav-link-icon"></i> Kelola Cabang</a>
      <a class="nav-link" data-view="layanan-paket"><i data-lucide="package" class="nav-link-icon"></i> Layanan & Paket</a>
      <a class="nav-link" data-view="karyawan"><i data-lucide="users-2" class="nav-link-icon"></i> Karyawan (Staff/Guru)</a>
      <a class="nav-link" data-view="orang-tua"><i data-lucide="contact" class="nav-link-icon"></i> Data Orang Tua</a>
      <a class="nav-link" data-view="siswa"><i data-lucide="graduation-cap" class="nav-link-icon"></i> Data Siswa</a>
      <a class="nav-link" data-view="sesi-bimbingan"><i data-lucide="calendar" class="nav-link-icon"></i> Jadwal Sesi Belajar</a>

      <div class="sidebar-heading">Keuangan & SDM</div>
      <a class="nav-link" data-view="transaksi"><i data-lucide="credit-card" class="nav-link-icon"></i> Pembayaran Kursus</a>
      <a class="nav-link" data-view="laporan-absensi"><i data-lucide="clipboard-check" class="nav-link-icon"></i> Laporan Absensi SDM</a>
    `;
  }

  if (role === 'mentor') {
    return `
      <div class="sidebar-heading">Mentor Portal</div>
      <a class="nav-link" data-view="dashboard"><i data-lucide="layout-dashboard" class="nav-link-icon"></i> Dashboard</a>
      <a class="nav-link" data-view="jadwal-mengajar"><i data-lucide="calendar-check" class="nav-link-icon"></i> Jadwal Mengajar</a>
      <a class="nav-link" data-view="presensi-pribadi"><i data-lucide="clock" class="nav-link-icon"></i> Presensi Harian</a>
    `;
  }

  if (role === 'siswa') {
    return `
      <div class="sidebar-heading">Siswa Portal</div>
      <a class="nav-link" data-view="dashboard"><i data-lucide="calendar" class="nav-link-icon"></i> Jadwal Kursus</a>
      <a class="nav-link" data-view="materi-siswa"><i data-lucide="book-open" class="nav-link-icon"></i> Materi Belajar</a>
      <a class="nav-link" data-view="rapor-siswa"><i data-lucide="award" class="nav-link-icon"></i> Rapor Nilai & Absensi</a>
      <a class="nav-link" data-view="tagihan-siswa"><i data-lucide="receipt" class="nav-link-icon"></i> Riwayat Pembayaran</a>
    `;
  }

  if (role === 'orang_tua') {
    return `
      <div class="sidebar-heading">Portal Orang Tua</div>
      <a class="nav-link" data-view="dashboard"><i data-lucide="heart-handshake" class="nav-link-icon"></i> Pantau Anak</a>
      <a class="nav-link" data-view="jadwal-anak"><i data-lucide="calendar" class="nav-link-icon"></i> Jadwal Belajar Anak</a>
      <a class="nav-link" data-view="tagihan-anak"><i data-lucide="wallet" class="nav-link-icon"></i> Riwayat Tagihan</a>
    `;
  }

  return '';
}

// Widget Clock-in/out di Topbar untuk Karyawan
function getTopbarActionWidgets(role) {
  if (['admin', 'staff', 'mentor'].includes(role)) {
    const isClockedIn = state.clockStatus.clockedIn;
    const isClockedOut = state.clockStatus.clockedOut;

    if (!isClockedIn) {
      return `
        <button class="btn btn-success btn-sm" onclick="triggerClockIn()">
          <i data-lucide="log-in"></i> Clock-In Hari Ini
        </button>
      `;
    } else if (!isClockedOut) {
      return `
        <div class="clock-status-pill">
          <span class="dot-indicator active"></span>
          <span>Hadir (${state.clockStatus.data ? state.clockStatus.data.jam_masuk.substring(0, 5) : 'OK'})</span>
        </div>
        <button class="btn btn-danger btn-sm" onclick="triggerClockOut()">
          <i data-lucide="log-out"></i> Clock-Out
        </button>
      `;
    } else {
      return `
        <div class="clock-status-pill">
          <span class="dot-indicator"></span>
          <span>Selesai (Pulang: ${state.clockStatus.data ? state.clockStatus.data.jam_pulang.substring(0, 5) : 'OK'})</span>
        </div>
      `;
    }
  }
  return '';
}

async function triggerClockIn() {
  try {
    const res = await apiCall('/absensi/clock-in', 'POST', { status: 'hadir' });
    showToast('Presensi Masuk Berhasil', res.message, 'success');
    renderDashboardShell();
  } catch (err) {
    showToast('Presensi Gagal', err.message, 'error');
  }
}

async function triggerClockOut() {
  try {
    const res = await apiCall('/absensi/clock-out', 'POST');
    showToast('Presensi Pulang Berhasil', res.message, 'success');
    renderDashboardShell();
  } catch (err) {
    showToast('Presensi Gagal', err.message, 'error');
  }
}

// =====================================================================
// ROUTING & VIEW CONTROLLER
// =====================================================================
function navigateTo(viewName) {
  state.currentView = viewName;

  // Update active state di sidebar links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewName);
  });

  const contentElem = document.getElementById('page-content');
  const headingElem = document.getElementById('page-heading');
  const role = state.user.role;

  // Dispatch renderer berdasarkan role dan view
  if (role === 'admin' || role === 'staff') {
    switch (viewName) {
      case 'dashboard': renderAdminOverview(contentElem, headingElem); break;
      case 'cabang': renderCabangView(contentElem, headingElem); break;
      case 'layanan-paket': renderLayananPaketView(contentElem, headingElem); break;
      case 'karyawan': renderKaryawanView(contentElem, headingElem); break;
      case 'orang-tua': renderOrangTuaView(contentElem, headingElem); break;
      case 'siswa': renderSiswaView(contentElem, headingElem); break;
      case 'sesi-bimbingan': renderSesiView(contentElem, headingElem); break;
      case 'transaksi': renderTransaksiView(contentElem, headingElem); break;
      case 'laporan-absensi': renderLaporanAbsensiView(contentElem, headingElem); break;
      default: renderAdminOverview(contentElem, headingElem);
    }
  } else if (role === 'mentor') {
    switch (viewName) {
      case 'dashboard':
      case 'jadwal-mengajar': renderMentorJadwalView(contentElem, headingElem); break;
      case 'presensi-pribadi': renderMentorPresensiView(contentElem, headingElem); break;
      default: renderMentorJadwalView(contentElem, headingElem);
    }
  } else if (role === 'siswa') {
    switch (viewName) {
      case 'dashboard': renderSiswaJadwalView(contentElem, headingElem); break;
      case 'materi-siswa': renderSiswaMateriView(contentElem, headingElem); break;
      case 'rapor-siswa': renderSiswaRaporView(contentElem, headingElem); break;
      case 'tagihan-siswa': renderSiswaTagihanView(contentElem, headingElem); break;
      default: renderSiswaJadwalView(contentElem, headingElem);
    }
  } else if (role === 'orang_tua') {
    switch (viewName) {
      case 'dashboard': renderOrtuMonitoringView(contentElem, headingElem); break;
      case 'jadwal-anak': renderOrtuJadwalView(contentElem, headingElem); break;
      case 'tagihan-anak': renderOrtuTagihanView(contentElem, headingElem); break;
      default: renderOrtuMonitoringView(contentElem, headingElem);
    }
  }

  // Bind sidebar click events
  document.querySelectorAll('.nav-link').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      navigateTo(link.dataset.view);
    };
  });
}

// =====================================================================
// VIEW 1: ADMIN & STAFF VIEWS
// =====================================================================

// Overview Admin
async function renderAdminOverview(content, heading) {
  heading.innerText = 'Overview & Ringkasan Eksekutif';
  content.innerHTML = '<div style="text-align:center; padding: 2rem;">Mengambil data ringkasan...</div>';

  try {
    const [cabang, layanan, paket, siswa, karyawan, transaksi] = await Promise.all([
      apiCall('/master/cabang'),
      apiCall('/master/layanan'),
      apiCall('/master/paket'),
      apiCall('/master/siswa'),
      apiCall('/master/karyawan'),
      apiCall('/transaksi')
    ]);

    const totalPendapatan = (transaksi.data || []).reduce((acc, curr) => acc + parseFloat(curr.nominal || 0), 0);

    content.innerHTML = `
      <!-- KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrapper blue"><i data-lucide="graduation-cap"></i></div>
          <div>
            <div class="kpi-info-label">Total Siswa Binaan</div>
            <div class="kpi-value">${siswa.data.length}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrapper green"><i data-lucide="users-2"></i></div>
          <div>
            <div class="kpi-info-label">Staff & Mentor</div>
            <div class="kpi-value">${karyawan.data.length}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrapper amber"><i data-lucide="package"></i></div>
          <div>
            <div class="kpi-info-label">Paket Kursus Aktif</div>
            <div class="kpi-value">${paket.data.length}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrapper purple"><i data-lucide="banknote"></i></div>
          <div>
            <div class="kpi-info-label">Total Pemasukan</div>
            <div class="kpi-value">Rp ${(totalPendapatan / 1000).toLocaleString('id-ID')}K</div>
          </div>
        </div>
      </div>

      <!-- RECENT TRANSACTIONS TABLE -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="history"></i> Transaksi Pembayaran Terbaru</h3>
          <button class="btn btn-secondary btn-sm" onclick="navigateTo('transaksi')">Lihat Semua Transaksi</button>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama Siswa</th>
                <th>Paket Kursus</th>
                <th>Nominal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(transaksi.data || []).slice(0, 5).map(t => `
                <tr>
                  <td>${new Date(t.tanggal_bayar).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                  <td><strong>${t.nama_siswa}</strong><br><small class="text-secondary">${t.asal_sekolah || '-'}</small></td>
                  <td>${t.nama_paket}</td>
                  <td><strong>Rp ${parseFloat(t.nominal).toLocaleString('id-ID')}</strong></td>
                  <td><span class="badge ${t.status_pembayaran === 'lunas' ? 'badge-success' : 'badge-warning'}">${t.status_pembayaran.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><p class="text-danger">Gagal memuat data: ${err.message}</p></div>`;
  }
}

// Master Cabang
async function renderCabangView(content, heading) {
  heading.innerText = 'Kelola Cabang Bimbingan Belajar';
  content.innerHTML = 'Memuat cabang...';

  try {
    const res = await apiCall('/master/cabang');
    content.innerHTML = `
      <div class="content-header">
        <div class="content-title-desc">
          <h2>Daftar Cabang Bimbingan</h2>
          <p>Manajemen operasional pusat dan cabang bimbingan belajar</p>
        </div>
        <div class="action-buttons-group">
          <button class="btn btn-primary" onclick="openTambahCabangModal()"><i data-lucide="plus-circle"></i> Tambah Cabang</button>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Cabang</th>
                <th>Alamat Lengkap</th>
                <th>Kontak / No Telepon</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.map(c => `
                <tr>
                  <td>#${c.id}</td>
                  <td><strong>${c.nama_cabang}</strong></td>
                  <td>${c.alamat}</td>
                  <td>${c.kontak}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="openEditCabangModal(${JSON.stringify(c).replace(/"/g, '&quot;')})">Edit</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

function openTambahCabangModal() {
  const formHtml = `
    <div class="form-group">
      <label class="form-label">Nama Cabang</label>
      <input type="text" id="cabang-nama" class="form-control" placeholder="Contoh: Bisolpin Cabang Surabaya" required>
    </div>
    <div class="form-group">
      <label class="form-label">Alamat Lengkap</label>
      <textarea id="cabang-alamat" class="form-control" rows="3" placeholder="Jl. Pahlawan No. 10..." required></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Kontak / Telepon</label>
      <input type="text" id="cabang-kontak" class="form-control" placeholder="031-1234567 / 0812345678" required>
    </div>
  `;

  showModal('Tambah Cabang Baru', formHtml, [
    { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
    {
      text: 'Simpan Cabang',
      className: 'btn-primary',
      onClick: async (close) => {
        const nama_cabang = document.getElementById('cabang-nama').value;
        const alamat = document.getElementById('cabang-alamat').value;
        const kontak = document.getElementById('cabang-kontak').value;
        if (!nama_cabang || !alamat || !kontak) return showToast('Peringatan', 'Lengkapi seluruh formulir.', 'error');

        try {
          await apiCall('/master/cabang', 'POST', { nama_cabang, alamat, kontak });
          showToast('Sukses', 'Cabang baru berhasil disimpan.', 'success');
          close();
          navigateTo('cabang');
        } catch (e) {
          showToast('Gagal', e.message, 'error');
        }
      }
    }
  ]);
}

function openEditCabangModal(cabang) {
  const formHtml = `
    <div class="form-group">
      <label class="form-label">Nama Cabang</label>
      <input type="text" id="cabang-nama" class="form-control" value="${cabang.nama_cabang}" required>
    </div>
    <div class="form-group">
      <label class="form-label">Alamat Lengkap</label>
      <textarea id="cabang-alamat" class="form-control" rows="3" required>${cabang.alamat}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Kontak / Telepon</label>
      <input type="text" id="cabang-kontak" class="form-control" value="${cabang.kontak}" required>
    </div>
  `;

  showModal(`Edit Cabang #${cabang.id}`, formHtml, [
    { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
    {
      text: 'Perbarui Cabang',
      className: 'btn-primary',
      onClick: async (close) => {
        const nama_cabang = document.getElementById('cabang-nama').value;
        const alamat = document.getElementById('cabang-alamat').value;
        const kontak = document.getElementById('cabang-kontak').value;

        try {
          await apiCall(`/master/cabang/${cabang.id}`, 'PUT', { nama_cabang, alamat, kontak });
          showToast('Sukses', 'Cabang berhasil diperbarui.', 'success');
          close();
          navigateTo('cabang');
        } catch (e) {
          showToast('Gagal', e.message, 'error');
        }
      }
    }
  ]);
}

// Master Layanan & Paket Kursus
async function renderLayananPaketView(content, heading) {
  heading.innerText = 'Layanan & Paket Bimbingan Belajar';
  content.innerHTML = 'Memuat layanan dan paket...';

  try {
    const [layananRes, paketRes] = await Promise.all([
      apiCall('/master/layanan'),
      apiCall('/master/paket')
    ]);

    content.innerHTML = `
      <div class="content-header">
        <div class="content-title-desc">
          <h2>Program Layanan & Paket Kursus</h2>
          <p>Daftar bidang studi, paket pertemuan, dan penentuan tarif bimbingan</p>
        </div>
        <div class="action-buttons-group">
          <!-- Tombol Import Data Layanan -->
          <button class="btn btn-secondary" onclick="openBulkImportModal('layanan')">
            <i data-lucide="file-spreadsheet"></i> Import CSV Layanan
          </button>
          <button class="btn btn-primary" onclick="openTambahLayananModal()">
            <i data-lucide="plus-circle"></i> Tambah Layanan
          </button>
          <button class="btn btn-primary" onclick="openTambahPaketModal(${JSON.stringify(layananRes.data).replace(/"/g, '&quot;')})">
            <i data-lucide="plus-circle"></i> Tambah Paket
          </button>
        </div>
      </div>

      <!-- TABEL LAYANAN -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="bookmark"></i> Kategori Layanan Kursus</h3>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Layanan Program</th>
                <th>Deskripsi</th>
                <th>Harga Dasar</th>
              </tr>
            </thead>
            <tbody>
              ${layananRes.data.map(l => `
                <tr>
                  <td>#${l.id}</td>
                  <td><strong>${l.nama_layanan}</strong></td>
                  <td>${l.deskripsi || '-'}</td>
                  <td>Rp ${parseFloat(l.harga_dasar).toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- TABEL PAKET KURSUS -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="package"></i> Paket Kursus Spesifik</h3>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Paket</th>
                <th>Bidang Layanan</th>
                <th>Jumlah Sesi</th>
                <th>Harga Paket</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${paketRes.data.map(p => `
                <tr>
                  <td>#${p.id}</td>
                  <td><strong>${p.nama_paket}</strong></td>
                  <td><span class="badge badge-info">${p.nama_layanan}</span></td>
                  <td>${p.jumlah_pertemuan} Pertemuan</td>
                  <td><strong>Rp ${parseFloat(p.harga_paket).toLocaleString('id-ID')}</strong></td>
                  <td><small>${p.deskripsi || '-'}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

function openTambahLayananModal() {
  const formHtml = `
    <div class="form-group">
      <label class="form-label">Nama Layanan</label>
      <input type="text" id="layanan-nama" class="form-control" placeholder="Contoh: Persiapan Kedinasan STAN" required>
    </div>
    <div class="form-group">
      <label class="form-label">Deskripsi</label>
      <textarea id="layanan-deskripsi" class="form-control" rows="2" placeholder="Deskripsi kurikulum atau fokus layanan..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Harga Dasar (Rp)</label>
      <input type="number" id="layanan-harga" class="form-control" placeholder="1500000" required>
    </div>
  `;

  showModal('Tambah Layanan Kursus Baru', formHtml, [
    { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
    {
      text: 'Simpan Layanan',
      className: 'btn-primary',
      onClick: async (close) => {
        const nama_layanan = document.getElementById('layanan-nama').value;
        const deskripsi = document.getElementById('layanan-deskripsi').value;
        const harga_dasar = document.getElementById('layanan-harga').value;
        if (!nama_layanan || !harga_dasar) return showToast('Peringatan', 'Lengkapi kolom wajib.', 'error');

        try {
          await apiCall('/master/layanan', 'POST', { nama_layanan, deskripsi, harga_dasar });
          showToast('Sukses', 'Layanan berhasil dibuat.', 'success');
          close();
          navigateTo('layanan-paket');
        } catch (e) {
          showToast('Gagal', e.message, 'error');
        }
      }
    }
  ]);
}

function openTambahPaketModal(layananList) {
  const options = layananList.map(l => `<option value="${l.id}">${l.nama_layanan}</option>`).join('');
  const formHtml = `
    <div class="form-group">
      <label class="form-label">Pilih Program Layanan</label>
      <select id="paket-layanan-id" class="form-control">${options}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Nama Paket</label>
      <input type="text" id="paket-nama" class="form-control" placeholder="Contoh: Paket Intensif 12 Sesi" required>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Jumlah Pertemuan</label>
        <input type="number" id="paket-jumlah" class="form-control" value="12" required>
      </div>
      <div class="form-group">
        <label class="form-label">Harga Paket (Rp)</label>
        <input type="number" id="paket-harga" class="form-control" placeholder="2500000" required>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Deskripsi Fasilitas</label>
      <textarea id="paket-deskripsi" class="form-control" rows="2" placeholder="Termasuk modul, tryout, bimbingan privat..."></textarea>
    </div>
  `;

  showModal('Tambah Paket Kursus Baru', formHtml, [
    { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
    {
      text: 'Simpan Paket',
      className: 'btn-primary',
      onClick: async (close) => {
        const layanan_id = document.getElementById('paket-layanan-id').value;
        const nama_paket = document.getElementById('paket-nama').value;
        const jumlah_pertemuan = document.getElementById('paket-jumlah').value;
        const harga_paket = document.getElementById('paket-harga').value;
        const deskripsi = document.getElementById('paket-deskripsi').value;

        if (!nama_paket || !harga_paket) return showToast('Peringatan', 'Lengkapi seluruh data paket.', 'error');

        try {
          await apiCall('/master/paket', 'POST', { layanan_id, nama_paket, jumlah_pertemuan, harga_paket, deskripsi });
          showToast('Sukses', 'Paket bimbingan berhasil dibuat.', 'success');
          close();
          navigateTo('layanan-paket');
        } catch (e) {
          showToast('Gagal', e.message, 'error');
        }
      }
    }
  ]);
}

// Master Karyawan (Staff / Guru)
async function renderKaryawanView(content, heading) {
  heading.innerText = 'Kelola Karyawan (Staff & Mentor)';
  content.innerHTML = 'Memuat karyawan...';

  try {
    const res = await apiCall('/master/karyawan');
    content.innerHTML = `
      <div class="content-header">
        <div class="content-title-desc">
          <h2>Daftar Karyawan Bimbingan Belajar</h2>
          <p>Manajemen tenaga pendidik (guru/mentor) dan staf administrasi operasional</p>
        </div>
        <div class="action-buttons-group">
          <!-- Tombol Import Data Karyawan -->
          <button class="btn btn-secondary" onclick="openBulkImportModal('karyawan')">
            <i data-lucide="file-spreadsheet"></i> Import CSV Karyawan
          </button>
          <button class="btn btn-primary" onclick="openTambahKaryawanModal()">
            <i data-lucide="user-plus"></i> Tambah Karyawan
          </button>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>NIP</th>
                <th>Nama Lengkap</th>
                <th>Role & Tipe</th>
                <th>Spesialisasi</th>
                <th>No. Handphone</th>
                <th>Cabang</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.map(k => `
                <tr>
                  <td><code>${k.nip}</code></td>
                  <td><strong>${k.nama}</strong><br><small class="text-secondary">@${k.username}</small></td>
                  <td>
                    <span class="badge ${k.tipe_karyawan === 'guru' ? 'badge-primary' : 'badge-warning'}">
                      ${k.tipe_karyawan.toUpperCase()} (${k.role})
                    </span>
                  </td>
                  <td>${k.spesialisasi || '-'}</td>
                  <td>${k.no_hp}</td>
                  <td><span class="badge badge-info">${k.nama_cabang || 'Pusat'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

function openTambahKaryawanModal() {
  const formHtml = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Username Akun</label>
        <input type="text" id="karyawan-user" class="form-control" placeholder="mentor_agus" required>
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="karyawan-pass" class="form-control" value="password123" required>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">NIP Karyawan</label>
        <input type="text" id="karyawan-nip" class="form-control" placeholder="GUR-2026-009" required>
      </div>
      <div class="form-group">
        <label class="form-label">Nama Lengkap & Gelar</label>
        <input type="text" id="karyawan-nama" class="form-control" placeholder="Agus Setiawan, S.Pd" required>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Tipe Karyawan</label>
        <select id="karyawan-tipe" class="form-control">
          <option value="guru">Guru / Mentor</option>
          <option value="staff">Staff Administrasi</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">No. Handphone / WhatsApp</label>
        <input type="text" id="karyawan-nohp" class="form-control" placeholder="08123456789" required>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Bidang Spesialisasi / Mata Pelajaran</label>
      <input type="text" id="karyawan-spesialisasi" class="form-control" placeholder="Contoh: Fisika & Matematika Lanjut">
    </div>
  `;

  showModal('Tambah Karyawan Baru', formHtml, [
    { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
    {
      text: 'Simpan Karyawan',
      className: 'btn-primary',
      onClick: async (close) => {
        const username = document.getElementById('karyawan-user').value;
        const password = document.getElementById('karyawan-pass').value;
        const nip = document.getElementById('karyawan-nip').value;
        const nama = document.getElementById('karyawan-nama').value;
        const tipe_karyawan = document.getElementById('karyawan-tipe').value;
        const role = tipe_karyawan === 'guru' ? 'mentor' : 'staff';
        const no_hp = document.getElementById('karyawan-nohp').value;
        const spesialisasi = document.getElementById('karyawan-spesialisasi').value;

        if (!username || !password || !nip || !nama || !no_hp) {
          return showToast('Peringatan', 'Lengkapi seluruh data wajib.', 'error');
        }

        try {
          await apiCall('/master/karyawan', 'POST', { username, password, role, nip, nama, tipe_karyawan, no_hp, spesialisasi, cabang_id: state.user.cabang_id });
          showToast('Sukses', 'Karyawan berhasil didaftarkan.', 'success');
          close();
          navigateTo('karyawan');
        } catch (e) {
          showToast('Gagal', e.message, 'error');
        }
      }
    }
  ]);
}

// Master Orang Tua
async function renderOrangTuaView(content, heading) {
  heading.innerText = 'Kelola Data Orang Tua / Wali';
  content.innerHTML = 'Memuat data orang tua...';

  try {
    const res = await apiCall('/master/orang-tua');
    content.innerHTML = `
      <div class="content-header">
        <div class="content-title-desc">
          <h2>Data Orang Tua & Wali Siswa</h2>
          <p>Informasi kontak orang tua untuk pelaporan akademik dan tagihan kursus</p>
        </div>
        <div class="action-buttons-group">
          <!-- Tombol Import Data Orang Tua -->
          <button class="btn btn-secondary" onclick="openBulkImportModal('orang-tua')">
            <i data-lucide="file-spreadsheet"></i> Import CSV Ortu
          </button>
          <button class="btn btn-primary" onclick="openTambahOrangTuaModal()">
            <i data-lucide="user-plus"></i> Tambah Orang Tua
          </button>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Username Akun</th>
                <th>Nama Orang Tua</th>
                <th>No. Telepon / WA</th>
                <th>Pekerjaan</th>
                <th>Alamat</th>
                <th>Jumlah Siswa</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.map(o => `
                <tr>
                  <td><code>@${o.username}</code></td>
                  <td><strong>${o.nama_ortu}</strong></td>
                  <td>${o.no_hp}</td>
                  <td>${o.pekerjaan || '-'}</td>
                  <td><small>${o.alamat || '-'}</small></td>
                  <td><span class="badge badge-info">${o.total_anak} Anak</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

function openTambahOrangTuaModal() {
  const formHtml = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Username Akun</label>
        <input type="text" id="ortu-user" class="form-control" placeholder="ortu_budi" required>
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="ortu-pass" class="form-control" value="password123" required>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Nama Lengkap Orang Tua</label>
      <input type="text" id="ortu-nama" class="form-control" placeholder="Bpk. Hendra Gunawan" required>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">No. HP / WhatsApp</label>
        <input type="text" id="ortu-nohp" class="form-control" placeholder="081298765432" required>
      </div>
      <div class="form-group">
        <label class="form-label">Pekerjaan</label>
        <input type="text" id="ortu-pekerjaan" class="form-control" placeholder="Wiraswasta / Karyawan BUMN">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Alamat Rumah</label>
      <textarea id="ortu-alamat" class="form-control" rows="2" placeholder="Alamat domisili orang tua..."></textarea>
    </div>
  `;

  showModal('Tambah Akun Orang Tua', formHtml, [
    { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
    {
      text: 'Simpan Data',
      className: 'btn-primary',
      onClick: async (close) => {
        const username = document.getElementById('ortu-user').value;
        const password = document.getElementById('ortu-pass').value;
        const nama_ortu = document.getElementById('ortu-nama').value;
        const no_hp = document.getElementById('ortu-nohp').value;
        const pekerjaan = document.getElementById('ortu-pekerjaan').value;
        const alamat = document.getElementById('ortu-alamat').value;

        if (!username || !password || !nama_ortu || !no_hp) {
          return showToast('Peringatan', 'Lengkapi seluruh data wajib.', 'error');
        }

        try {
          await apiCall('/master/orang-tua', 'POST', { username, password, nama_ortu, no_hp, pekerjaan, alamat, cabang_id: state.user.cabang_id });
          showToast('Sukses', 'Data orang tua berhasil disimpan.', 'success');
          close();
          navigateTo('orang-tua');
        } catch (e) {
          showToast('Gagal', e.message, 'error');
        }
      }
    }
  ]);
}

// Master Siswa
async function renderSiswaView(content, heading) {
  heading.innerText = 'Kelola Data Siswa';
  content.innerHTML = 'Memuat data siswa...';

  try {
    const [siswaRes, ortuRes] = await Promise.all([
      apiCall('/master/siswa'),
      apiCall('/master/orang-tua')
    ]);

    content.innerHTML = `
      <div class="content-header">
        <div class="content-title-desc">
          <h2>Daftar Siswa Bimbingan</h2>
          <p>Data profil siswa, relasi wali orang tua, dan asal sekolah</p>
        </div>
        <div class="action-buttons-group">
          <!-- Tombol Import Data Siswa -->
          <button class="btn btn-secondary" onclick="openBulkImportModal('siswa')">
            <i data-lucide="file-spreadsheet"></i> Import CSV Siswa
          </button>
          <button class="btn btn-primary" onclick="openTambahSiswaModal(${JSON.stringify(ortuRes.data).replace(/"/g, '&quot;')})">
            <i data-lucide="user-plus"></i> Tambah Siswa Baru
          </button>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Username Akun</th>
                <th>Nama Siswa</th>
                <th>Asal Sekolah</th>
                <th>Orang Tua / Wali</th>
                <th>No. HP Wali</th>
                <th>Tanggal Lahir</th>
              </tr>
            </thead>
            <tbody>
              ${siswaRes.data.map(s => `
                <tr>
                  <td><code>@${s.username}</code></td>
                  <td><strong>${s.nama_siswa}</strong></td>
                  <td><span class="badge badge-info">${s.asal_sekolah || '-'}</span></td>
                  <td>${s.nama_ortu ? `<strong>${s.nama_ortu}</strong>` : '<span class="text-muted">Belum ditautkan</span>'}</td>
                  <td>${s.no_hp_ortu || '-'}</td>
                  <td>${s.tanggal_lahir ? new Date(s.tanggal_lahir).toLocaleDateString('id-ID') : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

function openTambahSiswaModal(ortuList) {
  const ortuOptions = ortuList.map(o => `<option value="${o.id_user}">${o.nama_ortu} (@${o.username})</option>`).join('');

  const formHtml = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Username Akun</label>
        <input type="text" id="siswa-user" class="form-control" placeholder="siswa_reza" required>
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="siswa-pass" class="form-control" value="password123" required>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Nama Lengkap Siswa</label>
      <input type="text" id="siswa-nama" class="form-control" placeholder="Reza Rahardian" required>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Asal Sekolah</label>
        <input type="text" id="siswa-sekolah" class="form-control" placeholder="SMA Negeri 3 Jakarta">
      </div>
      <div class="form-group">
        <label class="form-label">Tanggal Lahir</label>
        <input type="date" id="siswa-tgl" class="form-control">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tautkan Orang Tua / Wali</label>
      <select id="siswa-ortu" class="form-control">
        <option value="">-- Tanpa Relasi Orang Tua --</option>
        ${ortuOptions}
      </select>
    </div>
  `;

  showModal('Pendaftaran Siswa Baru', formHtml, [
    { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
    {
      text: 'Simpan Siswa',
      className: 'btn-primary',
      onClick: async (close) => {
        const username = document.getElementById('siswa-user').value;
        const password = document.getElementById('siswa-pass').value;
        const nama_siswa = document.getElementById('siswa-nama').value;
        const asal_sekolah = document.getElementById('siswa-sekolah').value;
        const tanggal_lahir = document.getElementById('siswa-tgl').value;
        const orang_tua_id = document.getElementById('siswa-ortu').value || null;

        if (!username || !password || !nama_siswa) {
          return showToast('Peringatan', 'Lengkapi seluruh data wajib siswa.', 'error');
        }

        try {
          await apiCall('/master/siswa', 'POST', {
            username, password, nama_siswa, asal_sekolah, tanggal_lahir, orang_tua_id, cabang_id: state.user.cabang_id
          });
          showToast('Sukses', 'Siswa baru berhasil didaftarkan.', 'success');
          close();
          navigateTo('siswa');
        } catch (e) {
          showToast('Gagal', e.message, 'error');
        }
      }
    }
  ]);
}

// Master Sesi Bimbingan
async function renderSesiView(content, heading) {
  heading.innerText = 'Jadwal Sesi Bimbingan Belajar';
  content.innerHTML = 'Memuat jadwal sesi...';

  try {
    const [sesiRes, paketRes, mentorRes, siswaRes] = await Promise.all([
      apiCall('/master/sesi'),
      apiCall('/master/paket'),
      apiCall('/master/karyawan'),
      apiCall('/master/siswa')
    ]);

    const mentors = mentorRes.data.filter(k => k.tipe_karyawan === 'guru' || k.role === 'mentor');

    content.innerHTML = `
      <div class="content-header">
        <div class="content-title-desc">
          <h2>Jadwal Sesi & Ruangan Kelas</h2>
          <p>Pengaturan jadwal sesi tatap muka dan tautan ruang belajar online</p>
        </div>
        <div class="action-buttons-group">
          <button class="btn btn-primary" onclick="openJadwalkanSesiModal(${JSON.stringify(paketRes.data).replace(/"/g, '&quot;')}, ${JSON.stringify(mentors).replace(/"/g, '&quot;')}, ${JSON.stringify(siswaRes.data).replace(/"/g, '&quot;')})">
            <i data-lucide="plus-circle"></i> Jadwalkan Sesi Baru
          </button>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Paket Program</th>
                <th>Mentor Pengampu</th>
                <th>Waktu Pelaksanaan</th>
                <th>Ruangan / Link</th>
                <th>Jumlah Siswa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${sesiRes.data.map(s => `
                <tr>
                  <td>#${s.id}</td>
                  <td><strong>${s.nama_paket}</strong><br><small class="text-secondary">${s.nama_layanan}</small></td>
                  <td><span class="badge badge-primary"><i data-lucide="user"></i> ${s.nama_mentor}</span></td>
                  <td>
                    ${new Date(s.waktu_mulai).toLocaleDateString('id-ID', { dateStyle: 'medium' })}<br>
                    <small>${new Date(s.waktu_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${new Date(s.waktu_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small>
                  </td>
                  <td><small>${s.ruangan_link || '-'}</small></td>
                  <td><span class="badge badge-info">${s.total_siswa} Siswa Terdaftar</span></td>
                  <td><span class="badge ${s.status === 'selesai' ? 'badge-success' : 'badge-warning'}">${s.status.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

function openJadwalkanSesiModal(paketList, mentorList, siswaList) {
  const paketOptions = paketList.map(p => `<option value="${p.id}">${p.nama_paket} (${p.nama_layanan})</option>`).join('');
  const mentorOptions = mentorList.map(m => `<option value="${m.id_user}">${m.nama} (${m.spesialisasi || 'Guru'})</option>`).join('');
  const siswaCheckboxes = siswaList.map(s => `
    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; font-size: 0.85rem;">
      <input type="checkbox" name="sesi-siswa-checkbox" value="${s.id_user}">
      <span>${s.nama_siswa} (${s.asal_sekolah || 'Siswa'})</span>
    </label>
  `).join('');

  const formHtml = `
    <div class="form-group">
      <label class="form-label">Paket Kursus</label>
      <select id="sesi-paket-id" class="form-control">${paketOptions}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Mentor / Guru Pengampu</label>
      <select id="sesi-mentor-id" class="form-control">${mentorOptions}</select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Waktu Mulai</label>
        <input type="datetime-local" id="sesi-mulai" class="form-control" required>
      </div>
      <div class="form-group">
        <label class="form-label">Waktu Selesai</label>
        <input type="datetime-local" id="sesi-selesai" class="form-control" required>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Ruangan / Tautan Tatap Muka</label>
      <input type="text" id="sesi-ruangan" class="form-control" placeholder="Ruang A-101 / Zoom: https://meet.bisolpin.ac/room-101">
    </div>
    <div class="form-group">
      <label class="form-label">Daftarkan Siswa ke Sesi Ini Langsung:</label>
      <div style="max-height: 140px; overflow-y: auto; background: #f8fafc; padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        ${siswaCheckboxes || '<span class="text-muted">Belum ada siswa terdaftar</span>'}
      </div>
    </div>
  `;

  showModal('Jadwalkan Sesi Bimbingan Baru', formHtml, [
    { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
    {
      text: 'Simpan Jadwal',
      className: 'btn-primary',
      onClick: async (close) => {
        const paket_id = document.getElementById('sesi-paket-id').value;
        const mentor_id = document.getElementById('sesi-mentor-id').value;
        const waktu_mulai = document.getElementById('sesi-mulai').value;
        const waktu_selesai = document.getElementById('sesi-selesai').value;
        const ruangan_link = document.getElementById('sesi-ruangan').value;

        const checkedSiswa = Array.from(document.querySelectorAll('input[name="sesi-siswa-checkbox"]:checked')).map(el => parseInt(el.value, 10));

        if (!paket_id || !mentor_id || !waktu_mulai || !waktu_selesai) {
          return showToast('Peringatan', 'Lengkapi tanggal dan jam sesi.', 'error');
        }

        try {
          await apiCall('/master/sesi', 'POST', {
            paket_id, mentor_id, waktu_mulai, waktu_selesai, status: 'terjadwal', ruangan_link, siswa_ids: checkedSiswa
          });
          showToast('Sukses', 'Sesi bimbingan berhasil dijadwalkan.', 'success');
          close();
          navigateTo('sesi-bimbingan');
        } catch (e) {
          showToast('Gagal', e.message, 'error');
        }
      }
    }
  ], true);
}

// Transaksi & Keuangan
async function renderTransaksiView(content, heading) {
  heading.innerText = 'Transaksi & Pembayaran Kursus';
  content.innerHTML = 'Memuat transaksi...';

  try {
    const [transRes, siswaRes, paketRes] = await Promise.all([
      apiCall('/transaksi'),
      apiCall('/master/siswa'),
      apiCall('/master/paket')
    ]);

    content.innerHTML = `
      <div class="content-header">
        <div class="content-title-desc">
          <h2>Catatan Pembayaran & Tagihan</h2>
          <p>Registrasi paket bimbingan dan penerimaan pembayaran siswa</p>
        </div>
        <div class="action-buttons-group">
          <button class="btn btn-primary" onclick="openTambahTransaksiModal(${JSON.stringify(siswaRes.data).replace(/"/g, '&quot;')}, ${JSON.stringify(paketRes.data).replace(/"/g, '&quot;')})">
            <i data-lucide="receipt"></i> Catat Pembayaran Baru
          </button>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>No. Transaksi</th>
                <th>Tanggal Bayar</th>
                <th>Nama Siswa</th>
                <th>Paket Kursus</th>
                <th>Nominal Bayar</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${transRes.data.map(t => `
                <tr>
                  <td><code>TRX-${String(t.id).padStart(5, '0')}</code></td>
                  <td>${new Date(t.tanggal_bayar).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                  <td><strong>${t.nama_siswa}</strong><br><small class="text-secondary">Wali: ${t.nama_ortu || '-'}</small></td>
                  <td>${t.nama_paket}</td>
                  <td><strong>Rp ${parseFloat(t.nominal).toLocaleString('id-ID')}</strong></td>
                  <td><span class="badge ${t.status_pembayaran === 'lunas' ? 'badge-success' : 'badge-warning'}">${t.status_pembayaran.toUpperCase()}</span></td>
                  <td>
                    ${t.status_pembayaran === 'cicilan' ? `
                      <button class="btn btn-success btn-sm" onclick="setTransaksiLunas(${t.id})">Tandai Lunas</button>
                    ` : '<span class="text-muted"><i data-lucide="check"></i> Selesai</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

function openTambahTransaksiModal(siswaList, paketList) {
  const siswaOptions = siswaList.map(s => `<option value="${s.id_user}">${s.nama_siswa} (${s.asal_sekolah || 'Siswa'})</option>`).join('');
  const paketOptions = paketList.map(p => `<option value="${p.id}" data-harga="${p.harga_paket}">${p.nama_paket} - Rp ${parseFloat(p.harga_paket).toLocaleString('id-ID')}</option>`).join('');

  const formHtml = `
    <div class="form-group">
      <label class="form-label">Pilih Siswa</label>
      <select id="trans-siswa-id" class="form-control">${siswaOptions}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Pilih Paket Kursus</label>
      <select id="trans-paket-id" class="form-control" onchange="document.getElementById('trans-nominal').value = this.options[this.selectedIndex].getAttribute('data-harga')">
        ${paketOptions}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nominal Pembayaran (Rp)</label>
        <input type="number" id="trans-nominal" class="form-control" value="${paketList[0] ? paketList[0].harga_paket : 0}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Status Pembayaran</label>
        <select id="trans-status" class="form-control">
          <option value="lunas">Lunas</option>
          <option value="cicilan">Cicilan</option>
        </select>
      </div>
    </div>
  `;

  showModal('Pendaftaran Paket & Pembayaran Siswa', formHtml, [
    { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
    {
      text: 'Simpan Pembayaran',
      className: 'btn-primary',
      onClick: async (close) => {
        const siswa_id = document.getElementById('trans-siswa-id').value;
        const paket_id = document.getElementById('trans-paket-id').value;
        const nominal = document.getElementById('trans-nominal').value;
        const status_pembayaran = document.getElementById('trans-status').value;

        try {
          await apiCall('/transaksi', 'POST', { siswa_id, paket_id, nominal, status_pembayaran });
          showToast('Sukses', 'Transaksi berhasil disimpan dan siswa terdaftar ke paket.', 'success');
          close();
          navigateTo('transaksi');
        } catch (e) {
          showToast('Gagal', e.message, 'error');
        }
      }
    }
  ]);
}

async function setTransaksiLunas(transaksiId) {
  try {
    await apiCall(`/transaksi/${transaksiId}/status`, 'PUT', { status_pembayaran: 'lunas' });
    showToast('Sukses', 'Status transaksi diperbarui menjadi LUNAS.', 'success');
    navigateTo('transaksi');
  } catch (e) {
    showToast('Gagal', e.message, 'error');
  }
}

// Laporan Absensi SDM
async function renderLaporanAbsensiView(content, heading) {
  heading.innerText = 'Laporan Kehadiran Karyawan (SDM)';
  content.innerHTML = 'Memuat rekapitulasi presensi...';

  try {
    const res = await apiCall('/absensi/laporan');
    content.innerHTML = `
      <div class="content-header">
        <div class="content-title-desc">
          <h2>Rekapitulasi Kehadiran Staff & Guru</h2>
          <p>Laporan clock-in dan clock-out presensi harian seluruh karyawan</p>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama Karyawan</th>
                <th>Tipe</th>
                <th>Jam Masuk</th>
                <th>Jam Pulang</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.map(a => `
                <tr>
                  <td>${new Date(a.tanggal).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                  <td><strong>${a.nama}</strong><br><small class="text-secondary">${a.nip}</small></td>
                  <td><span class="badge ${a.tipe_karyawan === 'guru' ? 'badge-primary' : 'badge-warning'}">${a.tipe_karyawan.toUpperCase()}</span></td>
                  <td><strong>${a.jam_masuk ? a.jam_masuk.substring(0, 5) : '-'}</strong></td>
                  <td><strong>${a.jam_pulang ? a.jam_pulang.substring(0, 5) : '<span class="text-muted">Belum Pulang</span>'}</strong></td>
                  <td><span class="badge ${a.status === 'hadir' ? 'badge-success' : 'badge-danger'}">${a.status.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

// =====================================================================
// BULK IMPORT MODAL CONTROLLER (CSV / EXCEL)
// =====================================================================
function openBulkImportModal(entityType) {
  const titles = {
    siswa: 'Import Data Siswa (CSV / Excel)',
    karyawan: 'Import Data Karyawan (CSV / Excel)',
    'orang-tua': 'Import Data Orang Tua (CSV / Excel)',
    layanan: 'Import Data Layanan Kursus (CSV / Excel)'
  };

  const sampleHeaders = {
    siswa: 'username,password,nama_siswa,asal_sekolah,tanggal_lahir,orang_tua_username,cabang_id\nsiswa_andi,password123,Andi Santoso,SMA 1 Jakarta,2008-05-14,ortu_andi,1',
    karyawan: 'username,password,nip,nama,tipe_karyawan,role,no_hp,spesialisasi,cabang_id\nguru_dewi,password123,GUR-002,Dewi Lestari,guru,mentor,08123456703,Biologi,1',
    'orang-tua': 'username,password,nama_ortu,no_hp,pekerjaan,alamat,cabang_id\nortu_ahmad,password123,Ahmad Yani,081288889999,Arsitek,Jl. Melati No. 4,1',
    layanan: 'nama_layanan,deskripsi,harga_dasar\nRobotika & AI Kids,Pemrograman robot dan logika AI dasar,1750000'
  };

  const bodyHtml = `
    <div class="file-dropzone" id="dropzone" onclick="document.getElementById('file-input').click()">
      <div class="dropzone-icon"><i data-lucide="upload-cloud"></i></div>
      <div class="dropzone-text" id="dropzone-text">Klik atau seret berkas CSV/Excel ke sini</div>
      <div class="dropzone-subtext">Mendukung format .csv, .xlsx, .xls (Maks. 10MB)</div>
      <input type="file" id="file-input" accept=".csv, .xlsx, .xls" style="display: none;">
    </div>

    <div class="sample-csv-guide">
      <strong>Format Header Kolom yang Diharapkan:</strong>
      <code>${sampleHeaders[entityType] || ''}</code>
    </div>
  `;

  showModal(titles[entityType] || 'Bulk Import Data', bodyHtml, [
    { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
    {
      text: 'Unggah & Proses Import',
      className: 'btn-primary',
      onClick: async (close) => {
        const fileInput = document.getElementById('file-input');
        if (!fileInput.files || fileInput.files.length === 0) {
          return showToast('Peringatan', 'Pilih berkas CSV atau Excel terlebih dahulu.', 'error');
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
          const res = await apiCall(`/import/${entityType}`, 'POST', formData, true);
          showToast('Import Berhasil', res.message, 'success');
          close();
          navigateTo(entityType === 'layanan' ? 'layanan-paket' : entityType);
        } catch (e) {
          showToast('Gagal Import', e.message, 'error');
        }
      }
    }
  ]);

  // File drag & change listeners
  const fileInput = document.getElementById('file-input');
  const dropzoneText = document.getElementById('dropzone-text');
  fileInput.onchange = () => {
    if (fileInput.files.length > 0) {
      dropzoneText.innerText = `Berkas terpilih: ${fileInput.files[0].name}`;
    }
  };
}

// =====================================================================
// VIEW 2: MENTOR (GURU) VIEWS
// =====================================================================
async function renderMentorJadwalView(content, heading) {
  heading.innerText = 'Jadwal Mengajar & Operasional Kelas';
  content.innerHTML = 'Memuat jadwal mengajar mentor...';

  try {
    const res = await apiCall('/operasional/sesi-mengajar');
    content.innerHTML = `
      <div class="content-header">
        <div class="content-title-desc">
          <h2>Daftar Sesi Mengajar Saya</h2>
          <p>Kelola presensi siswa, upload dokumen materi, dan input nilai akademik</p>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Jadwal Sesi</th>
                <th>Paket Kursus</th>
                <th>Ruangan / Tatap Muka</th>
                <th>Siswa & Materi</th>
                <th>Aksi Operasional</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.length === 0 ? `
                <tr><td colspan="5" class="empty-state"><p>Belum ada jadwal mengajar yang ditugaskan.</p></td></tr>
              ` : res.data.map(s => `
                <tr>
                  <td>
                    <strong>${new Date(s.waktu_mulai).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</strong><br>
                    <small>${new Date(s.waktu_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${new Date(s.waktu_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small>
                  </td>
                  <td><strong>${s.nama_paket}</strong><br><small class="text-secondary">${s.nama_layanan}</small></td>
                  <td><small>${s.ruangan_link || '-'}</small></td>
                  <td>
                    <span class="badge badge-info"><i data-lucide="users"></i> ${s.total_siswa} Siswa</span>
                    <span class="badge badge-primary"><i data-lucide="file-text"></i> ${s.total_materi} Modul</span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                      <button class="btn btn-primary btn-sm" onclick="openAbsensiSiswaModal(${s.id})">
                        <i data-lucide="check-square"></i> Absen
                      </button>
                      <button class="btn btn-secondary btn-sm" onclick="openUploadMateriModal(${s.id})">
                        <i data-lucide="upload"></i> Materi
                      </button>
                      <button class="btn btn-success btn-sm" onclick="openInputNilaiModal(${s.id})">
                        <i data-lucide="award"></i> Nilai
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

// Modal Absensi Siswa per Sesi
async function openAbsensiSiswaModal(sesiId) {
  try {
    const res = await apiCall(`/operasional/sesi/${sesiId}/detail`);
    const peserta = res.data.peserta;

    if (peserta.length === 0) {
      return showToast('Informasi', 'Belum ada siswa yang didaftarkan ke sesi ini.', 'info');
    }

    const rowsHtml = peserta.map((p, idx) => `
      <tr data-siswa-id="${p.siswa_id}">
        <td><strong>${p.nama_siswa}</strong><br><small class="text-secondary">${p.asal_sekolah || '-'}</small></td>
        <td>
          <select class="form-control form-control-sm absen-status-select" style="padding: 0.3rem;">
            <option value="Hadir" ${p.status_kehadiran === 'Hadir' ? 'selected' : ''}>Hadir</option>
            <option value="Izin" ${p.status_kehadiran === 'Izin' ? 'selected' : ''}>Izin</option>
            <option value="Sakit" ${p.status_kehadiran === 'Sakit' ? 'selected' : ''}>Sakit</option>
            <option value="Alpa" ${p.status_kehadiran === 'Alpa' ? 'selected' : ''}>Alpa</option>
          </select>
        </td>
      </tr>
    `).join('');

    const bodyHtml = `
      <p style="margin-bottom: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
        Silakan beri status presensi untuk masing-masing siswa pada sesi bimbingan ini:
      </p>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Nama Siswa</th>
              <th style="width: 140px;">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    showModal(`Presensi Siswa Sesi #${sesiId}`, bodyHtml, [
      { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
      {
        text: 'Simpan Presensi',
        className: 'btn-primary',
        onClick: async (close) => {
          const presensiList = [];
          document.querySelectorAll('tr[data-siswa-id]').forEach(tr => {
            const siswa_id = parseInt(tr.getAttribute('data-siswa-id'), 10);
            const status = tr.querySelector('.absen-status-select').value;
            presensiList.push({ siswa_id, status });
          });

          try {
            await apiCall(`/operasional/sesi/${sesiId}/absen-siswa`, 'POST', { presensi: presensiList });
            showToast('Sukses', 'Presensi siswa berhasil disimpan.', 'success');
            close();
          } catch (e) {
            showToast('Gagal', e.message, 'error');
          }
        }
      }
    ]);

  } catch (e) {
    showToast('Gagal', e.message, 'error');
  }
}

// Modal Upload Materi
function openUploadMateriModal(sesiId) {
  const formHtml = `
    <div class="form-group">
      <label class="form-label">Judul Materi / Modul</label>
      <input type="text" id="materi-judul" class="form-control" placeholder="Contoh: Modul 02: Trik Cepat Soal Logika Aljabar" required>
    </div>
    <div class="form-group">
      <label class="form-label">Pilih Berkas Modul (PDF, PPT, DOCX)</label>
      <input type="file" id="materi-file" class="form-control" required>
    </div>
  `;

  showModal(`Upload Materi Sesi #${sesiId}`, formHtml, [
    { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
    {
      text: 'Unggah Materi',
      className: 'btn-primary',
      onClick: async (close) => {
        const judul = document.getElementById('materi-judul').value;
        const fileInput = document.getElementById('materi-file');

        if (!judul || !fileInput.files || fileInput.files.length === 0) {
          return showToast('Peringatan', 'Judul dan berkas modul wajib diisi.', 'error');
        }

        const formData = new FormData();
        formData.append('judul', judul);
        formData.append('file', fileInput.files[0]);

        try {
          await apiCall(`/operasional/sesi/${sesiId}/materi`, 'POST', formData, true);
          showToast('Sukses', 'Materi berhasil diunggah.', 'success');
          close();
          navigateTo('jadwal-mengajar');
        } catch (e) {
          showToast('Gagal', e.message, 'error');
        }
      }
    }
  ]);
}

// Modal Input Nilai
async function openInputNilaiModal(sesiId) {
  try {
    const res = await apiCall(`/operasional/sesi/${sesiId}/detail`);
    const peserta = res.data.peserta;

    if (peserta.length === 0) {
      return showToast('Informasi', 'Belum ada siswa yang didaftarkan ke sesi ini.', 'info');
    }

    const rowsHtml = peserta.map(p => `
      <tr data-siswa-id="${p.siswa_id}">
        <td><strong>${p.nama_siswa}</strong></td>
        <td style="width: 100px;">
          <input type="number" step="0.1" class="form-control form-control-sm nilai-input" value="${p.nilai || 80}" min="0" max="100">
        </td>
        <td>
          <input type="text" class="form-control form-control-sm catatan-input" value="${p.catatan_nilai || ''}" placeholder="Catatan evaluasi belajar...">
        </td>
      </tr>
    `).join('');

    const bodyHtml = `
      <p style="margin-bottom: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
        Input nilai hasil latihan/evaluasi serta catatan perkembangan pemahaman siswa:
      </p>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Nama Siswa</th>
              <th>Nilai (0-100)</th>
              <th>Catatan / Feedback</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    showModal(`Evaluasi Nilai Siswa Sesi #${sesiId}`, bodyHtml, [
      { text: 'Batal', className: 'btn-secondary', onClick: (close) => close() },
      {
        text: 'Simpan Nilai',
        className: 'btn-primary',
        onClick: async (close) => {
          const penilaianList = [];
          document.querySelectorAll('tr[data-siswa-id]').forEach(tr => {
            const siswa_id = parseInt(tr.getAttribute('data-siswa-id'), 10);
            const nilai = parseFloat(tr.querySelector('.nilai-input').value) || 0;
            const catatan = tr.querySelector('.catatan-input').value;
            penilaianList.push({ siswa_id, nilai, catatan });
          });

          try {
            await apiCall(`/operasional/sesi/${sesiId}/nilai`, 'POST', { penilaian: penilaianList });
            showToast('Sukses', 'Penilaian siswa berhasil disimpan.', 'success');
            close();
          } catch (e) {
            showToast('Gagal', e.message, 'error');
          }
        }
      }
    ], true);

  } catch (e) {
    showToast('Gagal', e.message, 'error');
  }
}

// Mentor Presensi Pribadi
async function renderMentorPresensiView(content, heading) {
  heading.innerText = 'Presensi Harian Pribadi';
  content.innerHTML = `
    <div class="card" style="max-width: 500px; margin: 0 auto; text-align: center; padding: 2rem;">
      <h3 style="margin-bottom: 0.5rem;">Clock-in & Clock-out Kehadiran</h3>
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Catat jam kehadiran mengajar Anda setiap hari.</p>
      
      <div style="display: flex; justify-content: center; gap: 1rem;">
        <button class="btn btn-success" onclick="triggerClockIn()"><i data-lucide="log-in"></i> Clock-In Sekarang</button>
        <button class="btn btn-danger" onclick="triggerClockOut()"><i data-lucide="log-out"></i> Clock-Out Sekarang</button>
      </div>
    </div>
  `;
  lucide.createIcons();
}

// =====================================================================
// VIEW 3: SISWA VIEWS
// =====================================================================
async function renderSiswaJadwalView(content, heading) {
  heading.innerText = 'Jadwal Kursus & Kelas Saya';
  content.innerHTML = 'Memuat jadwal bimbingan...';

  try {
    const res = await apiCall('/portal/jadwal');
    content.innerHTML = `
      <div class="content-header">
        <div class="content-title-desc">
          <h2>Jadwal Bimbingan Belajar Aktif</h2>
          <p>Daftar sesi pertemuan kelas intensif dan tautan tatap muka online</p>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Waktu Pertemuan</th>
                <th>Program Paket</th>
                <th>Mentor Pengajar</th>
                <th>Ruangan / Link</th>
                <th>Status Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.jadwal.length === 0 ? `
                <tr><td colspan="5" class="empty-state"><p>Belum ada jadwal sesi belajar yang aktif.</p></td></tr>
              ` : res.data.jadwal.map(j => `
                <tr>
                  <td>
                    <strong>${new Date(j.waktu_mulai).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</strong><br>
                    <small>${new Date(j.waktu_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</small>
                  </td>
                  <td><strong>${j.nama_paket}</strong><br><small class="text-secondary">${j.nama_layanan}</small></td>
                  <td><span class="badge badge-primary"><i data-lucide="user"></i> ${j.nama_mentor}</span></td>
                  <td><small>${j.ruangan_link || '-'}</small></td>
                  <td><span class="badge ${j.status_absen === 'Hadir' ? 'badge-success' : 'badge-warning'}">${j.status_absen || 'Belum Presensi'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

async function renderSiswaMateriView(content, heading) {
  heading.innerText = 'Modul & Materi Pembelajaran';
  content.innerHTML = 'Memuat berkas modul...';

  try {
    const res = await apiCall('/portal/materi');
    content.innerHTML = `
      <div class="content-header">
        <div class="content-title-desc">
          <h2>Unduh Materi & Modul</h2>
          <p>Materi presentasi, latihan soal, dan pembahasan dari mentor</p>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Judul Modul</th>
                <th>Paket Kursus</th>
                <th>Mentor</th>
                <th>Tanggal Unggah</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.length === 0 ? `
                <tr><td colspan="5" class="empty-state"><p>Belum ada materi pembelajaran yang diunggah.</p></td></tr>
              ` : res.data.map(m => `
                <tr>
                  <td><strong>${m.judul}</strong></td>
                  <td>${m.nama_paket}</td>
                  <td>${m.nama_mentor}</td>
                  <td><small>${new Date(m.created_at).toLocaleDateString('id-ID')}</small></td>
                  <td>
                    <a href="${m.file_path}" target="_blank" class="btn btn-primary btn-sm">
                      <i data-lucide="download"></i> Unduh Berkas
                    </a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

async function renderSiswaRaporView(content, heading) {
  heading.innerText = 'Rapor Nilai & Evaluasi Belajar';
  content.innerHTML = 'Memuat rekap evaluasi...';

  try {
    const res = await apiCall('/portal/riwayat');
    const stats = res.data.statistik;

    content.innerHTML = `
      <!-- KPI RAPOR -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrapper green"><i data-lucide="check-circle"></i></div>
          <div>
            <div class="kpi-info-label">Tingkat Kehadiran</div>
            <div class="kpi-value">${stats.persentase_kehadiran}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrapper blue"><i data-lucide="award"></i></div>
          <div>
            <div class="kpi-info-label">Rata-rata Nilai</div>
            <div class="kpi-value">${stats.rata_rata_nilai}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrapper amber"><i data-lucide="calendar"></i></div>
          <div>
            <div class="kpi-info-label">Total Pertemuan</div>
            <div class="kpi-value">${stats.total_pertemuan_tercatat} Sesi</div>
          </div>
        </div>
      </div>

      <!-- TABEL EVALUASI NILAI -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="file-text"></i> Nilai Hasil Latihan & Catatan Mentor</h3>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Pertemuan</th>
                <th>Paket Kursus</th>
                <th>Mentor</th>
                <th>Nilai</th>
                <th>Catatan Evaluasi</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.riwayat_penilaian.length === 0 ? `
                <tr><td colspan="5" class="empty-state"><p>Belum ada nilai evaluasi yang diinput mentor.</p></td></tr>
              ` : res.data.riwayat_penilaian.map(n => `
                <tr>
                  <td>${new Date(n.waktu_mulai).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                  <td>${n.nama_paket}</td>
                  <td>${n.nama_mentor}</td>
                  <td><strong style="font-size: 1.1rem; color: var(--primary);">${n.nilai}</strong></td>
                  <td><small>${n.catatan || '-'}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

async function renderSiswaTagihanView(content, heading) {
  heading.innerText = 'Riwayat Tagihan & Pembayaran Kursus';
  content.innerHTML = 'Memuat transaksi pembayaran...';

  try {
    const res = await apiCall('/portal/transaksi');
    content.innerHTML = `
      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>No. Bukti</th>
                <th>Tanggal Pembayaran</th>
                <th>Paket Kursus</th>
                <th>Nominal</th>
                <th>Status Pembayaran</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.transaksi.length === 0 ? `
                <tr><td colspan="5" class="empty-state"><p>Belum ada riwayat transaksi kursus.</p></td></tr>
              ` : res.data.transaksi.map(t => `
                <tr>
                  <td><code>TRX-${String(t.id).padStart(5, '0')}</code></td>
                  <td>${new Date(t.tanggal_bayar).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                  <td><strong>${t.nama_paket}</strong><br><small class="text-secondary">${t.nama_layanan}</small></td>
                  <td><strong>Rp ${parseFloat(t.nominal).toLocaleString('id-ID')}</strong></td>
                  <td><span class="badge ${t.status_pembayaran === 'lunas' ? 'badge-success' : 'badge-warning'}">${t.status_pembayaran.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

// =====================================================================
// VIEW 4: ORANG TUA VIEWS
// =====================================================================
async function renderOrtuMonitoringView(content, heading) {
  heading.innerText = 'Pantau Kehadiran & Nilai Akademik Anak';
  content.innerHTML = 'Memuat data pemantauan anak...';

  try {
    const childParam = state.selectedChildId ? `?siswa_id=${state.selectedChildId}` : '';
    const res = await apiCall(`/portal/riwayat${childParam}`);
    const stats = res.data.statistik;
    const daftarAnak = res.data.daftar_anak || [];

    const childSelectorHtml = daftarAnak.length > 1 ? `
      <div style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
        <label style="font-weight: 700; font-size: 0.85rem;">Pilih Anak:</label>
        <select class="form-control" style="max-width: 260px;" onchange="state.selectedChildId = this.value; renderOrtuMonitoringView(document.getElementById('page-content'), document.getElementById('page-heading'))">
          ${daftarAnak.map(a => `<option value="${a.id_user}" ${a.id_user === res.data.siswa_id ? 'selected' : ''}>${a.nama_siswa}</option>`).join('')}
        </select>
      </div>
    ` : '';

    content.innerHTML = `
      ${childSelectorHtml}

      <!-- STATISTIK KEHADIRAN & NILAI ANAK -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrapper green"><i data-lucide="check-circle"></i></div>
          <div>
            <div class="kpi-info-label">Kehadiran Kelas Anak</div>
            <div class="kpi-value">${stats.persentase_kehadiran}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrapper blue"><i data-lucide="award"></i></div>
          <div>
            <div class="kpi-info-label">Rata-rata Nilai Anak</div>
            <div class="kpi-value">${stats.rata_rata_nilai}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrapper amber"><i data-lucide="book-check"></i></div>
          <div>
            <div class="kpi-info-label">Total Sesi Bimbingan</div>
            <div class="kpi-value">${stats.total_pertemuan_tercatat} Sesi</div>
          </div>
        </div>
      </div>

      <!-- TABEL CATATAN EVALUASI & NILAI ANAK -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="file-text"></i> Riwayat Nilai & Evaluasi dari Guru</h3>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Pertemuan</th>
                <th>Paket Kursus</th>
                <th>Guru / Mentor</th>
                <th>Nilai Anak</th>
                <th>Catatan Perkembangan</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.riwayat_penilaian.length === 0 ? `
                <tr><td colspan="5" class="empty-state"><p>Belum ada evaluasi nilai anak.</p></td></tr>
              ` : res.data.riwayat_penilaian.map(n => `
                <tr>
                  <td>${new Date(n.waktu_mulai).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                  <td>${n.nama_paket}</td>
                  <td>${n.nama_mentor}</td>
                  <td><strong style="font-size: 1.1rem; color: var(--primary);">${n.nilai}</strong></td>
                  <td><small>${n.catatan || '-'}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- TABEL HISTORI KEHADIRAN SESI BELAJAR -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i data-lucide="clipboard-check"></i> Histori Presensi Anak per Sesi</h3>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Waktu Sesi</th>
                <th>Paket Kursus</th>
                <th>Guru</th>
                <th>Status Presensi</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.riwayat_absensi.length === 0 ? `
                <tr><td colspan="4" class="empty-state"><p>Belum ada catatan presensi anak.</p></td></tr>
              ` : res.data.riwayat_absensi.map(a => `
                <tr>
                  <td>${new Date(a.waktu_mulai).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                  <td>${a.nama_paket}</td>
                  <td>${a.nama_mentor}</td>
                  <td><span class="badge ${a.status === 'Hadir' ? 'badge-success' : 'badge-danger'}">${a.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

async function renderOrtuJadwalView(content, heading) {
  heading.innerText = 'Jadwal Kursus & Belajar Anak';
  content.innerHTML = 'Memuat jadwal anak...';

  try {
    const childParam = state.selectedChildId ? `?siswa_id=${state.selectedChildId}` : '';
    const res = await apiCall(`/portal/jadwal${childParam}`);
    content.innerHTML = `
      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Waktu Belajar</th>
                <th>Program Paket</th>
                <th>Mentor Pengajar</th>
                <th>Ruangan / Tatap Maya</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.jadwal.length === 0 ? `
                <tr><td colspan="4" class="empty-state"><p>Belum ada jadwal belajar anak.</p></td></tr>
              ` : res.data.jadwal.map(j => `
                <tr>
                  <td>
                    <strong>${new Date(j.waktu_mulai).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</strong><br>
                    <small>${new Date(j.waktu_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</small>
                  </td>
                  <td><strong>${j.nama_paket}</strong></td>
                  <td><span class="badge badge-primary">${j.nama_mentor}</span></td>
                  <td><small>${j.ruangan_link || '-'}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

async function renderOrtuTagihanView(content, heading) {
  heading.innerText = 'Riwayat Tagihan & Pembayaran Paket Anak';
  content.innerHTML = 'Memuat tagihan anak...';

  try {
    const childParam = state.selectedChildId ? `?siswa_id=${state.selectedChildId}` : '';
    const res = await apiCall(`/portal/transaksi${childParam}`);
    content.innerHTML = `
      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>No. Bukti Transaksi</th>
                <th>Tanggal Bayar</th>
                <th>Paket Kursus</th>
                <th>Nominal</th>
                <th>Status Pembayaran</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.transaksi.length === 0 ? `
                <tr><td colspan="5" class="empty-state"><p>Belum ada catatan tagihan.</p></td></tr>
              ` : res.data.transaksi.map(t => `
                <tr>
                  <td><code>TRX-${String(t.id).padStart(5, '0')}</code></td>
                  <td>${new Date(t.tanggal_bayar).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                  <td><strong>${t.nama_paket}</strong><br><small class="text-secondary">${t.nama_layanan}</small></td>
                  <td><strong>Rp ${parseFloat(t.nominal).toLocaleString('id-ID')}</strong></td>
                  <td><span class="badge ${t.status_pembayaran === 'lunas' ? 'badge-success' : 'badge-warning'}">${t.status_pembayaran.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    lucide.createIcons();
  } catch (e) {
    content.innerHTML = `<p class="text-danger">${e.message}</p>`;
  }
}

// =====================================================================
// APPLICATION INITIALIZATION
// =====================================================================
function renderApp() {
  if (!state.token || !state.user) {
    renderLoginScreen();
  } else {
    renderDashboardShell();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
