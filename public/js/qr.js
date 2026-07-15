// ============================================================
//  qr.js — QR Registration Page Logic
//
//  Responsibilities:
//    1. Live clock in the topbar
//    2. Registration form — validate, POST /api/qr/register,
//       render QR image with QRCode.js, download as PNG
//    3. Re-download modal — fetch existing token, re-render QR
//    4. "Register Another" resets the form cleanly
// ============================================================

// ---- CSRF token (embedded in the meta tag by Blade) ----
const CSRF = document.querySelector('meta[name="csrf-token"]').content;

// ---- State ----
let currentToken     = null;   // UUID last returned by the API
let currentName      = null;   // full name for the download filename
let currentSchoolId  = null;   // school ID for the download filename

// ===========================================================
//  1. LIVE CLOCK
// ===========================================================
function updateClock() {
  const now  = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });
  document.getElementById('clockTime').textContent = time;
  document.getElementById('clockDate').textContent = date;
}
updateClock();
setInterval(updateClock, 1000);

// ===========================================================
//  2. HELPERS
// ===========================================================

/** Show or clear a field-level validation error. */
function setFieldError(groupId, errorId, message) {
  const grp = document.getElementById(groupId);
  const err = document.getElementById(errorId);
  if (message) {
    grp.classList.add('has-error');
    err.textContent = message;
  } else {
    grp.classList.remove('has-error');
    err.textContent = '';
  }
}

/** Clear all field errors and the global banner. */
function clearErrors() {
  ['grpSchoolId','grpLastName','grpFirstName','grpMI'].forEach(id => {
    document.getElementById(id).classList.remove('has-error');
  });
  ['errSchoolId','errLastName','errFirstName','errMI'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
  const banner = document.getElementById('formBanner');
  banner.style.display = 'none';
  banner.textContent   = '';
}

/** Show the global error banner inside the form. */
function showBanner(message, bannerId = 'formBanner') {
  const banner = document.getElementById(bannerId);
  banner.textContent   = message;
  banner.style.display = 'block';
}

/** Set the Register button into loading state. */
function setLoading(loading) {
  const btn = document.getElementById('btnRegister');
  if (loading) {
    btn.disabled   = true;
    btn.innerHTML  = '<span class="spinner"></span> Registering…';
  } else {
    btn.disabled   = false;
    btn.innerHTML  = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
        Register &amp; Generate QR Code`;
  }
}

/**
 * Render a QR code inside the given container element.
 * Clears any previous QR first.
 * @param {string} containerId  — id of the wrapper div
 * @param {string} token        — value to encode
 */
function renderQr(containerId, token) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';   // clear previous render
  // QRCode.js constructor — options mirror the library's API
  new QRCode(container, {
    text:         token,
    width:        200,
    height:       200,
    colorDark:    '#1a4d3e',   // matches --green-dark
    colorLight:   '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,   // high error correction
  });
}

/**
 * Trigger a PNG download of the rendered QR canvas.
 * QRCode.js injects either a <canvas> or an <img> depending on the browser.
 */
function downloadQr(filename) {
  const container = document.getElementById('qrCanvas');
  const canvas    = container.querySelector('canvas');
  const img       = container.querySelector('img');

  if (canvas) {
    const link  = document.createElement('a');
    link.href   = canvas.toDataURL('image/png');
    link.download = filename;
    link.click();
  } else if (img) {
    // Fallback for browsers that render an <img> instead of <canvas>
    const link  = document.createElement('a');
    link.href   = img.src;
    link.download = filename;
    link.click();
  }
}

// ===========================================================
//  3. SHOW SUCCESS PANEL
// ===========================================================
function showSuccess(data) {
  const mi       = data.middle_initial ? ` ${data.middle_initial}.` : '';
  const fullName = `${data.first_name}${mi} ${data.last_name}`;
  const genDate  = new Date(data.qr_generated_at).toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Store state for download
  currentToken    = data.qr_token;
  currentName     = fullName;
  currentSchoolId = data.school_id;

  // Populate success panel text
  document.getElementById('successName').textContent = fullName;
  document.getElementById('successId').textContent   = `School ID: ${data.school_id}`;
  document.getElementById('qrDate').textContent      = genDate;

  // Render QR
  renderQr('qrCanvas', data.qr_token);

  // Swap panels
  document.getElementById('panelForm').style.display    = 'none';
  document.getElementById('panelSuccess').style.display = '';

  // Scroll to top of card
  document.getElementById('panelSuccess').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===========================================================
//  4. REGISTRATION FORM SUBMIT
// ===========================================================
document.getElementById('regForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const schoolId      = document.getElementById('schoolId').value.trim();
  const lastName      = document.getElementById('lastName').value.trim();
  const firstName     = document.getElementById('firstName').value.trim();
  const middleInitial = document.getElementById('middleInitial').value.trim();

  // ---- Client-side validation ----
  let valid = true;
  if (!schoolId)  { setFieldError('grpSchoolId', 'errSchoolId', 'School ID is required.'); valid = false; }
  if (!lastName)  { setFieldError('grpLastName',  'errLastName',  'Last name is required.'); valid = false; }
  if (!firstName) { setFieldError('grpFirstName', 'errFirstName', 'First name is required.'); valid = false; }
  if (middleInitial && !/^[A-Za-z]$/.test(middleInitial)) {
    setFieldError('grpMI', 'errMI', 'Must be a single letter.'); valid = false;
  }
  if (!valid) return;

  setLoading(true);

  try {
    const res  = await fetch('/api/qr/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': CSRF },
      body:    JSON.stringify({
        school_id:      schoolId,
        last_name:      lastName,
        first_name:     firstName,
        middle_initial: middleInitial || null,
      }),
    });
    const data = await res.json();

    if (res.status === 422) {
      // Server-side field validation errors
      if (data.errors?.school_id)       setFieldError('grpSchoolId', 'errSchoolId', data.errors.school_id);
      if (data.errors?.last_name)       setFieldError('grpLastName',  'errLastName',  data.errors.last_name);
      if (data.errors?.first_name)      setFieldError('grpFirstName', 'errFirstName', data.errors.first_name);
      if (data.errors?.middle_initial)  setFieldError('grpMI',        'errMI',        data.errors.middle_initial);
      return;
    }

    if (res.status === 409) {
      // Duplicate school ID
      showBanner(data.error || 'This School ID is already registered.');
      setFieldError('grpSchoolId', 'errSchoolId', 'Already registered.');
      return;
    }

    if (!res.ok) {
      showBanner(data.error || 'An unexpected error occurred. Please try again.');
      return;
    }

    // Success — show QR panel
    showSuccess(data);

  } catch {
    showBanner('Network error. Please check your connection and try again.');
  } finally {
    setLoading(false);
  }
});

// ===========================================================
//  5. DOWNLOAD BUTTON
// ===========================================================
document.getElementById('btnDownload').addEventListener('click', () => {
  if (!currentToken) return;
  const safeName = (currentName || 'qr').replace(/\s+/g, '_');
  const safeId   = (currentSchoolId || 'id').replace(/\W+/g, '-');
  downloadQr(`QR_${safeName}_${safeId}.png`);
});

// ===========================================================
//  6. REGISTER ANOTHER — reset to form
// ===========================================================
document.getElementById('btnNewReg').addEventListener('click', () => {
  // Reset form fields
  document.getElementById('regForm').reset();
  clearErrors();

  // Clear QR state
  currentToken    = null;
  currentName     = null;
  currentSchoolId = null;
  document.getElementById('qrCanvas').innerHTML = '';

  // Swap panels
  document.getElementById('panelSuccess').style.display = 'none';
  document.getElementById('panelForm').style.display    = '';
});

// ===========================================================
//  7. RE-DOWNLOAD MODAL
// ===========================================================
const redownloadOverlay = document.getElementById('redownloadOverlay');

// Open modal
document.getElementById('btnRedownload').addEventListener('click', () => {
  document.getElementById('reSchoolId').value = '';
  document.getElementById('errReSchoolId').textContent = '';
  document.getElementById('grpReSchoolId').classList.remove('has-error');
  const reBanner = document.getElementById('reBanner');
  reBanner.style.display = 'none';
  reBanner.textContent   = '';
  redownloadOverlay.style.display = 'flex';
  document.getElementById('reSchoolId').focus();
});

// Close modal
function closeRedownloadModal() {
  redownloadOverlay.style.display = 'none';
}
document.getElementById('closeRedownload').addEventListener('click',  closeRedownloadModal);
document.getElementById('cancelRedownload').addEventListener('click', closeRedownloadModal);
redownloadOverlay.addEventListener('click', (e) => {
  if (e.target === redownloadOverlay) closeRedownloadModal();
});

// Fetch token and show success panel
document.getElementById('btnFetchToken').addEventListener('click', async () => {
  const schoolId = document.getElementById('reSchoolId').value.trim();
  const errEl    = document.getElementById('errReSchoolId');
  const grpEl    = document.getElementById('grpReSchoolId');
  const reBanner = document.getElementById('reBanner');

  // Reset
  errEl.textContent = '';
  grpEl.classList.remove('has-error');
  reBanner.style.display = 'none';
  reBanner.textContent   = '';

  if (!schoolId) {
    grpEl.classList.add('has-error');
    errEl.textContent = 'Please enter your School ID.';
    return;
  }

  const btn = document.getElementById('btnFetchToken');
  btn.disabled  = true;
  btn.textContent = 'Looking up…';

  try {
    // Normalise ID to uppercase (mirrors server normalise())
    const normId = schoolId.toUpperCase().replace(/\s+/g, '');
    const res    = await fetch(`/api/qr/token/${encodeURIComponent(normId)}`);
    const data   = await res.json();

    if (res.status === 404) {
      grpEl.classList.add('has-error');
      errEl.textContent = 'School ID not found. Please register first.';
      return;
    }
    if (!res.ok) {
      showBanner(data.error || 'Could not retrieve QR code.', 'reBanner');
      return;
    }

    // Close modal, show success panel with existing token
    closeRedownloadModal();
    showSuccess(data);

  } catch {
    showBanner('Network error. Please try again.', 'reBanner');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Retrieve QR Code';
  }
});
