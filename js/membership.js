/**
 * membership.js – v4.1
 * All features + complete status checker + optional DOB.
 */
import { db, auth } from './firebase-config.js';
import {
  collection, addDoc, serverTimestamp, query as fbQuery, where,
  getDocs, orderBy, limit, updateDoc, doc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const STATE = {
  plans: [],
  clubData: {},
  selectedPlan: null,
  currentStep: 1,
  submitting: false,
  lastAppData: null,
  paymentMethod: 'upi',
  appIdGenerated: null,
  user: null,
  memberApps: [],
  guestMode: true,
};

const $ = (id) => document.getElementById(id);

/* ---------- DOM helpers ---------- */
function setError(fieldId, errId, msg) {
  const field = $(fieldId), err = $(errId);
  if (!field || !err) return;
  if (msg) { field.classList.add('m--error'); err.textContent = msg; }
  else { field.classList.remove('m--error'); err.textContent = ''; }
}
function clearError(fieldId, errId) { setError(fieldId, errId, ''); }
function showGlobalError(msg) {
  const el = $('m-global-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}
function hideGlobalError() { showGlobalError(''); }

/* ---------- Auth observer ---------- */
onAuthStateChanged(auth, async (user) => {
  STATE.user = user;
  const authBtn = $('m-auth-btn');
  const banner = $('m-signin-banner');
  const emailField = $('f-email');
  const lockIcon = $('email-lock-icon');

  if (user) {
    if (authBtn) authBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> My Membership`;
    STATE.guestMode = false;
    if (emailField) {
      emailField.value = user.email || '';
      emailField.readOnly = true;
      emailField.style.backgroundColor = '#f8f8f8';
      emailField.style.cursor = 'not-allowed';
    }
    if (lockIcon) lockIcon.style.display = 'inline-block';
    if (banner) banner.style.display = 'none';
    await loadMemberData();
    showMemberDashboard();
  } else {
    if (authBtn) authBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Sign In`;
    STATE.guestMode = true;
    STATE.memberApps = [];
    if (emailField) {
      emailField.readOnly = false;
      emailField.style.backgroundColor = '';
      emailField.style.cursor = '';
    }
    if (lockIcon) lockIcon.style.display = 'none';
    if (banner) banner.style.display = 'flex';
    hideMemberDashboard();
  }
});

/* ---------- Banner handling ---------- */
function initBanner() {
  const banner = $('m-signin-banner');
  const closeBtn = $('m-signin-banner-close');
  const signinBtn = $('m-signin-banner-btn');
  if (closeBtn) closeBtn.addEventListener('click', () => { if (banner) banner.style.display = 'none'; });
  if (signinBtn) signinBtn.addEventListener('click', () => { showAuthForm('signin'); $('m-auth-modal').style.display = 'flex'; });
}

/* ---------- Load plans ---------- */
async function loadPlans() {
  try {
    const res = await fetch('../data/membership-plans.json');
    if (!res.ok) throw new Error('Failed to load plans');
    const data = await res.json();
    STATE.plans = data.plans || [];
    STATE.clubData = data.club || {};
    renderPlans();
    updateClubInfo();
  } catch (err) {
    const grid = $('m-plans-grid');
    if (grid) grid.innerHTML = '<div class="m-plans__loading" style="color:#c62828;">Could not load plans. Please refresh the page.</div>';
    console.error('loadPlans error:', err);
  }
}

function updateClubInfo() {
  const c = STATE.clubData;
  if (!c) return;
  const upiText = $('m-upi-id-text'); if (upiText) upiText.textContent = c.upiId || 'yourname@upi';
  const upiName = $('m-upi-name-text'); if (upiName) upiName.textContent = c.upiName || c.name || '';
  const guideUpi = $('m-guide-upi'); if (guideUpi) guideUpi.textContent = c.upiId || 'yourname@upi';
  const faqP1 = $('faq-phone-1'); if (faqP1) faqP1.textContent = c.phone || '';
  const faqP2 = $('faq-phone-2'); if (faqP2) faqP2.textContent = c.phone || '';
  const fyEl = $('m-footer-year'); if (fyEl) fyEl.textContent = new Date().getFullYear();
}

function renderPlans() {
  const grid = $('m-plans-grid');
  if (!grid) return;
  grid.innerHTML = '';
  STATE.plans.forEach((plan) => {
    const card = document.createElement('div');
    card.className = 'm-plan-card' +
      (plan.active ? ' m-plan-card--active' : ' m-plan-card--inactive') +
      (plan.featured ? ' m-plan-card--featured' : '');
    const badgeClass = plan.active ? 'm-plan-card__badge--available' : 'm-plan-card__badge--soon';
    const featuresHTML = (plan.features || []).map(f => `<li class="m-plan-card__feature">${f}</li>`).join('');
    const btnHTML = plan.active
      ? `<button class="m-btn m-btn--gold m-btn--full m-plan-select-btn" data-plan-id="${plan.id}">Get Started</button>`
      : `<button class="m-btn m-btn--plan-inactive m-btn--full" disabled>Coming Soon</button>`;
    card.innerHTML = `
      <span class="m-plan-card__badge ${badgeClass}">${plan.badge}</span>
      <div class="m-plan-card__header">
        <div class="m-plan-card__name">${plan.name}</div>
        <div class="m-plan-card__desc">${plan.description}</div>
      </div>
      <div class="m-plan-card__price-row">
        <span class="m-plan-card__currency">${plan.currencySymbol}</span>
        <span class="m-plan-card__price">${plan.price}</span>
        <span class="m-plan-card__duration">/ ${plan.duration}</span>
      </div>
      <ul class="m-plan-card__features">${featuresHTML}</ul>
      <div class="m-plan-card__cta">${btnHTML}</div>
    `;
    grid.appendChild(card);
  });
  document.querySelectorAll('.m-plan-select-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const planId = btn.getAttribute('data-plan-id');
      const plan = STATE.plans.find(p => p.id === planId);
      if (plan && plan.active) selectPlan(plan);
    });
  });
}

function selectPlan(plan) {
  STATE.selectedPlan = plan;
  const barName = $('m-plan-bar-name');
  const barPrice = $('m-plan-bar-price');
  if (barName) barName.textContent = plan.name;
  if (barPrice) barPrice.textContent = `${plan.currencySymbol}${plan.price}`;
  ['m-amount-display', 'm-cash-amount-display'].forEach(id => {
    const el = $(id); if (el) el.textContent = `${plan.currencySymbol}${plan.price}`;
  });
  ['m-amount-plan', 'm-cash-amount-plan'].forEach(id => {
    const el = $(id); if (el) el.textContent = plan.name;
  });
  const guideAmt = $('m-guide-amount'); if (guideAmt) guideAmt.textContent = `${plan.currencySymbol}${plan.price}`;
  const confirmAmt = $('m-confirm-amount'); if (confirmAmt) confirmAmt.textContent = `${plan.currencySymbol}${plan.price}`;
  const formSection = $('m-form-section');
  if (formSection) formSection.style.display = 'block';
  goToStep(1);
  setTimeout(() => { formSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
}

function goToStep(step) {
  STATE.currentStep = step;
  hideGlobalError();
  [1, 2, 3].forEach((n) => {
    const panel = $(`m-form-step-${n}`);
    if (panel) panel.style.display = n === step ? 'block' : 'none';
  });
  [1, 2, 3].forEach((n) => {
    const stepEl = $(`m-step-${n}`);
    if (!stepEl) return;
    stepEl.classList.remove('m-step--active', 'm-step--done');
    if (n < step) stepEl.classList.add('m-step--done');
    else if (n === step) stepEl.classList.add('m-step--active');
    const circle = stepEl.querySelector('.m-step__circle');
    if (circle) circle.textContent = n < step ? '✓' : String(n);
  });
  const formSection = $('m-form-section');
  if (formSection) {
    setTimeout(() => { formSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  }
}

function switchPaymentMethod(method) {
  STATE.paymentMethod = method;
  const tabUpi = $('m-pay-tab-upi');
  const tabCash = $('m-pay-tab-cash');
  const panelUpi = $('m-pay-panel-upi');
  const panelCash = $('m-pay-panel-cash');
  if (tabUpi) tabUpi.classList.toggle('m-pay-tab--active', method === 'upi');
  if (tabCash) tabCash.classList.toggle('m-pay-tab--active', method === 'cash');
  if (panelUpi) panelUpi.style.display = method === 'upi' ? 'block' : 'none';
  if (panelCash) panelCash.style.display = method === 'cash' ? 'block' : 'none';
  const confirmText = $('m-confirm-text');
  if (confirmText) {
    const amount = STATE.selectedPlan ? `${STATE.selectedPlan.currencySymbol}${STATE.selectedPlan.price}` : 'the amount';
    if (method === 'upi') {
      confirmText.innerHTML = `I confirm that I have completed the UPI payment of <strong>${amount}</strong> to Sarberia Pally Seba Samity and the Transaction ID entered above is correct.`;
    } else {
      confirmText.innerHTML = `I confirm that I have paid the cash amount of <strong>${amount}</strong> to the authorised person and the receiver name entered above is correct.`;
    }
  }
  ['e-txn', 'e-receiver', 'e-confirm'].forEach(id => { const el = $(id); if (el) el.textContent = ''; });
  ['f-txn', 'f-receiver'].forEach(id => { const el = $(id); if (el) el.classList.remove('m--error'); });
}

/* ---------- Validation ---------- */
function validateStep1() {
  let valid = true;
  const name = $('f-name').value.trim();
  if (!name) { setError('f-name', 'e-name', 'Full name is required.'); valid = false; }
  else if (name.length < 3) { setError('f-name', 'e-name', 'Name must be at least 3 characters.'); valid = false; }
  else { clearError('f-name', 'e-name'); }

  const emailField = $('f-email');
  const email = emailField.value.trim();
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) { setError('f-email', 'e-email', 'Email address is required.'); valid = false; }
  else if (!emailRx.test(email)) { setError('f-email', 'e-email', 'Please enter a valid email address.'); valid = false; }
  else { clearError('f-email', 'e-email'); }

  if (STATE.user && email !== STATE.user.email) {
    setError('f-email', 'e-email', 'Email cannot be changed while signed in.');
    valid = false;
  }

  const phone = $('f-phone').value.trim();
  const phoneRx = /^[6-9]\d{9}$/;
  if (!phone) { setError('f-phone', 'e-phone', 'Phone number is required.'); valid = false; }
  else if (!phoneRx.test(phone)) { setError('f-phone', 'e-phone', 'Enter a valid 10-digit Indian mobile number.'); valid = false; }
  else { clearError('f-phone', 'e-phone'); }

  // DOB is optional; validate only if provided
  const dob = $('f-dob').value;
  if (dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 5 || age > 100) {
      setError('f-dob', 'e-dob', 'Age must be between 5 and 100 years.');
      valid = false;
    } else {
      clearError('f-dob', 'e-dob');
    }
  } else {
    clearError('f-dob', 'e-dob');
  }

  const guardian = $('f-guardian').value.trim();
  if (!guardian) { setError('f-guardian', 'e-guardian', 'Father/Guardian name is required.'); valid = false; }
  else { clearError('f-guardian', 'e-guardian'); }

  const emergency = $('f-emergency').value.trim();
  if (emergency && !/^\d{10,15}$/.test(emergency)) { setError('f-emergency', 'e-emergency', 'Enter a valid phone number (10-15 digits).'); valid = false; }
  else { clearError('f-emergency', 'e-emergency'); }

  const address = $('f-address').value.trim();
  if (!address) { setError('f-address', 'e-address', 'Full address is required.'); valid = false; }
  else if (address.length < 10) { setError('f-address', 'e-address', 'Please enter a more complete address (min 10 characters).'); valid = false; }
  else { clearError('f-address', 'e-address'); }

  return valid;
}

function validateStep2() {
  let valid = true;
  if (STATE.paymentMethod === 'upi') {
    const txn = $('f-txn').value.trim();
    if (!txn) { setError('f-txn', 'e-txn', 'Transaction ID is required.'); valid = false; }
    else if (!/^[a-zA-Z0-9]{8,}$/.test(txn)) { setError('f-txn', 'e-txn', 'Enter a valid Transaction ID (min 8 alphanumeric characters).'); valid = false; }
    else { clearError('f-txn', 'e-txn'); }
  } else {
    const receiver = $('f-receiver').value.trim();
    if (!receiver) { setError('f-receiver', 'e-receiver', 'Receiver name is required.'); valid = false; }
    else if (receiver.length < 3) { setError('f-receiver', 'e-receiver', 'Name must be at least 3 characters.'); valid = false; }
    else { clearError('f-receiver', 'e-receiver'); }
  }
  const confirmed = $('f-confirm').checked;
  if (!confirmed) {
    const errEl = $('e-confirm');
    if (errEl) errEl.textContent = 'Please confirm the payment.';
    valid = false;
  } else {
    const errEl = $('e-confirm');
    if (errEl) errEl.textContent = '';
  }
  return valid;
}

/* ---------- App ID generation ---------- */
async function generateUniqueAppId() {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 3; attempt++) {
    const random = Math.floor(100000 + Math.random() * 900000);
    const appId = `APP-${year}-${random}`;
    const q = fbQuery(collection(db, 'membership_applications'), where('applicationId', '==', appId), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return appId;
  }
  const timestamp = Date.now().toString(36).toUpperCase();
  return `APP-${year}-${timestamp}`;
}

/* ---------- Member data (for logged-in users) ---------- */
async function loadMemberData() {
  if (!STATE.user) return;
  const email = STATE.user.email.toLowerCase();
  const q1 = fbQuery(collection(db, 'membership_applications'), where('email', '==', email));
  const q2 = fbQuery(collection(db, 'membership_applications'), where('userId', '==', STATE.user.uid));
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const apps = [...snap1.docs, ...snap2.docs].map(d => ({ _id: d.id, ...d.data() }));
  STATE.memberApps = apps.filter((a, i, arr) => arr.findIndex(x => x._id === a._id) === i);
}

function showMemberDashboard() {
  if (STATE.guestMode) return;
  const approved = STATE.memberApps.find(a => a.status === 'approved');
  const dashboard = $('m-dashboard-inline');
  if (!dashboard) return;
  if (approved) {
    dashboard.style.display = 'block';
    dashboard.innerHTML = `
      <div class="m-member-card">
        <div class="m-member-card__header">
          <svg class="m-member-card__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="m-member-card__title">You are a Member!</span>
        </div>
        <div class="m-member-card__body">
          <div class="m-member-row"><span>Membership ID</span><span>${approved.membershipId || '-'}</span></div>
          <div class="m-member-row"><span>Valid Until</span><span>${fmtDate(approved.expiryDate)}</span></div>
          <div class="m-member-row"><span>Plan</span><span>${approved.planName}</span></div>
        </div>
        <div class="m-member-card__actions">
          <button class="m-btn m-btn--gold m-btn--sm" id="m-download-card-btn">Download Card</button>
          <button class="m-btn m-btn--primary m-btn--sm" id="m-renew-btn">Renew</button>
        </div>
      </div>
    `;
    document.getElementById('m-download-card-btn')?.addEventListener('click', () => downloadCard(approved));
    document.getElementById('m-renew-btn')?.addEventListener('click', () => renewMembership(approved));
  } else {
    dashboard.style.display = 'none';
  }
}

function hideMemberDashboard() {
  const dashboard = $('m-dashboard-inline');
  if (dashboard) dashboard.style.display = 'none';
}

function downloadCard(app) {
  const params = new URLSearchParams({
    name: app.name || '',
    email: app.email || '',
    appId: app.applicationId || '',
    membershipId: app.membershipId || '',
    planName: app.planName || '',
    amount: String(app.amount || ''),
    validYears: String(app.validYears || 1),
  });
  window.open(`../admin/card-generator.html?${params.toString()}`, '_blank');
}

function renewMembership(app) {
  const plan = STATE.plans.find(p => p.id === app.planId);
  if (plan) selectPlan(plan);
  setTimeout(() => {
    $('f-name').value = app.name || '';
    $('f-email').value = app.email || '';
    $('f-phone').value = app.phone || '';
    $('f-dob').value = app.dob || '';
    $('f-guardian').value = app.guardian || '';
    $('f-emergency').value = app.emergencyContact || '';
    $('f-address').value = app.address || '';
  }, 200);
}

/* ---------- Auth modal ---------- */
function initAuthModal() {
  const authBtn = $('m-auth-btn');
  const modal = $('m-auth-modal');
  const closeBtn = $('m-auth-modal-close');

  authBtn?.addEventListener('click', () => {
    if (STATE.user) {
      showMemberDetailsModal();
    } else {
      showAuthForm('signin');
    }
    modal.style.display = 'flex';
  });

  closeBtn?.addEventListener('click', () => modal.style.display = 'none');
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

function showAuthForm(mode) {
  const title = mode === 'signin' ? 'Sign In' : 'Create Account';
  document.getElementById('auth-modal-title').textContent = title;
  const body = $('auth-modal-body');
  body.innerHTML = `
    <div class="m-form__group">
      <label class="m-form__label">Email</label>
      <input class="m-form__input" type="email" id="auth-email" placeholder="you@example.com" />
      <span class="m-form__error" id="auth-email-err"></span>
    </div>
    <div class="m-form__group">
      <label class="m-form__label">Password</label>
      <input class="m-form__input" type="password" id="auth-password" placeholder="Min 6 characters" />
      <span class="m-form__error" id="auth-password-err"></span>
    </div>
    <div class="m-form__error" id="auth-general-err" style="display:none;"></div>
    <button class="m-btn m-btn--primary m-btn--full" id="auth-submit-btn">${mode === 'signin' ? 'Sign In' : 'Create Account'}</button>
    <button class="m-btn m-btn--outline m-btn--full" id="auth-toggle-btn" style="margin-top:8px;">
      ${mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign In'}
    </button>
  `;
  document.getElementById('auth-submit-btn').addEventListener('click', () => handleAuth(mode));
  document.getElementById('auth-toggle-btn').addEventListener('click', () => showAuthForm(mode === 'signin' ? 'signup' : 'signin'));
}

async function handleAuth(mode) {
  const email = $('auth-email').value.trim();
  const password = $('auth-password').value.trim();
  let valid = true;
  if (!email) { setError('auth-email', 'auth-email-err', 'Required'); valid = false; }
  if (!password || password.length < 6) { setError('auth-password', 'auth-password-err', 'Min 6 characters'); valid = false; }
  if (!valid) return;

  try {
    if (mode === 'signup') {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    await loadMemberData();
    const unclaimed = STATE.memberApps.filter(a => !a.userId);
    if (unclaimed.length > 0) {
      showClaimModal(unclaimed);
    }
    $('m-auth-modal').style.display = 'none';
  } catch (err) {
    document.getElementById('auth-general-err').textContent = err.message;
    document.getElementById('auth-general-err').style.display = 'block';
  }
}

function showMemberDetailsModal() {
  document.getElementById('auth-modal-title').textContent = 'My Membership';
  const body = $('auth-modal-body');
  const approved = STATE.memberApps.find(a => a.status === 'approved');
  if (approved) {
    body.innerHTML = `
      <div class="m-member-card" style="background:var(--m-cream); border-color:var(--m-gold);">
        <div class="m-member-card__header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="m-member-card__title">Active Member</span>
        </div>
        <div class="m-member-card__body">
          <div class="m-member-row"><span>Membership ID</span><span>${approved.membershipId || '-'}</span></div>
          <div class="m-member-row"><span>Valid Until</span><span>${fmtDate(approved.expiryDate)}</span></div>
        </div>
        <div class="m-member-card__actions">
          <button class="m-btn m-btn--gold m-btn--sm" id="m-download-card-modal">Card</button>
          <button class="m-btn m-btn--primary m-btn--sm" id="m-renew-modal">Renew</button>
        </div>
      </div>
      <button class="m-btn m-btn--outline m-btn--full" id="m-signout-btn" style="margin-top:12px;">Sign Out</button>
    `;
    document.getElementById('m-download-card-modal')?.addEventListener('click', () => downloadCard(approved));
    document.getElementById('m-renew-modal')?.addEventListener('click', () => {
      $('m-auth-modal').style.display = 'none';
      renewMembership(approved);
    });
    document.getElementById('m-signout-btn')?.addEventListener('click', async () => {
      await signOut(auth);
      $('m-auth-modal').style.display = 'none';
    });
  } else {
    body.innerHTML = `<p>No active membership found. <a href="#plans">Apply now</a>.</p>
      <button class="m-btn m-btn--outline m-btn--full" id="m-signout-btn" style="margin-top:12px;">Sign Out</button>`;
    document.getElementById('m-signout-btn')?.addEventListener('click', async () => {
      await signOut(auth);
      $('m-auth-modal').style.display = 'none';
    });
  }
}

/* ---------- Claim modal ---------- */
function showClaimModal(unclaimedApps) {
  const modal = $('m-claim-modal');
  modal.style.display = 'flex';
  document.getElementById('claim-id').value = '';
  document.getElementById('claim-err').textContent = '';

  document.getElementById('m-claim-submit').onclick = async () => {
    const id = document.getElementById('claim-id').value.trim().toUpperCase();
    if (!id) { document.getElementById('claim-err').textContent = 'Please enter an ID.'; return; }
    const match = unclaimedApps.find(a => a.applicationId.toUpperCase() === id || (a.transactionId && a.transactionId.toUpperCase() === id));
    if (!match) {
      document.getElementById('claim-err').textContent = 'No application found with that ID. Make sure you entered the correct Application ID or Transaction ID.';
      return;
    }
    await updateDoc(doc(db, 'membership_applications', match._id), { userId: STATE.user.uid });
    modal.style.display = 'none';
    await loadMemberData();
    showMemberDashboard();
  };

  document.getElementById('m-claim-skip').onclick = () => { modal.style.display = 'none'; };
  document.getElementById('m-claim-modal-close').onclick = () => modal.style.display = 'none';
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

/* ---------- Submission with duplicate checks ---------- */
async function submitApplication() {
  if (STATE.submitting) return;
  if (!validateStep2()) return;
  STATE.submitting = true;
  hideGlobalError();

  const submitBtn = $('m-step2-submit');
  const btnText = submitBtn?.querySelector('.m-btn__text');
  const btnSpinner = submitBtn?.querySelector('.m-btn__spinner');
  if (btnText) btnText.style.display = 'none';
  if (btnSpinner) btnSpinner.style.display = 'inline-flex';
  if (submitBtn) submitBtn.disabled = true;

  try {
    const plan = STATE.selectedPlan;
    const emailVal = $('f-email').value.trim().toLowerCase();
    const isUpi = STATE.paymentMethod === 'upi';
    const txnVal = isUpi ? $('f-txn').value.trim() : '';

    if (isUpi && txnVal) {
      const q = fbQuery(collection(db, 'membership_applications'), where('transactionId', '==', txnVal));
      const snap = await getDocs(q);
      if (!snap.empty) {
        showGlobalError('This Transaction ID has already been used. Please check your payment details.');
        return;
      }
    }

    const activeQ = fbQuery(collection(db, 'membership_applications'), where('email', '==', emailVal), where('status', '==', 'approved'));
    const activeSnap = await getDocs(activeQ);
    if (!activeSnap.empty) {
      const activeApp = activeSnap.docs[0].data();
      const expiryDate = activeApp.expiryDate ? new Date(activeApp.expiryDate) : null;
      if (expiryDate && expiryDate > new Date()) {
        const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        showGlobalError(`You already have an active membership (expires in ${daysLeft} days). You can still apply for a renewal below.`);
      }
    }

    const pendingQ = fbQuery(collection(db, 'membership_applications'), where('email', '==', emailVal), where('status', '==', 'pending'));
    const pendingSnap = await getDocs(pendingQ);
    if (!pendingSnap.empty) {
      showGlobalError('You already have a pending application. Please wait for admin review.');
      return;
    }

    const appId = await generateUniqueAppId();
    STATE.appIdGenerated = appId;
    const receiverVal = isUpi ? null : $('f-receiver').value.trim();
    const cashNoteVal = isUpi ? null : ($('f-cash-note').value.trim() || null);

    const docData = {
      applicationId: appId,
      status: 'pending',
      submittedAt: serverTimestamp(),
      name: $('f-name').value.trim(),
      email: emailVal,
      emailLower: emailVal,
      phone: $('f-phone').value.trim(),
      dob: $('f-dob').value,                    // can be empty string
      guardian: $('f-guardian').value.trim(),
      emergencyContact: $('f-emergency').value.trim() || null,
      address: $('f-address').value.trim(),
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      duration: plan.duration,
      validYears: plan.validYears,
      paymentMethod: STATE.paymentMethod,
      transactionId: txnVal,
      receiverName: receiverVal,
      cashNote: cashNoteVal,
      screenshotURL: null,
      startDate: null,
      expiryDate: null,
      membershipId: null,
      verifiedAt: null,
      verifiedBy: null,
      adminNotes: null,
      userId: STATE.user ? STATE.user.uid : null,
    };

    await addDoc(collection(db, 'membership_applications'), docData);
    STATE.lastAppData = {
      appId,
      plan,
      txnId: txnVal || null,
      receiverName: receiverVal,
      email: emailVal,
      paymentMethod: STATE.paymentMethod,
    };
    populateSuccessStep();
    goToStep(3);
  } catch (err) {
    console.error('submitApplication error:', err);
    showGlobalError('Submission failed. Please check your internet connection and try again.');
  } finally {
    STATE.submitting = false;
    if (btnText) btnText.style.display = 'inline';
    if (btnSpinner) btnSpinner.style.display = 'none';
    if (submitBtn) submitBtn.disabled = false;
  }
}

function populateSuccessStep() {
  const d = STATE.lastAppData;
  if (!d) return;
  const setTxt = (id, val) => { const el = $(id); if (el) el.textContent = val || '-'; };
  setTxt('s-app-id', d.appId);
  setTxt('s-plan', d.plan.name);
  setTxt('s-amount', `${d.plan.currencySymbol}${d.plan.price}`);
  if (d.paymentMethod === 'upi') {
    setTxt('s-txn', d.txnId);
  } else {
    setTxt('s-txn', `Cash (Receiver: ${d.receiverName})`);
  }

  const createBtn = $('m-create-account-btn');
  if (createBtn) {
    if (STATE.guestMode) {
      createBtn.style.display = 'inline-flex';
      createBtn.onclick = () => {
        showAuthForm('signup');
        $('m-auth-modal').style.display = 'flex';
        setTimeout(() => {
          const authEmail = document.getElementById('auth-email');
          if (authEmail) authEmail.value = d.email;
        }, 100);
      };
    } else {
      createBtn.style.display = 'none';
    }
  }
}

/* ---------- Save confirmation .txt ---------- */
function saveConfirmation() {
  const d = STATE.lastAppData;
  if (!d) return;
  const club = STATE.clubData;
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const text = [
    '-----------------------------------------------',
    '   SARBERIA PALLY SEBA SAMITY',
    '   MEMBERSHIP APPLICATION CONFIRMATION',
    '-----------------------------------------------',
    '',
    `Application ID : ${d.appId}`,
    `Plan            : ${d.plan.name}`,
    `Amount Paid     : ${d.plan.currencySymbol}${d.plan.price}`,
    d.paymentMethod === 'upi' ? `Transaction ID  : ${d.txnId}` : `Payment Method  : Cash (Receiver: ${d.receiverName})`,
    `Email           : ${d.email || ''}`,
    `Status          : Pending (Under Review)`,
    `Submitted At    : ${now} IST`,
    '',
    '-----------------------------------------------',
    '   CHECK YOUR STATUS',
    '-----------------------------------------------',
    'Visit the membership page and click "Check Status".',
    `Option 1: Application ID (${d.appId}) + Email`,
    d.paymentMethod === 'upi' ? `Option 2: Transaction ID (${d.txnId}) + Email` : '',
    '',
    '-----------------------------------------------',
    '   WHAT HAPPENS NEXT',
    '-----------------------------------------------',
    '1. Admin verifies your payment.',
    '2. Application approved within 24 hours.',
    '3. You receive an email with your digital card.',
    '4. Present your card at club events.',
    '',
    '-----------------------------------------------',
    '   CONTACT',
    '-----------------------------------------------',
    `Phone   : ${club.phone || '+91 00000 00000'}`,
    `Email   : ${club.email || 'sarberiapallysebasamity@gmail.com'}`,
    `Website : ${club.website || ''}`,
    '',
    '-----------------------------------------------',
    '"We unite for a better tomorrow through',
    ' Education, Health & Culture."',
    '-----------------------------------------------',
  ].join('\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PSS-Confirmation-${d.appId}.txt`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

/* ---------- QR error ---------- */
window.handleQRError = function () {
  const img = $('m-qr-img');
  const fallback = $('m-qr-fallback');
  if (img) img.style.display = 'none';
  if (fallback) fallback.style.display = 'flex';
};

/* ---------- Copy UPI ID ---------- */
function copyUpiId() {
  const upiEl = $('m-upi-id-text');
  if (!upiEl) return;
  const text = upiEl.textContent.trim();
  const btn = $('m-copy-upi-btn');
  const originalText = btn ? btn.textContent : 'Copy';
  const fallbackCopy = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) { /* silent */ }
    document.body.removeChild(ta);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      if (btn) btn.textContent = 'Copied!';
      setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
    }).catch(() => { fallbackCopy(); if (btn) btn.textContent = 'Copied!'; setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000); });
  } else {
    fallbackCopy();
    if (btn) btn.textContent = 'Copied!';
    setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
  }
}

/* ---------- FAQ accordion ---------- */
function initFAQ() {
  document.querySelectorAll('.m-faq__item').forEach((item) => {
    const btn = item.querySelector('.m-faq__question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('m--open');
      document.querySelectorAll('.m-faq__item').forEach(i => i.classList.remove('m--open'));
      if (!isOpen) item.classList.add('m--open');
    });
  });
}

/* ---------- Mobile menu ---------- */
function initMobileMenu() {
  const hamburger = $('m-hamburger');
  const nav = $('m-nav');
  if (!hamburger || !nav) return;
  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('m--open');
    hamburger.classList.toggle('m--open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });
  nav.querySelectorAll('.m-header__nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('m--open');
      hamburger.classList.remove('m--open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATUS CHECKER (full)
   ═══════════════════════════════════════════════════════════════════════════ */
function initStatusChecker() {
  const openBtn = $('m-open-status-btn');
  const closeBtn = $('m-status-modal-close');
  const searchBtn = $('m-status-search-btn');
  const againBtn = $('ms-search-again-btn');
  const closeBtnR = $('ms-close-btn');
  const modal = $('m-status-modal');
  const checkAfterSubmit = $('m-check-status-after-submit');
  const methodToggle = $('ms-method-toggle');

  if (openBtn) openBtn.addEventListener('click', openStatusModal);
  if (checkAfterSubmit) {
    checkAfterSubmit.addEventListener('click', () => {
      openStatusModal();
      switchSearchMethod('appid');
      if (STATE.lastAppData) {
        const appIdEl = $('ms-app-id'); const emailEl = $('ms-email');
        if (appIdEl) appIdEl.value = STATE.lastAppData.appId || '';
        if (emailEl) emailEl.value = STATE.lastAppData.email || '';
      }
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', closeStatusModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeStatusModal(); });
  if (searchBtn) searchBtn.addEventListener('click', searchApplication);
  if (againBtn) againBtn.addEventListener('click', showSearchForm);
  if (closeBtnR) closeBtnR.addEventListener('click', closeStatusModal);
  if (methodToggle) {
    methodToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const current = methodToggle.getAttribute('data-current') || 'appid';
      switchSearchMethod(current === 'appid' ? 'txn' : 'appid');
    });
  }
  ['ms-app-id', 'ms-email', 'ms-txn'].forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener('focus', () => {
        const errEl = $(id + '-err'); if (errEl) errEl.textContent = '';
        el.classList.remove('m--error');
        const gErr = $('ms-error'); if (gErr) gErr.style.display = 'none';
      });
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
      closeStatusModal();
    }
  });
}

function switchSearchMethod(method) {
  const appIdGroup = $('ms-group-appid');
  const txnGroup = $('ms-group-txn');
  const toggleLink = $('ms-method-toggle');
  const toggleText = $('ms-method-text');
  if (method === 'txn') {
    if (appIdGroup) appIdGroup.style.display = 'none';
    if (txnGroup) txnGroup.style.display = 'flex';
    if (toggleLink) toggleLink.setAttribute('data-current', 'txn');
    if (toggleText) toggleText.textContent = 'I have my Application ID';
  } else {
    if (appIdGroup) appIdGroup.style.display = 'flex';
    if (txnGroup) txnGroup.style.display = 'none';
    if (toggleLink) toggleLink.setAttribute('data-current', 'appid');
    if (toggleText) toggleText.textContent = 'Forgot Application ID? Use Transaction ID';
  }
  ['ms-app-id', 'ms-txn', 'ms-email'].forEach(id => { const el = $(id); if (el) el.classList.remove('m--error'); });
  ['ms-app-id-err', 'ms-txn-err', 'ms-email-err'].forEach(id => { const el = $(id); if (el) el.textContent = ''; });
  const gErr = $('ms-error'); if (gErr) gErr.style.display = 'none';
}

function openStatusModal() {
  const modal = $('m-status-modal');
  if (modal) { modal.style.display = 'flex'; document.body.classList.add('m-scroll-locked'); }
  showSearchForm();
}

function closeStatusModal() {
  const modal = $('m-status-modal');
  if (modal) { modal.style.display = 'none'; document.body.classList.remove('m-scroll-locked'); }
}

function showSearchForm() {
  const searchForm = $('m-status-search-form');
  const results = $('m-status-results');
  if (searchForm) searchForm.style.display = 'flex';
  if (results) results.style.display = 'none';
  switchSearchMethod('appid');
  ['ms-app-id', 'ms-txn', 'ms-email'].forEach(id => { const el = $(id); if (el) el.value = ''; });
}

async function searchApplication() {
  const toggleLink = $('ms-method-toggle');
  const method = (toggleLink?.getAttribute('data-current')) || 'appid';
  const emailEl = $('ms-email');
  const errEl = $('ms-error');
  const email = (emailEl?.value || '').trim().toLowerCase();
  let valid = true;
  if (!email) { const e = $('ms-email-err'); if (e) e.textContent = 'Email address is required.'; emailEl?.classList.add('m--error'); valid = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { const e = $('ms-email-err'); if (e) e.textContent = 'Please enter a valid email.'; emailEl?.classList.add('m--error'); valid = false; }
  let searchField = ''; let searchValue = '';
  if (method === 'appid') {
    const appIdEl = $('ms-app-id'); const appId = (appIdEl?.value || '').trim().toUpperCase();
    if (!appId) { const e = $('ms-app-id-err'); if (e) e.textContent = 'Application ID is required.'; appIdEl?.classList.add('m--error'); valid = false; }
    searchField = 'applicationId'; searchValue = appId;
  } else {
    const txnEl = $('ms-txn'); const txn = (txnEl?.value || '').trim();
    if (!txn) { const e = $('ms-txn-err'); if (e) e.textContent = 'Transaction ID is required.'; txnEl?.classList.add('m--error'); valid = false; }
    else if (txn.length < 8) { const e = $('ms-txn-err'); if (e) e.textContent = 'Transaction ID must be at least 8 characters.'; txnEl?.classList.add('m--error'); valid = false; }
    searchField = 'transactionId'; searchValue = txn;
  }
  if (!valid) return;

  const searchBtn = $('m-status-search-btn');
  const btnText = searchBtn?.querySelector('.m-btn__text');
  const btnSpin = searchBtn?.querySelector('.m-btn__spinner');
  if (btnText) btnText.style.display = 'none';
  if (btnSpin) btnSpin.style.display = 'inline-flex';
  if (searchBtn) searchBtn.disabled = true;
  if (errEl) errEl.style.display = 'none';

  try {
    let foundDoc = null; let totalMatches = 0;
    const q1 = fbQuery(collection(db, 'membership_applications'), where(searchField, '==', searchValue), where('email', '==', email));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      let docs = snap1.docs.map(d => d.data());
      if (docs.length > 1) docs.sort((a,b) => (b.submittedAt?.toDate?.()||0) - (a.submittedAt?.toDate?.()||0));
      foundDoc = docs[0]; totalMatches = docs.length;
    }
    if (!foundDoc) {
      const q2 = fbQuery(collection(db, 'membership_applications'), where(searchField, '==', searchValue));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        const allDocs = snap2.docs.map(d => d.data());
        const matched = allDocs.filter(d => (d.email||'').toLowerCase().trim() === email);
        if (matched.length) {
          if (matched.length > 1) matched.sort((a,b) => (b.submittedAt?.toDate?.()||0) - (a.submittedAt?.toDate?.()||0));
          foundDoc = matched[0]; totalMatches = matched.length;
        }
      }
    }
    if (!foundDoc && method === 'txn') {
      const q3 = fbQuery(collection(db, 'membership_applications'), where('email', '==', email));
      const snap3 = await getDocs(q3);
      if (!snap3.empty) {
        const allDocs = snap3.docs.map(d => d.data());
        const matched = allDocs.filter(d => (d.transactionId||'').toLowerCase().trim() === searchValue.toLowerCase().trim());
        if (matched.length) { foundDoc = matched[0]; totalMatches = matched.length; }
      }
    }
    if (!foundDoc && method === 'appid') {
      const q4 = fbQuery(collection(db, 'membership_applications'), where('email', '==', email));
      const snap4 = await getDocs(q4);
      if (!snap4.empty) {
        const allDocs = snap4.docs.map(d => d.data());
        const matched = allDocs.filter(d => (d.applicationId||'').toUpperCase().trim() === searchValue.toUpperCase().trim());
        if (matched.length) { foundDoc = matched[0]; totalMatches = matched.length; }
      }
    }

    if (foundDoc) {
      showStatusResults(foundDoc, totalMatches > 1 ? totalMatches : 0);
    } else {
      const fieldLabel = method === 'appid' ? 'Application ID' : 'Transaction ID';
      if (errEl) {
        errEl.innerHTML = `❌ No application found matching this <strong>${fieldLabel}</strong> and <strong>Email</strong> combination.<br><br>
          <strong>Tips:</strong><br>
          ▪ Make sure the email is exactly what you used during application<br>
          ▪ Check for typos in your ${fieldLabel}<br>
          ${method === 'appid' ? '▪ Try searching by Transaction ID instead (click the link above)<br>' : '▪ Try searching by Application ID instead (click the link above)<br>'}
          ▪ Check your UPI app for the exact Transaction ID<br>
          ▪ If you downloaded the confirmation .txt file, check it for your details`;
        errEl.style.display = 'block';
      }
    }
  } catch (err) {
    console.error('[Status Checker] Error:', err);
    if (err.message && err.message.includes('index')) {
      if (errEl) errEl.innerHTML = '🔧 Search index is being set up. This is a one-time process.<br><br>Please try again in 2-3 minutes. If the problem persists, try searching by <strong>Application ID</strong> instead.';
    } else {
      if (errEl) errEl.textContent = '⚠️ Something went wrong. Please check your internet connection and try again.';
    }
    if (errEl) errEl.style.display = 'block';
  } finally {
    if (btnText) btnText.style.display = 'inline';
    if (btnSpin) btnSpin.style.display = 'none';
    if (searchBtn) searchBtn.disabled = false;
  }
}

function showStatusResults(app, totalMatches) {
  const searchForm = $('m-status-search-form');
  const results = $('m-status-results');
  if (searchForm) searchForm.style.display = 'none';
  if (results) results.style.display = 'flex';

  const multiNotice = $('ms-multi-notice');
  if (multiNotice) {
    if (totalMatches > 1) { multiNotice.textContent = `📋 Found ${totalMatches} applications. Showing the most recent one.`; multiNotice.style.display = 'block'; }
    else { multiNotice.style.display = 'none'; }
  }
  const banner = $('ms-banner');
  const bannerIcon = $('ms-banner-icon');
  const bannerStat = $('ms-banner-status');
  if (banner) banner.classList.remove('m-status-banner--pending', 'm-status-banner--approved', 'm-status-banner--rejected');
  const statusMap = {
    pending: { cls: 'm-status-banner--pending', icon: '⏳', label: 'Pending Review', msg: 'Your application is currently under review. Our admin team will verify your payment and process your application within 24 hours. You will receive an email once it is approved.' },
    approved: { cls: 'm-status-banner--approved', icon: '✅', label: 'Approved', msg: 'Congratulations! Your membership has been approved. You should receive (or have already received) an email with your digital membership card (PDF) attached.' },
    rejected: { cls: 'm-status-banner--rejected', icon: '❌', label: 'Rejected', msg: 'Unfortunately, your application was not approved. Please check the rejection reason below.' }
  };
  const info = statusMap[app.status] || statusMap.pending;
  if (banner) banner.classList.add(info.cls);
  if (bannerIcon) bannerIcon.textContent = info.icon;
  if (bannerStat) bannerStat.textContent = info.label;
  const msgEl = $('ms-message'); if (msgEl) msgEl.textContent = info.msg;

  const set = (id, val) => { const el = $(id); if (el) el.textContent = val || '-'; };
  set('ms-r-appid', app.applicationId);
  set('ms-r-name', app.name);
  set('ms-r-plan', app.planName);
  set('ms-r-amount', `₹${app.amount || 0}`);
  const paymentDisplay = app.paymentMethod === 'cash'
    ? `Cash (Receiver: ${app.receiverName || 'N/A'})`
    : (app.transactionId || 'N/A');
  set('ms-r-payment', paymentDisplay);
  set('ms-r-submitted', formatDateForStatus(app.submittedAt));

  const approvedBlock = $('ms-approved-details'); if (approvedBlock) approvedBlock.style.display = app.status === 'approved' ? 'block' : 'none';
  if (app.status === 'approved') {
    set('ms-r-mid', app.membershipId);
    set('ms-r-start', formatDateForStatus(app.startDate));
    set('ms-r-expiry', formatDateForStatus(app.expiryDate));
    set('ms-r-verified', formatDateForStatus(app.verifiedAt));
  }
  const rejectedBlock = $('ms-rejected-details'); if (rejectedBlock) rejectedBlock.style.display = app.status === 'rejected' ? 'block' : 'none';
  if (app.status === 'rejected') {
    set('ms-r-reason', app.adminNotes || 'No reason provided.');
    set('ms-r-rejected-date', formatDateForStatus(app.verifiedAt));
  }
}

function formatDateForStatus(val) {
  if (!val) return '-';
  if (val && typeof val.toDate === 'function') {
    return val.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return String(val);
}

/* ---------- Attach listeners ---------- */
function attachListeners() {
  const step1Next = $('m-step1-next'); if (step1Next) step1Next.addEventListener('click', () => { if (validateStep1()) goToStep(2); });
  const step2Back = $('m-step2-back'); if (step2Back) step2Back.addEventListener('click', () => goToStep(1));
  const step2Submit = $('m-step2-submit'); if (step2Submit) step2Submit.addEventListener('click', submitApplication);
  const changePlanBtn = $('m-change-plan-btn'); if (changePlanBtn) changePlanBtn.addEventListener('click', () => { const plansSection = $('plans'); if (plansSection) plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  const copyUpiBtn = $('m-copy-upi-btn'); if (copyUpiBtn) copyUpiBtn.addEventListener('click', copyUpiId);
  const saveBtn = $('m-save-confirmation-btn'); if (saveBtn) saveBtn.addEventListener('click', saveConfirmation);
  const clearMap = [
    ['f-name','e-name'], ['f-email','e-email'], ['f-phone','e-phone'], ['f-dob','e-dob'],
    ['f-guardian','e-guardian'], ['f-emergency','e-emergency'], ['f-address','e-address'], ['f-txn','e-txn'], ['f-receiver','e-receiver']
  ];
  clearMap.forEach(([fieldId, errId]) => {
    const el = $(fieldId);
    if (el) {
      el.addEventListener('focus', () => clearError(fieldId, errId));
      el.addEventListener('input', () => clearError(fieldId, errId));
    }
  });
  const confirmCb = $('f-confirm'); if (confirmCb) confirmCb.addEventListener('change', () => { const errEl = $('e-confirm'); if (errEl && confirmCb.checked) errEl.textContent = ''; });
  const phoneField = $('f-phone'); if (phoneField) phoneField.addEventListener('input', () => { phoneField.value = phoneField.value.replace(/\D/g, '').slice(0, 10); });
  const tabUpi = $('m-pay-tab-upi'); const tabCash = $('m-pay-tab-cash');
  if (tabUpi) tabUpi.addEventListener('click', () => switchPaymentMethod('upi'));
  if (tabCash) tabCash.addEventListener('click', () => switchPaymentMethod('cash'));
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadPlans();
  initFAQ();
  initMobileMenu();
  attachListeners();
  initStatusChecker();
  initAuthModal();
  initBanner();
  const fyEl = $('m-footer-year');
  if (fyEl) fyEl.textContent = new Date().getFullYear();
});

/* Helper fmtDate */
function fmtDate(val) {
  if (!val) return '—';
  if (val && typeof val.toDate === 'function') return val.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (typeof val === 'string') { const d = new Date(val); if (!isNaN(d.getTime())) return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  return String(val);
}