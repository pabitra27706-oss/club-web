/**
 * membership.js – v2
 * Offline cash payment, duplicate check, app ID collision fix, start date at approval
 */
import { db } from './firebase-config.js';
import {
  collection, addDoc, serverTimestamp, query as fbQuery, where,
  getDocs, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const STATE = {
  plans: [],
  clubData: {},
  selectedPlan: null,
  currentStep: 1,
  submitting: false,
  lastAppData: null,
  paymentMethod: 'upi',
  appIdGenerated: null,
};

const $ = (id) => document.getElementById(id);

function setError(fieldId, errId, msg) {
  const field = $(fieldId);
  const err = $(errId);
  if (!field || !err) return;
  if (msg) {
    field.classList.add('m--error');
    err.textContent = msg;
  } else {
    field.classList.remove('m--error');
    err.textContent = '';
  }
}
function clearError(fieldId, errId) { setError(fieldId, errId, ''); }
function showGlobalError(msg) {
  const el = $('m-global-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}
function hideGlobalError() { showGlobalError(''); }

/* ------------------------------------------------------------------ */
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
    if (grid) grid.innerHTML = '<div class="m-plans__loading" style="color:#c62828;">⚠️ Could not load plans. Please refresh the page.</div>';
    console.error('loadPlans error:', err);
  }
}

function updateClubInfo() {
  const c = STATE.clubData;
  if (!c) return;
  const upiText = $('m-upi-id-text');
  if (upiText) upiText.textContent = c.upiId || 'yourname@upi';
  const upiName = $('m-upi-name-text');
  if (upiName) upiName.textContent = c.upiName || c.name || '';
  const guideUpi = $('m-guide-upi');
  if (guideUpi) guideUpi.textContent = c.upiId || 'yourname@upi';
  const faqP1 = $('faq-phone-1');
  if (faqP1) faqP1.textContent = c.phone || '';
  const faqP2 = $('faq-phone-2');
  if (faqP2) faqP2.textContent = c.phone || '';
  const fyEl = $('m-footer-year');
  if (fyEl) fyEl.textContent = new Date().getFullYear();
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
      ? `<button class="m-btn m-btn--gold m-btn--full m-plan-select-btn" data-plan-id="${plan.id}">Get Started →</button>`
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

/* ---- validation ---- */
function validateStep1() {
  let valid = true;
  const name = $('f-name').value.trim();
  if (!name) { setError('f-name', 'e-name', 'Full name is required.'); valid = false; }
  else if (name.length < 3) { setError('f-name', 'e-name', 'Name must be at least 3 characters.'); valid = false; }
  else { clearError('f-name', 'e-name'); }

  const email = $('f-email').value.trim();
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) { setError('f-email', 'e-email', 'Email address is required.'); valid = false; }
  else if (!emailRx.test(email)) { setError('f-email', 'e-email', 'Please enter a valid email address.'); valid = false; }
  else { clearError('f-email', 'e-email'); }

  const phone = $('f-phone').value.trim();
  const phoneRx = /^[6-9]\d{9}$/;
  if (!phone) { setError('f-phone', 'e-phone', 'Phone number is required.'); valid = false; }
  else if (!phoneRx.test(phone)) { setError('f-phone', 'e-phone', 'Enter a valid 10-digit Indian mobile number.'); valid = false; }
  else { clearError('f-phone', 'e-phone'); }

  const dob = $('f-dob').value;
  if (!dob) { setError('f-dob', 'e-dob', 'Date of birth is required.'); valid = false; }
  else {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 5 || age > 100) { setError('f-dob', 'e-dob', 'Age must be between 5 and 100 years.'); valid = false; }
    else { clearError('f-dob', 'e-dob'); }
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

/* ---- app ID collision fix ---- */
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

/* ---- duplicate check ---- */
async function checkDuplicateApplication(email) {
  const q = fbQuery(
    collection(db, 'membership_applications'),
    where('email', '==', email.toLowerCase()),
    where('status', 'in', ['pending', 'approved'])
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/* ---- submit ---- */
async function submitApplication() {
  if (STATE.submitting) return;
  if (!validateStep2()) return;
  STATE.submitting = true;
  hideGlobalError();

  const submitBtn = $('m-step2-submit');
  const btnText = submitBtn ? submitBtn.querySelector('.m-btn__text') : null;
  const btnSpinner = submitBtn ? submitBtn.querySelector('.m-btn__spinner') : null;
  if (btnText) btnText.style.display = 'none';
  if (btnSpinner) btnSpinner.style.display = 'inline-flex';
  if (submitBtn) submitBtn.disabled = true;

  try {
    const plan = STATE.selectedPlan;
    const emailVal = $('f-email').value.trim().toLowerCase();
    const isDuplicate = await checkDuplicateApplication(emailVal);
    if (isDuplicate) {
      showGlobalError('You already have a pending or approved application. Please wait for admin review before applying again.');
      return;
    }

    const appId = await generateUniqueAppId();
    STATE.appIdGenerated = appId;
    const isUpi = STATE.paymentMethod === 'upi';
    const txnVal = isUpi ? $('f-txn').value.trim() : null;
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
      dob: $('f-dob').value,
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
    };

    await addDoc(collection(db, 'membership_applications'), docData);
    STATE.lastAppData = {
      appId,
      plan,
      txnId: txnVal,
      receiverName: receiverVal,
      email: emailVal,
      paymentMethod: STATE.paymentMethod,
    };
    populateSuccessStep();
    goToStep(3);
  } catch (err) {
    console.error('submitApplication error:', err);
    showGlobalError('❌ Submission failed. Please check your internet connection and try again. If the problem persists, contact us directly.');
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
}

/* ---- save confirmation txt ---- */
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

/* ---- QR error fallback ---- */
window.handleQRError = function () {
  const img = $('m-qr-img');
  const fallback = $('m-qr-fallback');
  if (img) img.style.display = 'none';
  if (fallback) fallback.style.display = 'flex';
};

/* ---- copy UPI ID ---- */
function copyUpiId() {
  const upiEl = $('m-upi-id-text');
  if (!upiEl) return;
  const text = upiEl.textContent.trim();
  const btn = $('m-copy-upi-btn');
  const originalText = btn ? btn.textContent : '📋 Copy';
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
      if (btn) btn.textContent = '✅ Copied!';
      setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
    }).catch(() => { fallbackCopy(); if (btn) btn.textContent = '✅ Copied!'; setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000); });
  } else {
    fallbackCopy();
    if (btn) btn.textContent = '✅ Copied!';
    setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
  }
}

/* ---- FAQ accordion ---- */
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

/* ---- mobile menu ---- */
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

/* ---- status checker (unchanged logic, minor adaptation) ---- */
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

  // Escape key to close modal
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
  const searchForm = $('m-status-search-form'); const results = $('m-status-results');
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
    // Strategy 1: exact query
    const q1 = fbQuery(collection(db, 'membership_applications'), where(searchField, '==', searchValue), where('email', '==', email));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      let docs = snap1.docs.map(d => d.data());
      if (docs.length > 1) docs.sort((a,b) => (b.submittedAt?.toDate?.()||0) - (a.submittedAt?.toDate?.()||0));
      foundDoc = docs[0]; totalMatches = docs.length;
    }
    // Strategy 2: field only + client filter email
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
    // Strategy 3: if txn search failed, email-only + client txn filter
    if (!foundDoc && method === 'txn') {
      const q3 = fbQuery(collection(db, 'membership_applications'), where('email', '==', email));
      const snap3 = await getDocs(q3);
      if (!snap3.empty) {
        const allDocs = snap3.docs.map(d => d.data());
        const matched = allDocs.filter(d => (d.transactionId||'').toLowerCase().trim() === searchValue.toLowerCase().trim());
        if (matched.length) { foundDoc = matched[0]; totalMatches = matched.length; }
      }
    }
    // Strategy 4: if appid search failed, email-only + client appId filter
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
  const searchForm = $('m-status-search-form'); const results = $('m-status-results');
  if (searchForm) searchForm.style.display = 'none';
  if (results) results.style.display = 'flex';
  const multiNotice = $('ms-multi-notice');
  if (multiNotice) {
    if (totalMatches > 1) { multiNotice.textContent = `📋 Found ${totalMatches} applications. Showing the most recent one.`; multiNotice.style.display = 'block'; }
    else { multiNotice.style.display = 'none'; }
  }
  const banner = $('ms-banner'); const bannerIcon = $('ms-banner-icon'); const bannerStat = $('ms-banner-status');
  if (banner) banner.classList.remove('m-status-banner--pending', 'm-status-banner--approved', 'm-status-banner--rejected');
  const statusMap = {
    pending: { cls: 'm-status-banner--pending', icon: '⏳', label: 'Pending Review', msg: 'Your application is currently under review. Our admin team will verify your payment and process your application within 24 hours. You will receive an email once it is approved.' },
    approved: { cls: 'm-status-banner--approved', icon: '✅', label: 'Approved', msg: 'Congratulations! Your membership has been approved. You should receive (or have already received) an email with your digital membership card (PDF) attached. If you haven\'t received it yet, please contact us with your Application ID.' },
    rejected: { cls: 'm-status-banner--rejected', icon: '❌', label: 'Rejected', msg: 'Unfortunately, your application was not approved. Please check the rejection reason below. If you believe this is an error or you have questions, please contact us with your Application ID.' }
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
  // Show payment method and details
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

/* ---- attach event listeners ---- */
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

  // Payment method tabs
  const tabUpi = $('m-pay-tab-upi'); const tabCash = $('m-pay-tab-cash');
  if (tabUpi) tabUpi.addEventListener('click', () => switchPaymentMethod('upi'));
  if (tabCash) tabCash.addEventListener('click', () => switchPaymentMethod('cash'));
}

/* ---- init ---- */
document.addEventListener('DOMContentLoaded', () => {
  loadPlans();
  initFAQ();
  initMobileMenu();
  attachListeners();
  initStatusChecker();
  const fyEl = $('m-footer-year');
  if (fyEl) fyEl.textContent = new Date().getFullYear();
});