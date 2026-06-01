/**
 * membership.js
 * Handles all logic for pages/membership.html
 * - Loads plans from JSON
 * - Step navigation + validation
 * - Firebase Firestore submission
 * - Status checker (search by App ID + Email)
 * - FAQ accordion, mobile menu, footer year
 */

import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  query as fbQuery,
  where,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/* ═══════════════════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════════════════ */
const STATE = {
  plans:        [],
  clubData:     {},
  selectedPlan: null,
  currentStep:  1,
  submitting:   false,
  lastAppData:  null
};

/* ═══════════════════════════════════════════════════════════════════════════
   DOM HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
const $  = (id) => document.getElementById(id);
const $q = (sel) => document.querySelector(sel);

function setError(fieldId, errId, msg) {
  const field = $(fieldId);
  const err   = $(errId);
  if (!field || !err) return;
  if (msg) {
    field.classList.add('m--error');
    err.textContent = msg;
  } else {
    field.classList.remove('m--error');
    err.textContent = '';
  }
}

function clearError(fieldId, errId) {
  setError(fieldId, errId, '');
}

function showGlobalError(msg) {
  const el = $('m-global-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}

function hideGlobalError() { showGlobalError(''); }

/* ═══════════════════════════════════════════════════════════════════════════
   LOAD PLANS FROM JSON
   ═══════════════════════════════════════════════════════════════════════════ */
async function loadPlans() {
  try {
    const res  = await fetch('../data/membership-plans.json');
    if (!res.ok) throw new Error('Failed to load plans');
    const data = await res.json();
    STATE.plans    = data.plans    || [];
    STATE.clubData = data.club     || {};
    renderPlans();
    updateClubInfo();
  } catch (err) {
    const grid = $('m-plans-grid');
    if (grid) {
      grid.innerHTML =
        '<div class="m-plans__loading" style="color:#c62828;">' +
        '⚠️ Could not load plans. Please refresh the page.</div>';
    }
    console.error('loadPlans error:', err);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   UPDATE CLUB INFO FROM JSON
   ═══════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════
   RENDER PLAN CARDS
   ═══════════════════════════════════════════════════════════════════════════ */
function renderPlans() {
  const grid = $('m-plans-grid');
  if (!grid) return;
  grid.innerHTML = '';

  STATE.plans.forEach((plan) => {
    const card = document.createElement('div');
    card.className =
      'm-plan-card' +
      (plan.active   ? ' m-plan-card--active'   : ' m-plan-card--inactive') +
      (plan.featured ? ' m-plan-card--featured'  : '');

    const badgeClass = plan.active
      ? 'm-plan-card__badge--available'
      : 'm-plan-card__badge--soon';

    const featuresHTML = (plan.features || [])
      .map(f => `<li class="m-plan-card__feature">${f}</li>`)
      .join('');

    const btnHTML = plan.active
      ? `<button class="m-btn m-btn--gold m-btn--full m-plan-select-btn"
                 data-plan-id="${plan.id}">
           Get Started →
         </button>`
      : `<button class="m-btn m-btn--plan-inactive m-btn--full" disabled>
           Coming Soon
         </button>`;

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
      const plan   = STATE.plans.find(p => p.id === planId);
      if (plan && plan.active) selectPlan(plan);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   SELECT PLAN
   ═══════════════════════════════════════════════════════════════════════════ */
function selectPlan(plan) {
  STATE.selectedPlan = plan;

  const barName  = $('m-plan-bar-name');
  const barPrice = $('m-plan-bar-price');
  if (barName)  barName.textContent  = plan.name;
  if (barPrice) barPrice.textContent = `${plan.currencySymbol}${plan.price}`;

  const amtDisplay = $('m-amount-display');
  const amtPlan    = $('m-amount-plan');
  const guideAmt   = $('m-guide-amount');
  const confirmAmt = $('m-confirm-amount');
  if (amtDisplay) amtDisplay.textContent = `${plan.currencySymbol}${plan.price}`;
  if (amtPlan)    amtPlan.textContent    = plan.name;
  if (guideAmt)   guideAmt.textContent   = `${plan.currencySymbol}${plan.price}`;
  if (confirmAmt) confirmAmt.textContent = `${plan.currencySymbol}${plan.price}`;

  const formSection = $('m-form-section');
  if (formSection) formSection.style.display = 'block';

  goToStep(1);

  setTimeout(() => {
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP NAVIGATION
   ═══════════════════════════════════════════════════════════════════════════ */
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
    if (n < step)       stepEl.classList.add('m-step--done');
    else if (n === step) stepEl.classList.add('m-step--active');

    const circle = stepEl.querySelector('.m-step__circle');
    if (circle) {
      circle.textContent = n < step ? '' : String(n);
    }
  });

  const formSection = $('m-form-section');
  if (formSection) {
    setTimeout(() => {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   VALIDATION — STEP 1
   ═══════════════════════════════════════════════════════════════════════════ */
function validateStep1() {
  let valid = true;

  const name = $('f-name').value.trim();
  if (!name) {
    setError('f-name', 'e-name', 'Full name is required.');
    valid = false;
  } else if (name.length < 3) {
    setError('f-name', 'e-name', 'Name must be at least 3 characters.');
    valid = false;
  } else {
    clearError('f-name', 'e-name');
  }

  const email = $('f-email').value.trim();
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    setError('f-email', 'e-email', 'Email address is required.');
    valid = false;
  } else if (!emailRx.test(email)) {
    setError('f-email', 'e-email', 'Please enter a valid email address.');
    valid = false;
  } else {
    clearError('f-email', 'e-email');
  }

  const phone = $('f-phone').value.trim();
  const phoneRx = /^[6-9]\d{9}$/;
  if (!phone) {
    setError('f-phone', 'e-phone', 'Phone number is required.');
    valid = false;
  } else if (!phoneRx.test(phone)) {
    setError('f-phone', 'e-phone', 'Enter a valid 10-digit Indian mobile number.');
    valid = false;
  } else {
    clearError('f-phone', 'e-phone');
  }

  const dob = $('f-dob').value;
  if (!dob) {
    setError('f-dob', 'e-dob', 'Date of birth is required.');
    valid = false;
  } else {
    const dobDate = new Date(dob);
    const today   = new Date();
    const age     = today.getFullYear() - dobDate.getFullYear();
    if (age < 5 || age > 100) {
      setError('f-dob', 'e-dob', 'Age must be between 5 and 100 years.');
      valid = false;
    } else {
      clearError('f-dob', 'e-dob');
    }
  }

  const guardian = $('f-guardian').value.trim();
  if (!guardian) {
    setError('f-guardian', 'e-guardian', 'Father/Guardian name is required.');
    valid = false;
  } else {
    clearError('f-guardian', 'e-guardian');
  }

  const emergency = $('f-emergency').value.trim();
  if (emergency && !/^\d{10,15}$/.test(emergency)) {
    setError('f-emergency', 'e-emergency', 'Enter a valid phone number (10-15 digits).');
    valid = false;
  } else {
    clearError('f-emergency', 'e-emergency');
  }

  const address = $('f-address').value.trim();
  if (!address) {
    setError('f-address', 'e-address', 'Full address is required.');
    valid = false;
  } else if (address.length < 10) {
    setError('f-address', 'e-address', 'Please enter a more complete address (min 10 characters).');
    valid = false;
  } else {
    clearError('f-address', 'e-address');
  }

  return valid;
}

/* ═══════════════════════════════════════════════════════════════════════════
   VALIDATION — STEP 2
   ═══════════════════════════════════════════════════════════════════════════ */
function validateStep2() {
  let valid = true;

  const txn = $('f-txn').value.trim();
  const txnRx = /^[a-zA-Z0-9]{8,}$/;
  if (!txn) {
    setError('f-txn', 'e-txn', 'Transaction ID is required.');
    valid = false;
  } else if (!txnRx.test(txn)) {
    setError('f-txn', 'e-txn',
      'Enter a valid Transaction ID (min 8 alphanumeric characters).');
    valid = false;
  } else {
    clearError('f-txn', 'e-txn');
  }

  const confirmed = $('f-confirm').checked;
  if (!confirmed) {
    const errEl = $('e-confirm');
    if (errEl) errEl.textContent = 'Please confirm that you have completed the payment.';
    valid = false;
  } else {
    const errEl = $('e-confirm');
    if (errEl) errEl.textContent = '';
  }

  return valid;
}

/* ═══════════════════════════════════════════════════════════════════════════
   GENERATE APPLICATION ID
   ═══════════════════════════════════════════════════════════════════════════ */
function generateAppId() {
  const year   = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `APP-${year}-${random}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CALCULATE DATES
   ═══════════════════════════════════════════════════════════════════════════ */
function calculateDates(validYears) {
  const start  = new Date();
  const expiry = new Date(start);
  expiry.setFullYear(expiry.getFullYear() + (validYears || 1));
  return {
    startDate:  start.toISOString().split('T')[0],
    expiryDate: expiry.toISOString().split('T')[0]
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUBMIT TO FIREBASE
   ═══════════════════════════════════════════════════════════════════════════ */
async function submitApplication() {
  if (STATE.submitting) return;
  if (!validateStep2()) return;

  STATE.submitting = true;
  hideGlobalError();

  const submitBtn  = $('m-step2-submit');
  const btnText    = submitBtn ? submitBtn.querySelector('.m-btn__text')    : null;
  const btnSpinner = submitBtn ? submitBtn.querySelector('.m-btn__spinner') : null;
  if (btnText)    btnText.style.display    = 'none';
  if (btnSpinner) btnSpinner.style.display = 'inline-flex';
  if (submitBtn)  submitBtn.disabled       = true;

  try {
    const plan       = STATE.selectedPlan;
    const appId      = generateAppId();
    const { startDate, expiryDate } = calculateDates(plan.validYears);

    const docData = {
      applicationId:    appId,
      status:           'pending',
      submittedAt:      serverTimestamp(),

      name:             $('f-name').value.trim(),
      email:            $('f-email').value.trim().toLowerCase(),
      phone:            $('f-phone').value.trim(),
      dob:              $('f-dob').value,
      guardian:         $('f-guardian').value.trim(),
      emergencyContact: $('f-emergency').value.trim() || null,
      address:          $('f-address').value.trim(),

      planId:           plan.id,
      planName:         plan.name,
      amount:           plan.price,
      duration:         plan.duration,
      validYears:       plan.validYears,

      transactionId:    $('f-txn').value.trim(),
      screenshotURL:    null,

      startDate,
      expiryDate,

      membershipId:     null,
      verifiedAt:       null,
      verifiedBy:       null,
      adminNotes:       null
    };

    await addDoc(collection(db, 'membership_applications'), docData);

    STATE.lastAppData = {
      appId,
      plan,
      txnId: docData.transactionId,
      email: docData.email
    };
    populateSuccessStep();
    goToStep(3);

  } catch (err) {
    console.error('submitApplication error:', err);
    showGlobalError(
      '⚠️ Submission failed. Please check your internet connection and try again. ' +
      'If the problem persists, contact us directly.'
    );
  } finally {
    STATE.submitting = false;
    if (btnText)    btnText.style.display    = 'inline';
    if (btnSpinner) btnSpinner.style.display = 'none';
    if (submitBtn)  submitBtn.disabled       = false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POPULATE STEP 3 SUCCESS DATA
   ═══════════════════════════════════════════════════════════════════════════ */
function populateSuccessStep() {
  const d = STATE.lastAppData;
  if (!d) return;

  const sAppId  = $('s-app-id');
  const sPlan   = $('s-plan');
  const sAmount = $('s-amount');
  const sTxn    = $('s-txn');

  if (sAppId)  sAppId.textContent  = d.appId;
  if (sPlan)   sPlan.textContent   = d.plan.name;
  if (sAmount) sAmount.textContent = `${d.plan.currencySymbol}${d.plan.price}`;
  if (sTxn)    sTxn.textContent    = d.txnId;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SAVE CONFIRMATION AS .TXT
   ═══════════════════════════════════════════════════════════════════════════ */
function saveConfirmation() {
  const d = STATE.lastAppData;
  if (!d) return;

  const club = STATE.clubData;
  const now  = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const text = [
    '═══════════════════════════════════════════════',
    '   SARBERIA PALLY SEBA SAMITY',
    '   MEMBERSHIP APPLICATION CONFIRMATION',
    '═══════════════════════════════════════════════',
    '',
    `Application ID  : ${d.appId}`,
    `Plan            : ${d.plan.name}`,
    `Amount Paid     : ${d.plan.currencySymbol}${d.plan.price}`,
    `Transaction ID  : ${d.txnId}`,
    `Status          : Pending (Under Review)`,
    `Submitted At    : ${now} IST`,
    '',
    '───────────────────────────────────────────────',
    '   WHAT HAPPENS NEXT',
    '───────────────────────────────────────────────',
    '1. Admin verifies your transaction ID.',
    '2. Application approved within 24 hours.',
    '3. You receive an email with your digital card.',
    '4. Present your card at club events.',
    '',
    '───────────────────────────────────────────────',
    '   CHECK YOUR STATUS',
    '───────────────────────────────────────────────',
    'Visit the membership page and click "Check Status".',
    `Enter Application ID: ${d.appId}`,
    `Enter Email: ${d.email || ''}`,
    '',
    '───────────────────────────────────────────────',
    '   CONTACT',
    '───────────────────────────────────────────────',
    `Phone   : ${club.phone || '+91 00000 00000'}`,
    `Email   : ${club.email || 'sarberiapallysebasamity@gmail.com'}`,
    `Website : ${club.website || ''}`,
    '',
    '═══════════════════════════════════════════════',
    '"We unite for a better tomorrow through',
    ' Education, Health & Culture."',
    '═══════════════════════════════════════════════',
  ].join('\n');

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `PSS-Confirmation-${d.appId}.txt`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/* ═══════════════════════════════════════════════════════════════════════════
   QR ERROR FALLBACK
   ═══════════════════════════════════════════════════════════════════════════ */
window.handleQRError = function () {
  const img      = $('m-qr-img');
  const fallback = $('m-qr-fallback');
  if (img)      img.style.display      = 'none';
  if (fallback) fallback.style.display = 'flex';
};

/* ═══════════════════════════════════════════════════════════════════════════
   COPY UPI ID
   ═══════════════════════════════════════════════════════════════════════════ */
function copyUpiId() {
  const upiEl = $('m-upi-id-text');
  if (!upiEl) return;
  const text = upiEl.textContent.trim();

  const fallbackCopy = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) { /* silent */ }
    document.body.removeChild(ta);
  };

  const btn = $('m-copy-upi-btn');
  const originalText = btn ? btn.textContent : '📋 Copy';

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      if (btn) { btn.textContent = '✅ Copied!'; }
      setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
    }).catch(() => {
      fallbackCopy();
      if (btn) { btn.textContent = '✅ Copied!'; }
      setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
    });
  } else {
    fallbackCopy();
    if (btn) { btn.textContent = '✅ Copied!'; }
    setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ ACCORDION
   ═══════════════════════════════════════════════════════════════════════════ */
function initFAQ() {
  const items = document.querySelectorAll('.m-faq__item');
  items.forEach((item) => {
    const btn = item.querySelector('.m-faq__question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('m--open');
      items.forEach(i => i.classList.remove('m--open'));
      if (!isOpen) item.classList.add('m--open');
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE HAMBURGER MENU
   ═══════════════════════════════════════════════════════════════════════════ */
function initMobileMenu() {
  const hamburger = $('m-hamburger');
  const nav       = $('m-nav');
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
   STATUS CHECKER
   ═══════════════════════════════════════════════════════════════════════════ */
function initStatusChecker() {
  const openBtn   = $('m-open-status-btn');
  const closeBtn  = $('m-status-modal-close');
  const searchBtn = $('m-status-search-btn');
  const againBtn  = $('ms-search-again-btn');
  const closeBtnR = $('ms-close-btn');
  const modal     = $('m-status-modal');

  // "Check Status" button after submit (step 3)
  const checkAfterSubmit = $('m-check-status-after-submit');

  if (openBtn) {
    openBtn.addEventListener('click', openStatusModal);
  }

  if (checkAfterSubmit) {
    checkAfterSubmit.addEventListener('click', () => {
      openStatusModal();
      // Pre-fill with last submission data
      if (STATE.lastAppData) {
        const appIdEl = $('ms-app-id');
        const emailEl = $('ms-email');
        if (appIdEl) appIdEl.value = STATE.lastAppData.appId || '';
        if (emailEl) emailEl.value = STATE.lastAppData.email || '';
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeStatusModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeStatusModal();
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', searchApplication);
  }

  if (againBtn) {
    againBtn.addEventListener('click', showSearchForm);
  }

  if (closeBtnR) {
    closeBtnR.addEventListener('click', closeStatusModal);
  }

  // Clear errors on focus
  ['ms-app-id', 'ms-email'].forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener('focus', () => {
        const errEl = $(id + '-err');
        if (errEl) errEl.textContent = '';
        el.classList.remove('m--error');
        const gErr = $('ms-error');
        if (gErr) gErr.style.display = 'none';
      });
    }
  });
}

function openStatusModal() {
  const modal = $('m-status-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.classList.add('m-scroll-locked');
  }
  showSearchForm();
}

function closeStatusModal() {
  const modal = $('m-status-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('m-scroll-locked');
  }
}

function showSearchForm() {
  const searchForm = $('m-status-search-form');
  const results    = $('m-status-results');
  if (searchForm) searchForm.style.display = 'flex';
  if (results)    results.style.display    = 'none';

  const appIdEl = $('ms-app-id');
  const emailEl = $('ms-email');
  if (appIdEl) appIdEl.value = '';
  if (emailEl) emailEl.value = '';

  ['ms-app-id-err', 'ms-email-err'].forEach(id => {
    const el = $(id);
    if (el) el.textContent = '';
  });
  const gErr = $('ms-error');
  if (gErr) gErr.style.display = 'none';
}

function formatDateForStatus(val) {
  if (!val) return '—';
  if (val && typeof val.toDate === 'function') {
    return val.toDate().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
  return String(val);
}

async function searchApplication() {
  const appIdEl = $('ms-app-id');
  const emailEl = $('ms-email');
  const errEl   = $('ms-error');

  const appId = (appIdEl?.value || '').trim().toUpperCase();
  const email = (emailEl?.value || '').trim().toLowerCase();

  // Validate
  let valid = true;
  if (!appId) {
    const e = $('ms-app-id-err');
    if (e) e.textContent = 'Application ID is required.';
    appIdEl?.classList.add('m--error');
    valid = false;
  }
  if (!email) {
    const e = $('ms-email-err');
    if (e) e.textContent = 'Email address is required.';
    emailEl?.classList.add('m--error');
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const e = $('ms-email-err');
    if (e) e.textContent = 'Please enter a valid email.';
    emailEl?.classList.add('m--error');
    valid = false;
  }
  if (!valid) return;

  // Show loading
  const searchBtn = $('m-status-search-btn');
  const btnText   = searchBtn?.querySelector('.m-btn__text');
  const btnSpin   = searchBtn?.querySelector('.m-btn__spinner');
  if (btnText)   btnText.style.display   = 'none';
  if (btnSpin)   btnSpin.style.display   = 'inline-flex';
  if (searchBtn) searchBtn.disabled      = true;
  if (errEl)     errEl.style.display     = 'none';

  try {
    const q = fbQuery(
      collection(db, 'membership_applications'),
      where('applicationId', '==', appId),
      where('email', '==', email)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      if (errEl) {
        errEl.textContent =
          '❌ No application found with this ID and email combination. ' +
          'Please check your Application ID and email address and try again.';
        errEl.style.display = 'block';
      }
      return;
    }

    const docData = snapshot.docs[0].data();
    showStatusResults(docData);

  } catch (err) {
    console.error('Status search error:', err);
    if (errEl) {
      errEl.textContent =
        '⚠️ Something went wrong. Please check your internet connection and try again.';
      errEl.style.display = 'block';
    }
  } finally {
    if (btnText)   btnText.style.display   = 'inline';
    if (btnSpin)   btnSpin.style.display   = 'none';
    if (searchBtn) searchBtn.disabled      = false;
  }
}

function showStatusResults(app) {
  const searchForm = $('m-status-search-form');
  const results    = $('m-status-results');
  if (searchForm) searchForm.style.display = 'none';
  if (results)    results.style.display    = 'flex';

  // Banner
  const banner     = $('ms-banner');
  const bannerIcon = $('ms-banner-icon');
  const bannerStat = $('ms-banner-status');

  if (banner) {
    banner.classList.remove(
      'm-status-banner--pending',
      'm-status-banner--approved',
      'm-status-banner--rejected'
    );
  }

  const statusMap = {
    pending: {
      cls:   'm-status-banner--pending',
      icon:  '⏳',
      label: 'Pending Review',
      msg:   'Your application is currently under review. Our admin team will ' +
             'verify your payment and process your application within 24 hours. ' +
             'You will receive an email once it is approved.'
    },
    approved: {
      cls:   'm-status-banner--approved',
      icon:  '✅',
      label: 'Approved',
      msg:   'Congratulations! Your membership has been approved. You should ' +
             'receive (or have already received) an email with your digital ' +
             'membership card (PDF) attached. If you haven\'t received it yet, ' +
             'please contact us with your Application ID.'
    },
    rejected: {
      cls:   'm-status-banner--rejected',
      icon:  '❌',
      label: 'Rejected',
      msg:   'Unfortunately, your application was not approved. Please check the ' +
             'rejection reason below. If you believe this is an error or you have ' +
             'questions, please contact us with your Application ID.'
    }
  };

  const info = statusMap[app.status] || statusMap.pending;
  if (banner)     banner.classList.add(info.cls);
  if (bannerIcon) bannerIcon.textContent  = info.icon;
  if (bannerStat) bannerStat.textContent  = info.label;

  // Status message
  const msgEl = $('ms-message');
  if (msgEl) msgEl.textContent = info.msg;

  // Application details
  const set = (id, val) => {
    const el = $(id);
    if (el) el.textContent = val || '—';
  };

  set('ms-r-appid',     app.applicationId);
  set('ms-r-name',      app.name);
  set('ms-r-plan',      app.planName);
  set('ms-r-amount',    `₹${app.amount || 0}`);
  set('ms-r-txn',       app.transactionId);
  set('ms-r-submitted', formatDateForStatus(app.submittedAt));

  // Approved details
  const approvedBlock = $('ms-approved-details');
  if (approvedBlock) {
    approvedBlock.style.display = app.status === 'approved' ? 'block' : 'none';
  }
  if (app.status === 'approved') {
    set('ms-r-mid',      app.membershipId);
    set('ms-r-start',    formatDateForStatus(app.startDate));
    set('ms-r-expiry',   formatDateForStatus(app.expiryDate));
    set('ms-r-verified', formatDateForStatus(app.verifiedAt));
  }

  // Rejected details
  const rejectedBlock = $('ms-rejected-details');
  if (rejectedBlock) {
    rejectedBlock.style.display = app.status === 'rejected' ? 'block' : 'none';
  }
  if (app.status === 'rejected') {
    set('ms-r-reason',        app.adminNotes || 'No reason provided.');
    set('ms-r-rejected-date', formatDateForStatus(app.verifiedAt));
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   ATTACH ALL EVENT LISTENERS
   ═══════════════════════════════════════════════════════════════════════════ */
function attachListeners() {
  // Step 1 → 2
  const step1Next = $('m-step1-next');
  if (step1Next) {
    step1Next.addEventListener('click', () => {
      if (validateStep1()) goToStep(2);
    });
  }

  // Step 2 → 1 (back)
  const step2Back = $('m-step2-back');
  if (step2Back) {
    step2Back.addEventListener('click', () => goToStep(1));
  }

  // Submit
  const step2Submit = $('m-step2-submit');
  if (step2Submit) {
    step2Submit.addEventListener('click', submitApplication);
  }

  // Change plan
  const changePlanBtn = $('m-change-plan-btn');
  if (changePlanBtn) {
    changePlanBtn.addEventListener('click', () => {
      const plansSection = $('plans');
      if (plansSection) {
        plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Copy UPI
  const copyUpiBtn = $('m-copy-upi-btn');
  if (copyUpiBtn) {
    copyUpiBtn.addEventListener('click', copyUpiId);
  }

  // Save confirmation
  const saveBtn = $('m-save-confirmation-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveConfirmation);
  }

  // Real-time error clearing
  const clearMap = [
    ['f-name',      'e-name'],
    ['f-email',     'e-email'],
    ['f-phone',     'e-phone'],
    ['f-dob',       'e-dob'],
    ['f-guardian',  'e-guardian'],
    ['f-emergency', 'e-emergency'],
    ['f-address',   'e-address'],
    ['f-txn',       'e-txn'],
  ];
  clearMap.forEach(([fieldId, errId]) => {
    const el = $(fieldId);
    if (el) {
      el.addEventListener('focus', () => clearError(fieldId, errId));
      el.addEventListener('input', () => clearError(fieldId, errId));
    }
  });

  // Checkbox error clear
  const confirmCb = $('f-confirm');
  if (confirmCb) {
    confirmCb.addEventListener('change', () => {
      const errEl = $('e-confirm');
      if (errEl && confirmCb.checked) errEl.textContent = '';
    });
  }

  // Phone: digits only
  const phoneField = $('f-phone');
  if (phoneField) {
    phoneField.addEventListener('input', () => {
      phoneField.value = phoneField.value.replace(/\D/g, '').slice(0, 10);
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadPlans();
  initFAQ();
  initMobileMenu();
  attachListeners();
  initStatusChecker();

  const fyEl = $('m-footer-year');
  if (fyEl) fyEl.textContent = new Date().getFullYear();
});