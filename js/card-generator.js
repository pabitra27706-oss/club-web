/**
 * card-generator.js
 * Handles admin/card-generator.html
 * - Reads URL params and pre-fills inputs
 * - Live preview of card overlays
 * - PDF generation via html2canvas + jsPDF
 * - Auth guard (handled by admin.js onAuthStateChanged)
 */

/* ═══════════════════════════════════════════════════════════════════════════
   DOM HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
const $ = (id) => document.getElementById(id);

/* ═══════════════════════════════════════════════════════════════════════════
   FORMAT DATE: YYYY-MM-DD → DD / MM / YYYY
   ═══════════════════════════════════════════════════════════════════════════ */
function formatDateDisplay(isoStr) {
  if (!isoStr) return 'DD / MM / YYYY';
  const [y, m, d] = isoStr.split('-');
  if (!y || !m || !d) return isoStr;
  return `${d} / ${m} / ${y}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   GET TODAY AS YYYY-MM-DD
   ═══════════════════════════════════════════════════════════════════════════ */
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/* ═══════════════════════════════════════════════════════════════════════════
   GENERATE MEMBERSHIP ID (fallback if not passed via URL)
   ═══════════════════════════════════════════════════════════════════════════ */
function generateMembershipId() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PSS-${year}-${random}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   UPDATE CARD PREVIEW OVERLAYS
   ═══════════════════════════════════════════════════════════════════════════ */
function updatePreview() {
  const name = ($('ag-name') || {}).value?.trim().toUpperCase() || 'MEMBER NAME';
  const mid = ($('ag-mid') || {}).value?.trim() || 'PSS-0000-0000';
  const date = ($('ag-date') || {}).value || '';
  const valid = ($('ag-valid') || {}).value || '1';
  
  const nameEl = $('ag-overlay-name');
  const idEl = $('ag-overlay-id');
  const dateEl = $('ag-overlay-date');
  const validEl = $('ag-overlay-valid');
  
  if (nameEl) nameEl.textContent = name;
  if (idEl) idEl.textContent = mid;
  if (dateEl) dateEl.textContent = formatDateDisplay(date);
  if (validEl) validEl.textContent = valid;
}

/* ═══════════════════════════════════════════════════════════════════════════
   READ URL PARAMS AND PRE-FILL
   ═══════════════════════════════════════════════════════════════════════════ */
function prefillFromURL() {
  const params = new URLSearchParams(window.location.search);
  let hasPrefill = false;
  
  const name = params.get('name') || '';
  const email = params.get('email') || '';
  const appId = params.get('appId') || '';
  const membershipId = params.get('membershipId') || '';
  const validYears = params.get('validYears') || '1';
  
  if (name || membershipId) hasPrefill = true;
  
  const setVal = (id, val) => {
    const el = $(id);
    if (el && val) el.value = val;
  };
  
  setVal('ag-name', name);
  setVal('ag-email', email);
  setVal('ag-appid', appId);
  setVal('ag-mid', membershipId || generateMembershipId());
  setVal('ag-date', todayISO());
  
  // Set valid years dropdown
  const validEl = $('ag-valid');
  if (validEl) {
    const vy = String(parseInt(validYears, 10) || 1);
    // Find matching option
    for (const opt of validEl.options) {
      if (opt.value === vy) { opt.selected = true; break; }
    }
  }
  
  // Show prefill notice
  if (hasPrefill) {
    const notice = $('ag-prefill-notice');
    if (notice) notice.style.display = 'flex';
  }
  
  // If no membershipId from URL, set generated one
  const midEl = $('ag-mid');
  if (midEl && !midEl.value) {
    midEl.value = generateMembershipId();
  }
  
  updatePreview();
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE ERROR FALLBACK
   ═══════════════════════════════════════════════════════════════════════════ */
window.handleTemplateError = function() {
  const img = $('ag-card-bg');
  const wrap = $('ag-card-wrap');
  if (img) img.style.display = 'none';
  if (wrap) {
    wrap.style.background =
      'linear-gradient(135deg, #1a1a2e 0%, #0f3460 60%, #16213e 100%)';
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   PDF GENERATION
   ═══════════════════════════════════════════════════════════════════════════ */
async function generatePDF() {
  // Validate required fields
  const name = ($('ag-name') || {}).value?.trim();
  const mid = ($('ag-mid') || {}).value?.trim();
  
  if (!name) {
    alert('Please enter the member name before downloading.');
    $('ag-name')?.focus();
    return;
  }
  if (!mid) {
    alert('Membership ID is missing.');
    return;
  }
  
  // Ensure preview is up to date
  updatePreview();
  
  // Show loading overlay
  const loadingEl = $('ag-loading-overlay');
  const downloadBtn = $('ag-download-btn');
  if (loadingEl) loadingEl.style.display = 'flex';
  if (downloadBtn) downloadBtn.disabled = true;
  
  // Small delay to let DOM update render
  await new Promise(r => setTimeout(r, 120));
  
  try {
    const cardEl = $('ag-card-wrap');
    if (!cardEl) throw new Error('Card element not found.');
    
    // Capture with html2canvas at 3× scale for quality
    const canvas = await html2canvas(cardEl, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      imageTimeout: 10000,
    });
    
    // Build filename from membership ID
    const safeMid = mid.replace(/[^a-zA-Z0-9-]/g, '');
    const filename = `Membership-Card-${safeMid}.pdf`;
    
    // Create PDF — landscape, custom size (228mm × 148mm ≈ A5 landscape)
    // jsPDF: new jsPDF(orientation, unit, [width, height])
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [228, 148],
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Add image to fill the entire page
    pdf.addImage(imgData, 'PNG', 0, 0, 228, 148);
    
    // Save / download
    pdf.save(filename);
    
    // Success feedback
    if (downloadBtn) {
      const orig = downloadBtn.textContent;
      downloadBtn.textContent = '✅ Downloaded!';
      setTimeout(() => {
        downloadBtn.textContent = orig;
      }, 3000);
    }
    
  } catch (err) {
    console.error('PDF generation error:', err);
    alert(
      '⚠️ PDF generation failed.\n\n' +
      'Possible reasons:\n' +
      '• Card template image not found\n' +
      '• Browser security restriction (try from a server, not file://)\n' +
      '• html2canvas or jsPDF script failed to load\n\n' +
      'Error: ' + (err.message || String(err))
    );
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
    if (downloadBtn) downloadBtn.disabled = false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   ATTACH EVENT LISTENERS
   ═══════════════════════════════════════════════════════════════════════════ */
function attachListeners() {
  // Live preview on all input changes
  const liveFields = ['ag-name', 'ag-mid', 'ag-date', 'ag-valid'];
  liveFields.forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', updatePreview);
    }
  });
  
  // Download button
  const downloadBtn = $('ag-download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', generatePDF);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  prefillFromURL();
  attachListeners();
  
  // Set default date if not pre-filled
  const dateEl = $('ag-date');
  if (dateEl && !dateEl.value) {
    dateEl.value = todayISO();
    updatePreview();
  }
});