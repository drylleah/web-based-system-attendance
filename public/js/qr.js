// ============================================================
//  qr.js — QR Registration Page Logic
//
//  Responsibilities:
//    1. Registration form — validate, POST /api/qr/register,
//       render QR image with QRCode.js, download as PNG
//    2. Re-download modal — fetch existing token, re-render QR
//    3. "Register Another" resets the form cleanly
// ============================================================

// ---- CSRF token (embedded in the meta tag by Blade) ----
const CSRF = document.querySelector('meta[name="csrf-token"]').content;

// ---- State ----
let currentToken     = null;   // UUID last returned by the API
let currentName      = null;   // full name for the download filename
let currentSchoolId  = null;   // school ID for the download filename

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

// ============================================================
//  REGISTERED QR USERS — management modal
//
//  Features
//  ────────
//  • Load all QR-registered users via GET /api/qr/cards
//  • Real-time search filter (School ID or name)
//  • View QR Code — renders token in a sub-modal with download
//  • Edit — update last/first name and middle initial in-place
//  • Delete — confirmation dialog before DELETE /api/qr/cards/{id}
//  • Count badge on the open-modal button stays in sync
// ============================================================

// ---- Element refs ----
const mgmtOverlay     = document.getElementById('mgmtOverlay');
const mgmtTableBody   = document.getElementById('mgmtTableBody');
const mgmtEmpty       = document.getElementById('mgmtEmpty');
const mgmtLoading     = document.getElementById('mgmtLoading');
const mgmtToastEl     = document.getElementById('mgmtToast');
const mgmtCountBadge  = document.getElementById('mgmtCount');
const mgmtHeaderCount = document.getElementById('mgmtHeaderCount');
const mgmtSearchInput = document.getElementById('mgmtSearch');

// ---- Data ----
let mgmtAllCards = [];   // full list from API

// ============================================================
//  OPEN / CLOSE
// ============================================================
document.getElementById('btnOpenMgmt').addEventListener('click', () => {
  mgmtOverlay.classList.add('show');
  loadMgmtCards();
});

document.getElementById('closeMgmt').addEventListener('click', closeMgmt);
mgmtOverlay.addEventListener('click', (e) => {
  if (e.target === mgmtOverlay) closeMgmt();
});

function closeMgmt() {
  mgmtOverlay.classList.remove('show');
}

// ============================================================
//  REFRESH BUTTON
// ============================================================
document.getElementById('mgmtRefresh').addEventListener('click', () => {
  mgmtSearchInput.value = '';
  loadMgmtCards();
});

// ============================================================
//  LOAD CARDS  —  GET /api/qr/cards
// ============================================================
async function loadMgmtCards() {
  mgmtLoading.style.display = 'flex';
  mgmtEmpty.style.display   = 'none';
  mgmtTableBody.innerHTML   = '';

  try {
    const res  = await fetch('/api/qr/cards', {
      headers: { 'X-CSRF-TOKEN': CSRF },
    });

    if (res.status === 401) {
      mgmtTableBody.innerHTML = `
        <tr><td colspan="6" style="text-align:center;padding:28px;color:#b91c1c;">
          Not logged in as admin. <a href="/" style="color:var(--green-main);font-weight:600;">Log in</a> to manage registrations.
        </td></tr>`;
      mgmtLoading.style.display = 'none';
      return;
    }

    const data = await res.json();
    mgmtAllCards = data.cards || [];

    // Update both count badges
    const total = mgmtAllCards.length;
    mgmtCountBadge.textContent  = total;
    mgmtHeaderCount.textContent = total;

    renderMgmtTable(mgmtAllCards);

  } catch {
    showMgmtToast('Failed to load registrations. Check your connection.', 'err');
  } finally {
    mgmtLoading.style.display = 'none';
  }
}

// ============================================================
//  RENDER TABLE
// ============================================================
function renderMgmtTable(cards) {
  mgmtTableBody.innerHTML = '';

  if (!cards.length) {
    mgmtEmpty.style.display = 'flex';
    return;
  }
  mgmtEmpty.style.display = 'none';

  cards.forEach(card => {
    const date = card.created_at
      ? new Date(card.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })
      : '—';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mgmt-cell-id">${escHtml(card.school_id)}</td>
      <td class="mgmt-cell-name">${escHtml(card.last_name)}</td>
      <td class="mgmt-cell-name">${escHtml(card.first_name)}</td>
      <td class="mgmt-cell-mi">${card.middle_initial ? escHtml(card.middle_initial) : '—'}</td>
      <td class="mgmt-cell-date">${date}</td>
      <td>
        <div class="mgmt-actions">
          <button class="mgmt-btn-icon view" title="View QR Code" data-id="${escHtml(card.school_id)}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0
                   8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12
                   19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            </svg>
          </button>
          <button class="mgmt-btn-icon edit" title="Edit" data-id="${escHtml(card.school_id)}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5
                   4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 7.125 18 14v4.75A2.25 2.25 0 0 1 15.75
                21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
            </svg>
          </button>
          <button class="mgmt-btn-icon delete" title="Delete" data-id="${escHtml(card.school_id)}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107
                   1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244
                   2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456
                   0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114
                   1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201
                   a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09
                   2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
            </svg>
          </button>
        </div>
      </td>`;

    // Wire up action buttons
    tr.querySelector('.view').addEventListener('click',
      () => openQrViewer(card));
    tr.querySelector('.edit').addEventListener('click',
      () => openEditModal(card));
    tr.querySelector('.delete').addEventListener('click',
      () => openDeleteModal(card));

    mgmtTableBody.appendChild(tr);
  });
}

// ============================================================
//  SEARCH FILTER
// ============================================================
mgmtSearchInput.addEventListener('input', () => {
  const q = mgmtSearchInput.value.toLowerCase().trim();
  if (!q) {
    renderMgmtTable(mgmtAllCards);
    return;
  }
  const filtered = mgmtAllCards.filter(c =>
    c.school_id.toLowerCase().includes(q)   ||
    c.last_name.toLowerCase().includes(q)   ||
    c.first_name.toLowerCase().includes(q)  ||
    (c.middle_initial || '').toLowerCase().includes(q)
  );
  renderMgmtTable(filtered);
});

// ============================================================
//  QR VIEWER SUB-MODAL
// ============================================================
const qrViewerOverlay = document.getElementById('qrViewerOverlay');
let   viewerCard      = null;  // card currently shown in viewer

function openQrViewer(card) {
  viewerCard = card;

  const mi       = card.middle_initial ? ` ${card.middle_initial}.` : '';
  const fullName = `${card.first_name}${mi} ${card.last_name}`;
  const genDate  = card.qr_generated_at
    ? new Date(card.qr_generated_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—';

  document.getElementById('viewerName').textContent = fullName;
  document.getElementById('viewerId').textContent   = `School ID: ${card.school_id}`;
  document.getElementById('viewerDate').textContent = genDate;

  // Render fresh QR into the viewer canvas
  const container = document.getElementById('viewerQrCanvas');
  container.innerHTML = '';
  new QRCode(container, {
    text:         card.qr_token,
    width:        200,
    height:       200,
    colorDark:    '#1a4d3e',
    colorLight:   '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });

  qrViewerOverlay.style.display = 'flex';
}

document.getElementById('closeQrViewer').addEventListener('click', () => {
  qrViewerOverlay.style.display = 'none';
  viewerCard = null;
});
qrViewerOverlay.addEventListener('click', (e) => {
  if (e.target === qrViewerOverlay) {
    qrViewerOverlay.style.display = 'none';
    viewerCard = null;
  }
});

// Download from viewer
document.getElementById('btnViewerDownload').addEventListener('click', () => {
  if (!viewerCard) return;
  const container = document.getElementById('viewerQrCanvas');
  const canvas    = container.querySelector('canvas');
  const img       = container.querySelector('img');
  const safeName  = `${viewerCard.first_name}_${viewerCard.last_name}`.replace(/\s+/g, '_');
  const safeId    = viewerCard.school_id.replace(/\W+/g, '-');
  const filename  = `QR_${safeName}_${safeId}.png`;

  if (canvas) {
    const a = document.createElement('a');
    a.href     = canvas.toDataURL('image/png');
    a.download = filename;
    a.click();
  } else if (img) {
    const a = document.createElement('a');
    a.href     = img.src;
    a.download = filename;
    a.click();
  }
});

// ============================================================
//  EDIT SUB-MODAL
// ============================================================
const editOverlay = document.getElementById('editOverlay');
let   editCard    = null;

function openEditModal(card) {
  editCard = card;

  document.getElementById('editSchoolIdLabel').textContent = `School ID: ${card.school_id}`;
  document.getElementById('editLastName').value   = card.last_name;
  document.getElementById('editFirstName').value  = card.first_name;
  document.getElementById('editMI').value         = card.middle_initial || '';

  const banner = document.getElementById('editBanner');
  banner.style.display = 'none';
  banner.textContent   = '';

  editOverlay.style.display = 'flex';
  document.getElementById('editLastName').focus();
}

document.getElementById('closeEdit').addEventListener('click', closeEditModal);
document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
editOverlay.addEventListener('click', (e) => {
  if (e.target === editOverlay) closeEditModal();
});

function closeEditModal() {
  editOverlay.style.display = 'none';
  editCard = null;
}

document.getElementById('btnSaveEdit').addEventListener('click', async () => {
  if (!editCard) return;

  const lastName  = document.getElementById('editLastName').value.trim();
  const firstName = document.getElementById('editFirstName').value.trim();
  const mi        = document.getElementById('editMI').value.trim();
  const banner    = document.getElementById('editBanner');

  banner.style.display = 'none';
  banner.textContent   = '';

  if (!lastName)  { showEditBanner('Last name is required.');  return; }
  if (!firstName) { showEditBanner('First name is required.'); return; }
  if (mi && !/^[A-Za-z]$/.test(mi)) {
    showEditBanner('Middle initial must be a single letter.'); return;
  }

  const btn = document.getElementById('btnSaveEdit');
  btn.disabled    = true;
  btn.textContent = 'Saving…';

  try {
    const res  = await fetch(`/api/qr/cards/${encodeURIComponent(editCard.school_id)}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': CSRF },
      body:    JSON.stringify({
        last_name:      lastName,
        first_name:     firstName,
        middle_initial: mi || null,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      showEditBanner(data.error || 'Failed to update. Please try again.');
      return;
    }

    // Update local data so the table reflects the change immediately
    const idx = mgmtAllCards.findIndex(c => c.school_id === editCard.school_id);
    if (idx !== -1) {
      mgmtAllCards[idx].last_name      = lastName;
      mgmtAllCards[idx].first_name     = firstName;
      mgmtAllCards[idx].middle_initial = mi || null;
    }

    closeEditModal();
    renderMgmtTable(mgmtAllCards);
    showMgmtToast(`${firstName} ${lastName} updated successfully.`, 'ok');

  } catch {
    showEditBanner('Network error. Please try again.');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Save Changes';
  }
});

function showEditBanner(msg) {
  const banner = document.getElementById('editBanner');
  banner.textContent   = msg;
  banner.style.display = 'block';
}

// ============================================================
//  DELETE CONFIRMATION SUB-MODAL
// ============================================================
const deleteOverlay = document.getElementById('deleteOverlay');
let   deleteCard    = null;

function openDeleteModal(card) {
  deleteCard = card;

  const mi       = card.middle_initial ? ` ${card.middle_initial}.` : '';
  const fullName = `${card.first_name}${mi} ${card.last_name}`;
  document.getElementById('deleteTargetName').textContent = fullName;
  document.getElementById('deleteTargetId').textContent   = `School ID: ${card.school_id}`;

  const btn = document.getElementById('btnConfirmDelete');
  btn.disabled    = false;
  btn.textContent = 'Yes, Delete';

  deleteOverlay.style.display = 'flex';
}

document.getElementById('closeDelete').addEventListener('click',  closeDeleteModal);
document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
deleteOverlay.addEventListener('click', (e) => {
  if (e.target === deleteOverlay) closeDeleteModal();
});

function closeDeleteModal() {
  deleteOverlay.style.display = 'none';
  deleteCard = null;
}

document.getElementById('btnConfirmDelete').addEventListener('click', async () => {
  if (!deleteCard) return;

  const btn = document.getElementById('btnConfirmDelete');
  btn.disabled    = true;
  btn.textContent = 'Deleting…';

  try {
    const res  = await fetch(`/api/qr/cards/${encodeURIComponent(deleteCard.school_id)}`, {
      method:  'DELETE',
      headers: { 'X-CSRF-TOKEN': CSRF },
    });
    const data = await res.json();

    if (!res.ok) {
      showMgmtToast(data.error || 'Failed to delete.', 'err');
      closeDeleteModal();
      return;
    }

    // Remove from local data
    const name = `${deleteCard.first_name} ${deleteCard.last_name}`;
    mgmtAllCards = mgmtAllCards.filter(c => c.school_id !== deleteCard.school_id);

    // Sync count badges
    mgmtCountBadge.textContent  = mgmtAllCards.length;
    mgmtHeaderCount.textContent = mgmtAllCards.length;

    closeDeleteModal();

    // Re-apply any active search filter
    const q = mgmtSearchInput.value.toLowerCase().trim();
    renderMgmtTable(
      q ? mgmtAllCards.filter(c =>
            c.school_id.toLowerCase().includes(q) ||
            c.last_name.toLowerCase().includes(q) ||
            c.first_name.toLowerCase().includes(q)) :
          mgmtAllCards
    );

    showMgmtToast(`${name} has been removed.`, 'ok');

  } catch {
    showMgmtToast('Network error. Please try again.', 'err');
    closeDeleteModal();
  }
});

// ============================================================
//  TOAST HELPER
// ============================================================
let mgmtToastTimer;
function showMgmtToast(msg, type = 'ok') {
  mgmtToastEl.textContent = msg;
  mgmtToastEl.className   = `mgmt-toast ${type}`;
  clearTimeout(mgmtToastTimer);
  mgmtToastTimer = setTimeout(() => {
    mgmtToastEl.className = 'mgmt-toast';
  }, 3200);
}

// ============================================================
//  UTILITY
// ============================================================
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
