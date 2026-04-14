// signin.js
// Exports: module.exports = function renderSignInPage() → returns HTML string
// Used by home.js at: app.get('/signin', ...)
// NOTE: All server/routing logic is handled by home.js — this file only provides the HTML template.

const SIGNIN_TEMPLATE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BondHealth — Sign In</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); display: flex; align-items: center; justify-content: center; min-height: 100vh; position: relative; overflow: hidden; }
    .page-wrapper { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; position: relative; }
    .signin-wrapper { position: relative; z-index: 10; pointer-events: auto; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .right-section { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none; }
    .right-content { text-align: center; max-width: 400px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .animated-lights { position: relative; width: 300px; height: 300px; }
    .light { position: absolute; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0.2)); filter: blur(60px); }
    .light-1 { width: 150px; height: 150px; top: 20px; left: 75px; animation: float 8s ease-in-out infinite; }
    .light-2 { width: 120px; height: 120px; top: 120px; left: 10px; animation: float 10s ease-in-out infinite 1s; }
    .light-3 { width: 100px; height: 100px; top: 140px; right: 20px; animation: float 9s ease-in-out infinite 2s; }
    .light-4 { width: 130px; height: 130px; bottom: 30px; left: 80px; animation: float 11s ease-in-out infinite 1.5s; }
    .light-5 { width: 110px; height: 110px; bottom: 50px; right: 40px; animation: float 9.5s ease-in-out infinite 2.5s; }
    @keyframes float { 0%,100%{transform:translate(0,0) scale(1);opacity:0.4} 50%{transform:translate(20px,30px) scale(1.1);opacity:0.7} }
    .particle-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
    .particle { position: absolute; background: rgba(255,255,255,0.3); border-radius: 50%; }
    .particle-1{width:40px;height:40px;top:10%;left:15%;animation:drift 20s ease-in-out infinite}
    .particle-2{width:60px;height:60px;top:20%;right:10%;animation:drift 25s ease-in-out infinite 2s}
    .particle-3{width:35px;height:35px;top:50%;left:5%;animation:drift 22s ease-in-out infinite 1s}
    .particle-4{width:50px;height:50px;bottom:15%;right:20%;animation:drift 28s ease-in-out infinite 3s}
    .particle-5{width:45px;height:45px;top:70%;left:80%;animation:drift 24s ease-in-out infinite 1.5s}
    .particle-6{width:55px;height:55px;top:30%;left:50%;animation:drift 26s ease-in-out infinite 2.5s}
    .particle-7{width:38px;height:38px;bottom:25%;left:30%;animation:drift 23s ease-in-out infinite 0.8s}
    .particle-8{width:52px;height:52px;top:60%;right:5%;animation:drift 27s ease-in-out infinite 2.2s}
    @keyframes drift{0%{transform:translate(0,0) rotate(0deg) scale(1);opacity:0.2}25%{opacity:0.4}50%{transform:translate(50px,100px) rotate(180deg) scale(1.1);opacity:0.5}75%{opacity:0.3}100%{transform:translate(0,0) rotate(360deg) scale(1);opacity:0.2}}
    .signin-container { background: white; width: 100%; height: 100%; animation: slideUp 0.8s cubic-bezier(0.34,1.56,0.64,1); position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; box-sizing: border-box; overflow-y: auto; }
    @keyframes slideUp{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:translateY(0)}}
    .form-content { width: 100%; max-width: 380px; animation: fadeInScale 0.8s ease-out 0.2s both; }
    @keyframes fadeInScale{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
    .logo-section { text-align: center; margin-bottom: 30px; }
    .logo-icon { width: 50px; height: 50px; background: linear-gradient(135deg,#00d4ff,#0099cc); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 28px; }
    .website-name { font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
    .tagline { font-size: 13px; color: #666; }
    .toggle-section { display: flex; background: #f0f0f0; border-radius: 8px; padding: 4px; margin-bottom: 35px; gap: 4px; }
    .toggle-btn { flex: 1; padding: 12px 16px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); color: #666; background: transparent; }
    .toggle-btn.active { background: white; color: #00d4ff; box-shadow: 0 4px 12px rgba(0,212,255,0.3); transform: scale(1.02); }
    .toggle-btn:hover:not(.active) { color: #00d4ff; transform: translateY(-2px); }
    .form-section { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    .form-group { margin-bottom: 20px; }
    .form-label { display: block; font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-input { width: 100%; padding: 12px 14px; border: 1.5px solid #e0e0e0; border-radius: 6px; font-size: 14px; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); font-family: inherit; }
    .form-input:focus { outline: none; border-color: #00d4ff; box-shadow: 0 0 0 4px rgba(0,212,255,0.2); transform: scale(1.01); }
    .form-input::placeholder { color: #999; }
    .forgot-pw-link { display: inline-block; font-size: 13px; color: #00d4ff; text-decoration: none; margin-top: -15px; margin-bottom: 25px; transition: color 0.3s ease; }
    .forgot-pw-link:hover { color: #0099cc; text-decoration: underline; }
    .signin-btn { width: 100%; padding: 13px; background: linear-gradient(135deg,#00d4ff,#0099cc); color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 18px; }
    .signin-btn:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,212,255,0.5); }
    .signin-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    .message-box { display: none; padding: 12px 14px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; text-align: center; }
    .message-box.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .message-box.error   { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .message-box.show    { display: block; animation: slideDown 0.4s cubic-bezier(0.34,1.56,0.64,1); }
    @keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
    .custom-dropdown { position: relative; }
    .dropdown-btn { width: 100%; padding: 12px 14px; border: 1.5px solid #e0e0e0; border-radius: 6px; font-size: 14px; background: white; color: #1a1a1a; cursor: pointer; transition: all 0.3s; font-weight: 500; display: flex; align-items: center; justify-content: space-between; font-family: inherit; }
    .dropdown-btn:hover { border-color: #00d4ff; }
    .dropdown-menu { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1.5px solid #e0e0e0; border-top: none; border-radius: 0 0 6px 6px; display: none; z-index: 10; box-shadow: 0 8px 16px rgba(0,0,0,0.1); overflow: hidden; }
    .dropdown-menu.show { display: block; animation: dropdownSlide 0.3s ease; }
    @keyframes dropdownSlide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
    .dropdown-item { width: 100%; padding: 12px 14px; border: none; background: white; color: #1a1a1a; text-align: left; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; font-family: inherit; }
    .dropdown-item:hover { background: rgba(0,212,255,0.1); color: #00d4ff; padding-left: 18px; }
    .dropdown-item.selected { background: rgba(0,212,255,0.15); color: #00d4ff; font-weight: 600; }
    .admin-signup-btn { width: 100%; padding: 13px; background: linear-gradient(135deg,#4CAF50,#45a049); color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); text-transform: uppercase; letter-spacing: 0.8px; margin-top: 10px; display: none; }
    .admin-signup-btn.show { display: block; }
    .admin-signup-btn:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(76,175,80,0.5); }
    .patient-signup-container { text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0; }
    .patient-signup-text { font-size: 14px; color: #666; }
    .patient-signup-btn { background: none; border: none; color: #00d4ff; font-weight: 700; cursor: pointer; font-size: 14px; text-decoration: underline; padding: 0 5px; }
    .patient-signup-btn:hover { color: #0099cc; }
    .fp-modal { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,0.45); z-index: 1000; padding: 20px; }
    .fp-modal.show { display: flex; }
    .fp-card { width: 100%; max-width: 420px; background: #fff; border-radius: 12px; padding: 22px; box-shadow: 0 16px 40px rgba(0,0,0,0.2); }
    .fp-title { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; }
    .fp-sub { font-size: 13px; color: #666; margin-bottom: 16px; }
    .fp-row { margin-bottom: 12px; }
    .fp-actions { display: flex; gap: 10px; margin-top: 14px; }
    .fp-btn { border: none; border-radius: 8px; padding: 10px 12px; font-size: 13px; font-weight: 700; cursor: pointer; flex: 1; }
    .fp-btn.primary { background: linear-gradient(135deg,#00d4ff,#0099cc); color: #fff; }
    .fp-btn.ghost { background: #edf2f7; color: #334155; }
    .fp-link-btn { border: none; background: transparent; color: #00a6d1; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0; }
    .fp-status { font-size: 12px; margin-top: 8px; min-height: 18px; }
    .fp-status.error { color: #dc2626; }
    .fp-status.success { color: #16a34a; }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <div class="signin-wrapper">
      <div class="signin-container">
        <div class="form-content">
          <div class="logo-section">
            <div class="logo-icon">🏥</div>
            <div class="website-name">Bond Health</div>
            <div class="tagline">Secure Sign In</div>
          </div>

          <div class="toggle-section">
            <button class="toggle-btn active" id="patientBtn">Patient</button>
            <button class="toggle-btn" id="hospitalBtn">Hospital</button>
          </div>

          <div class="message-box" id="messageBox"></div>

          <!-- Patient Form -->
          <form class="form-section" id="patientForm">
            <div class="form-group">
              <label class="form-label">Email / Username</label>
              <input type="text" class="form-input" id="patientUsername" placeholder="Enter your email or username" required autocomplete="username">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" id="patientPassword" placeholder="••••••••" required autocomplete="current-password">
            </div>
            <a href="#" class="forgot-pw-link" id="forgotPwLink">Forgot password?</a>
            <button type="submit" class="signin-btn" id="patientSigninBtn">Sign In</button>
            <div class="patient-signup-container">
              <span class="patient-signup-text">Don't have an account? </span>
              <button type="button" class="patient-signup-btn" onclick="window.location.href='/patient-signup'">Sign Up</button>
            </div>
          </form>

          <!-- Hospital role selector -->
          <div class="form-section" id="hospitalDropdownSection" style="display:none">
            <div class="form-group">
              <label class="form-label">Select Role</label>
              <div class="custom-dropdown">
                <button type="button" class="dropdown-btn" id="dropdownBtn">
                  Select your role
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
                <div class="dropdown-menu" id="dropdownMenu">
                  <button type="button" class="dropdown-item" data-role="admin">Admin</button>
                  <button type="button" class="dropdown-item" data-role="doctor">Doctor</button>
                  <button type="button" class="dropdown-item" data-role="lab">Lab</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Hospital / Staff Form -->
          <form class="form-section" id="hospitalForm" style="display:none">
            <div class="form-group">
              <label class="form-label">Email / Username</label>
              <input type="text" class="form-input" id="hospitalUsername" placeholder="Enter your username" required autocomplete="username">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" id="hospitalPassword" placeholder="••••••••" required autocomplete="current-password">
            </div>
            <a href="#" class="forgot-pw-link" id="forgotPwLinkHospital">Forgot password?</a>
            <button type="submit" class="signin-btn" id="hospitalSigninBtn">Sign In</button>
            <button type="button" class="admin-signup-btn" id="adminSignupBtn" onclick="window.location.href='/admin-signup'">Sign Up as Admin</button>
          </form>
        </div>

        <div class="right-section">
          <div class="right-content">
            <div class="animated-lights">
              <div class="light light-1"></div><div class="light light-2"></div>
              <div class="light light-3"></div><div class="light light-4"></div>
              <div class="light light-5"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="particle-container">
    <div class="particle particle-1"></div><div class="particle particle-2"></div>
    <div class="particle particle-3"></div><div class="particle particle-4"></div>
    <div class="particle particle-5"></div><div class="particle particle-6"></div>
    <div class="particle particle-7"></div><div class="particle particle-8"></div>
  </div>

  <div class="fp-modal" id="forgotPasswordModal">
    <div class="fp-card" id="forgotPasswordCard">
      <div class="fp-title">Reset Password</div>
      <div class="fp-sub">Enter your email, username, or phone. We will send an OTP to your registered email or phone.</div>
      <div class="fp-row" id="fpLoginRow">
        <input type="text" class="form-input" id="fpLoginId" placeholder="Email, username, or phone">
      </div>
      <div class="fp-row" id="fpOtpRow" style="display:none;">
        <input type="text" class="form-input" id="fpOtp" placeholder="Enter OTP (6 digits)">
      </div>
      <div class="fp-row" id="fpNewPasswordRow" style="display:none;">
        <input type="password" class="form-input" id="fpNewPassword" placeholder="New password (min 8 chars)">
      </div>
      <div class="fp-row" id="fpConfirmPasswordRow" style="display:none;">
        <input type="password" class="form-input" id="fpConfirmPassword" placeholder="Confirm new password">
      </div>
      <div class="fp-actions">
        <button class="fp-btn ghost" id="fpCloseBtn" type="button">Close</button>
        <button class="fp-btn primary" id="fpResetBtn" type="button" style="display:none;">Reset Password</button>
      </div>
      <div class="fp-actions" id="fpSendRow">
        <button class="fp-btn ghost" id="fpSendOtpBtn" type="button">Send OTP</button>
      </div>
      <div class="fp-actions" id="fpVerifyRow" style="display:none;">
        <button class="fp-btn ghost" id="fpVerifyOtpBtn" type="button">Verify OTP</button>
      </div>
      <div id="fpResendRow" style="margin-top:10px; display:none; justify-content:space-between; align-items:center;">
        <button class="fp-link-btn" id="fpResendOtpBtn" type="button">Resend OTP</button>
        <span id="fpStatus" class="fp-status"></span>
      </div>
      <div id="fpStatusOnly" style="margin-top:10px; display:flex; justify-content:flex-end; align-items:center;">
        <span class="fp-status"></span>
      </div>
    </div>
  </div>

  <script>
    let selectedRole = null;

    // ── Message helper ─────────────────────────────
    function showMessage(msg, type = 'error') {
      const el = document.getElementById('messageBox');
      el.textContent = msg;
      el.className = 'message-box ' + type + ' show';
      setTimeout(() => el.classList.remove('show'), 4000);
    }

    // ── Toggle Patient / Hospital ──────────────────
    document.getElementById('patientBtn').addEventListener('click', () => switchForm('patient'));
    document.getElementById('hospitalBtn').addEventListener('click', () => switchForm('hospital'));

    function switchForm(type) {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('messageBox').classList.remove('show');

      if (type === 'patient') {
        document.getElementById('patientBtn').classList.add('active');
        document.getElementById('patientForm').style.display = 'block';
        document.getElementById('hospitalDropdownSection').style.display = 'none';
        document.getElementById('hospitalForm').style.display = 'none';
      } else {
        document.getElementById('hospitalBtn').classList.add('active');
        document.getElementById('patientForm').style.display = 'none';
        document.getElementById('hospitalDropdownSection').style.display = 'block';
        document.getElementById('hospitalForm').style.display = 'none';
        resetDropdown();
      }
    }

    // ── Dropdown ───────────────────────────────────
    document.getElementById('dropdownBtn').addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('dropdownMenu').classList.toggle('show');
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', function() {
        selectedRole = this.dataset.role;
        const btn = document.getElementById('dropdownBtn');
        btn.innerHTML = this.textContent + '<svg width="12" height="8" viewBox="0 0 12 8" fill="none" style="margin-left:8px"><path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        document.getElementById('dropdownMenu').classList.remove('show');
        document.getElementById('hospitalForm').style.display = 'block';
        document.getElementById('adminSignupBtn').classList.toggle('show', selectedRole === 'admin');
      });
    });

    document.addEventListener('click', e => {
      if (!document.querySelector('.custom-dropdown').contains(e.target))
        document.getElementById('dropdownMenu').classList.remove('show');
    });

    function resetDropdown() {
      selectedRole = null;
      document.getElementById('dropdownBtn').innerHTML = 'Select your role <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style="margin-left:8px"><path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      document.getElementById('dropdownMenu').classList.remove('show');
      document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
      document.getElementById('adminSignupBtn').classList.remove('show');
      document.getElementById('hospitalForm').style.display = 'none';
      document.getElementById('hospitalForm').reset();
    }

    // ── Form submissions ───────────────────────────
    document.getElementById('patientForm').addEventListener('submit', e => { e.preventDefault(); handleSignIn('patient'); });
    document.getElementById('hospitalForm').addEventListener('submit', e => { e.preventDefault(); handleSignIn('hospital'); });

    async function handleSignIn(type) {
      const username = document.getElementById(type === 'patient' ? 'patientUsername' : 'hospitalUsername').value.trim();
      const password = document.getElementById(type === 'patient' ? 'patientPassword' : 'hospitalPassword').value;
      const role     = type === 'hospital' ? selectedRole : 'patient';

      if (!username || !password) { showMessage('Please enter username and password'); return; }
      if (type === 'hospital' && !role) { showMessage('Please select a role first'); return; }

      const btnId = type === 'patient' ? 'patientSigninBtn' : 'hospitalSigninBtn';
      const btn   = document.getElementById(btnId);
      btn.disabled    = true;
      btn.textContent = 'Signing in…';

      try {
        const res  = await fetch('/api/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role })
        });
        const data = await res.json();

        if (data.success) {
          showMessage('Login successful! Redirecting…', 'success');
          const map = {
            patient: '/patient-dashboard',
            doctor:  '/doctor-dashboard',
            admin:   '/admin-dashboard',
            lab:     '/lab-dashboard'
          };
          setTimeout(() => {
            window.location.href = data.redirectTo || map[data.user?.role] || '/';
          }, 800);
        } else {
          showMessage(data.message || 'Invalid credentials');
          btn.disabled    = false;
          btn.textContent = 'Sign In';
        }
      } catch (err) {
        showMessage('Network error. Please try again.');
        btn.disabled    = false;
        btn.textContent = 'Sign In';
      }
    }

    // ── Forgot password (OTP + resend + reset) ─────
    const fpModal = document.getElementById('forgotPasswordModal');
    const fpStatus = document.getElementById('fpStatus');
    const fpLoginId = document.getElementById('fpLoginId');
    const fpOtp = document.getElementById('fpOtp');
    const fpNewPassword = document.getElementById('fpNewPassword');
    const fpConfirmPassword = document.getElementById('fpConfirmPassword');
    const forgotPasswordCard = document.getElementById('forgotPasswordCard');
    const fpOtpRow = document.getElementById('fpOtpRow');
    const fpNewPasswordRow = document.getElementById('fpNewPasswordRow');
    const fpConfirmPasswordRow = document.getElementById('fpConfirmPasswordRow');
    const fpSendRow = document.getElementById('fpSendRow');
    const fpVerifyRow = document.getElementById('fpVerifyRow');
    const fpResendRow = document.getElementById('fpResendRow');
    const fpResetBtn = document.getElementById('fpResetBtn');
    let fpBackdropMouseDown = false;
    let fpStep = 'request';

    function setFpStatus(msg, type) {
      fpStatus.textContent = msg || '';
      fpStatus.className = 'fp-status ' + (type || '');
    }

    function openForgotModal(prefill = '') {
      fpModal.classList.add('show');
      fpLoginId.value = prefill || '';
      fpOtp.value = '';
      fpNewPassword.value = '';
      fpConfirmPassword.value = '';
      fpStep = 'request';
      fpOtpRow.style.display = 'none';
      fpNewPasswordRow.style.display = 'none';
      fpConfirmPasswordRow.style.display = 'none';
      fpSendRow.style.display = 'flex';
      fpVerifyRow.style.display = 'none';
      fpResendRow.style.display = 'none';
      fpResetBtn.style.display = 'none';
      setFpStatus('', '');
    }

    function closeForgotModal() {
      fpModal.classList.remove('show');
    }

    async function fpPost(url, payload) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Request failed');
      return data;
    }

    document.getElementById('forgotPwLink').addEventListener('click', e => {
      e.preventDefault();
      openForgotModal(document.getElementById('patientUsername').value.trim());
    });
    document.getElementById('forgotPwLinkHospital').addEventListener('click', e => {
      e.preventDefault();
      openForgotModal(document.getElementById('hospitalUsername').value.trim());
    });

    document.getElementById('fpCloseBtn').addEventListener('click', closeForgotModal);
    forgotPasswordCard.addEventListener('mousedown', e => e.stopPropagation());
    forgotPasswordCard.addEventListener('click', e => e.stopPropagation());
    fpModal.addEventListener('mousedown', e => {
      fpBackdropMouseDown = (e.target === fpModal);
    });
    fpModal.addEventListener('click', e => {
      if (e.target === fpModal && fpBackdropMouseDown) closeForgotModal();
      fpBackdropMouseDown = false;
    });

    document.getElementById('fpSendOtpBtn').addEventListener('click', async () => {
      const loginId = fpLoginId.value.trim();
      if (!loginId) { setFpStatus('Enter email, username, or phone first', 'error'); return; }
      setFpStatus('Sending OTP...', '');
      try {
        const data = await fpPost('/api/auth/forgot-password/request', { loginId });
        const devOtpHint = data?.dev_otp ? (' OTP (dev mode): ' + data.dev_otp) : '';
        setFpStatus((data?.message || 'OTP sent to your registered email') + devOtpHint, 'success');
        fpStep = 'otp';
        fpOtpRow.style.display = 'block';
        fpVerifyRow.style.display = 'flex';
        fpResendRow.style.display = 'flex';
        fpLoginId.disabled = true;
        document.getElementById('fpSendOtpBtn').disabled = true;
      } catch (err) {
        setFpStatus(err.message, 'error');
      }
    });

    document.getElementById('fpResendOtpBtn').addEventListener('click', async () => {
      const loginId = fpLoginId.value.trim();
      if (!loginId) { setFpStatus('Enter email, username, or phone first', 'error'); return; }
      setFpStatus('Resending OTP...', '');
      try {
        const data = await fpPost('/api/auth/forgot-password/resend', { loginId });
        const devOtpHint = data?.dev_otp ? (' OTP (dev mode): ' + data.dev_otp) : '';
        setFpStatus((data?.message || 'OTP resent successfully') + devOtpHint, 'success');
      } catch (err) {
        setFpStatus(err.message, 'error');
      }
    });

    document.getElementById('fpVerifyOtpBtn').addEventListener('click', async () => {
      const loginId = fpLoginId.value.trim();
      const otp = fpOtp.value.trim();
      if (!loginId || !otp) { setFpStatus('Enter login and OTP', 'error'); return; }
      setFpStatus('Verifying OTP...', '');
      try {
        await fpPost('/api/auth/forgot-password/verify', { loginId, otp });
        setFpStatus('OTP verified. You can now reset password.', 'success');
        fpStep = 'reset';
        fpOtp.disabled = true;
        document.getElementById('fpVerifyOtpBtn').disabled = true;
        fpNewPasswordRow.style.display = 'block';
        fpConfirmPasswordRow.style.display = 'block';
        fpResetBtn.style.display = 'block';
      } catch (err) {
        setFpStatus(err.message, 'error');
      }
    });

    document.getElementById('fpResetBtn').addEventListener('click', async () => {
      const loginId = fpLoginId.value.trim();
      const otp = fpOtp.value.trim();
      const newPassword = fpNewPassword.value;
      const confirmPassword = fpConfirmPassword.value;
      if (!loginId || !otp || !newPassword || !confirmPassword) {
        setFpStatus('Fill all fields', 'error'); return;
      }
      setFpStatus('Resetting password...', '');
      try {
        await fpPost('/api/auth/forgot-password/reset', { loginId, otp, newPassword, confirmPassword });
        setFpStatus('Password reset successful. Please sign in.', 'success');
        showMessage('Password reset successful. Please sign in with new password.', 'success');
        setTimeout(closeForgotModal, 900);
      } catch (err) {
        setFpStatus(err.message, 'error');
      }
    });
  </script>
</body>
</html>`;

module.exports = function renderSignInPage() {
    return SIGNIN_TEMPLATE;
};