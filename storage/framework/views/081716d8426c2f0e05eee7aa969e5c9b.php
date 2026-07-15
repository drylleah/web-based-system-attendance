<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Registration — Attendance System</title>
  <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?php echo e(asset('css/dashboard.css')); ?>">
  <link rel="stylesheet" href="<?php echo e(asset('css/qr.css')); ?>">
</head>
<body>

  <!-- ========== SIDEBAR ========== -->
  <aside class="sidebar">
    <div class="sidebar-logo">
      <img src="<?php echo e(asset('images/lormaLogo.png')); ?>" alt="Lorma Colleges"
           onerror="this.style.display='none'; document.getElementById('logoPlaceholder').style.display='block'">
      <div class="logo-placeholder" id="logoPlaceholder" style="display:none;">
        <div class="logo-name">LORMA</div>
        <div class="logo-sub">COLLEGES</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <a class="nav-item" href="<?php echo e(route('dashboard')); ?>">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
        </svg>
        Home
      </a>
      <a class="nav-item" href="<?php echo e(route('timerecord')); ?>">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        Time Record
      </a>
      <a class="nav-item" href="<?php echo e(route('settings')); ?>">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        Settings
      </a>
      <a class="nav-item active" href="<?php echo e(route('qr.register')); ?>">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 17.25h.75v.75h-.75v-.75ZM17.25 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75H13.5V13.5ZM18 13.5h.75v.75H18V13.5ZM15.75 15.75h.75v.75h-.75v-.75ZM18 16.5h.75v.75H18v-.75Z" />
        </svg>
        QR Register
      </a>
    </nav>

    <div class="sidebar-footer">
      <div class="user-avatar" id="userAvatar">A</div>
      <div class="user-info">
        <div class="user-name" id="userDisplayName">Admin User</div>
        <div class="user-email" id="userEmail">admin@lorma.edu</div>
      </div>
      <button class="logout-btn" id="logoutBtn" title="Logout">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
        </svg>
      </button>
    </div>
  </aside>

  <!-- ========== MAIN ========== -->
  <div class="main">

    <!-- Topbar -->
    <header class="topbar">
      <span class="topbar-title">QR Registration</span>
      <div class="topbar-right">
        <button class="icon-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </button>
        <div class="topbar-avatar" id="topbarAvatar" title="Profile"
             onclick="window.location.href='<?php echo e(route('settings')); ?>?tab=account'">A</div>
      </div>
    </header>

    <!-- Page Content -->
    <div class="page-content">

      <!-- ===== REGISTRATION FORM PANEL ===== -->
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

        <div class="redownload-link">
          Already registered?
          <button type="button" class="link-btn" id="btnRedownload">Re-download your QR code</button>
        </div>
      </div>

      <!-- ===== REGISTERED QR USERS BUTTON ===== -->
      <div class="mgmt-btn-row">
        <button class="btn-mgmt" id="btnOpenMgmt">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
          </svg>
          Registered QR Users
          <span class="mgmt-count" id="mgmtCount">0</span>
        </button>
      </div>
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
        <p class="success-id"   id="successId">—</p>

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
          <button class="btn-newreg" id="btnNewReg">Register Another</button>
        </div>
      </div>

    </div><!-- /page-content -->

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

    <!-- ===== MANAGEMENT MODAL ===== -->
    <div class="mgmt-overlay" id="mgmtOverlay">
      <div class="mgmt-modal">

        <!-- Header -->
        <div class="mgmt-header">
          <div class="mgmt-header-left">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"/>
            </svg>
            <span>Registered QR Users</span>
            <span class="mgmt-header-count" id="mgmtHeaderCount">0</span>
          </div>
          <button class="mgmt-close" id="closeMgmt">&times;</button>
        </div>

        <!-- Toolbar -->
        <div class="mgmt-toolbar">
          <div class="mgmt-search-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input type="text" id="mgmtSearch" class="mgmt-search" placeholder="Search by School ID or name…">
          </div>
          <button class="mgmt-refresh-btn" id="mgmtRefresh" title="Refresh">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
          </button>
        </div>

        <!-- Table -->
        <div class="mgmt-table-wrap">
          <table class="mgmt-table">
            <thead>
              <tr>
                <th>School ID</th>
                <th>Last Name</th>
                <th>First Name</th>
                <th>M.I.</th>
                <th>Date Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="mgmtTableBody"></tbody>
          </table>

          <!-- Empty state -->
          <div class="mgmt-empty" id="mgmtEmpty" style="display:none;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5Z"/>
            </svg>
            <p>No registered QR users found.</p>
          </div>

          <!-- Loading state -->
          <div class="mgmt-loading" id="mgmtLoading" style="display:none;">
            <span class="mgmt-spinner"></span> Loading…
          </div>
        </div>

        <!-- Toast -->
        <div class="mgmt-toast" id="mgmtToast"></div>

      </div>
    </div>
    <!-- /MANAGEMENT MODAL -->

    <!-- ===== QR VIEWER SUB-MODAL ===== -->
    <div class="sub-overlay" id="qrViewerOverlay" style="display:none;">
      <div class="sub-modal">
        <div class="sub-modal-header">
          <span class="sub-modal-title">QR Code</span>
          <button class="modal-close" id="closeQrViewer">&times;</button>
        </div>
        <div class="sub-modal-body" style="align-items:center;">
          <p class="sub-modal-name"  id="viewerName">—</p>
          <p class="sub-modal-id"    id="viewerId">—</p>
          <div class="qr-wrapper" style="margin:12px 0;">
            <div id="viewerQrCanvas"></div>
            <p class="qr-caption">Personal QR Code</p>
            <p class="qr-date">Generated: <span id="viewerDate">—</span></p>
          </div>
          <button class="btn-download" id="btnViewerDownload" style="width:100%;margin-top:4px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
            </svg>
            Download QR Code
          </button>
        </div>
      </div>
    </div>
    <!-- /QR VIEWER -->

    <!-- ===== EDIT SUB-MODAL ===== -->
    <div class="sub-overlay" id="editOverlay" style="display:none;">
      <div class="sub-modal">
        <div class="sub-modal-header">
          <span class="sub-modal-title">Edit Registration</span>
          <button class="modal-close" id="closeEdit">&times;</button>
        </div>
        <div class="sub-modal-body">
          <p class="sub-modal-id" id="editSchoolIdLabel">—</p>
          <div class="field-group" style="margin-top:8px;">
            <label>Last Name <span class="required">*</span></label>
            <input type="text" id="editLastName" maxlength="100" autocomplete="off">
          </div>
          <div class="field-group">
            <label>First Name <span class="required">*</span></label>
            <input type="text" id="editFirstName" maxlength="100" autocomplete="off">
          </div>
          <div class="field-group">
            <label>Middle Initial</label>
            <input type="text" id="editMI" maxlength="1" autocomplete="off" style="max-width:80px;">
          </div>
          <div class="form-error-banner" id="editBanner" style="display:none;"></div>
        </div>
        <div class="sub-modal-footer">
          <button class="btn-cancel" id="cancelEdit">Cancel</button>
          <button class="btn-register modal-btn" id="btnSaveEdit">Save Changes</button>
        </div>
      </div>
    </div>
    <!-- /EDIT -->

    <!-- ===== DELETE CONFIRMATION SUB-MODAL ===== -->
    <div class="sub-overlay" id="deleteOverlay" style="display:none;">
      <div class="sub-modal sub-modal--sm">
        <div class="sub-modal-header">
          <span class="sub-modal-title" style="color:#b91c1c;">Delete Registration</span>
          <button class="modal-close" id="closeDelete">&times;</button>
        </div>
        <div class="sub-modal-body">
          <div class="delete-warn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
            </svg>
          </div>
          <p class="delete-warn-text">Are you sure you want to delete the registration for:</p>
          <p class="delete-warn-name" id="deleteTargetName">—</p>
          <p class="delete-warn-sub"  id="deleteTargetId">—</p>
          <p class="delete-warn-note">Their QR code will stop working immediately. This cannot be undone.</p>
        </div>
        <div class="sub-modal-footer">
          <button class="btn-cancel" id="cancelDelete">Cancel</button>
          <button class="btn-delete-confirm" id="btnConfirmDelete">Yes, Delete</button>
        </div>
      </div>
    </div>
    <!-- /DELETE CONFIRM -->

  </div><!-- /main -->

  <!-- QRCode.js -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
          integrity="sha512-CNgIRecGo7nphbeZ04Sc13ka07paqdeTu0WR1IM4kNcpmBAUSHSQX0FslNhTDadL4O5SAGapGt4FodqL8My0mA=="
          crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script>
    // ---- Session check + sidebar population ----
    // The QR registration page is technically public (students self-register)
    // but when an admin is logged in we show their info in the sidebar.
    // If no session exists we simply leave the defaults.
    (async function () {
      try {
        const res  = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.loggedIn && data.user) {
          const u = data.user;
          const initials = ((u.first_name || '').charAt(0) + (u.last_name || '').charAt(0)).toUpperCase() || 'A';
          const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Admin User';
          ['userAvatar','topbarAvatar'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = initials.charAt(0);
          });
          const nameEl  = document.getElementById('userDisplayName');
          const emailEl = document.getElementById('userEmail');
          if (nameEl)  nameEl.textContent  = fullName;
          if (emailEl) emailEl.textContent = u.email || '';
        }
      } catch { /* not logged in — defaults stay */ }
    })();

    // ---- Logout ----
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
      });
    }
  </script>
  <script src="<?php echo e(asset('js/qr.js')); ?>"></script>
</body>
</html>
<?php /**PATH C:\Users\dhary\Documents\attendance-web-based-system\resources\views/qr-registration.blade.php ENDPATH**/ ?>