<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Registration — Attendance System</title>
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/qr.css') }}">
</head>
<body>

  <!-- ========== TOP BAR ========== -->
  <header class="topbar">
    <div class="topbar-left">
      <div class="topbar-logo">
        <img src="{{ asset('images/lormaLogo.png') }}" alt="Lorma Colleges"
             onerror="this.style.display='none'">
      </div>
      <span class="topbar-title">QR Attendance Registration</span>
    </div>
    <div class="topbar-right">
      <div class="topbar-clock">
        <div class="clock-time" id="clockTime">--:-- --</div>
        <div class="clock-date" id="clockDate">--- --, ----</div>
      </div>
    </div>
  </header>

  <!-- ========== MAIN STAGE ========== -->
  <main class="stage">

    <!-- ===== STEP 1: REGISTRATION FORM ===== -->
    <div class="panel" id="panelForm">
      <div class="panel-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.4" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125
               1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75
               9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504
               1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0
               1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0
               1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125
               0 0 1 13.5 9.375v-4.5Z" />
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 17.25h.75v.75h-.75v-.75ZM17.25
               6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75H13.5V13.5ZM13.5 18.75h.75v.75H13.5v-.75Z
               M18 13.5h.75v.75H18V13.5ZM15.75 15.75h.75v.75h-.75v-.75ZM15.75 18.75h.75v.75h-.75v-.75Z
               M18 16.5h.75v.75H18v-.75Z" />
        </svg>
      </div>
      <h1 class="panel-title">Register for QR Attendance</h1>
      <p class="panel-sub">Fill in your details to generate your personal QR code.</p>

      <!-- Registration Form -->
      <form class="reg-form" id="regForm" novalidate>
        <div class="form-row">
          <div class="field-group" id="grpSchoolId">
            <label for="schoolId">School ID <span class="required">*</span></label>
            <input type="text" id="schoolId" name="school_id" placeholder="e.g. 2024-00001"
                   maxlength="50" autocomplete="off" spellcheck="false">
            <span class="field-error" id="errSchoolId"></span>
          </div>
        </div>
        <div class="form-row two-col">
          <div class="field-group" id="grpLastName">
            <label for="lastName">Last Name <span class="required">*</span></label>
            <input type="text" id="lastName" name="last_name" placeholder="Dela Cruz"
                   maxlength="100" autocomplete="off">
            <span class="field-error" id="errLastName"></span>
          </div>
          <div class="field-group" id="grpFirstName">
            <label for="firstName">First Name <span class="required">*</span></label>
            <input type="text" id="firstName" name="first_name" placeholder="Juan"
                   maxlength="100" autocomplete="off">
            <span class="field-error" id="errFirstName"></span>
          </div>
        </div>
        <div class="form-row">
          <div class="field-group mi-group" id="grpMI">
            <label for="middleInitial">Middle Initial</label>
            <input type="text" id="middleInitial" name="middle_initial" placeholder="A"
                   maxlength="1" autocomplete="off">
            <span class="field-error" id="errMI"></span>
          </div>
        </div>

        <!-- Global error banner (e.g. duplicate ID) -->
        <div class="form-error-banner" id="formBanner" style="display:none;"></div>

        <button type="submit" class="btn-register" id="btnRegister">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          Register &amp; Generate QR Code
        </button>
      </form>

      <!-- Re-download section -->
      <div class="redownload-link">
        Already registered?
        <button type="button" class="link-btn" id="btnRedownload">Re-download your QR code</button>
      </div>
    </div>
    <!-- /panelForm -->


    <!-- ===== STEP 2: SUCCESS / QR PREVIEW ===== -->
    <div class="panel panel-success" id="panelSuccess" style="display:none;">
      <div class="success-badge">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
             stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </svg>
      </div>
      <h2 class="success-title">Registration Successful!</h2>
      <p class="success-name" id="successName">—</p>
      <p class="success-id" id="successId">—</p>

      <!-- QR Code canvas — rendered by QRCode.js -->
      <div class="qr-wrapper">
        <div id="qrCanvas"></div>
        <p class="qr-caption">Your personal QR Code</p>
        <p class="qr-date">Generated: <span id="qrDate">—</span></p>
      </div>

      <div class="success-actions">
        <button class="btn-download" id="btnDownload">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0
                 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
          </svg>
          Download QR Code
        </button>
        <button class="btn-newreg" id="btnNewReg">
          Register Another
        </button>
      </div>
    </div>
    <!-- /panelSuccess -->

    <!-- ===== RE-DOWNLOAD MODAL ===== -->
    <div class="modal-overlay" id="redownloadOverlay" style="display:none;">
      <div class="modal" id="redownloadModal">
        <div class="modal-header">
          <span class="modal-title">Re-download QR Code</span>
          <button class="modal-close" id="closeRedownload">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">Enter your School ID to retrieve your existing QR code.</p>
          <div class="field-group" id="grpReSchoolId">
            <label for="reSchoolId">School ID</label>
            <input type="text" id="reSchoolId" placeholder="e.g. 2024-00001"
                   maxlength="50" autocomplete="off">
            <span class="field-error" id="errReSchoolId"></span>
          </div>
          <div class="form-error-banner" id="reBanner" style="display:none;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" id="cancelRedownload">Cancel</button>
          <button class="btn-register modal-btn" id="btnFetchToken">
            Retrieve QR Code
          </button>
        </div>
      </div>
    </div>
    <!-- /redownloadModal -->

  </main>
  <!-- /stage -->

  <!-- QRCode.js — pure JS QR renderer, no server-side dependency -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
          integrity="sha512-CNgIRecGo7nphbeZ04Sc13ka07paqdeTu0WR1IM4kNcpmBAUSHSQX0FslNhTDadL4O5SAGapGt4FodqL8My0mA=="
          crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="{{ asset('js/qr.js') }}"></script>
</body>
</html>
