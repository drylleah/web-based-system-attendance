/**
 * attendance.js — RFID Kiosk / Scanner page logic
 *
 * Flow:
 *  1. On page load, read ?id= from the URL (the School ID Number).
 *     If found → immediately trigger a scan.
 *  2. User can also type a School ID in the sim box and click Scan.
 *  3. POST to /api/rfid/scan with { id_number }
 *     → success: show result panel
 *     → error:   show error panel
 *  4. After DISPLAY_MS milliseconds, reset to idle.
 */

'use strict';

// ---- Config ----
const DISPLAY_MS    = 5000;
const IDLE_PANEL    = document.getElementById('panelIdle');
const SUCCESS_PANEL = document.getElementById('panelSuccess');
const ERROR_PANEL   = document.getElementById('panelError');

// Clock
const clockTimeEl = document.getElementById('clockTime');
const clockDateEl = document.getElementById('clockDate');

// Success panel
const resultBadge    = document.getElementById('resultBadge');
const badgeIconIn    = document.getElementById('badgeIconIn');
const badgeIconOut   = document.getElementById('badgeIconOut');
const resultAction   = document.getElementById('resultAction');
const resultAvatar   = document.getElementById('resultAvatar');
const resultName     = document.getElementById('resultName');
const resultId       = document.getElementById('resultId');
const resultTime     = document.getElementById('resultTime');
const resultDate     = document.getElementById('resultDate');
const resultProgress = document.getElementById('resultProgressBar');

// Error panel
const errorTitle    = document.getElementById('errorTitle');
const errorMsg      = document.getElementById('errorMsg');
const errorProgress = document.getElementById('errorProgressBar');

// Footer
const footerCardId = document.getElementById('footerCardId');

// Sim box
const simInput   = document.getElementById('simCardInput');
const simScanBtn = document.getElementById('simScanBtn');

// ------------------------------------------------------------------ clock --
function updateClock() {
  const now = new Date();
  clockTimeEl.textContent = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
  clockDateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
}
updateClock();
setInterval(updateClock, 1000);

// ------------------------------------------------------------------ panels --
let resetTimer = null;

function showPanel(which) {
  IDLE_PANEL.style.display    = 'none';
  SUCCESS_PANEL.style.display = 'none';
  ERROR_PANEL.style.display   = 'none';
  which.style.display = 'block';
}

function resetToIdle() {
  clearTimeout(resetTimer);
  footerCardId.textContent = '';
  showPanel(IDLE_PANEL);
  simInput.value = '';
  simInput.focus();
}

function startProgressBar(barEl, durationMs, cb) {
  clearTimeout(resetTimer);
  barEl.style.transition = 'none';
  barEl.style.transform  = 'scaleX(1)';
  void barEl.offsetWidth;
  barEl.style.transition = `transform ${durationMs}ms linear`;
  barEl.style.transform  = 'scaleX(0)';
  resetTimer = setTimeout(cb, durationMs);
}

// ------------------------------------------------------------------ scan --
async function doScan(rawId) {
  const idNumber = String(rawId).trim().toUpperCase();
  if (!idNumber) return;

  footerCardId.textContent = `ID: ${idNumber}`;

  try {
    const res  = await fetch('/api/rfid/scan', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id_number: idNumber })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showSuccessPanel(data);
    } else {
      showErrorPanel(data.error || 'Unknown error.', idNumber, res.status);
    }
  } catch {
    showErrorPanel('Cannot reach the server. Check your connection.', idNumber);
  }
}

// ------------------------------------------------------------------ success panel --

// Per-ID scan counter — used only for alternating the displayed label.
// Key: id_number string. Value: number of successful scans this session.
// Resets on page reload. Does NOT affect attendance records.
const scanCountMap = {};

function showSuccessPanel(data) {
  const id = data.id_number || '';

  // Increment scan count for this ID and derive display label.
  // Odd count (1, 3, 5…) → TIME IN   Even count (2, 4, 6…) → TIME OUT
  scanCountMap[id] = (scanCountMap[id] || 0) + 1;
  const displayIn  = (scanCountMap[id] % 2 === 1);

  resultBadge.className      = `result-badge result-badge--${displayIn ? 'in' : 'out'}`;
  badgeIconIn.style.display  = displayIn ? 'block' : 'none';
  badgeIconOut.style.display = displayIn ? 'none'  : 'block';

  resultAction.textContent = displayIn ? 'TIME IN' : 'TIME OUT';
  resultAction.className   = `result-action result-action--${displayIn ? 'in' : 'out'}`;

  resultAvatar.textContent      = (data.first_name || '?').charAt(0).toUpperCase();
  resultAvatar.style.background = displayIn ? 'var(--green-main)' : 'var(--blue-main)';

  resultName.textContent = data.full_name || `${data.first_name} ${data.last_name}`;
  resultId.textContent   = `ID: ${data.id_number}`;

  resultTime.textContent = data.time;
  resultTime.style.color = displayIn ? 'var(--green-main)' : 'var(--blue-main)';
  resultDate.textContent = new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  showPanel(SUCCESS_PANEL);
  startProgressBar(resultProgress, DISPLAY_MS, resetToIdle);
}

// ------------------------------------------------------------------ error panel --
function showErrorPanel(message, idNumber, status) {
  const titles = {
    404: 'ID Not Registered',
    403: 'ID Deactivated',
    400: 'Invalid Request',
  };
  errorTitle.textContent   = titles[status] || 'Scan Failed';
  errorMsg.textContent     = message;
  footerCardId.textContent = idNumber ? `ID attempted: ${idNumber}` : '';

  showPanel(ERROR_PANEL);
  startProgressBar(errorProgress, DISPLAY_MS, resetToIdle);
}

// ------------------------------------------------------------------ sim box --
simScanBtn.addEventListener('click', () => {
  const val = simInput.value.trim();
  if (!val) { simInput.focus(); return; }
  doScan(val);
});

simInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') simScanBtn.click();
});

// ------------------------------------------------------------------ URL param --
(function checkUrlParam() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  if (id) {
    setTimeout(() => doScan(id), 300);
  } else {
    simInput.focus();
  }
})();

// ================================================================
//  CARD MANAGER MODAL
// ================================================================

const cmOverlay    = document.getElementById('cardManagerOverlay');
const openCmBtn    = document.getElementById('openCardManager');
const closeCmBtn   = document.getElementById('closeCardManager');
const cmToast      = document.getElementById('cmToast');
const cmCountBadge = document.getElementById('cmCountBadge');

// -- Tabs --
const tabBtns     = document.querySelectorAll('.cm-tab');
const tabRegPane  = document.getElementById('tabRegister');
const tabListPane = document.getElementById('tabList');

function switchTab(name) {
  tabBtns.forEach(btn => btn.classList.toggle('cm-tab--active', btn.dataset.tab === name));
  tabRegPane.classList.toggle('cm-pane--hidden',  name !== 'register');
  tabListPane.classList.toggle('cm-pane--hidden', name !== 'list');
  if (name === 'list') loadCardList();
}

tabBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

// -- Open / Close --
openCmBtn.addEventListener('click', () => {
  cmOverlay.classList.add('show');
  document.getElementById('reg_id_number').focus();
  loadCardList();
});
closeCmBtn.addEventListener('click', closeModal);
cmOverlay.addEventListener('click', (e) => { if (e.target === cmOverlay) closeModal(); });

function closeModal() { cmOverlay.classList.remove('show'); }

// -- Toast --
let cmToastTimer;
function showCmToast(msg, type = 'success') {
  cmToast.textContent  = msg;
  cmToast.className    = `cm-toast show-${type}`;
  clearTimeout(cmToastTimer);
  cmToastTimer = setTimeout(() => { cmToast.className = 'cm-toast'; }, 3000);
}

// ----------------------------------------------------------------
//  REGISTER STUDENT
// ----------------------------------------------------------------
const regSubmitBtn = document.getElementById('regSubmitBtn');
const regError     = document.getElementById('regError');

function showRegError(msg) { regError.textContent = msg; regError.classList.add('show'); }
function clearRegError()   { regError.textContent = '';  regError.classList.remove('show'); }

regSubmitBtn.addEventListener('click', async () => {
  clearRegError();

  const id_number  = document.getElementById('reg_id_number').value.trim().toUpperCase();
  const last_name  = document.getElementById('reg_last_name').value.trim();
  const first_name = document.getElementById('reg_first_name').value.trim();
  const mi         = document.getElementById('reg_mi').value.trim();

  if (!id_number)  { showRegError('School ID Number is required.'); return; }
  if (!last_name)  { showRegError('Last Name is required.');        return; }
  if (!first_name) { showRegError('First Name is required.');       return; }

  regSubmitBtn.disabled     = true;
  regSubmitBtn.textContent  = 'Registering…';

  try {
    const res  = await fetch('/api/rfid/cards', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id_number, last_name, first_name, middle_initial: mi || null })
    });
    const data = await res.json();

    if (res.ok) {
      ['reg_id_number', 'reg_last_name', 'reg_first_name', 'reg_mi']
        .forEach(id => { document.getElementById(id).value = ''; });
      showCmToast(`${first_name} ${last_name} (${id_number}) registered successfully.`);
      loadCardList();
    } else {
      showRegError(data.error || 'Failed to register student.');
    }
  } catch {
    showRegError('Server error. Make sure you are logged in as admin.');
  } finally {
    regSubmitBtn.disabled   = false;
    regSubmitBtn.innerHTML  = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      Register Student`;
  }
});

// ----------------------------------------------------------------
//  LIST STUDENTS
// ----------------------------------------------------------------
let allCards = [];

async function loadCardList() {
  try {
    const res = await fetch('/api/rfid/cards');
    if (!res.ok) {
      if (res.status === 401) {
        document.getElementById('cmTableBody').innerHTML =
          `<tr><td colspan="5" style="text-align:center;padding:24px;color:#b91c1c;">
            Not logged in. <a href="/" style="color:var(--green-main);font-weight:600;">Log in as admin</a> to manage students.
          </td></tr>`;
        document.getElementById('cmEmpty').style.display = 'none';
      }
      return;
    }
    const data = await res.json();
    allCards = data.cards || [];
    cmCountBadge.textContent = allCards.length;
    renderCardList(allCards);
  } catch { /* server not reachable */ }
}

function renderCardList(cards) {
  const tbody = document.getElementById('cmTableBody');
  const empty = document.getElementById('cmEmpty');
  tbody.innerHTML = '';

  if (!cards.length) {
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  cards.forEach(card => {
    const fullName = `${card.first_name}${card.middle_initial ? ' ' + card.middle_initial + '.' : ''} ${card.last_name}`;
    const date     = new Date(card.registered_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="cm-id-number-cell">${card.id_number}</td>
      <td class="cm-name-cell">${fullName}</td>
      <td><span class="cm-status-${card.is_active ? 'active' : 'inactive'}">${card.is_active ? 'Active' : 'Inactive'}</span></td>
      <td class="cm-date-cell">${date}</td>
      <td>
        <button class="cm-btn-delete" title="Remove student" data-id="${card.id_number}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </td>
    `;

    tr.querySelector('.cm-btn-delete').addEventListener('click', async (e) => {
      const idNum = e.currentTarget.dataset.id;
      if (!confirm(`Remove student ID "${idNum}"? They will no longer be able to scan in.`)) return;
      try {
        const res = await fetch(`/api/rfid/cards/${encodeURIComponent(idNum)}`, { method: 'DELETE' });
        const d   = await res.json();
        if (res.ok) {
          showCmToast(`Student "${idNum}" removed.`);
          loadCardList();
        } else {
          showCmToast(d.error || 'Failed to remove student.', 'error');
        }
      } catch {
        showCmToast('Server error.', 'error');
      }
    });

    tbody.appendChild(tr);
  });
}

// -- Search --
document.getElementById('cmSearch').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderCardList(allCards.filter(c =>
    c.id_number.toLowerCase().includes(q)  ||
    c.last_name.toLowerCase().includes(q)  ||
    c.first_name.toLowerCase().includes(q)
  ));
});

// ================================================================
//  MANUAL LOG MODAL
// ================================================================

const mlOverlay    = document.getElementById('manualLogOverlay');
const openMlBtn    = document.getElementById('openManualLog');
const closeMlBtn   = document.getElementById('closeManualLog');
const mlToast      = document.getElementById('mlToast');
const mlError      = document.getElementById('mlError');
const mlSubmitBtn  = document.getElementById('mlSubmitBtn');
const mlToggleIn   = document.getElementById('mlToggleIn');
const mlToggleOut  = document.getElementById('mlToggleOut');

let mlLogType = 'time_in';

// -- Open / Close --
openMlBtn.addEventListener('click', () => {
  mlOverlay.classList.add('show');
  resetMlForm();
  document.getElementById('ml_last_name').focus();
});

closeMlBtn.addEventListener('click', closeMlModal);
mlOverlay.addEventListener('click', (e) => { if (e.target === mlOverlay) closeMlModal(); });

function closeMlModal() {
  mlOverlay.classList.remove('show');
}

function resetMlForm() {
  ['ml_last_name', 'ml_first_name', 'ml_mi', 'ml_id_number']
    .forEach(id => { document.getElementById(id).value = ''; });
  clearMlError();
  setMlLogType('time_in');
}

// -- Log Type Toggle --
function setMlLogType(type) {
  mlLogType = type;

  mlToggleIn.classList.toggle('ml-toggle--active',     type === 'time_in');
  mlToggleIn.classList.toggle('ml-toggle--active-out', false);
  mlToggleOut.classList.toggle('ml-toggle--active',    false);
  mlToggleOut.classList.toggle('ml-toggle--active-out', type === 'time_out');

  // Update submit button label and icon
  if (type === 'time_in') {
    mlSubmitBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      Save Time In`;
    mlSubmitBtn.className = 'ml-submit-btn ml-submit-btn--in';
  } else {
    mlSubmitBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
      </svg>
      Save Time Out`;
    mlSubmitBtn.className = 'ml-submit-btn ml-submit-btn--out';
  }
}

mlToggleIn.addEventListener('click',  () => setMlLogType('time_in'));
mlToggleOut.addEventListener('click', () => setMlLogType('time_out'));

// -- Error helpers --
function showMlError(msg) {
  mlError.textContent = msg;
  mlError.classList.add('show');
}
function clearMlError() {
  mlError.textContent = '';
  mlError.classList.remove('show');
}

// -- Toast --
let mlToastTimer;
function showMlToast(msg, type = 'success') {
  mlToast.textContent = msg;
  mlToast.className   = `ml-toast show-${type}`;
  clearTimeout(mlToastTimer);
  mlToastTimer = setTimeout(() => { mlToast.className = 'ml-toast'; }, 3500);
}

// -- Submit --
mlSubmitBtn.addEventListener('click', async () => {
  clearMlError();

  const last_name     = document.getElementById('ml_last_name').value.trim();
  const first_name    = document.getElementById('ml_first_name').value.trim();
  const middle_initial = document.getElementById('ml_mi').value.trim();
  const id_number     = document.getElementById('ml_id_number').value.trim().toUpperCase();

  if (!last_name)  { showMlError('Last Name is required.');        return; }
  if (!first_name) { showMlError('First Name is required.');       return; }
  if (!id_number)  { showMlError('School ID Number is required.'); return; }

  mlSubmitBtn.disabled = true;
  const originalHtml   = mlSubmitBtn.innerHTML;
  mlSubmitBtn.innerHTML = `<span class="ml-spinner"></span> Saving…`;

  try {
    const res  = await fetch('/api/attendance/manual', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'X-CSRF-TOKEN':  document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({
        id_number,
        last_name,
        first_name,
        middle_initial: middle_initial || null,
        log_type: mlLogType,
      }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      const actionLabel = mlLogType === 'time_in' ? 'Time In' : 'Time Out';
      showMlToast(`${actionLabel} saved for ${data.full_name} at ${data.time}`);

      // Clear form fields but keep modal open for the next entry
      ['ml_last_name', 'ml_first_name', 'ml_mi', 'ml_id_number']
    .forEach(id => { document.getElementById(id).value = ''; });
  clearMlError();
  document.getElementById('ml_last_name').focus();
    } else {
      showMlError(data.error || 'Failed to save. Please try again.');
    }
  } catch {
    showMlError('Cannot reach the server. Check your connection.');
  } finally {
    mlSubmitBtn.disabled  = false;
    mlSubmitBtn.innerHTML = originalHtml;
  }
});

// Allow Enter key on any input to trigger submit
['ml_last_name', 'ml_first_name', 'ml_mi', 'ml_id_number'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') mlSubmitBtn.click();
  });
});


// ================================================================
//  QR SCANNER  (optimised for 720p built-in laptop webcam)
//
//  Detection strategy
//  ──────────────────
//  Rather than acting on the first decoded frame (which can be a
//  partial or blurry read), we require the SAME token to appear in
//  TWO CONSECUTIVE ticks before committing.  On the second match we
//  freeze the canvas, do one final clean decode from the frozen
//  frame, then hand the token to the API.
//
//  This avoids false triggers from motion blur and gives jsQR a
//  stable image to work with on standard 720p webcams.
//
//  State machine
//  ─────────────
//  SCANNING  →  tick sees token  →  CONFIRMING (store candidate)
//  CONFIRMING → same token again → freeze frame → PROCESSING
//  PROCESSING → API returns      → success: close modal
//                                → failure: SCANNING (after 3 s)
// ================================================================

// ---- Element refs ----
const qrsOverlay     = document.getElementById('qrScannerOverlay');
const openQrsBtn     = document.getElementById('openQrScanner');
const closeQrsBtn    = document.getElementById('closeQrScanner');
const qrsVideo       = document.getElementById('qrsVideo');
const qrsCanvas      = document.getElementById('qrsCanvas');
const qrsSweep       = document.getElementById('qrsSweep');
const qrsCamError    = document.getElementById('qrsCamError');
const qrsCamErrorMsg = document.getElementById('qrsCamErrorMsg');
const qrsStatusDot   = document.getElementById('qrsStatusDot');
const qrsStatusText  = document.getElementById('qrsStatusText');

const qrsInstructions = document.getElementById('qrsInstructions');
const qrsLooking      = document.getElementById('qrsLooking');
const qrsFound        = document.getElementById('qrsFound');
const qrsNotFound     = document.getElementById('qrsNotFound');
const qrsNotFoundMsg  = document.getElementById('qrsNotFoundMsg');

document.getElementById('qrsScanAgain').addEventListener('click',    resumeScanning);
document.getElementById('qrsScanAgainErr').addEventListener('click', resumeScanning);

// ---- Constants ----
const QRS_INTERVAL_MS  = 80;    // ~12 fps tick — fast enough, light on CPU
const QRS_ROI_SIZE     = 640;   // px — canvas size passed to jsQR
const QRS_CONFIRM_NEEDED = 1;   // single confirmed read is enough — reduces latency on 720p webcams

// ---- State ----
let qrsStream         = null;
let qrsTimerId        = null;
let qrsScanning       = false;   // tick loop active
let qrsProcessing     = false;   // API call in flight — hard block on new scans
let qrsLastToken      = null;    // last successfully processed token
let qrsCandidateToken = null;    // token seen in current tick
let qrsConfirmCount   = 0;       // how many consecutive ticks matched candidate

// ----------------------------------------------------------------
//  HELPERS
// ----------------------------------------------------------------
function setQrsStatus(state, text) {
  qrsStatusDot.className    = `qrs-status-dot qrs-status-dot--${state}`;
  qrsStatusText.textContent = text;
}

function showQrsPanel(name) {
  qrsInstructions.style.display = name === 'instructions' ? '' : 'none';
  qrsLooking.style.display      = name === 'looking'      ? '' : 'none';
  qrsFound.style.display        = name === 'found'        ? '' : 'none';
  qrsNotFound.style.display     = name === 'notfound'     ? '' : 'none';
}

// ----------------------------------------------------------------
//  OPEN MODAL
// ----------------------------------------------------------------
openQrsBtn.addEventListener('click', openQrScanner);

async function openQrScanner() {
  showQrsPanel('instructions');
  setQrsStatus('idle', 'Starting camera…');
  qrsCamError.style.display         = 'none';
  qrsSweep.style.animationPlayState = 'running';
  qrsLastToken      = null;
  qrsCandidateToken = null;
  qrsConfirmCount   = 0;
  qrsProcessing     = false;
  qrsOverlay.classList.add('show');

  try {
    qrsStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width:     { min: 640, ideal: 1280 },
        height:    { min: 480, ideal: 720  },
        frameRate: { ideal: 30 },
      },
      audio: false,
    });

    qrsVideo.srcObject = qrsStream;
    qrsVideo.addEventListener('canplay', startScanLoop, { once: true });

  } catch (err) {
    const msg =
      err.name === 'NotAllowedError'      ? 'Camera permission denied. Allow access in browser settings.' :
      err.name === 'NotFoundError'        ? 'No camera found on this device.' :
      err.name === 'NotReadableError'     ? 'Camera is in use by another application.' :
      err.name === 'SecurityError'        ? 'Camera blocked: page must be served over HTTPS.' :
      err.name === 'OverconstrainedError' ? 'Camera does not support the requested settings.' :
                                            `${err.name}: ${err.message}`;
    qrsCamError.style.display         = 'flex';
    qrsCamErrorMsg.textContent        = msg;
    setQrsStatus('error', 'Camera unavailable');
    qrsSweep.style.animationPlayState = 'paused';
    console.error('[QR] getUserMedia failed:', err.name, err.message);
  }
}

// ----------------------------------------------------------------
//  CLOSE MODAL
// ----------------------------------------------------------------
closeQrsBtn.addEventListener('click', closeQrScanner);
qrsOverlay.addEventListener('click', (e) => {
  if (e.target === qrsOverlay) closeQrScanner();
});

function closeQrScanner() {
  stopScanLoop();
  stopCamera();
  qrsOverlay.classList.remove('show');
  showQrsPanel('instructions');
  setQrsStatus('idle', 'Starting camera…');
  qrsLastToken      = null;
  qrsCandidateToken = null;
  qrsConfirmCount   = 0;
  qrsProcessing     = false;
}

function stopCamera() {
  if (qrsStream) {
    qrsStream.getTracks().forEach(t => t.stop());
    qrsStream = null;
  }
  qrsVideo.srcObject = null;
}

// ----------------------------------------------------------------
//  SCAN LOOP
// ----------------------------------------------------------------
function startScanLoop() {
  qrsScanning = true;
  setQrsStatus('scanning', 'Scanning…');
  scheduleTick();
}

function stopScanLoop() {
  qrsScanning = false;
  if (qrsTimerId !== null) {
    clearTimeout(qrsTimerId);
    qrsTimerId = null;
  }
}

function scheduleTick() {
  if (!qrsScanning) return;
  qrsTimerId = setTimeout(tick, QRS_INTERVAL_MS);
}

function tick() {
  if (!qrsScanning || qrsProcessing) {
    scheduleTick();
    return;
  }

  if (qrsVideo.readyState < qrsVideo.HAVE_ENOUGH_DATA || qrsVideo.videoWidth === 0) {
    scheduleTick();
    return;
  }

  // ---- Draw FULL frame scaled to 640×360 ----
  // Scanning the full frame (not just center crop) means the QR code
  // is detected regardless of where it appears in the viewfinder.
  // 640×360 is fast for jsQR while retaining enough detail for a UUID QR.
  const vw  = qrsVideo.videoWidth;
  const vh  = qrsVideo.videoHeight;
  const ctx = qrsCanvas.getContext('2d', { willReadFrequently: true });
  qrsCanvas.width  = 640;
  qrsCanvas.height = Math.round(640 * vh / vw);
  ctx.drawImage(qrsVideo, 0, 0, qrsCanvas.width, qrsCanvas.height);

  // ---- Attempt decode ----
  const imageData = ctx.getImageData(0, 0, qrsCanvas.width, qrsCanvas.height);
  const result    = jsQR(imageData.data, qrsCanvas.width, qrsCanvas.height, {
    inversionAttempts: 'attemptBoth',
  });

  if (result && result.data) {
    const token = result.data.trim();
    console.log('[QR] jsQR decoded:', token.substring(0, 20) + '…');

    if (!token) { resetCandidate(); scheduleTick(); return; }

    // Skip if this token was already successfully processed
    if (token === qrsLastToken) { scheduleTick(); return; }

    if (token === qrsCandidateToken) {
      // Same token again — increment confirmation counter
      qrsConfirmCount++;
    } else {
      // New token seen — start fresh confirmation
      qrsCandidateToken = token;
      qrsConfirmCount   = 1;
    }

    if (qrsConfirmCount >= QRS_CONFIRM_NEEDED) {
      // ---- CONFIRMED — freeze the frame and commit ----
      // The canvas already holds the most recent clean frame of this
      // token. Stop the loop immediately to prevent any further decodes
      // while the API call is in flight.
      stopScanLoop();
      commitToken(token);
      return;
    }

    // Not yet confirmed — update status and keep scanning
    setQrsStatus('scanning', 'Hold steady…');

  } else {
    // No QR in this frame — reset candidate streak
    resetCandidate();
    const dots = ['.', '..', '...'];
    qrsStatusText.textContent = 'Scanning' + dots[Math.floor(Date.now() / 400) % 3];
  }

  scheduleTick();
}

function resetCandidate() {
  qrsCandidateToken = null;
  qrsConfirmCount   = 0;
}

// ----------------------------------------------------------------
//  COMMIT TOKEN
//  Called once a token has been confirmed across consecutive ticks.
//  The canvas holds a frozen clean frame — we do one final decode
//  from it to get the authoritative token string, then call the API.
// ----------------------------------------------------------------
function commitToken(confirmedToken) {
  // Final authoritative decode from the frozen canvas frame
  const ctx       = qrsCanvas.getContext('2d', { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, qrsCanvas.width, qrsCanvas.height);
  const final     = jsQR(imageData.data, qrsCanvas.width, qrsCanvas.height, {
    inversionAttempts: 'attemptBoth',
  });

  // Use the final decode result if available, fall back to confirmed token
  const token = (final && final.data) ? final.data.trim() : confirmedToken;

  console.log('[QR] Committed token:', token);

  qrsProcessing = true;
  qrsSweep.style.animationPlayState = 'paused';
  setQrsStatus('scanning', 'Processing…');
  showQrsPanel('looking');

  processAttendance(token);
}

// ----------------------------------------------------------------
//  PROCESS ATTENDANCE — POST /api/qr/scan
// ----------------------------------------------------------------
async function processAttendance(token) {
  try {
    const res  = await fetch('/api/qr/scan', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ qr_token: token }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      // ---- SUCCESS ----
      qrsLastToken = token;   // prevent re-scan of same token
      closeQrScanner();
      showSuccessPanel(data);
      // Scanning resumes automatically next time the modal is opened

    } else {
      // ---- UNREGISTERED OR SERVER ERROR ----
      const msg = data.error ||
        (res.status === 404
          ? 'This QR code is not registered for attendance.'
          : 'An error occurred. Please try again.');
      setQrsStatus('error', res.status === 404 ? 'QR not recognised' : 'Scan failed');
      qrsNotFoundMsg.textContent = msg;
      showQrsPanel('notfound');
      scheduleAutoResume();
    }

  } catch {
    setQrsStatus('error', 'Network error');
    qrsNotFoundMsg.textContent = 'Could not reach the server. Check your connection.';
    showQrsPanel('notfound');
    scheduleAutoResume();

  } finally {
    qrsProcessing = false;
  }
}

// ----------------------------------------------------------------
//  AUTO-RESUME — 3 s cooldown after a failed lookup
// ----------------------------------------------------------------
function scheduleAutoResume() {
  setTimeout(() => {
    resumeScanning();
  }, 3000);
}

// ----------------------------------------------------------------
//  RESUME SCANNING
// ----------------------------------------------------------------
function resumeScanning() {
  qrsCandidateToken = null;
  qrsConfirmCount   = 0;
  qrsProcessing     = false;

  showQrsPanel('instructions');
  setQrsStatus('scanning', 'Scanning…');
  qrsSweep.style.animationPlayState = 'running';

  qrsScanning = true;
  scheduleTick();
}
