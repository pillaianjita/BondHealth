const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, getClient } = require('./db/config');
require('dotenv').config();
const hospitalRegistrationPage = require('./HospitalRegistration');
const hospitalPage = require('./Hospital');
const PORT = process.env.PORT || 3005;

// JWT helper functions
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.user_id, 
            username: user.username, 
            role: user.role 
        }, 
        process.env.JWT_SECRET || 'fallback_secret', 
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (error) {
        return null;
    }
};

// Track active sessions
let activeSessions = new Map();

// Cookie parser helper
function parseCookies(request) {
    const list = {};
    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            let [name, ...rest] = cookie.split('=');
            name = name.trim();
            if (!name) return;
            const value = rest.join('=').trim();
            if (!value) return;
            list[name] = decodeURIComponent(value);
        });
    }
    return list;
}


// ============================================
// SIGNIN PAGE TEMPLATE - COMPLETE HTML
// ============================================
const SIGNIN_TEMPLATE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Healthcare Sign In</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); display: flex; align-items: center; justify-content: center; min-height: 100vh; position: relative; overflow: hidden; }
    .page-wrapper { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; position: relative; }
    .signin-wrapper { position: relative; z-index: 10; pointer-events: auto; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .right-section { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none; }
    .right-content { text-align: center; max-width: 400px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .animated-lights { position: relative; width: 300px; height: 300px; }
    .light { position: absolute; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.2)); filter: blur(60px); }
    .light-1 { width: 150px; height: 150px; top: 20px; left: 75px; animation: float 8s ease-in-out infinite; }
    .light-2 { width: 120px; height: 120px; top: 120px; left: 10px; animation: float 10s ease-in-out infinite 1s; }
    .light-3 { width: 100px; height: 100px; top: 140px; right: 20px; animation: float 9s ease-in-out infinite 2s; }
    .light-4 { width: 130px; height: 130px; bottom: 30px; left: 80px; animation: float 11s ease-in-out infinite 1.5s; }
    .light-5 { width: 110px; height: 110px; bottom: 50px; right: 40px; animation: float 9.5s ease-in-out infinite 2.5s; }
    @keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; } 50% { transform: translate(20px, 30px) scale(1.1); opacity: 0.7; } }
    .particle-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
    .particle { position: absolute; background: rgba(255, 255, 255, 0.3); border-radius: 50%; }
    .particle-1 { width: 40px; height: 40px; top: 10%; left: 15%; animation: drift 20s ease-in-out infinite; }
    .particle-2 { width: 60px; height: 60px; top: 20%; right: 10%; animation: drift 25s ease-in-out infinite 2s; }
    .particle-3 { width: 35px; height: 35px; top: 50%; left: 5%; animation: drift 22s ease-in-out infinite 1s; }
    .particle-4 { width: 50px; height: 50px; bottom: 15%; right: 20%; animation: drift 28s ease-in-out infinite 3s; }
    .particle-5 { width: 45px; height: 45px; top: 70%; left: 80%; animation: drift 24s ease-in-out infinite 1.5s; }
    .particle-6 { width: 55px; height: 55px; top: 30%; left: 50%; animation: drift 26s ease-in-out infinite 2.5s; }
    .particle-7 { width: 38px; height: 38px; bottom: 25%; left: 30%; animation: drift 23s ease-in-out infinite 0.8s; }
    .particle-8 { width: 52px; height: 52px; top: 60%; right: 5%; animation: drift 27s ease-in-out infinite 2.2s; }
    @keyframes drift { 0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.2; } 25% { opacity: 0.4; } 50% { transform: translate(50px, 100px) rotate(180deg) scale(1.1); opacity: 0.5; } 75% { opacity: 0.3; } 100% { transform: translate(0, 0) rotate(360deg) scale(1); opacity: 0.2; } }
    .signin-container { background: white; width: 100%; height: 100%; animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; box-sizing: border-box; overflow-y: auto; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
    .form-content { width: 100%; max-width: 380px; animation: fadeInScale 0.8s ease-out 0.2s both; }
    @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .logo-section { text-align: center; margin-bottom: 30px; animation: slideInDown 0.8s ease-out 0.3s both; }
    @keyframes slideInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    .logo-icon { width: 50px; height: 50px; background: linear-gradient(135deg, #00d4ff, #0099cc); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 28px; }
    .website-name { font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
    .tagline { font-size: 13px; color: #666; }
    .toggle-section { display: flex; background: #f0f0f0; border-radius: 8px; padding: 4px; margin-bottom: 35px; gap: 4px; }
    .toggle-btn { flex: 1; padding: 12px 16px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); color: #666; background: transparent; }
    .toggle-btn.active { background: white; color: #00d4ff; box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3); transform: scale(1.02); }
    .toggle-btn:hover:not(.active) { color: #00d4ff; transform: translateY(-2px); }
    .form-section { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .form-group { margin-bottom: 20px; }
    .form-label { display: block; font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-input { width: 100%; padding: 12px 14px; border: 1.5px solid #e0e0e0; border-radius: 6px; font-size: 14px; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); font-family: inherit; }
    .form-input:focus { outline: none; border-color: #00d4ff; box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.2); transform: scale(1.01); }
    .form-input::placeholder { color: #999; }
    .forgot-pw-link { display: inline-block; font-size: 13px; color: #00d4ff; text-decoration: none; margin-top: -15px; margin-bottom: 25px; transition: color 0.3s ease; }
    .forgot-pw-link:hover { color: #0099cc; text-decoration: underline; }
    .signin-btn { width: 100%; padding: 13px; background: linear-gradient(135deg, #00d4ff, #0099cc); color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 18px; position: relative; overflow: hidden; }
    .signin-btn:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0, 212, 255, 0.5); }
    .signup-section { text-align: center; padding-top: 20px; border-top: 1px solid #f0f0f0; }
    .signup-text { font-size: 13px; color: #666; }
    .signup-link { color: #00d4ff; text-decoration: none; font-weight: 700; transition: color 0.3s ease; cursor: pointer; }
    .signup-link:hover { color: #0099cc; text-decoration: underline; }
    .success-message { display: none; background: #d4edda; color: #155724; padding: 12px 14px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; text-align: center; border: 1px solid #c3e6cb; }
    .success-message.show { display: block; animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    .custom-dropdown { position: relative; }
    .dropdown-btn { width: 100%; padding: 12px 14px; border: 1.5px solid #e0e0e0; border-radius: 6px; font-size: 14px; background: white; color: #1a1a1a; cursor: pointer; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); font-weight: 500; display: flex; align-items: center; justify-content: space-between; font-family: inherit; }
    .dropdown-btn:hover { border-color: #00d4ff; transform: translateY(-2px); }
    .dropdown-menu { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1.5px solid #e0e0e0; border-top: none; border-radius: 0 0 6px 6px; margin-top: -1px; display: none; z-index: 10; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .dropdown-menu.show { display: block; animation: dropdownSlide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes dropdownSlide { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
    .dropdown-item { width: 100%; padding: 12px 14px; border: none; background: white; color: #1a1a1a; text-align: left; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); font-family: inherit; }
    .dropdown-item:hover { background: rgba(0, 212, 255, 0.1); color: #00d4ff; transform: translateX(4px); }
    .dropdown-item.selected { background: rgba(0, 212, 255, 0.15); color: #00d4ff; font-weight: 600; }
    
    /* Admin Sign Up Button */
    .admin-signup-btn {
      width: 100%;
      padding: 13px;
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 10px;
      position: relative;
      overflow: hidden;
      display: none;
    }
    
    .admin-signup-btn.show {
      display: block;
      animation: fadeIn 0.4s ease-out;
    }
    
    .admin-signup-btn:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(76, 175, 80, 0.5);
    }

    /* Patient Sign Up Button */
    .patient-signup-container {
      text-align: center;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #f0f0f0;
    }
    
    .patient-signup-text {
      font-size: 14px;
      color: #666;
    }
    
    .patient-signup-btn {
      background: none;
      border: none;
      color: #00d4ff;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
      text-decoration: underline;
      padding: 0 5px;
    }
    
    .patient-signup-btn:hover {
      color: #0099cc;
    }
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
          <div class="success-message" id="successMessage"></div>
          
          <!-- Patient Form -->
          <form class="form-section" id="patientForm">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" class="form-input" id="patientUsername" placeholder="Enter your email" required>
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" id="patientPassword" placeholder="••••••••" required>
            </div>
            <a href="#" class="forgot-pw-link" id="forgotPwLink">Forgot password?</a>
            <button type="submit" class="signin-btn">Sign In</button>
            
            <!-- Patient Sign Up Section -->
            <div class="patient-signup-container">
              <span class="patient-signup-text">Don't have an account? </span>
              <button type="button" class="patient-signup-btn" id="patientSignupBtn" onclick="window.location.href='/patient-signup'">Sign Up</button>
            </div>
          </form>
          
          <!-- Hospital Dropdown Section -->
          <div class="form-section" id="hospitalDropdownSection" style="display: none;">
            <div class="form-group">
              <label class="form-label">Select Role</label>
              <div class="custom-dropdown">
                <button type="button" class="dropdown-btn" id="dropdownBtn">
                  Select your role
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style="margin-left: 8px;">
                    <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
                <div class="dropdown-menu" id="dropdownMenu">
                  <button type="button" class="dropdown-item" data-role="admin">Admin</button>
                  <button type="button" class="dropdown-item" data-role="doctor">Doctor</button>
                  <button type="button" class="dropdown-item" data-role="lab">Lab</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Hospital Form -->
          <form class="form-section" id="hospitalForm" style="display: none;">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" class="form-input" id="hospitalUsername" placeholder="Enter your username" required>
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" id="hospitalPassword" placeholder="••••••••" required>
            </div>
            <a href="#" class="forgot-pw-link" id="forgotPwLinkHospital">Forgot password?</a>
            <button type="submit" class="signin-btn">Sign In</button>
            <button type="button" class="admin-signup-btn" id="adminSignupBtn">Sign Up as Admin</button>
          </form>
        </div>
        <div class="right-section">
          <div class="right-content">
            <div class="animated-lights">
              <div class="light light-1"></div>
              <div class="light light-2"></div>
              <div class="light light-3"></div>
              <div class="light light-4"></div>
              <div class="light light-5"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="particle-container">
    <div class="particle particle-1"></div>
    <div class="particle particle-2"></div>
    <div class="particle particle-3"></div>
    <div class="particle particle-4"></div>
    <div class="particle particle-5"></div>
    <div class="particle particle-6"></div>
    <div class="particle particle-7"></div>
    <div class="particle particle-8"></div>
  </div>
  <script>
    let currentType = 'patient';
    let selectedRole = null;

    // Dropdown functionality
    document.getElementById('dropdownBtn').addEventListener('click', function(e) {
      e.preventDefault();
      const menu = document.getElementById('dropdownMenu');
      this.classList.toggle('active');
      menu.classList.toggle('show');
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        selectedRole = this.dataset.role;
        const roleText = this.textContent;
        const btn = document.getElementById('dropdownBtn');
        btn.textContent = roleText;
        
        // Add SVG back
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '12');
        svg.setAttribute('height', '8');
        svg.setAttribute('viewBox', '0 0 12 8');
        svg.setAttribute('fill', 'none');
        svg.style.marginLeft = '8px';
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M1 1L6 6L11 1');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);
        btn.appendChild(svg);
        
        // Update selected state
        document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        
        // Close dropdown
        btn.classList.remove('active');
        document.getElementById('dropdownMenu').classList.remove('show');
        
        // Show hospital form
        document.getElementById('hospitalForm').style.display = 'block';
        
        // Show Admin Sign Up button ONLY for Admin role
        const adminSignupBtn = document.getElementById('adminSignupBtn');
        if (selectedRole === 'admin') {
          adminSignupBtn.classList.add('show');
        } else {
          adminSignupBtn.classList.remove('show');
        }
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      const dropdown = document.querySelector('.custom-dropdown');
      if (!dropdown.contains(e.target)) {
        document.getElementById('dropdownBtn').classList.remove('active');
        document.getElementById('dropdownMenu').classList.remove('show');
      }
    });

    // Form submission handlers
    document.getElementById('patientForm').addEventListener('submit', function(e) {
      e.preventDefault();
      handleSignIn('patient');
    });

    document.getElementById('hospitalForm').addEventListener('submit', function(e) {
      e.preventDefault();
      handleSignIn('hospital');
    });

    // Admin Sign Up button handler
    document.getElementById('adminSignupBtn').addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = '/admin-signup';
    });

    // Forgot password handlers
    document.getElementById('forgotPwLink').addEventListener('click', function(e) {
      e.preventDefault();
      showMessage('Password reset link sent to your registered email!');
    });

    document.getElementById('forgotPwLinkHospital').addEventListener('click', function(e) {
      e.preventDefault();
      showMessage('Password reset link sent to your hospital email!');
    });

    // Toggle buttons
    document.getElementById('patientBtn').addEventListener('click', function() {
      switchForm('patient');
    });

    document.getElementById('hospitalBtn').addEventListener('click', function() {
      switchForm('hospital');
    });

    function switchForm(type) {
      currentType = type;
      
      document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
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
        
        // Reset dropdown
        selectedRole = null;
        const btn = document.getElementById('dropdownBtn');
        btn.textContent = 'Select your role';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '12');
        svg.setAttribute('height', '8');
        svg.setAttribute('viewBox', '0 0 12 8');
        svg.setAttribute('fill', 'none');
        svg.style.marginLeft = '8px';
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M1 1L6 6L11 1');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);
        btn.appendChild(svg);
        
        btn.classList.remove('active');
        document.getElementById('dropdownMenu').classList.remove('show');
        document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
        document.getElementById('adminSignupBtn').classList.remove('show');
        document.getElementById('hospitalForm').reset();
      }
      
      document.getElementById('successMessage').classList.remove('show');
    }

    async function handleSignIn(type) {
      const username = document.getElementById(type === 'patient' ? 'patientUsername' : 'hospitalUsername').value;
      const password = document.getElementById(type === 'patient' ? 'patientPassword' : 'hospitalPassword').value;
      const role = type === 'hospital' ? selectedRole : 'patient';
      
      if (!username || !password) {
          showMessage('Please enter username and password');
          return;
      }
      
      try {
          // CHANGE THIS URL - point to home.js API
          // Use the signin API endpoint
          const response = await fetch('/api/signin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password, role })
          });

          const data = await response.json();

          if (data.success) {
              showMessage('Login successful! Redirecting...');
              
              setTimeout(() => {
                  const redirectMap = {
                      patient: 'http://localhost:3005/patient-dashboard',
                      doctor: 'http://localhost:3005/doctor-dashboard',
                      admin: 'http://localhost:3005/admin-dashboard',
                      lab: 'http://localhost:3005/lab-dashboard'
                  };
                  window.location.href = redirectMap[data.user.role] || 'http://localhost:3005/';
              }, 1000);
          } else {
              showMessage(data.message || 'Login failed');
          }
      } catch (error) {
          console.error('Login error:', error);
          showMessage('Network error. Please try again.');
      }
    }

    function showMessage(message) {
      const messageEl = document.getElementById('successMessage');
      messageEl.textContent = message;
      messageEl.classList.add('show');
      
      setTimeout(() => {
        messageEl.classList.remove('show');
      }, 3000);
    }
  </script>
</body>
</html>`;

// ============================================
// HTTP SERVER
// ============================================
/*const server = http.createServer(async (req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Serve Sign In page
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache'
        });
        res.end(SIGNIN_TEMPLATE);
    }
    
    // SERVE LAB DASHBOARD - USING EXPORTED FUNCTION FROM labs.js
    // SERVE LAB DASHBOARD - WITH AUTHENTICATION
    else if (req.url === '/lab-dashboard') {
        const cookies = parseCookies(req);
        const token = cookies.token;
        
        if (!token) {
            res.writeHead(302, { 'Location': '/' });
            res.end();
            return;
        }
        
        const decoded = verifyToken(token);
        if (!decoded || !activeSessions.has(decoded.id) || decoded.role !== 'lab') {
            res.writeHead(302, { 'Location': '/' });
            res.end();
            return;
        }
        
        try {
            const renderLabDashboard = require('./labs.js');
            const html = await renderLabDashboard(decoded.id);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } catch (err) {
            console.error('Error loading labs.js:', err);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 - Lab Dashboard not found</h1><p>Make sure labs.js is in the same directory and exports the render function</p><a href="/">Back to Sign In</a>');
        }
    }
    
    // SERVE PATIENT DASHBOARD - USING EXPORTED FUNCTION FROM Patient.js
    // SERVE PATIENT DASHBOARD - WITH AUTHENTICATION
    else if (req.url === '/patient-dashboard') {
        const cookies = parseCookies(req);
        const token = cookies.token;
        
        if (!token) {
            res.writeHead(302, { 'Location': '/' });
            res.end();
            return;
        }
        
        const decoded = verifyToken(token);
        if (!decoded || !activeSessions.has(decoded.id) || decoded.role !== 'patient') {
            res.writeHead(302, { 'Location': '/' });
            res.end();
            return;
        }
        
        try {
            const renderPatientDashboard = require('./Patient.js');
            const html = await renderPatientDashboard(decoded.id);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } catch (err) {
            console.error('Error loading Patient.js:', err);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 - Patient Dashboard not found</h1><p>Make sure Patient.js is in the same directory and exports the render function</p><a href="/">Back to Sign In</a>');
        }
    }
    
    // SERVE ADMIN DASHBOARD - USING EXPORTED FUNCTION FROM admin.js
    // SERVE ADMIN DASHBOARD - WITH AUTHENTICATION
    else if (req.url === '/admin-dashboard') {
        const cookies = parseCookies(req);
        const token = cookies.token;
        
        if (!token) {
            res.writeHead(302, { 'Location': '/' });
            res.end();
            return;
        }
        
        const decoded = verifyToken(token);
        if (!decoded || !activeSessions.has(decoded.id) || decoded.role !== 'admin') {
            res.writeHead(302, { 'Location': '/' });
            res.end();
            return;
        }
        
        try {
            const renderAdminDashboard = require('./admin.js');
            const html = await renderAdminDashboard(decoded.id);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } catch (err) {
            console.error('Error loading admin.js:', err);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 - Admin Dashboard not found</h1><p>Make sure admin.js is in the same directory and exports the render function</p><a href="/">Back to Sign In</a>');
        }
    }
    
    // SERVE DOCTOR DASHBOARD - USING EXPORTED FUNCTION FROM Doctor.js
    // SERVE DOCTOR DASHBOARD - WITH AUTHENTICATION
    else if (req.url === '/doctor-dashboard') {
        const cookies = parseCookies(req);
        const token = cookies.token;
        
        if (!token) {
            res.writeHead(302, { 'Location': '/' });
            res.end();
            return;
        }
        
        const decoded = verifyToken(token);
        if (!decoded || !activeSessions.has(decoded.id) || decoded.role !== 'doctor') {
            res.writeHead(302, { 'Location': '/' });
            res.end();
            return;
        }
        
        try {
            const renderDoctorDashboard = require('./Doctor.js');
            const html = await renderDoctorDashboard(decoded.id);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } catch (err) {
            console.error('Error loading Doctor.js:', err);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 - Doctor Dashboard not found</h1><p>Make sure Doctor.js is in the same directory and exports the render function</p><a href="/">Back to Sign In</a>');
        }
    }
    
    // Serve Admin Signup
    else if (req.url === '/admin-signup') {
       res.writeHead(200, { 'Content-Type': 'text/html' });
       res.end(hospitalRegistrationPage);
    }
    
    // Serve Patient Signup
    else if (req.url === '/patient-signup') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Patient Sign Up</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                    .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: slideUp 0.8s ease; }
                    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                    h1 { color: #00d4ff; text-align: center; margin-bottom: 30px; }
                    .form-group { margin-bottom: 20px; }
                    .form-label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
                    .form-input { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 15px; transition: all 0.3s ease; }
                    .form-input:focus { outline: none; border-color: #00d4ff; box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1); }
                    .submit-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-top: 10px; }
                    .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0, 212, 255, 0.4); }
                    .back-btn { margin-top: 20px; padding: 12px 30px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; width: 100%; }
                    .back-btn:hover { background: #555; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>👤 Patient Sign Up</h1>
                    <p style="text-align: center; color: #666; margin-bottom: 30px;">Create your patient account:</p>
                    <form id="patientSignupForm" onsubmit="event.preventDefault(); alert('Account created successfully! Please sign in.'); window.location.href='/';">
                        <div class="form-group">
                            <label class="form-label">Full Name</label>
                            <input type="text" class="form-input" placeholder="Enter your full name" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email Address</label>
                            <input type="email" class="form-input" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Username</label>
                            <input type="text" class="form-input" placeholder="Choose a username" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-input" placeholder="Create a password" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Confirm Password</label>
                            <input type="password" class="form-input" placeholder="Confirm your password" required>
                        </div>
                        <button type="submit" class="submit-btn">Create Account</button>
                    </form>
                    <button class="back-btn" onclick="window.location.href='/'">← Back to Sign In</button>
                </div>
            </body>
            </html>
        `);
    }
    
    // API endpoint for signin
    // API endpoint for signin
    else if (req.url === '/api/signin' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                console.log('Sign in attempt:', data.username);
                
                const { username, password, role } = data;
                
                if (!username || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Username and password required' }));
                    return;
                }
                
                // Query database for user
                const result = await query(
                    'SELECT * FROM users WHERE username = $1 OR email = $1',
                    [username]
                );
                
                const user = result.rows[0];
                
                if (!user) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Invalid credentials' }));
                    return;
                }
                
                // Verify password
                const isValid = await bcrypt.compare(password, user.password_hash);
                
                if (!isValid) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Invalid credentials' }));
                    return;
                }
                
                // Verify role matches
                if (role && user.role !== role) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Invalid role for this user' }));
                    return;
                }
                
                // Update last login
                await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);
                
                // Generate token
                const token = generateToken({ 
                    user_id: user.user_id, 
                    username: user.username, 
                    role: user.role 
                });
                
                activeSessions.set(user.user_id, { token, loginTime: new Date().toISOString() });
                
                // Set cookie
                res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Max-Age=604800; Path=/`);
                
                // Determine redirect URL
                let redirectUrl = null;
                if (user.role === 'admin') {
                    redirectUrl = '/admin-dashboard';
                } else if (user.role === 'doctor') {
                    redirectUrl = '/doctor-dashboard';
                } else if (user.role === 'lab') {
                    redirectUrl = '/lab-dashboard';
                } else if (user.role === 'patient') {
                    redirectUrl = '/patient-dashboard';
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Sign in successful!',
                    user: { 
                        id: user.user_id, 
                        username: user.username, 
                        email: user.email, 
                        role: user.role 
                    },
                    redirectTo: redirectUrl
                }));
                
            } catch (error) {
                console.error('Sign in error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Server error' }));
            }
        });
    }
    
    // Logout endpoint
    else if (req.url === '/api/logout' && req.method === 'POST') {
        const cookies = parseCookies(req);
        const token = cookies.token;
        
        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                activeSessions.delete(decoded.id);
            }
        }
        
        res.setHeader('Set-Cookie', 'token=; HttpOnly; Max-Age=0; Path=/');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Logged out' }));
    }

    // 404 Not Found
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});*/

// At the bottom of signin.js, add:
module.exports = function renderSignInPage() {
    return SIGNIN_TEMPLATE;
};

// Start server
/*server.listen(PORT, () => {
    console.log('\n=======================================');
    console.log('✅ BOND HEALTH - SINGLE SERVER SOLUTION');
    console.log('=======================================');
    console.log(`🌐 Sign In Page: http://localhost:${PORT}/`);
    console.log(`🔬 Lab Dashboard: http://localhost:${PORT}/lab-dashboard`);
    console.log(`👤 Patient Dashboard: http://localhost:${PORT}/patient-dashboard`);
    console.log(`🏥 Admin Dashboard: http://localhost:${PORT}/admin-dashboard`);
    console.log(`👨‍⚕️ Doctor Dashboard: http://localhost:${PORT}/doctor-dashboard`);
    console.log(`📝 Admin Sign Up: http://localhost:${PORT}/admin-signup`);
    console.log(`📝 Patient Sign Up: http://localhost:${PORT}/patient-signup`);
    console.log('=======================================');
    console.log('🚀 Run ONLY this file!');
    console.log('📁 All dashboard files (labs.js, Patient.js, admin.js, Doctor.js) now EXPORT render functions');
    console.log('=======================================\n');
});*/