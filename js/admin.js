/**
 * admin.js – v3
 * Handles admin/dashboard.html (and login, card-generator)
 * Renewal logic: if member already has active membership, extend it.
 */
import { auth, db } from './firebase-config.js';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  collection, doc, getDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const PATH = window.location.pathname;
const IS_LOGIN = PATH.includes('index.html') || PATH.endsWith('/admin/') || PATH.endsWith('/admin');
const IS_DASH = PATH.includes('dashboard.html');
const IS_CARD = PATH.includes('card-generator.html');

const G = {
  allApps: [],
  planData: {},
  clubData: {},
  emailTemplates: {},
  currentView: 'applications',
  activeAppId: null,
  rejectTargetId: null,
  emailTargetId: null,
  unsubscribe: null,
};

const $ = (id) => document.getElementById(id);
const $q = (sel) => document.querySelector(sel);
function showEl(id) { const e = $(id); if (e) e.style.display = ''; }
function hideEl(id) { const e = $(id); if (e) e.style.display = 'none'; }

/* ═══════════════════════════════════════════════════════════════════════════
   AUTH STATE LISTENER
   ═══════════════════════════════════════════════════════════════════════════ */
onAuthStateChanged(auth, async (user) => {
  if (IS_LOGIN) {
    if (user) {
      const isAdmin = await checkAdmin(user.uid);
      if (isAdmin) window.location.href = 'dashboard.html';
    }
  }

  if (IS_DASH) {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    const isAdmin = await checkAdmin(user.uid);
    if (!isAdmin) {
      await signOut(auth);
      window.location.href = 'index.html';
      return;
    }
    const emailEl = $('ad-user-email');
    if (emailEl) emailEl.textContent = user.email || 'admin';
    initDashboard();
  }

  if (IS_CARD) {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    const isAdmin = await checkAdmin(user.uid);
    if (!isAdmin) window.location.href = 'index.html';
  }
});

async function checkAdmin(uid) {
  try {
    const snap = await getDoc(doc(db, 'admin_users', uid));
    return snap.exists() && snap.data().role === 'admin';
  } catch (_) {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN PAGE LOGIC
   ═══════════════════════════════════════════════════════════════════════════ */
if (IS_LOGIN) {
  let failCount   = 0;
  let lockoutEnd  = 0;
  const MAX_FAILS = 5;
  const LOCK_MS   = 5 * 60 * 1000;
  let lockTimer   = null;

  function showLoginError(msg) {
    const el = $('al-error');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  }
  function hideLoginError() {
    const el = $('al-error');
    if (el) el.style.display = 'none';
  }

  function setLoginLoading(on) {
    const btn     = $('al-submit-btn');
    const txtEl   = btn ? btn.querySelector('.al-submit-btn__text')    : null;
    const spinEl  = btn ? btn.querySelector('.al-submit-btn__spinner') : null;
    if (!btn) return;
    btn.disabled = on;
    if (txtEl)  txtEl.style.display  = on ? 'none'        : 'inline';
    if (spinEl) spinEl.style.display = on ? 'inline-flex' : 'none';
  }

  function startLockout() {
    lockoutEnd = Date.now() + LOCK_MS;
    const bar  = $('al-lockout-bar');
    const msg  = $('al-lockout-msg');
    if (bar) bar.style.display = 'flex';
    const btn  = $('al-submit-btn');
    if (btn) btn.disabled = true;

    lockTimer = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(lockTimer);
        lockTimer  = null;
        failCount  = 0;
        lockoutEnd = 0;
        if (bar) bar.style.display = 'none';
        if (btn) btn.disabled = false;
        if (msg) msg.textContent = 'Too many failed attempts. Please wait.';
      } else {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        if (msg) msg.textContent =
          `Too many failed attempts. Wait ${m}:${s.toString().padStart(2,'0')} before retrying.`;
      }
    }, 1000);
  }

  function isLockedOut() {
    return Date.now() < lockoutEnd;
  }

  function mapAuthError(code) {
    const map = {
      'auth/invalid-email':          'Invalid email address format.',
      'auth/user-not-found':         'No account found with this email.',
      'auth/wrong-password':         'Incorrect password. Please try again.',
      'auth/invalid-credential':     'Invalid email or password.',
      'auth/too-many-requests':      'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your internet connection.',
      'auth/user-disabled':          'This account has been disabled.',
    };
    return map[code] || 'Login failed. Please check your credentials and try again.';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const eyeBtn  = $('al-eye-btn');
    const pwdInp  = $('al-password');
    const eyeIcon = $('al-eye-icon');
    if (eyeBtn && pwdInp) {
      eyeBtn.addEventListener('click', () => {
        const isText = pwdInp.type === 'text';
        pwdInp.type  = isText ? 'password' : 'text';
        if (eyeIcon) eyeIcon.textContent = isText ? '👁' : '🙈';
      });
    }

    const form = $('al-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideLoginError();

        if (isLockedOut()) return;

        const email    = ($('al-email')    || {}).value?.trim()  || '';
        const password = ($('al-password') || {}).value?.trim()  || '';

        if (!email || !password) {
          showLoginError('Please enter both email and password.');
          return;
        }

        setLoginLoading(true);
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const isAdmin = await checkAdmin(cred.user.uid);
          if (!isAdmin) {
            await signOut(auth);
            failCount++;
            if (failCount >= MAX_FAILS) startLockout();
            showLoginError('Access denied. You are not an authorized administrator.');
            return;
          }
        } catch (err) {
          failCount++;
          if (failCount >= MAX_FAILS) startLockout();
          showLoginError(mapAuthError(err.code));
        } finally {
          setLoginLoading(false);
        }
      });
    }

    [$('al-email'), $('al-password')].forEach(el => {
      if (el) el.addEventListener('input', hideLoginError);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD LOGIC
   ═══════════════════════════════════════════════════════════════════════════ */
async function initDashboard() {
  await loadPlanData();
  startRealtimeListener();
  initSidebar();
  initFilters();
  initMembersSearch();
  initLogout();
  attachModalCloseListeners();
}

/* ── Load Plan Data ──────────────────────────────────────────────────────── */
async function loadPlanData() {
  try {
    const res  = await fetch('../data/membership-plans.json');
    const data = await res.json();
    G.planData       = {};
    (data.plans || []).forEach(p => { G.planData[p.id] = p; });
    G.clubData       = data.club           || {};
    G.emailTemplates = data.emailTemplates || {};
  } catch (err) {
    console.error('loadPlanData error:', err);
  }
}

/* ── Real-time Firestore Listener ────────────────────────────────────────── */
function startRealtimeListener() {
  const q = query(
    collection(db, 'membership_applications'),
    orderBy('submittedAt', 'desc')
  );

  G.unsubscribe = onSnapshot(q, (snapshot) => {
    G.allApps = snapshot.docs.map(d => ({ _id: d.id, ...d.data() }));
    updateStatCards();
    renderApplicationsTable();
    renderMembersTable();
    renderStatistics();
  }, (err) => {
    console.error('Firestore snapshot error:', err);
    showToast('⚠️ Real-time connection error. Refresh the page.', 'error');
  });
}

/* ── Stat Cards ──────────────────────────────────────────────────────────── */
function updateStatCards() {
  const total    = G.allApps.length;
  const pending  = G.allApps.filter(a => a.status === 'pending').length;
  const approved = G.allApps.filter(a => a.status === 'approved').length;
  const rejected = G.allApps.filter(a => a.status === 'rejected').length;

  const set = (id, val) => { const e = $(id); if (e) e.textContent = val; };
  set('stat-total',    total);
  set('stat-pending',  pending);
  set('stat-approved', approved);
  set('stat-rejected', rejected);

  const badge = $('pending-count-badge');
  if (badge) {
    badge.textContent    = pending;
    badge.style.display  = pending > 0 ? 'inline-flex' : 'none';
  }
}

/* ── Filters ─────────────────────────────────────────────────────────────── */
function getFilteredApps() {
  const status  = ($('filter-status')  || {}).value || 'all';
  const plan    = ($('filter-plan')    || {}).value || 'all';
  const payment = ($('filter-payment') || {}).value || 'all';
  const search  = (($('filter-search') || {}).value || '').toLowerCase().trim();

  return G.allApps.filter(app => {
    if (status  !== 'all' && app.status !== status) return false;
    if (plan    !== 'all' && app.planId !== plan)   return false;
    if (payment !== 'all' && (app.paymentMethod || 'upi') !== payment) return false;
    if (search) {
      const haystack = [
        app.name, app.email, app.applicationId,
        app.transactionId, app.membershipId
      ].join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function initFilters() {
  ['filter-status', 'filter-plan', 'filter-search', 'filter-payment'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('input', renderApplicationsTable);
  });
  const refreshBtn = $('ad-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderApplicationsTable();
      showToast('🔄 Data refreshed.', 'info');
    });
  }
}

/* ── Format Date ─────────────────────────────────────────────────────────── */
function fmtDate(val) {
  if (!val) return '—';
  if (val && typeof val.toDate === 'function') {
    return val.toDate().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
  return String(val);
}

/* ── Plan Badge HTML ─────────────────────────────────────────────────────── */
function planBadgeHTML(planId, planName) {
  const cls = {
    annual: 'ad-plan-badge--annual',
    gym:    'ad-plan-badge--gym',
    yoga:   'ad-plan-badge--yoga'
  }[planId] || 'ad-plan-badge--default';
  return `<span class="ad-plan-badge ${cls}">${planName || planId}</span>`;
}

/* ── Status Badge HTML ───────────────────────────────────────────────────── */
function statusBadgeHTML(status) {
  const map = {
    pending:  { cls: 'ad-status-badge--pending',  label: '⏳ Pending'  },
    approved: { cls: 'ad-status-badge--approved', label: '✅ Approved' },
    rejected: { cls: 'ad-status-badge--rejected', label: '❌ Rejected' },
  };
  const { cls, label } = map[status] || { cls: '', label: status };
  return `<span class="ad-status-badge ${cls}">${label}</span>`;
}

/* ── Render Applications Table ───────────────────────────────────────────── */
function renderApplicationsTable() {
  const tbody = $('applications-tbody');
  if (!tbody) return;

  const apps = getFilteredApps();
  if (apps.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="ad-table__empty">
          <div class="ad-empty-state">
            <div class="ad-empty-state__icon">📭</div>
            <div class="ad-empty-state__msg">No applications match your filters.</div>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = apps.map(app => {
    const rowCls = app.status === 'pending' ? 'ad-row--pending' : '';
    const isCash = (app.paymentMethod || 'upi') === 'cash';

    let txnCell;
    if (isCash) {
      txnCell = `<span class="ad-cash-badge">💵 Cash</span><br><small>Rcvr: ${esc(app.receiverName || '—')}</small>`;
    } else {
      const txnShort = (app.transactionId || '—').slice(0, 16) +
        ((app.transactionId || '').length > 16 ? '…' : '');
      txnCell = `<span class="ad-cell-txn" title="${esc(app.transactionId || '')}">${esc(txnShort)}</span>`;
    }

    const cardBtn = app.status === 'approved'
      ? `<button class="ad-tbl-btn ad-tbl-btn--card" data-action="card" data-id="${app._id}">🎴 Card</button>`
      : '';

    return `
      <tr class="${rowCls}" data-id="${app._id}">
        <td><span class="ad-cell-id">${app.applicationId || '—'}</span></td>
        <td><span class="ad-cell-name">${esc(app.name || '—')}</span></td>
        <td>
          <div class="ad-cell-email">
            <a href="mailto:${esc(app.email)}">${esc(app.email || '—')}</a>
          </div>
          <div class="ad-cell-phone">${esc(app.phone || '')}</div>
        </td>
        <td>${planBadgeHTML(app.planId, app.planName)}</td>
        <td><span class="ad-cell-amount">₹${app.amount || 0}</span></td>
        <td>${txnCell}</td>
        <td><span class="ad-cell-date">${fmtDate(app.submittedAt)}</span></td>
        <td>${statusBadgeHTML(app.status)}</td>
        <td>
          <div class="ad-action-btns">
            <button class="ad-tbl-btn" data-action="view" data-id="${app._id}">
              View
            </button>
            ${cardBtn}
          </div>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      const id     = btn.getAttribute('data-id');
      if (action === 'view') openDetailModal(id);
      if (action === 'card') openCardGenerator(id);
    });
  });
}

/* ── Render Members Table ────────────────────────────────────────────────── */
function renderMembersTable(searchVal) {
  const tbody = $('members-tbody');
  if (!tbody) return;

  const search = (searchVal || ($('members-search') || {}).value || '')
    .toLowerCase().trim();

  let members = G.allApps.filter(a => a.status === 'approved');
  if (search) {
    members = members.filter(a => {
      return [a.name, a.email, a.membershipId, a.applicationId]
        .join(' ').toLowerCase().includes(search);
    });
  }

  if (members.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="ad-table__empty">
          <div class="ad-empty-state">
            <div class="ad-empty-state__icon">👥</div>
            <div class="ad-empty-state__msg">
              ${search ? 'No members match your search.' : 'No approved members yet.'}
            </div>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = members.map(app => `
    <tr data-id="${app._id}">
      <td><span class="ad-cell-id">${esc(app.membershipId || '—')}</span></td>
      <td><span class="ad-cell-name">${esc(app.name || '—')}</span></td>
      <td>
        <div class="ad-cell-email">
          <a href="mailto:${esc(app.email)}">${esc(app.email || '—')}</a>
        </div>
        <div class="ad-cell-phone">${esc(app.phone || '')}</div>
      </td>
      <td>${planBadgeHTML(app.planId, app.planName)}</td>
      <td><span class="ad-cell-date">${fmtDate(app.startDate)}</span></td>
      <td><span class="ad-cell-date">${fmtDate(app.expiryDate)}</span></td>
      <td>
        <div class="ad-action-btns">
          <button class="ad-tbl-btn" data-action="view" data-id="${app._id}">
            Details
          </button>
          <button class="ad-tbl-btn ad-tbl-btn--card" data-action="card" data-id="${app._id}">
            🎴 Card
          </button>
        </div>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      const id     = btn.getAttribute('data-id');
      if (action === 'view') openDetailModal(id);
      if (action === 'card') openCardGenerator(id);
    });
  });
}

function initMembersSearch() {
  const inp = $('members-search');
  if (inp) inp.addEventListener('input', () => renderMembersTable(inp.value));
}

/* ── Render Statistics ───────────────────────────────────────────────────── */
function renderStatistics() {
  const approved  = G.allApps.filter(a => a.status === 'approved');
  const revenue   = approved.reduce((s, a) => s + (a.amount || 0), 0);
  const nowMonth  = new Date().getMonth();
  const nowYear   = new Date().getFullYear();
  const thisMonth = G.allApps.filter(a => {
    const d = a.submittedAt && typeof a.submittedAt.toDate === 'function'
      ? a.submittedAt.toDate() : new Date(a.submittedAt || 0);
    return d.getMonth() === nowMonth && d.getFullYear() === nowYear;
  }).length;

  const set = (id, val) => { const e = $(id); if (e) e.textContent = val; };
  set('metric-revenue', `₹${revenue.toLocaleString('en-IN')}`);
  set('metric-active',  approved.length);
  set('metric-month',   thisMonth);

  const planBarsEl = $('plan-bars');
  if (planBarsEl) {
    const planRevMap = {};
    approved.forEach(a => {
      planRevMap[a.planId] = (planRevMap[a.planId] || 0) + (a.amount || 0);
    });
    if (Object.keys(planRevMap).length === 0) {
      planBarsEl.innerHTML = '<div class="ad-plan-bar-empty">No revenue data yet.</div>';
    } else {
      const maxRev = Math.max(...Object.values(planRevMap));
      planBarsEl.innerHTML = Object.entries(planRevMap).map(([pid, rev]) => {
        const pct  = maxRev > 0 ? Math.round((rev / maxRev) * 100) : 0;
        const name = G.planData[pid]?.name || pid;
        return `
          <div class="ad-plan-bar-row">
            <span class="ad-plan-bar-name">${esc(name)}</span>
            <div class="ad-plan-bar-track">
              <div class="ad-plan-bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="ad-plan-bar-pct">₹${rev.toLocaleString('en-IN')}</span>
          </div>`;
      }).join('');
    }
  }

  const actEl = $('activity-list');
  if (actEl) {
    const recent = [...G.allApps].slice(0, 10);
    if (recent.length === 0) {
      actEl.innerHTML = '<div class="ad-plan-bar-empty">No activity yet.</div>';
    } else {
      actEl.innerHTML = recent.map(app => `
        <div class="ad-activity-item">
          <span class="ad-activity-item__name">${esc(app.name || '—')}</span>
          ${statusBadgeHTML(app.status)}
          <span class="ad-activity-item__amount">₹${app.amount || 0}</span>
          <span class="ad-activity-item__date">${fmtDate(app.submittedAt)}</span>
        </div>`).join('');
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR NAVIGATION
   ═══════════════════════════════════════════════════════════════════════════ */
function initSidebar() {
  document.querySelectorAll('.ad-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      switchView(view);
      if (window.innerWidth <= 900) closeSidebar();
    });
  });

  const hamburger = $('ad-hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', toggleSidebar);
  }

  const overlay = $('ad-sidebar-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }
}

function switchView(viewName) {
  G.currentView = viewName;

  ['applications', 'members', 'statistics'].forEach(v => {
    const el = $(`view-${v}`);
    if (el) el.style.display = v === viewName ? 'block' : 'none';
  });

  document.querySelectorAll('.ad-nav-btn').forEach(btn => {
    btn.classList.toggle('ad-nav-btn--active',
      btn.getAttribute('data-view') === viewName);
  });

  const titles = {
    applications: 'Applications',
    members:      'Members',
    statistics:   'Statistics'
  };
  const titleEl = $('ad-page-title');
  if (titleEl) titleEl.textContent = titles[viewName] || viewName;

  if (viewName === 'members')    renderMembersTable();
  if (viewName === 'statistics') renderStatistics();
}

function toggleSidebar() {
  const sidebar = $('ad-sidebar');
  const overlay = $('ad-sidebar-overlay');
  if (!sidebar) return;
  const isOpen = sidebar.classList.toggle('ad--open');
  if (overlay) overlay.classList.toggle('ad--visible', isOpen);
}

function closeSidebar() {
  const sidebar = $('ad-sidebar');
  const overlay = $('ad-sidebar-overlay');
  if (sidebar) sidebar.classList.remove('ad--open');
  if (overlay) overlay.classList.remove('ad--visible');
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGOUT
   ═══════════════════════════════════════════════════════════════════════════ */
function initLogout() {
  const btn = $('ad-logout-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to logout?')) return;
    if (G.unsubscribe) G.unsubscribe();
    await signOut(auth);
    window.location.href = 'index.html';
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODAL HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
function showModal(id) {
  const el = $(id);
  if (el) {
    el.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function hideModal(id) {
  const el = $(id);
  if (el) {
    el.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function attachModalCloseListeners() {
  const detailClose = $('modal-detail-close');
  if (detailClose) detailClose.addEventListener('click', () => hideModal('modal-detail'));

  const rejectClose  = $('modal-reject-close');
  const rejectCancel = $('modal-reject-cancel');
  if (rejectClose)  rejectClose.addEventListener('click',  () => hideModal('modal-reject'));
  if (rejectCancel) rejectCancel.addEventListener('click', () => hideModal('modal-reject'));

  const emailClose  = $('modal-email-close');
  const emailClose2 = $('modal-email-close-2');
  if (emailClose)  emailClose.addEventListener('click',  () => hideModal('modal-email'));
  if (emailClose2) emailClose2.addEventListener('click', () => hideModal('modal-email'));

  ['modal-detail', 'modal-reject', 'modal-email'].forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target === el) hideModal(id);
      });
    }
  });

  const rejectConfirm = $('modal-reject-confirm');
  if (rejectConfirm) {
    rejectConfirm.addEventListener('click', confirmReject);
  }

  const copyAllBtn     = $('copy-all-btn');
  if (copyAllBtn)   copyAllBtn.addEventListener('click', copyAllEmail);

  ['copy-to-btn', 'copy-subject-btn', 'copy-body-btn'].forEach(btnId => {
    const btn = $(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const fieldMap = {
        'copy-to-btn':      'email-to',
        'copy-subject-btn': 'email-subject',
        'copy-body-btn':    'email-body',
      };
      const text = ($(fieldMap[btnId]) || {}).textContent || '';
      copyToClipboard(text, btn);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   DETAIL MODAL
   ═══════════════════════════════════════════════════════════════════════════ */
function openDetailModal(docId) {
  const app = G.allApps.find(a => a._id === docId);
  if (!app) return;
  G.activeAppId = docId;

  const body   = $('modal-detail-body');
  const footer = $('modal-detail-footer');
  if (!body || !footer) return;

  const isCash = (app.paymentMethod || 'upi') === 'cash';
  const paymentDetail = isCash
    ? `<div class="ad-detail-row"><span class="ad-detail-key">Payment Method</span><span class="ad-detail-val">💵 Cash</span></div>
       <div class="ad-detail-row"><span class="ad-detail-key">Receiver Name</span><span class="ad-detail-val">${esc(app.receiverName || '—')}</span></div>
       ${app.cashNote ? `<div class="ad-detail-row"><span class="ad-detail-key">Note</span><span class="ad-detail-val">${esc(app.cashNote)}</span></div>` : ''}`
    : `<div class="ad-detail-row"><span class="ad-detail-key">Transaction ID</span><span class="ad-detail-val ad-detail-val--mono">${esc(app.transactionId || '—')}</span></div>`;

  body.innerHTML = `
    <div class="ad-detail-section">
      <div class="ad-detail-section__title">👤 Personal Information</div>
      <div class="ad-detail-grid">
        ${detailRow('Full Name',        app.name)}
        ${detailRow('Email', `<a href="mailto:${esc(app.email)}">${esc(app.email)}</a>`, true)}
        ${detailRow('Phone',            app.phone)}
        ${detailRow('Date of Birth',    app.dob)}
        ${detailRow('Father/Guardian',  app.guardian)}
        ${detailRow('Emergency Contact',app.emergencyContact || '—')}
        ${detailRow('Address',          app.address, false, true)}
      </div>
    </div>
    <div class="ad-detail-section">
      <div class="ad-detail-section__title">💳 Plan & Payment</div>
      <div class="ad-detail-grid">
        ${detailRow('Plan',          app.planName)}
        ${detailRow('Amount',        `₹${app.amount}`)}
        ${detailRow('Duration',      app.duration)}
        ${paymentDetail}
        ${detailRow('Start Date',    fmtDate(app.startDate))}
        ${detailRow('Expiry Date',   fmtDate(app.expiryDate))}
      </div>
    </div>
    <div class="ad-detail-section">
      <div class="ad-detail-section__title">📋 Application Record</div>
      <div class="ad-detail-grid">
        ${detailRow('Application ID',  app.applicationId, false, false, true)}
        ${detailRow('Submitted',       fmtDate(app.submittedAt), false, false, true)}
        ${detailRow('Status',          statusBadgeHTML(app.status), true, false, true)}
        ${detailRow('Membership ID',   app.membershipId || '—', false, false, true)}
        ${detailRow('Verified At',     fmtDate(app.verifiedAt), false, false, true)}
        ${detailRow('Admin Notes',     app.adminNotes || '—', false, false, true)}
      </div>
    </div>
  `;

  footer.innerHTML = '';
  const closeBtn = makeBtn('Close', 'ad-btn--outline', () => hideModal('modal-detail'));
  footer.appendChild(closeBtn);

  if (app.status === 'pending') {
    const rejectBtn = makeBtn('❌ Reject', 'ad-btn--danger', () => {
      hideModal('modal-detail');
      openRejectModal(docId);
    });
    const approveBtn = makeBtn('✅ Approve', 'ad-btn--success', () => {
      hideModal('modal-detail');
      confirmApprove(docId);
    });
    footer.appendChild(rejectBtn);
    footer.appendChild(approveBtn);
  }

  if (app.status === 'approved') {
    const emailBtn = makeBtn('📧 Email Template', 'ad-btn--outline', () => {
      hideModal('modal-detail');
      openEmailModal(docId);
    });
    const cardBtn = makeBtn('🎴 Generate Card', 'ad-btn--gold', () => {
      hideModal('modal-detail');
      openCardGenerator(docId);
    });
    footer.appendChild(emailBtn);
    footer.appendChild(cardBtn);
  }

  if (app.status === 'rejected') {
    const emailBtn = makeBtn('📧 Email Template', 'ad-btn--outline', () => {
      hideModal('modal-detail');
      openEmailModal(docId);
    });
    footer.appendChild(emailBtn);
  }

  showModal('modal-detail');
}

function detailRow(key, val, isHTML = false, isFull = false, isFullGrid = false) {
  const fullCls = (isFull || isFullGrid) ? ' ad-detail-row--full' : '';
  const content = isHTML ? val : `<span>${esc(String(val ?? '—'))}</span>`;
  return `
    <div class="ad-detail-row${fullCls}">
      <span class="ad-detail-key">${key}</span>
      <span class="ad-detail-val">${content}</span>
    </div>`;
}

function makeBtn(label, cls, onClick) {
  const btn = document.createElement('button');
  btn.className   = `ad-btn ${cls}`;
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

/* ═══════════════════════════════════════════════════════════════════════════
   APPROVE FLOW (with renewal extension)
   ═══════════════════════════════════════════════════════════════════════════ */
function generateMembershipId() {
  const year   = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PSS-${year}-${random}`;
}

async function confirmApprove(docId) {
  const app = G.allApps.find(a => a._id === docId);
  if (!app) return;

  // Check if this email already has an active, unexpired membership
  const existingActive = G.allApps.find(a =>
    a._id !== docId &&
    a.email === app.email &&
    a.status === 'approved' &&
    a.expiryDate && new Date(a.expiryDate) > new Date()
  );

  let membershipId;
  let start, expiry;
  const validYears = app.validYears || 1;

  if (existingActive) {
    // RENEWAL: extend from existing expiry
    start = new Date(existingActive.expiryDate);
    start.setDate(start.getDate() + 1);          // day after current expiry
    membershipId = existingActive.membershipId;  // keep same membership ID
    expiry = new Date(start);
    expiry.setFullYear(expiry.getFullYear() + validYears);

    const confirmed = confirm(
      `RENEWAL DETECTED\n\n` +
      `Member: ${app.name}\n` +
      `Current Expiry: ${fmtDate(existingActive.expiryDate)}\n` +
      `New Start: ${start.toLocaleDateString('en-IN')}\n` +
      `New Expiry: ${expiry.toLocaleDateString('en-IN')}\n` +
      `Membership ID: ${membershipId}\n\n` +
      `Approve renewal?`
    );
    if (!confirmed) return;
  } else {
    // FRESH APPROVAL
    membershipId = generateMembershipId();
    start = new Date();
    expiry = new Date(start);
    expiry.setFullYear(expiry.getFullYear() + validYears);

    const confirmed = confirm(
      `Approve this application?\n\n` +
      `Name: ${app.name}\n` +
      `Plan: ${app.planName}\n` +
      `Amount: ₹${app.amount}\n\n` +
      `Membership ID will be: ${membershipId}`
    );
    if (!confirmed) return;
  }

  try {
    await updateDoc(doc(db, 'membership_applications', docId), {
      status:       'approved',
      membershipId,
      verifiedAt:   serverTimestamp(),
      verifiedBy:   auth.currentUser?.email || 'admin',
      startDate:    start.toISOString().split('T')[0],
      expiryDate:   expiry.toISOString().split('T')[0],
    });
    showToast(`✅ ${app.name} approved successfully!`, 'success');
    setTimeout(() => openEmailModal(docId), 700);
  } catch (err) {
    console.error('Approve error:', err);
    showToast('❌ Approval failed. Please try again.', 'error');
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   REJECT FLOW
   ═══════════════════════════════════════════════════════════════════════════ */
function openRejectModal(docId) {
  const app = G.allApps.find(a => a._id === docId);
  if (!app) return;
  G.rejectTargetId = docId;

  const infoEl = $('reject-info');
  if (infoEl) {
    infoEl.innerHTML = `
      <strong>${esc(app.name)}</strong><br/>
      Transaction ID: <code>${esc(app.transactionId || '—')}</code><br/>
      Amount: ₹${app.amount}
    `;
  }

  const reasonEl = $('reject-reason');
  const errEl    = $('reject-reason-error');
  if (reasonEl) reasonEl.value = '';
  if (errEl)    errEl.textContent = '';

  showModal('modal-reject');
}

async function confirmReject() {
  const reason  = ($('reject-reason') || {}).value?.trim() || '';
  const errEl   = $('reject-reason-error');

  if (!reason) {
    if (errEl) errEl.textContent = 'Please provide a reason for rejection.';
    return;
  }
  if (errEl) errEl.textContent = '';

  const docId = G.rejectTargetId;
  const app   = G.allApps.find(a => a._id === docId);
  if (!app) return;

  try {
    await updateDoc(doc(db, 'membership_applications', docId), {
      status:     'rejected',
      adminNotes: reason,
      verifiedAt: serverTimestamp(),
      verifiedBy: auth.currentUser?.email || 'admin',
    });
    hideModal('modal-reject');
    showToast(`❌ ${app.name}'s application rejected.`, 'error');
    setTimeout(() => openEmailModal(docId), 700);
  } catch (err) {
    console.error('Reject error:', err);
    showToast('Failed to reject. Please try again.', 'error');
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   EMAIL TEMPLATE MODAL
   ═══════════════════════════════════════════════════════════════════════════ */
function openEmailModal(docId) {
  const app = G.allApps.find(a => a._id === docId);
  if (!app) return;
  G.emailTargetId = docId;

  const club     = G.clubData;
  const tmplKey  = app.status === 'approved' ? 'approval' : 'rejection';
  const tmpl     = G.emailTemplates[tmplKey] || {};

  const replacements = {
    '{{NAME}}':          app.name            || '',
    '{{MEMBERSHIP_ID}}': app.membershipId    || '',
    '{{PLAN}}':          app.planName        || '',
    '{{ISSUE_DATE}}':    fmtDate(app.startDate),
    '{{EXPIRY_DATE}}':   fmtDate(app.expiryDate),
    '{{APP_ID}}':        app.applicationId   || '',
    '{{TRANSACTION_ID}}':app.transactionId   || '',
    '{{AMOUNT}}':        String(app.amount   || ''),
    '{{REASON}}':        app.adminNotes      || '',
    '{{PHONE}}':         club.phone          || '',
    '{{EMAIL}}':         club.email          || '',
    '{{PRESIDENT}}':     club.president      || '',
  };

  const fillTmpl = (str) => {
    if (!str) return '';
    return Object.entries(replacements).reduce(
      (s, [k, v]) => s.replaceAll(k, v), str
    );
  };

  const subject = fillTmpl(tmpl.subject || '');
  const body    = fillTmpl(tmpl.body    || '');

  const setTxt = (id, val) => { const e = $(id); if (e) e.textContent = val; };
  setTxt('email-to',      app.email  || '');
  setTxt('email-subject', subject);
  setTxt('email-body',    body);

  const cardWrap = $('email-card-btn-wrap');
  const cardLink = $('email-card-link');
  if (cardWrap && cardLink) {
    if (app.status === 'approved') {
      cardWrap.style.display = 'block';
      cardLink.href = buildCardURL(app);
    } else {
      cardWrap.style.display = 'none';
    }
  }

  const mailtoBtn = $('open-email-app-btn');
  if (mailtoBtn) {
    const mailto = `mailto:${encodeURIComponent(app.email || '')}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    mailtoBtn.href = mailto;
  }

  showModal('modal-email');
}

function copyAllEmail() {
  const to      = ($('email-to')      || {}).textContent || '';
  const subject = ($('email-subject') || {}).textContent || '';
  const body    = ($('email-body')    || {}).textContent || '';
  const all = `To: ${to}\nSubject: ${subject}\n\n${body}`;
  copyToClipboard(all, $('copy-all-btn'));
}

/* ═══════════════════════════════════════════════════════════════════════════
   CARD GENERATOR
   ═══════════════════════════════════════════════════════════════════════════ */
function buildCardURL(app) {
  const params = new URLSearchParams({
    name:         app.name          || '',
    email:        app.email         || '',
    appId:        app.applicationId || '',
    membershipId: app.membershipId  || '',
    planName:     app.planName      || '',
    amount:       String(app.amount || ''),
    validYears:   String(app.validYears || 1),
  });
  return `card-generator.html?${params.toString()}`;
}

function openCardGenerator(docId) {
  const app = G.allApps.find(a => a._id === docId);
  if (!app) return;
  if (app.status !== 'approved') {
    showToast('Card can only be generated for approved applications.', 'error');
    return;
  }
  window.open(buildCardURL(app), '_blank');
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════════════════════════════ */
function showToast(message, type = 'info') {
  const container = $('ad-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `ad-toast ad-toast--${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  toast.addEventListener('click', () => removeToast(toast));

  setTimeout(() => removeToast(toast), 4000);
}

function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.add('ad-toast--removing');
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLIPBOARD HELPER
   ═══════════════════════════════════════════════════════════════════════════ */
function copyToClipboard(text, btn) {
  const original = btn ? btn.textContent : '';

  const done = () => {
    if (btn) {
      btn.textContent = '✅ Copied!';
      setTimeout(() => { if (btn) btn.textContent = original; }, 2000);
    }
  };

  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) { /* silent */ }
    document.body.removeChild(ta);
    done();
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   ESCAPE HTML
   ═══════════════════════════════════════════════════════════════════════════ */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}