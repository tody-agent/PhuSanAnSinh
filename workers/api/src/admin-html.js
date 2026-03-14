/**
 * Admin Panel HTML — Inline SPA for Cloudflare Workers
 * Mobile-First Mini CRM
 */
export const ADMIN_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>An Sinh Admin — Mini CRM</title>
<style>
:root {
  --bg: #0f1117; --bg2: #1a1d27; --bg3: #242836;
  --text: #e8eaf0; --text2: #9ca3af; --text3: #6b7280;
  --accent: #3b82f6; --accent2: #2563eb; --accent-glow: rgba(59,130,246,.15);
  --success: #22c55e; --warning: #f59e0b; --danger: #ef4444;
  --border: #2d3348; --radius: 12px; --radius-sm: 8px;
  --shadow: 0 4px 24px rgba(0,0,0,.3);
  --font: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --nav-h: 64px;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:var(--font); background:var(--bg); color:var(--text); min-height:100dvh; padding-bottom:calc(var(--nav-h) + 16px); -webkit-font-smoothing:antialiased; }
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* ── Utility ── */
.hidden { display:none!important; }
.loading { opacity:.5; pointer-events:none; }

/* ── Login ── */
#login-page { display:flex; align-items:center; justify-content:center; min-height:100dvh; padding:20px; }
.login-card { background:var(--bg2); border:1px solid var(--border); border-radius:16px; padding:32px 24px; width:100%; max-width:380px; }
.login-card h1 { font-size:24px; font-weight:700; margin-bottom:4px; text-align:center; }
.login-card p { color:var(--text2); font-size:14px; text-align:center; margin-bottom:24px; }
.login-card .logo { font-size:40px; text-align:center; margin-bottom:12px; }
.form-group { margin-bottom:16px; }
.form-group label { display:block; font-size:13px; font-weight:500; color:var(--text2); margin-bottom:6px; }
.form-input { width:100%; padding:12px 14px; background:var(--bg3); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text); font-size:15px; outline:none; transition:border .2s; }
.form-input:focus { border-color:var(--accent); }
.btn { width:100%; padding:13px; background:var(--accent); color:#fff; border:none; border-radius:var(--radius-sm); font-size:15px; font-weight:600; cursor:pointer; transition:all .2s; }
.btn:active { transform:scale(.97); }
.btn:disabled { opacity:.5; }
.login-error { color:var(--danger); font-size:13px; text-align:center; margin-top:12px; min-height:20px; }

/* ── Header ── */
.app-header { position:sticky; top:0; z-index:50; background:rgba(15,17,23,.85); backdrop-filter:blur(12px); border-bottom:1px solid var(--border); padding:12px 16px; display:flex; align-items:center; justify-content:space-between; }
.app-header h2 { font-size:16px; font-weight:600; }
.header-user { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text2); }
.header-user .avatar { width:28px; height:28px; background:var(--accent); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; color:#fff; }
.logout-btn { background:none; border:1px solid var(--border); color:var(--text2); padding:5px 10px; border-radius:6px; font-size:12px; cursor:pointer; }

/* ── Bottom Nav ── */
.bottom-nav { position:fixed; bottom:0; left:0; right:0; z-index:50; background:rgba(15,17,23,.92); backdrop-filter:blur(12px); border-top:1px solid var(--border); display:flex; height:var(--nav-h); padding-bottom:env(safe-area-inset-bottom); }
.nav-item { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; color:var(--text3); font-size:10px; font-weight:500; cursor:pointer; transition:color .2s; text-decoration:none; -webkit-tap-highlight-color:transparent; }
.nav-item.active { color:var(--accent); }
.nav-item .nav-icon { font-size:20px; }
.nav-item .badge { position:absolute; top:6px; right:calc(50% - 18px); background:var(--danger); color:#fff; font-size:9px; font-weight:700; padding:1px 5px; border-radius:10px; min-width:16px; text-align:center; }

/* ── Pages ── */
.page { padding:16px; display:none; }
.page.active { display:block; }

/* ── Cards ── */
.metric-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
.metric-card { background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius); padding:16px; }
.metric-card .metric-icon { font-size:24px; margin-bottom:8px; }
.metric-card .metric-value { font-size:28px; font-weight:700; }
.metric-card .metric-label { font-size:12px; color:var(--text2); margin-top:2px; }

.section-title { font-size:15px; font-weight:600; margin-bottom:12px; color:var(--text2); }

/* ── List items ── */
.list-item { background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius); padding:14px; margin-bottom:10px; transition:background .15s; cursor:pointer; }
.list-item:active { background:var(--bg3); }
.list-row { display:flex; justify-content:space-between; align-items:center; }
.list-name { font-size:15px; font-weight:600; }
.list-phone { font-size:13px; color:var(--text2); margin-top:2px; }
.list-service { font-size:12px; color:var(--accent); margin-top:4px; }
.list-time { font-size:11px; color:var(--text3); margin-top:4px; }
.list-note { font-size:12px; color:var(--text2); margin-top:6px; font-style:italic; }

/* ── Status pills ── */
.pill { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
.pill-pending { background:rgba(245,158,11,.15); color:var(--warning); }
.pill-confirmed { background:rgba(59,130,246,.15); color:var(--accent); }
.pill-completed { background:rgba(34,197,94,.15); color:var(--success); }
.pill-cancelled { background:rgba(239,68,68,.15); color:var(--danger); }
.pill-waiting { background:rgba(245,158,11,.15); color:var(--warning); }
.pill-called { background:rgba(59,130,246,.15); color:var(--accent); }

/* ── Stars ── */
.stars { color:#fbbf24; letter-spacing:2px; font-size:14px; }

/* ── Filter chips ── */
.filter-row { display:flex; gap:8px; overflow-x:auto; padding-bottom:12px; -webkit-overflow-scrolling:touch; }
.filter-row::-webkit-scrollbar { display:none; }
.chip { padding:6px 14px; border-radius:20px; font-size:12px; font-weight:500; background:var(--bg3); border:1px solid var(--border); color:var(--text2); white-space:nowrap; cursor:pointer; transition:all .15s; }
.chip.active { background:var(--accent-glow); border-color:var(--accent); color:var(--accent); }

/* ── Queue special ── */
.queue-room { background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius); padding:16px; margin-bottom:12px; }
.queue-room-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
.queue-room-name { font-weight:600; font-size:15px; }
.queue-current-num { font-size:36px; font-weight:700; color:var(--accent); text-align:center; padding:16px 0; }
.queue-current-name { text-align:center; color:var(--text2); font-size:14px; margin-bottom:12px; }
.btn-call-next { width:100%; padding:12px; background:var(--success); color:#fff; border:none; border-radius:var(--radius-sm); font-size:14px; font-weight:600; cursor:pointer; }
.btn-call-next:active { transform:scale(.97); }

/* ── Empty state ── */
.empty { text-align:center; padding:40px 20px; color:var(--text3); }
.empty .empty-icon { font-size:48px; margin-bottom:12px; }
.empty p { font-size:14px; }

/* ── Detail modal (bottom sheet) ── */
.modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:100; display:none; }
.modal-backdrop.show { display:block; }
.modal-sheet { position:fixed; bottom:0; left:0; right:0; z-index:101; background:var(--bg2); border-radius:16px 16px 0 0; padding:20px 16px; padding-bottom:calc(20px + env(safe-area-inset-bottom)); max-height:80dvh; overflow-y:auto; transform:translateY(100%); transition:transform .3s ease; }
.modal-sheet.show { transform:translateY(0); }
.modal-handle { width:36px; height:4px; background:var(--border); border-radius:2px; margin:0 auto 16px; }
.modal-title { font-size:18px; font-weight:700; margin-bottom:16px; }
.modal-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border); }
.modal-row:last-child { border-bottom:none; }
.modal-label { color:var(--text2); font-size:13px; }
.modal-value { font-size:14px; font-weight:500; text-align:right; max-width:60%; }
.modal-actions { display:flex; gap:8px; margin-top:16px; }
.modal-actions .btn { flex:1; padding:10px; font-size:13px; }
.btn-success { background:var(--success); }
.btn-danger { background:var(--danger); }
.btn-outline { background:transparent; border:1px solid var(--border); color:var(--text); }

/* ── Refresh indicator ── */
.pull-indicator { text-align:center; padding:8px; color:var(--text3); font-size:12px; display:none; }
</style>
</head>
<body>

<!-- ═══════ LOGIN ═══════ -->
<div id="login-page">
  <div class="login-card">
    <div class="logo">🏥</div>
    <h1>Admin Panel</h1>
    <p>Đăng nhập để quản lý phòng khám</p>
    <div class="form-group">
      <label>Tài khoản</label>
      <input class="form-input" id="login-user" type="text" placeholder="admin" autocomplete="username" />
    </div>
    <div class="form-group">
      <label>Mật khẩu</label>
      <input class="form-input" id="login-pass" type="password" placeholder="••••••••" autocomplete="current-password" />
    </div>
    <button class="btn" id="login-btn" onclick="doLogin()">Đăng nhập</button>
    <div class="login-error" id="login-error"></div>
  </div>
</div>

<!-- ═══════ APP ═══════ -->
<div id="app" class="hidden">
  <!-- Header -->
  <header class="app-header">
    <h2 id="page-title">Dashboard</h2>
    <div class="header-user">
      <div class="avatar" id="user-avatar">A</div>
      <button class="logout-btn" onclick="doLogout()">Đăng xuất</button>
    </div>
  </header>

  <!-- Pages -->
  <main>
    <!-- Dashboard -->
    <div class="page active" id="page-dashboard">
      <div class="metric-grid" id="metrics"></div>
      <div class="section-title">Đặt lịch gần đây</div>
      <div id="recent-bookings"></div>
    </div>

    <!-- Bookings -->
    <div class="page" id="page-bookings">
      <div class="filter-row" id="booking-filters">
        <div class="chip active" data-filter="">Tất cả</div>
        <div class="chip" data-filter="pending">Chờ xác nhận</div>
        <div class="chip" data-filter="confirmed">Đã xác nhận</div>
        <div class="chip" data-filter="completed">Hoàn thành</div>
        <div class="chip" data-filter="cancelled">Đã hủy</div>
      </div>
      <div id="bookings-list"></div>
    </div>

    <!-- Reviews -->
    <div class="page" id="page-reviews">
      <div class="filter-row" id="review-filters">
        <div class="chip active" data-filter="">Tất cả</div>
        <div class="chip" data-filter="5">⭐ 5</div>
        <div class="chip" data-filter="4">⭐ 4</div>
        <div class="chip" data-filter="3">⭐ 3</div>
        <div class="chip" data-filter="1">⭐ 1-2</div>
      </div>
      <div id="review-stats"></div>
      <div id="reviews-list"></div>
    </div>

    <!-- Queue -->
    <div class="page" id="page-queue">
      <div id="queue-rooms"></div>
      <div class="section-title" style="margin-top:20px">Danh sách chờ hôm nay</div>
      <div id="queue-list"></div>
    </div>

    <!-- Leads -->
    <div class="page" id="page-leads">
      <div class="metric-grid" id="lead-pipeline"></div>
      <div class="filter-row" id="lead-filters">
        <div class="chip active" data-filter="">Tất cả</div>
        <div class="chip" data-filter="pending">Mới</div>
        <div class="chip" data-filter="confirmed">Đang xử lý</div>
        <div class="chip" data-filter="completed">Chốt</div>
      </div>
      <div id="leads-list"></div>
    </div>
  </main>

  <!-- Bottom Nav -->
  <nav class="bottom-nav">
    <a class="nav-item active" data-page="dashboard"><span class="nav-icon">📊</span>Tổng quan</a>
    <a class="nav-item" data-page="bookings"><span class="nav-icon">🗓️</span>Đặt lịch</a>
    <a class="nav-item" data-page="reviews"><span class="nav-icon">⭐</span>Đánh giá</a>
    <a class="nav-item" data-page="queue"><span class="nav-icon">🎫</span>Số thứ tự</a>
    <a class="nav-item" data-page="leads"><span class="nav-icon">📈</span>Leads</a>
  </nav>
</div>

<!-- ═══════ Detail Modal ═══════ -->
<div class="modal-backdrop" id="modal-backdrop" onclick="closeModal()"></div>
<div class="modal-sheet" id="modal-sheet">
  <div class="modal-handle"></div>
  <div id="modal-content"></div>
</div>

<script>
const API = location.origin;
let TOKEN = localStorage.getItem('ansinh_token');
let CURRENT_PAGE = 'dashboard';
let FILTER = {};

// ── API Helper ──
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
  const res = await fetch(API + path, { ...opts, headers: { ...headers, ...(opts.headers||{}) } });
  const data = await res.json();
  if (res.status === 401) { doLogout(); throw new Error('Session expired'); }
  if (!res.ok) throw new Error(data.error || data.message || 'Error');
  return data;
}

// ── Auth ──
async function doLogin() {
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  btn.disabled = true; errEl.textContent = '';
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: document.getElementById('login-user').value,
        password: document.getElementById('login-pass').value
      })
    });
    TOKEN = data.token;
    localStorage.setItem('ansinh_token', TOKEN);
    showApp();
  } catch (e) { errEl.textContent = e.message; }
  btn.disabled = false;
}

function doLogout() {
  TOKEN = null; localStorage.removeItem('ansinh_token');
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

async function showApp() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  navigate('dashboard');
}

// ── Navigation ──
document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => navigate(el.dataset.page));
});

function navigate(page) {
  CURRENT_PAGE = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  const titles = { dashboard:'Tổng quan', bookings:'Đặt lịch', reviews:'Đánh giá', queue:'Số thứ tự', leads:'Leads' };
  document.getElementById('page-title').textContent = titles[page] || page;
  loadPage(page);
}

async function loadPage(page) {
  try {
    if (page === 'dashboard') await loadDashboard();
    else if (page === 'bookings') await loadBookings();
    else if (page === 'reviews') await loadReviews();
    else if (page === 'queue') await loadQueue();
    else if (page === 'leads') await loadLeads();
  } catch(e) { console.error(e); }
}

// ── Dashboard ──
async function loadDashboard() {
  const d = await api('/api/dashboard');
  document.getElementById('metrics').innerHTML = [
    metricCard('🗓️', d.bookings.today, 'Đặt lịch hôm nay'),
    metricCard('⭐', d.reviews.avgRating || '—', 'Đánh giá TB'),
    metricCard('🎫', d.queue.waiting || 0, 'Đang chờ khám'),
    metricCard('📊', d.bookings.total, 'Tổng đặt lịch'),
  ].join('');
  document.getElementById('recent-bookings').innerHTML = d.recentBookings.length
    ? d.recentBookings.map(b => bookingItem(b)).join('')
    : '<div class="empty"><div class="empty-icon">📋</div><p>Chưa có đặt lịch</p></div>';
}

function metricCard(icon, value, label) {
  return '<div class="metric-card"><div class="metric-icon">' + icon + '</div><div class="metric-value">' + value + '</div><div class="metric-label">' + label + '</div></div>';
}

// ── Bookings ──
setupFilters('booking-filters', async (f) => { FILTER.bookings = f; await loadBookings(); });

async function loadBookings() {
  const qs = FILTER.bookings ? '?status=' + FILTER.bookings : '';
  const d = await api('/api/bookings' + qs);
  document.getElementById('bookings-list').innerHTML = d.bookings.length
    ? d.bookings.map(b => bookingItem(b)).join('')
    : '<div class="empty"><div class="empty-icon">📋</div><p>Không có đặt lịch</p></div>';
}

function bookingItem(b) {
  const t = new Date(b.created_at).toLocaleString('vi-VN', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' });
  return '<div class="list-item" onclick="showBookingDetail(\\'' + b.id + '\\')">'
    + '<div class="list-row"><span class="list-name">' + (b.name||'Ẩn danh') + '</span><span class="pill pill-' + b.status + '">' + statusLabel(b.status) + '</span></div>'
    + '<div class="list-phone">📞 ' + (b.phone||'') + '</div>'
    + (b.service ? '<div class="list-service">🏥 ' + b.service + '</div>' : '')
    + '<div class="list-time">⏰ ' + t + (b.time_slot ? ' · ' + b.time_slot : '') + '</div>'
    + (b.note ? '<div class="list-note">💬 ' + b.note + '</div>' : '')
    + '</div>';
}

function statusLabel(s) {
  const m = { pending:'Chờ XN', confirmed:'Đã XN', completed:'Hoàn thành', cancelled:'Đã hủy', waiting:'Đang chờ', called:'Đã gọi' };
  return m[s] || s;
}

async function showBookingDetail(id) {
  const d = await api('/api/bookings?status=');  // We'll find it in the list
  // Simple: open modal with action buttons
  openModal('<div class="modal-title">Cập nhật trạng thái</div>'
    + '<div class="modal-actions">'
    + '<button class="btn btn-success" onclick="updateBooking(\\'' + id + '\\',\\'confirmed\\')">✅ Xác nhận</button>'
    + '<button class="btn" onclick="updateBooking(\\'' + id + '\\',\\'completed\\')">✔️ Hoàn thành</button>'
    + '<button class="btn btn-danger" onclick="updateBooking(\\'' + id + '\\',\\'cancelled\\')">❌ Hủy</button>'
    + '</div>');
}

async function updateBooking(id, status) {
  await api('/api/bookings/' + id, { method:'PATCH', body:JSON.stringify({ status }) });
  closeModal(); loadBookings();
}

// ── Reviews ──
setupFilters('review-filters', async (f) => { FILTER.reviews = f; await loadReviews(); });

async function loadReviews() {
  const qs = FILTER.reviews ? '?rating=' + FILTER.reviews : '';
  const d = await api('/api/reviews' + qs);
  document.getElementById('review-stats').innerHTML = '<div style="text-align:center;padding:12px 0;margin-bottom:12px"><span style="font-size:36px;font-weight:700">' + (d.stats.avg_rating||'—') + '</span><span style="font-size:14px;color:var(--text2)"> / 5 ⭐ (' + (d.stats.total_reviews||0) + ' đánh giá)</span></div>';
  document.getElementById('reviews-list').innerHTML = d.reviews.length
    ? d.reviews.map(reviewItem).join('')
    : '<div class="empty"><div class="empty-icon">⭐</div><p>Chưa có đánh giá</p></div>';
}

function reviewItem(r) {
  const stars = '★'.repeat(r.rating||0) + '☆'.repeat(5-(r.rating||0));
  const t = new Date(r.created_at).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  return '<div class="list-item">'
    + '<div class="list-row"><span class="list-name">' + (r.name||'Ẩn danh') + '</span><span class="stars">' + stars + '</span></div>'
    + (r.service ? '<div class="list-service">🏥 ' + r.service + '</div>' : '')
    + (r.review_text ? '<div class="list-note">"' + r.review_text + '"</div>' : '')
    + (r.tags ? '<div style="margin-top:4px;font-size:12px;color:var(--accent)">' + r.tags + '</div>' : '')
    + '<div class="list-time">' + t + '</div>'
    + (r.admin_response ? '<div style="margin-top:8px;padding:8px;background:var(--bg3);border-radius:8px;font-size:12px"><strong>Phản hồi:</strong> ' + r.admin_response + '</div>' : '')
    + '</div>';
}

// ── Queue ──
async function loadQueue() {
  const [configD, currentD, ticketsD] = await Promise.all([
    api('/api/queue/config'), api('/api/queue/current'), api('/api/queue/tickets')
  ]);
  const current = currentD.data || {};
  document.getElementById('queue-rooms').innerHTML = (configD.data||[]).map(room => {
    const cur = current[room.roomId] || {};
    return '<div class="queue-room">'
      + '<div class="queue-room-header"><span class="queue-room-name">🚪 ' + room.roomId + ' — ' + room.doctorName + '</span></div>'
      + '<div class="queue-current-num">' + (cur.queueNumber || '—') + '</div>'
      + '<div class="queue-current-name">' + (cur.customerName || 'Chưa gọi') + '</div>'
      + '<button class="btn-call-next" onclick="callNext(\\'' + room.roomId + '\\')">📢 Gọi số tiếp theo</button>'
      + '</div>';
  }).join('') || '<div class="empty"><div class="empty-icon">🚪</div><p>Chưa cấu hình phòng</p></div>';

  const waiting = (ticketsD.tickets||[]).filter(t => t.status === 'waiting');
  document.getElementById('queue-list').innerHTML = waiting.length
    ? waiting.map(t => '<div class="list-item"><div class="list-row"><span class="list-name">' + t.ticket_number + ' — ' + t.name + '</span><span class="pill pill-' + t.status + '">' + statusLabel(t.status) + '</span></div><div class="list-phone">📞 ' + t.phone + ' · 🏥 ' + (t.service||'') + '</div></div>').join('')
    : '<div class="empty"><p>Không có người chờ</p></div>';
}

async function callNext(roomId) {
  // Find next waiting ticket
  const d = await api('/api/queue/tickets?status=waiting');
  const next = (d.tickets||[])[0];
  if (!next) { alert('Không còn người chờ!'); return; }
  await api('/api/queue/next', { method:'POST', body:JSON.stringify({ roomId, nextQueueNumber:next.ticket_number }) });
  loadQueue();
}

// ── Leads ──
setupFilters('lead-filters', async (f) => { FILTER.leads = f; await loadLeads(); });

async function loadLeads() {
  const qs = FILTER.leads ? '?status=' + FILTER.leads : '';
  const d = await api('/api/leads' + qs);
  const p = d.pipeline || {};
  document.getElementById('lead-pipeline').innerHTML = [
    metricCard('🆕', p.pending||0, 'Mới'),
    metricCard('🔄', p.confirmed||0, 'Đang xử lý'),
    metricCard('✅', p.completed||0, 'Đã chốt'),
    metricCard('❌', p.cancelled||0, 'Đã hủy'),
  ].join('');
  document.getElementById('leads-list').innerHTML = d.leads.length
    ? d.leads.map(b => bookingItem(b)).join('')
    : '<div class="empty"><div class="empty-icon">📈</div><p>Chưa có leads</p></div>';
}

// ── Helpers ──
function setupFilters(containerId, callback) {
  document.getElementById(containerId)?.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.getElementById(containerId).querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    callback(chip.dataset.filter);
  });
}

function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-backdrop').classList.add('show');
  document.getElementById('modal-sheet').classList.add('show');
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('show');
  document.getElementById('modal-sheet').classList.remove('show');
}

// ── Init ──
if (TOKEN) {
  api('/api/auth/me').then(d => {
    document.getElementById('user-avatar').textContent = (d.user.name||'A')[0].toUpperCase();
    showApp();
  }).catch(() => doLogout());
} else {
  document.getElementById('login-page').classList.remove('hidden');
}
</script>
</body>
</html>`;
