/**
 * card-generator.js
 * Handles admin/card-generator.html
 * - Reads URL params and pre-fills inputs
 * - Live preview of card overlays
 * - PDF generation via html2canvas + jsPDF
 * - Auth guard (handled by admin.js onAuthStateChanged)
 * - Fix: overlay now correctly shows plan duration from URL
 */

const $ = (id) => document.getElementById(id);

/* ── Format date to DD / MM / YYYY ── */
function formatDateDisplay(isoStr) {
  if (!isoStr) return 'DD / MM / YYYY';
  const [y, m, d] = isoStr.split('-');
  if (!y || !m || !d) return isoStr;
  return `${d} / ${m} / ${y}`;
}

/* ── Today as YYYY-MM-DD ── */
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/* ── Fallback membership ID ── */
function generateMembershipId() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PSS-${year}-${random}`;
}

/* ── Update card overlay preview ── */
function updatePreview() {
  const name = ($('ag-name') || {}).value?.trim().toUpperCase() || 'MEMBER NAME';
  const mid = ($('ag-mid') || {}).value?.trim() || 'PSS-0000-0000';
  const date = ($('ag-date') || {}).value || '';
  const valid = ($('ag-valid') || {}).value || '1'; // just the number
  
  const nameEl = $('ag-overlay-name');
  const idEl = $('ag-overlay-id');
  const dateEl = $('ag-overlay-date');
  const validEl = $('ag-overlay-valid');
  
  if (nameEl) nameEl.textContent = name;
  if (idEl) idEl.textContent = mid;
  if (dateEl) dateEl.textContent = formatDateDisplay(date);
  if (validEl) validEl.textContent = valid; // shows e.g. "2"
}

/* ── Pre-fill form from URL params ── */
function prefillFromURL() {
  const params = new URLSearchParams(window.location.search);
  let hasPrefill = false;
  
  const name = params.get('name') || '';
  const email = params.get('email') || '';
  const appId = params.get('appId') || '';
  const membershipId = params.get('membershipId') || '';
  const validYears = parseInt(params.get('validYears'), 10) || 1; // number
  
  if (name || membershipId) hasPrefill = true;
  
  // Fill the fields
  if ($('ag-name')) $('ag-name').value = name;
  if ($('ag-email')) $('ag-email').value = email;
  if ($('ag-appid')) $('ag-appid').value = appId;
  if ($('ag-mid')) $('ag-mid').value = membershipId || generateMembershipId();
  if ($('ag-date')) $('ag-date').value = todayISO();
  
  // Set the "Valid For" dropdown to the correct number
  const validSelect = $('ag-valid');
  if (validSelect) {
    // Find and select the matching option (1,2,3)
    for (const opt of validSelect.options) {
      if (parseInt(opt.value, 10) === validYears) {
        opt.selected = true;
        break;
      }
    }
  }
  
  // Show notice if pre-filled
  const notice = $('ag-prefill-notice');
  if (notice) notice.style.display = hasPrefill ? 'flex' : 'none';
  
  // Immediately update the overlay with the correct duration
  // (even if dropdown hasn't fired change event yet)
  const validOverlay = $('ag-overlay-valid');
  if (validOverlay) {
    validOverlay.textContent = validYears;
  }
  
  // Finally, refresh all overlays
  updatePreview();
}

/* ── Template error fallback ── */
window.handleTemplateError = function() {
  const img = $('ag-card-bg');
  const wrap = $('ag-card-wrap');
  if (img) img.style.display = 'none';
  if (wrap) {
    wrap.style.background =
      'linear-gradient(135deg, #1a1a2e 0%, #0f3460 60%, #16213e 100%)';
  }
};

/* ── Generate PDF ── */
async function generatePDF() {
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
  
  updatePreview();
  
  const loadingEl = $('ag-loading-overlay');
  const downloadBtn = $('ag-download-btn');
  if (loadingEl) loadingEl.style.display = 'flex';
  if (downloadBtn) downloadBtn.disabled = true;
  
  // Wait for DOM to render
  await new Promise(r => setTimeout(r, 120));
  
  try {
    const cardEl = $('ag-card-wrap');
    if (!cardEl) throw new Error('Card element not found.');
    
    const canvas = await html2canvas(cardEl, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      imageTimeout: 10000,
    });
    
    const safeMid = mid.replace(/[^a-zA-Z0-9-]/g, '');
    const filename = `Membership-Card-${safeMid}.pdf`;
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [228, 148],
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, 228, 148);
    pdf.save(filename);
    
    if (downloadBtn) {
      const orig = downloadBtn.textContent;
      downloadBtn.textContent = '✅ Downloaded!';
      setTimeout(() => { downloadBtn.textContent = orig; }, 3000);
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

/* ── Attach listeners ── */
function attachListeners() {
  ['ag-name', 'ag-mid', 'ag-date', 'ag-valid'].forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', updatePreview);
    }
  });
  
  const downloadBtn = $('ag-download-btn');
  if (downloadBtn) downloadBtn.addEventListener('click', generatePDF);
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  prefillFromURL();
  attachListeners();
  
  // Fallback if date is empty
  const dateEl = $('ag-date');
  if (dateEl && !dateEl.value) {
    dateEl.value = todayISO();
    updatePreview();
  }
});