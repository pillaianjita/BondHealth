const { query } = require('./db/config');

// ============================================
// SECURITY: HTML escape helper — use on ALL
// user/DB-sourced values before injecting into HTML
// ============================================
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function patientDisplayId(row) {
  if (row?.patient_uuid && String(row.patient_uuid).trim()) return String(row.patient_uuid);
  if (row?.patient_id) {
    const compact = String(row.patient_id).replace(/-/g, '').toUpperCase();
    if (compact) return `PT-${compact.slice(0, 8)}`;
  }
  return 'N/A';
}

// ============================================
// Normalize doctor row (DB snake_case + camelCase fallbacks)
// Call once at the boundary — never scatter this logic in templates
// ============================================
function normalizeDoctor(raw) {
  const d = { ...raw };
  d.name             = d.full_name || d.name || d.fullName || 'Doctor';
  d.doctor_uuid      = d.doctor_uuid || d.doctor_id || d.id || 'DR-0000';
  d.consultation_fee = d.consultation_fee || d.consultationFee || 'N/A';
  d.available_days   = d.available_days || d.availableDays || [];
  d.available_time   = d.available_time || d.availableTime || 'N/A';
  d.contact          = d.contact || d.phone || 'N/A';
  d.specialization   = d.specialization || 'Specialist';
  d.designation      = d.designation || 'Doctor';
  d.experience       = d.experience || 'N/A';
  d.qualification    = d.qualification || 'N/A';
  d.address          = d.address || '';
  d.email            = d.email || 'N/A';
  return d;
}

// ============================================
// Shared card builders (single source of truth)
// ============================================
function buildAptCardHTML(apt) {
  return `
    <div class="cyan-light rounded-xl p-5 hover-lift appointment-card" data-id="${esc(apt.appointment_id)}">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex items-center space-x-4">
          <div class="w-14 h-14 cyan-bg rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fas fa-user-injured text-xl text-white"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold cyan-text">${esc(apt.patient_name)}</h3>
            <p class="text-gray-500 text-sm">ID: ${esc(patientDisplayId(apt))}</p>
            <p class="text-gray-700 text-sm mt-1"><i class="fas fa-stethoscope mr-1 cyan-text"></i>${esc(apt.reason || 'General Consultation')}</p>
          </div>
        </div>
        <div class="flex flex-col items-start md:items-end gap-2">
          <div class="flex items-center gap-3">
            <span class="status-badge status-${esc(apt.status || 'pending')}">${esc(apt.status || 'pending')}</span>
            <span class="text-lg font-bold cyan-text">${esc(apt.appointment_time ? String(apt.appointment_time).substring(0, 5) : '--:--')}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="px-3 py-1.5 btn-cyan rounded-lg text-sm start-consult-btn"
              data-id="${esc(apt.appointment_id)}"
              data-patient="${esc(apt.patient_name)}"
              data-patient-id="${esc(apt.patient_id)}">
              <i class="fas fa-play-circle mr-1"></i>Start Consult
            </button>
            ${apt.appointment_type === 'online'
              ? `<button class="px-3 py-1.5 btn-green rounded-lg text-sm video-btn" data-id="${esc(apt.appointment_id)}"><i class="fas fa-video mr-1"></i>Video Call</button>`
              : ''}
            <button class="px-3 py-1.5 btn-white rounded-lg text-sm reschedule-btn" data-id="${esc(apt.appointment_id)}">Reschedule</button>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <span class="text-xs cyan-text">
          <i class="fas fa-${apt.appointment_type === 'online' ? 'wifi' : 'hospital'} mr-1"></i>
          ${apt.appointment_type === 'online' ? 'Online Consultation' : 'In-person Visit'}
        </span>
        <div class="flex gap-2">
          <button class="text-xs cyan-bg text-white px-3 py-1 rounded view-patient-history-btn"
            data-patient-id="${esc(apt.patient_id)}"
            data-patient-name="${esc(apt.patient_name)}">
            <i class="fas fa-file-medical mr-1"></i>History
          </button>
          <button class="text-xs btn-white px-3 py-1 rounded message-patient-btn"
            data-patient-id="${esc(apt.patient_id)}"
            data-patient-name="${esc(apt.patient_name)}">
            <i class="fas fa-comment-medical mr-1"></i>Message
          </button>
          <button class="text-xs btn-cyan px-3 py-1 rounded prescribe-btn"
            data-patient-id="${esc(apt.patient_id)}"
            data-patient-name="${esc(apt.patient_name)}">
            <i class="fas fa-prescription mr-1"></i>Prescribe
          </button>
        </div>
      </div>
    </div>`;
}

function buildReportCardHTML(r) {
  const isECG = r.test_type && r.test_type.toLowerCase().includes('ecg');
  return `
    <div class="cyan-light rounded-xl p-5 hover-lift report-card" data-id="${esc(r.report_id)}">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex items-center space-x-4">
          <div class="w-14 h-14 ${((r.status || '').toLowerCase() === 'verified' || (r.status || '').toLowerCase() === 'reviewed') ? 'cyan-bg' : 'cyan-dark'} rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fas ${isECG ? 'fa-heartbeat' : 'fa-vial'} text-xl text-white"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold cyan-text">${esc(r.patient_name)}</h3>
            <p class="text-gray-500 text-sm">ID: ${esc(patientDisplayId(r))}</p>
            <p class="text-gray-700 text-sm mt-1"><i class="fas fa-flask mr-1 cyan-text"></i>${esc(r.test_type)}</p>
          </div>
        </div>
        <div class="flex flex-col items-start md:items-end gap-2">
          <div class="flex items-center gap-3">
            <span class="status-badge status-${esc(r.status)}">${esc(r.status)}</span>
            <span class="text-sm cyan-text">${new Date(r.test_date).toLocaleDateString()}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="px-3 py-1.5 btn-cyan rounded-lg text-sm view-report-btn" data-id="${esc(r.report_id)}">
              <i class="fas fa-eye mr-1"></i>View
            </button>
            <button class="px-3 py-1.5 btn-white rounded-lg text-sm write-findings-btn"
              data-id="${esc(r.report_id)}"
              data-findings="${esc(r.findings || '')}">
              ${((r.status || '').toLowerCase() === 'verified' || (r.status || '').toLowerCase() === 'reviewed') ? 'Update' : 'Add Findings'}
            </button>
            <button class="px-3 py-1.5 btn-white rounded-lg text-sm download-report-btn"
              data-id="${esc(r.report_id)}"
              data-patient="${esc(r.patient_name)}"
              data-type="${esc(r.test_type)}"
              data-date="${esc(r.test_date)}"
              data-findings="${esc(r.findings || '')}">
              <i class="fas fa-download mr-1"></i>PDF
            </button>
            <button class="px-3 py-1.5 btn-white rounded-lg text-sm share-report-btn" data-id="${esc(r.report_id)}">
              <i class="fas fa-share-alt mr-1"></i>Share
            </button>
            <button class="px-3 py-1.5 btn-red rounded-lg text-sm delete-report-btn"
              data-id="${esc(r.report_id)}"
              data-patient="${esc(r.patient_name)}"
              data-type="${esc(r.test_type)}">
              <i class="fas fa-trash mr-1"></i>Delete
            </button>
          </div>
        </div>
      </div>
      ${r.findings
        ? `<div class="mt-3 p-3 white-card rounded-lg border-l-4 cyan-border">
             <p class="text-xs cyan-text font-semibold mb-1">Findings:</p>
             <p class="text-sm text-gray-700">${esc(r.findings)}</p>
           </div>`
        : ''}
    </div>`;
}

function buildPatientCardHTML(p) {
  const lastVisitText = p.last_visit
    ? new Date(p.last_visit).toLocaleDateString()
    : (p.next_visit ? 'Yet to visit' : 'N/A');
  return `
    <div class="cyan-light rounded-xl p-5 hover-lift patient-card" data-id="${esc(p.patient_id)}">
      <div class="flex items-center space-x-4 mb-4">
        <div class="w-14 h-14 cyan-bg rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          ${p.profile_photo_url
            ? `<img src="${esc(p.profile_photo_url)}" alt="${esc(p.full_name)}" class="w-full h-full object-cover">`
            : `<i class="fas fa-user-injured text-xl text-white"></i>`}
        </div>
        <div>
          <h3 class="text-base font-bold cyan-text patient-name">${esc(p.full_name)}</h3>
          <p class="text-gray-500 text-xs">ID: ${esc(patientDisplayId(p))}</p>
          <p class="text-xs cyan-text">${esc(p.age || 'N/A')} yrs • ${esc(p.gender || 'N/A')}</p>
        </div>
      </div>
      <div class="space-y-2 mb-3 text-sm">
        <div class="flex justify-between">
          <span class="cyan-text opacity-75">Blood Group:</span>
          <span class="font-medium cyan-text">${esc(p.blood_group || p.blood_type || 'N/A')}</span>
        </div>
        <div class="flex justify-between">
          <span class="cyan-text opacity-75">Last Visit:</span>
          <span class="cyan-text">${esc(lastVisitText)}</span>
        </div>
      </div>
      <div class="flex items-center justify-between pt-3 border-t border-gray-200">
        <span class="status-badge status-active">Active</span>
        <div class="flex space-x-2">
          <button class="w-9 h-9 cyan-bg rounded-full flex items-center justify-center text-white view-patient-btn"
            title="View Profile" data-patient-id="${esc(p.patient_id)}">
            <i class="fas fa-user-md text-sm"></i>
          </button>
          <button class="w-9 h-9 btn-green rounded-full flex items-center justify-center text-white online-consult-btn"
            title="Online Consult" data-patient-id="${esc(p.patient_id)}" data-patient-name="${esc(p.full_name)}">
            <i class="fas fa-video text-sm"></i>
          </button>
          <button class="w-9 h-9 cyan-dark rounded-full flex items-center justify-center text-white message-patient-btn relative"
            title="Message" data-patient-id="${esc(p.patient_id)}" data-patient-name="${esc(p.full_name)}">
            <i class="fas fa-comment text-sm"></i>
            <span class="unread-dot hidden absolute -top-2 -right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] leading-4 text-center rounded-full font-bold">0</span>
          </button>
          <button class="w-9 h-9 btn-white rounded-full flex items-center justify-center cyan-text prescribe-btn"
            title="Prescribe" data-patient-id="${esc(p.patient_id)}" data-patient-name="${esc(p.full_name)}">
            <i class="fas fa-prescription text-sm"></i>
          </button>
        </div>
      </div>
    </div>`;
}

// ============================================
// FUNCTION TO GENERATE DOCTOR DASHBOARD HTML
// ============================================
function generateDoctorHTML(doctor = null, appointments = [], reports = [], patientList = []) {
  const doctorData = normalizeDoctor(doctor || {
    doctor_uuid: 'DR-2024-0567',
    full_name: 'Dr. Sarah Chen',
    designation: 'Senior Cardiologist',
    specialization: 'Cardiology',
    experience: '12 years',
    qualification: 'MD, DM Cardiology',
    email: 'sarah.chen@bondhealth.com',
    contact: '+1 (555) 234-5678',
    address: '456 Medical Center, Cardiology Wing',
    consultation_fee: '$150',
    available_days: ['Mon', 'Wed', 'Fri'],
    available_time: '9:00 AM - 5:00 PM'
  });

  const availDaysStr = Array.isArray(doctorData.available_days)
    ? doctorData.available_days.join(', ')
    : (doctorData.available_days || 'N/A');

  // Safe initials: guard against empty/whitespace name
  const initials = doctorData.name.split(' ').filter(Boolean).map(n => n[0] ?? '').join('').toUpperCase().slice(0, 3) || 'DR';

  const todaysAppointments = appointments || [];
  const labReports         = reports || [];
  const patients           = patientList || [];

  const confirmedCount = todaysAppointments.filter(a => a.status === 'confirmed').length;
  const pendingReports = labReports.filter(r => r.status === 'pending').length;
  const onlineCount    = todaysAppointments.filter(a => a.appointment_type === 'online').length;
  const inPersonCount  = todaysAppointments.filter(a => a.appointment_type === 'in-person').length;

  // Only expose doctorId to client — never expose full patient/report PII in page source
  const clientDoctorId = JSON.stringify(doctor ? (doctor.doctor_id || null) : null);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BondHealth - Doctor Portal</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    *{font-family:'Poppins',sans-serif;box-sizing:border-box}
    body{margin:0;padding:0;min-height:100vh;background:linear-gradient(135deg,#ffffff 0%,#f0f9ff 100%);overflow-x:hidden}
    .cyan-bg{background:linear-gradient(135deg,#00bcd4 0%,#00acc1 100%)}
    .cyan-light{background:#e0f7fa}
    .cyan-dark{background:#00838f}
    .cyan-text{color:#006064}
    .cyan-border{border-color:#00bcd4}
    .white-card{background:white;box-shadow:0 10px 40px rgba(0,188,212,0.1)}
    .background-animation{position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;overflow:hidden}
    .floating-circle{position:absolute;border-radius:50%;background:linear-gradient(135deg,rgba(0,188,212,0.1),rgba(255,255,255,0.1));animation:float 25s infinite linear}
    .floating-circle:nth-child(1){width:300px;height:300px;top:-100px;left:-100px}
    .floating-circle:nth-child(2){width:200px;height:200px;top:50%;right:-50px;animation-delay:-8s}
    .floating-circle:nth-child(3){width:150px;height:150px;bottom:-50px;left:30%;animation-delay:-15s}
    @keyframes float{0%,100%{transform:translate(0,0) rotate(0deg)}25%{transform:translate(40px,40px) rotate(90deg)}50%{transform:translate(0,80px) rotate(180deg)}75%{transform:translate(-40px,40px) rotate(270deg)}}
    .wave-line{position:absolute;bottom:0;left:0;width:100%;height:100px;background:linear-gradient(90deg,rgba(0,188,212,0.2) 0%,rgba(0,172,193,0.3) 25%,rgba(0,131,143,0.2) 50%,rgba(0,96,100,0.3) 75%,rgba(0,188,212,0.2) 100%);opacity:0.3;animation:wave 12s infinite ease-in-out}
    @keyframes wave{0%,100%{transform:translateX(0)}50%{transform:translateX(60px)}}
    .slide-in{animation:slideIn 0.5s ease-out}
    @keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
    .fade-in{animation:fadeIn 0.6s ease-out}
    @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .hover-lift{transition:all 0.3s ease}
    .hover-lift:hover{transform:translateY(-5px);box-shadow:0 20px 40px rgba(0,188,212,0.15)}
    .menu-item{transition:all 0.3s ease;border-left:4px solid transparent}
    .menu-item:hover{border-left-color:#00bcd4;background:rgba(0,188,212,0.05)}
    .menu-item.active{border-left-color:#00bcd4;background:rgba(0,188,212,0.1);box-shadow:0 4px 12px rgba(0,188,212,0.1)}
    .btn-cyan{background:linear-gradient(135deg,#00bcd4,#00acc1);color:white;transition:all 0.3s ease;border:none;cursor:pointer}
    .btn-cyan:hover{transform:translateY(-2px);box-shadow:0 10px 20px rgba(0,188,212,0.3)}
    .btn-white{background:white;color:#006064;border:2px solid #00bcd4;transition:all 0.3s ease;cursor:pointer}
    .btn-white:hover{background:#00bcd4;color:white}
    .btn-red{background:linear-gradient(135deg,#ef4444,#dc2626);color:white;transition:all 0.3s ease;border:none;cursor:pointer}
    .btn-red:hover{background:linear-gradient(135deg,#dc2626,#b91c1c);transform:translateY(-2px);box-shadow:0 10px 20px rgba(239,68,68,0.3)}
    .btn-green{background:linear-gradient(135deg,#10b981,#059669);color:white;transition:all 0.3s ease;border:none;cursor:pointer}
    .btn-green:hover{transform:translateY(-2px);box-shadow:0 10px 20px rgba(16,185,129,0.3)}
    .scrollbar-thin::-webkit-scrollbar{width:6px}
    .scrollbar-thin::-webkit-scrollbar-track{background:#f1f1f1;border-radius:3px}
    .scrollbar-thin::-webkit-scrollbar-thumb{background:#00bcd4;border-radius:3px}
    .modal-backdrop{background:rgba(255,255,255,0.97);backdrop-filter:blur(6px)}
    .shine-effect{position:relative;overflow:hidden}
    .shine-effect::after{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:linear-gradient(to bottom right,rgba(255,255,255,0) 0%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0) 100%);transform:rotate(30deg);animation:shine 3s infinite}
    @keyframes shine{0%{transform:translateX(-100%) translateY(-100%) rotate(30deg)}100%{transform:translateX(100%) translateY(100%) rotate(30deg)}}
    .status-badge{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase}
    .status-confirmed{background:#d1fae5;color:#065f46}
    .status-pending{background:#fef3c7;color:#92400e}
    .status-reviewed{background:#dbeafe;color:#1e40af}
    .status-verified{background:#dbeafe;color:#1e40af}
    .status-active{background:#dcfce7;color:#166534}
    .status-cancelled{background:#fee2e2;color:#991b1b}
    .form-input{width:100%;padding:0.75rem;border:2px solid #e0f2fe;border-radius:0.5rem;transition:all 0.3s ease}
    .form-input:focus{outline:none;border-color:#00bcd4;box-shadow:0 0 0 3px rgba(0,188,212,0.1)}
    .form-select{width:100%;padding:0.75rem;border:2px solid #e0f2fe;border-radius:0.5rem;background:white}
    .logout-btn{background:#ef4444;color:white;padding:0.5rem 1.5rem;border-radius:0.5rem;font-weight:600;display:flex;align-items:center;gap:0.5rem;transition:all 0.3s ease;border:none;cursor:pointer}
    .logout-btn:hover{background:#dc2626;transform:translateY(-2px)}
    .edit-profile-btn{background:white;color:#00bcd4;border:2px solid #00bcd4;padding:0.5rem 1.5rem;border-radius:0.5rem;font-weight:600;display:flex;align-items:center;gap:0.5rem;transition:all 0.3s ease;cursor:pointer}
    .edit-profile-btn:hover{background:#00bcd4;color:white;transform:translateY(-2px)}
    .chat-msg-dr{display:flex;justify-content:flex-end;margin-bottom:0.5rem}
    .chat-msg-dr span{background:linear-gradient(135deg,#00bcd4,#00acc1);color:white;padding:0.5rem 1rem;border-radius:1rem 1rem 0 1rem;max-width:70%;font-size:0.875rem}
    .chat-msg-pt{display:flex;justify-content:flex-start;margin-bottom:0.5rem}
    .chat-msg-pt span{background:#e0f7fa;color:#006064;padding:0.5rem 1rem;border-radius:1rem 1rem 1rem 0;max-width:70%;font-size:0.875rem}
    @media(max-width:768px){.doctor-header{flex-direction:column;text-align:left}.doctor-header-left{width:100%;justify-content:space-between}}
  </style>
</head>
<body class="text-gray-800">
<div class="background-animation">
  <div class="floating-circle"></div><div class="floating-circle"></div><div class="floating-circle"></div>
  <div class="wave-line"></div>
</div>

<div class="container mx-auto px-4 py-6">

  <!-- HEADER -->
  <div class="white-card rounded-2xl p-6 mb-6 fade-in shine-effect">
    <div class="flex doctor-header items-center justify-between">
      <div class="doctor-header-left flex items-center gap-6">
        <button id="profileBtn" class="w-20 h-20 cyan-bg rounded-full flex items-center justify-center text-2xl font-bold text-white hover-lift border-none cursor-pointer flex-shrink-0 overflow-hidden relative" style="padding:0">
          ${doctorData.photo_url
            ? `<img src="${esc(doctorData.photo_url)}" alt="Profile" class="w-full h-full object-cover rounded-full" id="headerPhoto">`
            : `<span id="headerPhoto">${esc(initials)}</span>`}
        </button>
        <div>
          <h1 class="text-3xl font-bold cyan-text" id="headerDoctorName">${esc(doctorData.name)}</h1>
          <p class="text-gray-600" id="headerDoctorMeta">${esc(doctorData.designation)} • ${esc(doctorData.specialization)}</p>
          ${doctorData.hospital_photo_url
            ? `<div class="mt-1 flex items-center gap-2 text-xs text-gray-500">
                 <span class="w-5 h-5 rounded-full overflow-hidden inline-flex border border-cyan-200">
                   <img src="${esc(doctorData.hospital_photo_url)}" alt="Hospital" class="w-full h-full object-cover">
                 </span>
                 <span>${esc(doctorData.hospital_name || 'Hospital')}</span>
               </div>`
            : ''}
          <p class="text-sm cyan-text">ID: ${esc(doctorData.doctor_uuid)}</p>
        </div>
      </div>
      <div class="flex gap-3">
        <button id="editProfileHeaderBtn" class="edit-profile-btn"><i class="fas fa-edit"></i> Edit Profile</button>
        <button id="logoutHeaderBtn" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
      </div>
    </div>
  </div>

  <div class="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent my-6 opacity-30"></div>

  <div class="flex flex-col lg:flex-row gap-6">

    <!-- SIDEBAR -->
    <div class="lg:w-1/4">
      <div class="white-card rounded-2xl p-6 slide-in">
        <div class="space-y-2">
          <button class="menu-item active w-full text-left p-4 rounded-xl flex items-center space-x-4" data-section="appointments">
            <div class="w-12 h-12 cyan-bg rounded-xl flex items-center justify-center"><i class="fas fa-calendar-day text-xl text-white"></i></div>
            <div><p class="font-semibold cyan-text">Today's Appointments</p><p class="text-sm cyan-text opacity-75">View daily schedule</p></div>
            <span class="ml-auto cyan-bg text-white text-xs px-2 py-1 rounded-full" id="sidebarApptCount">${todaysAppointments.length}</span>
          </button>
          <button class="menu-item w-full text-left p-4 rounded-xl flex items-center space-x-4" data-section="lab-reports">
            <div class="w-12 h-12 cyan-light rounded-xl flex items-center justify-center"><i class="fas fa-file-medical-alt text-xl cyan-text"></i></div>
            <div><p class="font-semibold cyan-text">Lab Reports</p><p class="text-sm cyan-text opacity-75">Review test results</p></div>
            <span class="ml-auto cyan-dark text-white text-xs px-2 py-1 rounded-full" id="sidebarReportCount">${labReports.length}</span>
          </button>
          <button class="menu-item w-full text-left p-4 rounded-xl flex items-center space-x-4" data-section="patients">
            <div class="w-12 h-12 cyan-light rounded-xl flex items-center justify-center"><i class="fas fa-user-friends text-xl cyan-text"></i></div>
            <div><p class="font-semibold cyan-text">Patients</p><p class="text-sm cyan-text opacity-75">Manage patient list</p></div>
            <span class="ml-auto cyan-bg text-white text-xs px-2 py-1 rounded-full" id="sidebarPatientCount">${patients.length}</span>
          </button>
          <button class="menu-item w-full text-left p-4 rounded-xl flex items-center space-x-4" data-section="leave">
            <div class="w-12 h-12 cyan-light rounded-xl flex items-center justify-center"><i class="fas fa-calendar-times text-xl cyan-text"></i></div>
            <div><p class="font-semibold cyan-text">Leave</p><p class="text-sm cyan-text opacity-75">Apply &amp; view leave</p></div>
          </button>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <p class="text-sm font-semibold cyan-text mb-3">Quick Actions</p>
          <button class="w-full cyan-light rounded-lg p-3 text-left flex items-center gap-3 hover:opacity-80 transition quick-action" data-action="upload-document">
            <i class="fas fa-file-upload cyan-text text-lg"></i>
            <p class="text-sm cyan-text font-medium">Upload Document</p>
          </button>
          <button class="w-full cyan-light rounded-lg p-3 text-left flex items-center gap-3 hover:opacity-80 transition mt-2 quick-action" data-action="apply-leave">
            <i class="fas fa-calendar-plus cyan-text text-lg"></i>
            <p class="text-sm cyan-text font-medium">Apply for Leave</p>
          </button>
        </div>

        <!-- Stats -->
        <div class="mt-6 p-4 cyan-light rounded-xl">
          <p class="text-sm font-semibold cyan-text mb-3">Today's Stats</p>
          <div class="flex justify-between text-center">
            <div><p class="text-2xl font-bold cyan-text" id="statAppointments">${todaysAppointments.length}</p><p class="text-xs cyan-text opacity-75">Appts</p></div>
            <div><p class="text-2xl font-bold cyan-text" id="statReports">${pendingReports}</p><p class="text-xs cyan-text opacity-75">Pending</p></div>
            <div><p class="text-2xl font-bold cyan-text" id="statPatients">${patients.length}</p><p class="text-xs cyan-text opacity-75">Patients</p></div>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="lg:w-3/4">
      <div class="white-card rounded-2xl p-6 min-h-[600px] fade-in scrollbar-thin">

        <!-- APPOINTMENTS TAB -->
        <div id="appointmentsContent">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold cyan-text">Today's Appointments</h2>
            <div class="flex gap-3">
              <button id="refreshAppointmentsBtn" class="px-4 py-2 btn-cyan rounded-lg text-sm"><i class="fas fa-sync-alt mr-2"></i>Refresh</button>
            </div>
          </div>
          <div class="grid gap-4" id="appointmentsList">
            ${todaysAppointments.length > 0
              ? todaysAppointments.map(buildAptCardHTML).join('')
              : '<div class="text-center py-16 text-gray-400"><i class="fas fa-calendar-times text-5xl mb-4 block"></i><p class="text-lg">No appointments for today</p></div>'}
          </div>
          <div class="mt-6 cyan-light rounded-xl p-5">
            <h3 class="text-base font-semibold cyan-text mb-4">Schedule Summary</h3>
            <div class="grid grid-cols-3 gap-4">
              <div class="white-card p-4 rounded-xl text-center"><p class="text-3xl font-bold cyan-text" id="summaryConfirmed">${confirmedCount}</p><p class="text-xs cyan-text opacity-75 mt-1">Confirmed</p></div>
              <div class="white-card p-4 rounded-xl text-center"><p class="text-3xl font-bold cyan-text" id="summaryOnline">${onlineCount}</p><p class="text-xs cyan-text opacity-75 mt-1">Online</p></div>
              <div class="white-card p-4 rounded-xl text-center"><p class="text-3xl font-bold cyan-text" id="summaryInPerson">${inPersonCount}</p><p class="text-xs cyan-text opacity-75 mt-1">In-person</p></div>
            </div>
          </div>
        </div>

        <!-- LAB REPORTS TAB -->
        <div id="labReportsContent" class="hidden">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold cyan-text">Lab Reports</h2>
            <div class="flex gap-3">
              <button id="refreshReportsBtn" class="px-4 py-2 btn-cyan rounded-lg text-sm"><i class="fas fa-sync-alt mr-2"></i>Refresh</button>
              <button id="uploadReportBtn" class="px-4 py-2 btn-cyan rounded-lg text-sm"><i class="fas fa-file-upload mr-2"></i>Upload Report</button>
            </div>
          </div>
          <div class="grid gap-4" id="reportsList">
            ${labReports.length > 0
              ? labReports.map(buildReportCardHTML).join('')
              : '<div class="text-center py-16 text-gray-400"><i class="fas fa-file-medical text-5xl mb-4 block"></i><p class="text-lg">No lab reports found</p></div>'}
          </div>
        </div>

        <!-- PATIENTS TAB -->
        <div id="patientsContent" class="hidden">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold cyan-text">My Patients</h2>
            <div class="flex gap-3">
              <div class="relative">
                <input type="text" id="patientSearch" placeholder="Search patients…" class="pl-10 pr-4 py-2 cyan-light rounded-lg text-sm cyan-text focus:outline-none focus:ring-2 focus:ring-cyan-400">
                <i class="fas fa-search absolute left-3 top-2.5 text-gray-400"></i>
              </div>
              <button id="addPatientBtn" class="px-4 py-2 btn-cyan rounded-lg text-sm"><i class="fas fa-user-plus mr-2"></i>Add Patient</button>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="patientsList">
            ${patients.length > 0
              ? patients.map(buildPatientCardHTML).join('')
              : '<div class="col-span-3 text-center py-16 text-gray-400"><i class="fas fa-users text-5xl mb-4 block"></i><p class="text-lg">No patients found</p></div>'}
          </div>
        </div>

        <!-- LEAVE TAB -->
        <div id="leaveContent" class="hidden">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold cyan-text">Leave Management</h2>
            <button id="applyLeaveBtn" class="px-4 py-2 btn-cyan rounded-lg text-sm"><i class="fas fa-calendar-plus mr-2"></i>Apply for Leave</button>
          </div>
          <div id="leaveHistoryList" class="grid gap-4">
            <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin text-3xl mb-3 block cyan-text"></i><p>Loading leave records…</p></div>
          </div>
        </div>

      </div>
    </div>
  </div>
</div>

<!-- ══════════════════ MODALS ══════════════════ -->

<!-- Profile -->
<div id="profileModal" class="fixed inset-0 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
  <div class="white-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold cyan-text">Doctor Profile</h2>
      <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl" data-modal="profileModal">&times;</button>
    </div>
    <div class="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
      <div class="w-28 h-28 cyan-bg rounded-full flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">${esc(initials)}</div>
      <div>
        <h3 class="text-2xl font-bold cyan-text">${esc(doctorData.name)}</h3>
        <p class="text-lg cyan-text opacity-80 mt-1">${esc(doctorData.designation)}</p>
        <p class="text-gray-600 mt-1">${esc(doctorData.qualification)}</p>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      ${[
        ['Doctor ID', doctorData.doctor_uuid],
        ['Specialization', doctorData.specialization],
        ['Experience', doctorData.experience],
        ['Consultation Fee', doctorData.consultation_fee],
        ['Available Days', availDaysStr],
        ['Available Time', doctorData.available_time],
        ['Email', doctorData.email],
        ['Contact', doctorData.contact]
      ].map(([k, v]) => `<div class="cyan-light p-4 rounded-xl"><p class="text-xs cyan-text opacity-70">${esc(k)}</p><p class="font-semibold cyan-text mt-1">${esc(v || 'N/A')}</p></div>`).join('')}
    </div>
    <div class="flex justify-end gap-3">
      <button id="editFromProfileBtn" class="px-5 py-2.5 btn-cyan rounded-lg"><i class="fas fa-edit mr-2"></i>Edit Profile</button>
      <button id="logoutFromProfileBtn" class="px-5 py-2.5 btn-red rounded-lg"><i class="fas fa-sign-out-alt mr-2"></i>Logout</button>
    </div>
  </div>
</div>

<!-- Edit Profile -->
<div id="editProfileModal" class="fixed inset-0 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
  <div class="white-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold cyan-text">Edit Profile</h2>
      <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl" data-modal="editProfileModal">&times;</button>
    </div>
    <form id="editProfileForm" class="space-y-4">
      <div class="flex items-center gap-5 p-4 cyan-light rounded-xl">
        <div class="w-20 h-20 cyan-bg rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" id="photoPreviewWrap">
          ${doctorData.photo_url
            ? `<img src="${esc(doctorData.photo_url)}" id="photoPreview" class="w-full h-full object-cover">`
            : `<span id="photoPreview">${esc(initials)}</span>`}
        </div>
        <div>
          <p class="text-sm font-semibold cyan-text mb-1">Profile Photo</p>
          <div class="flex items-center gap-2 flex-wrap">
            <label class="cursor-pointer px-4 py-2 btn-white rounded-lg text-sm inline-flex items-center gap-2">
              <i class="fas fa-camera"></i> Change Photo
              <input type="file" id="editPhotoFile" accept="image/*" class="hidden">
            </label>
            <button type="button" id="deletePhotoBtn" class="px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2 text-red-500 border border-red-200 hover:bg-red-50">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
          <p class="text-xs text-gray-400 mt-1">JPG, PNG or GIF · max 10 MB</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium cyan-text mb-1">Full Name</label><input type="text" id="editName" value="${esc(doctorData.name)}" class="form-input" required></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Designation</label><input type="text" id="editDesignation" value="${esc(doctorData.designation)}" class="form-input"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Specialization</label><input type="text" id="editSpecialization" value="${esc(doctorData.specialization)}" class="form-input"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Experience</label><input type="text" id="editExperience" value="${esc(doctorData.experience)}" class="form-input"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Qualification</label><input type="text" id="editQualification" value="${esc(doctorData.qualification)}" class="form-input"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Email</label><input type="email" id="editEmail" value="${esc(doctorData.email)}" class="form-input" required></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Contact</label><input type="text" id="editContact" value="${esc(doctorData.contact)}" class="form-input"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Consultation Fee</label><input type="text" id="editFee" value="${esc(doctorData.consultation_fee)}" class="form-input"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Available Days</label><input type="text" id="editDays" value="${esc(availDaysStr)}" class="form-input" placeholder="Mon, Wed, Fri"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Available Time</label><input type="text" id="editTime" value="${esc(doctorData.available_time)}" class="form-input" placeholder="9:00 AM - 5:00 PM"></div>
      </div>
      <div><label class="block text-sm font-medium cyan-text mb-1">Address</label><textarea id="editAddress" rows="3" class="form-input">${esc(doctorData.address)}</textarea></div>
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="modal-close px-5 py-2.5 btn-white rounded-lg" data-modal="editProfileModal">Cancel</button>
        <button type="submit" class="px-5 py-2.5 btn-cyan rounded-lg"><i class="fas fa-save mr-2"></i>Save Changes</button>
      </div>
    </form>
  </div>
</div>

<!-- Patient Profile -->
<div id="patientProfileModal" class="fixed inset-0 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
  <div class="white-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold cyan-text">Patient Profile</h2>
      <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl" data-modal="patientProfileModal">&times;</button>
    </div>
    <div id="patientProfileContent"><div class="text-center py-10"><i class="fas fa-spinner fa-spin text-3xl cyan-text"></i></div></div>
  </div>
</div>

<!-- View Report -->
<div id="viewReportModal" class="fixed inset-0 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
  <div class="white-card rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold cyan-text">Report Details</h2>
      <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl" data-modal="viewReportModal">&times;</button>
    </div>
    <div id="reportViewContent"><div class="text-center py-10"><i class="fas fa-spinner fa-spin text-3xl cyan-text"></i></div></div>
  </div>
</div>

<!-- Add Findings -->
<div id="findingsModal" class="fixed inset-0 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
  <div class="white-card rounded-2xl p-8 max-w-xl w-full">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold cyan-text">Add / Update Findings</h2>
      <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl" data-modal="findingsModal">&times;</button>
    </div>
    <form id="findingsForm">
      <input type="hidden" id="findingsReportId">
      <div class="mb-4">
        <label class="block text-sm font-medium cyan-text mb-2">Clinical Findings</label>
        <textarea id="findingsText" rows="6" class="form-input" placeholder="Enter your clinical observations and findings…" required></textarea>
      </div>
      <div class="flex justify-end gap-3">
        <button type="button" class="modal-close px-5 py-2.5 btn-white rounded-lg" data-modal="findingsModal">Cancel</button>
        <button type="submit" class="px-5 py-2.5 btn-cyan rounded-lg"><i class="fas fa-save mr-2"></i>Save Findings</button>
      </div>
    </form>
  </div>
</div>

<!-- Share Report -->
<div id="shareReportModal" class="fixed inset-0 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
  <div class="white-card rounded-2xl p-8 max-w-lg w-full">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold cyan-text">Share Report</h2>
      <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl" data-modal="shareReportModal">&times;</button>
    </div>
    <form id="shareReportForm">
      <input type="hidden" id="shareReportId">
      <p class="text-sm cyan-text font-medium mb-3">Share With</p>
      <div class="space-y-3 mb-5">
        <label class="flex items-start gap-3 p-4 cyan-light rounded-xl cursor-pointer hover:opacity-80 border-2 border-transparent has-[:checked]:border-cyan-400">
          <input type="radio" name="shareScope" value="hospital" checked class="mt-1">
          <div><p class="font-semibold cyan-text">Doctors in My Hospital</p><p class="text-xs text-gray-500 mt-0.5">Share with all doctors in your hospital network</p></div>
        </label>
        <label class="flex items-start gap-3 p-4 cyan-light rounded-xl cursor-pointer hover:opacity-80 border-2 border-transparent has-[:checked]:border-cyan-400">
          <input type="radio" name="shareScope" value="outside" class="mt-1">
          <div><p class="font-semibold cyan-text">Specific Doctor Outside Hospital</p><p class="text-xs text-gray-500 mt-0.5">Send directly to a doctor via their email address</p></div>
        </label>
        <label class="flex items-start gap-3 p-4 cyan-light rounded-xl cursor-pointer hover:opacity-80 border-2 border-transparent has-[:checked]:border-cyan-400">
          <input type="radio" name="shareScope" value="all" class="mt-1">
          <div><p class="font-semibold cyan-text">All Doctors on Platform</p><p class="text-xs text-gray-500 mt-0.5">Make visible to all registered doctors on BondHealth</p></div>
        </label>
      </div>
      <div id="outsideEmailSection" class="hidden mb-4">
        <label class="block text-sm font-medium cyan-text mb-1">Doctor's Email *</label>
        <input type="email" id="shareDoctorEmail" class="form-input" placeholder="doctor@otherhospital.com">
      </div>
      <div id="outsideNameSection" class="hidden mb-4">
        <label class="block text-sm font-medium cyan-text mb-1">Doctor's Name <span class="font-normal opacity-60">(optional)</span></label>
        <input type="text" id="shareDoctorName" class="form-input" placeholder="Dr. Jane Smith">
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button type="button" class="modal-close px-5 py-2.5 btn-white rounded-lg" data-modal="shareReportModal">Cancel</button>
        <button type="submit" class="px-5 py-2.5 btn-cyan rounded-lg"><i class="fas fa-share-alt mr-2"></i>Share Report</button>
      </div>
    </form>
  </div>
</div>

<!-- Chat -->
<div id="chatModal" class="fixed inset-0 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
  <div class="white-card rounded-2xl overflow-hidden max-w-lg w-full flex flex-col" style="height:560px">
    <div class="flex justify-between items-center p-5 border-b border-gray-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 cyan-bg rounded-full flex items-center justify-center text-white font-bold text-lg" id="chatAvatar">P</div>
        <div>
          <p class="font-bold cyan-text" id="chatPatientNameDisplay">Patient</p>
          <p class="text-xs text-green-500 flex items-center gap-1"><span class="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>Online</p>
        </div>
      </div>
      <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl" data-modal="chatModal">&times;</button>
    </div>
    <div id="chatMessages" class="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin bg-gray-50"></div>
    <div class="p-4 border-t border-gray-100 bg-white">
      <form id="chatForm" class="flex gap-2">
        <input type="hidden" id="chatPatientId">
        <input type="text" id="chatInput" class="form-input flex-1" placeholder="Type a message…" autocomplete="off">
        <button type="submit" class="px-4 py-2 btn-cyan rounded-lg"><i class="fas fa-paper-plane"></i></button>
      </form>
    </div>
  </div>
</div>

<!-- Online Consult -->
<div id="onlineConsultModal" class="fixed inset-0 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
  <div class="white-card rounded-2xl p-8 max-w-md w-full text-center">
    <div class="w-20 h-20 btn-green rounded-full flex items-center justify-center mx-auto mb-5">
      <i class="fas fa-video text-3xl text-white"></i>
    </div>
    <h2 class="text-2xl font-bold cyan-text mb-2">Online Consultation</h2>
    <p class="text-gray-600 mb-1">Patient: <span id="onlineConsultPatientName" class="font-semibold cyan-text"></span></p>
    <p class="text-sm text-gray-400 mb-4">A secure video call link will be sent to the patient.</p>
    <div id="scheduleTimeRow" class="hidden mb-4 text-left">
      <label class="block text-sm font-medium cyan-text mb-1">Scheduled Date &amp; Time</label>
      <input type="datetime-local" id="scheduleDateTime" class="form-input w-full">
      <p class="text-xs text-gray-400 mt-1">Patient will receive a notification with the call link.</p>
    </div>
    <div class="flex flex-col gap-3">
      <button id="startVideoCallBtn" class="px-5 py-3 btn-green rounded-xl text-base"><i class="fas fa-video mr-2"></i>Start Video Call Now</button>
      <button id="scheduleVideoCallBtn" class="px-5 py-3 btn-white rounded-xl"><i class="fas fa-calendar-plus mr-2"></i>Schedule for Later</button>
      <button id="confirmScheduleBtn" class="hidden px-5 py-3 btn-green rounded-xl text-base"><i class="fas fa-check mr-2"></i>Confirm Schedule</button>
      <button class="modal-close px-5 py-2.5 text-gray-400 hover:text-gray-600" data-modal="onlineConsultModal">Cancel</button>
    </div>
  </div>
</div>

<!-- Prescription -->
<div id="prescriptionModal" class="fixed inset-0 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
  <div class="white-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold cyan-text">Write Prescription</h2>
      <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl" data-modal="prescriptionModal">&times;</button>
    </div>
    <form id="prescriptionForm">
      <input type="hidden" id="prescriptionPatientId">
      <div class="mb-4"><label class="block text-sm font-medium cyan-text mb-1">Patient</label><input type="text" id="prescriptionPatientName" readonly class="form-input bg-gray-50 cursor-not-allowed"></div>
      <div class="mb-4"><label class="block text-sm font-medium cyan-text mb-1">Diagnosis</label><textarea id="prescriptionDiagnosis" rows="2" class="form-input" placeholder="Enter diagnosis…" required></textarea></div>
      <div class="mb-4">
        <label class="block text-sm font-medium cyan-text mb-2">Medications</label>
        <div id="medicationsList" class="space-y-2">
          <div class="flex gap-2 medication-row">
            <input type="text" placeholder="Medication name" class="form-input flex-1 medication-name">
            <input type="text" placeholder="Dosage" class="form-input w-28 medication-dosage">
            <input type="text" placeholder="Frequency" class="form-input w-28 medication-frequency">
            <button type="button" class="text-red-400 hover:text-red-600 remove-medication px-2"><i class="fas fa-times"></i></button>
          </div>
        </div>
        <button type="button" id="addMedicationBtn" class="mt-2 text-sm cyan-text hover:underline"><i class="fas fa-plus mr-1"></i>Add Medication</button>
      </div>
      <div class="mb-4"><label class="block text-sm font-medium cyan-text mb-1">Additional Notes</label><textarea id="prescriptionNotes" rows="2" class="form-input" placeholder="Extra instructions…"></textarea></div>
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="modal-close px-5 py-2.5 btn-white rounded-lg" data-modal="prescriptionModal">Cancel</button>
        <button type="submit" class="px-5 py-2.5 btn-cyan rounded-lg"><i class="fas fa-prescription mr-2"></i>Save Prescription</button>
      </div>
    </form>
  </div>
</div>

<!-- Upload Document -->
<div id="uploadReportModal" class="fixed inset-0 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
  <div class="white-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold cyan-text">Upload Document / Lab Report</h2>
      <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl" data-modal="uploadReportModal">&times;</button>
    </div>
    <form id="uploadReportForm" class="space-y-4">
      <div><label class="block text-sm font-medium cyan-text mb-2">Select Patient *</label>
        <select id="uploadPatientId" required class="form-select">
          <option value="">Choose a patient…</option>
          ${patients.map(p => `<option value="${esc(p.patient_id)}">${esc(p.full_name)} (${esc(patientDisplayId(p))})</option>`).join('')}
        </select>
      </div>
      <div><label class="block text-sm font-medium cyan-text mb-2">Test / Document Type *</label><input type="text" id="uploadTestType" required class="form-input" placeholder="e.g. Blood Test, X-Ray, ECG, MRI"></div>
      <div><label class="block text-sm font-medium cyan-text mb-2">Test Date *</label><input type="date" id="uploadTestDate" required class="form-input"></div>
      <div><label class="block text-sm font-medium cyan-text mb-2">Findings / Notes</label><textarea id="uploadFindings" rows="3" class="form-input" placeholder="Enter findings or notes…"></textarea></div>
      <div><label class="block text-sm font-medium cyan-text mb-2">Attach File <span class="font-normal opacity-60">(PDF, JPG, PNG)</span></label><input type="file" id="uploadFile" accept=".pdf,.jpg,.jpeg,.png" class="form-input py-2 cursor-pointer"></div>
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="modal-close px-5 py-2.5 btn-white rounded-lg" data-modal="uploadReportModal">Cancel</button>
        <button type="submit" class="px-5 py-2.5 btn-cyan rounded-lg"><i class="fas fa-upload mr-2"></i>Upload</button>
      </div>
    </form>
  </div>
</div>

<!-- Add Patient -->
<div id="addPatientModal" class="fixed inset-0 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
  <div class="white-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold cyan-text">Add New Patient</h2>
      <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl" data-modal="addPatientModal">&times;</button>
    </div>
    <form id="addPatientForm" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium cyan-text mb-1">Full Name *</label><input type="text" id="newPatientName" required class="form-input"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Email *</label><input type="email" id="newPatientEmail" required class="form-input"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Phone *</label><input type="tel" id="newPatientPhone" required class="form-input"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Date of Birth *</label><input type="date" id="newPatientDob" required class="form-input"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Password *</label><input type="password" id="newPatientPassword" minlength="8" required class="form-input" placeholder="Min 8 characters"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Confirm Password *</label><input type="password" id="newPatientPasswordConfirm" minlength="8" required class="form-input" placeholder="Re-enter password"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Gender</label><select id="newPatientGender" class="form-select"><option>Male</option><option>Female</option><option>Other</option></select></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">Blood Group</label><select id="newPatientBloodGroup" class="form-select"><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option></select></div>
      </div>
      <div><label class="block text-sm font-medium cyan-text mb-1">Address</label><textarea id="newPatientAddress" rows="2" class="form-input"></textarea></div>
      <div class="border-t border-gray-200 pt-4">
        <h3 class="text-base font-semibold cyan-text mb-3">Emergency Contact</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block text-sm font-medium cyan-text mb-1">Name</label><input type="text" id="newPatientEmergencyName" class="form-input"></div>
          <div><label class="block text-sm font-medium cyan-text mb-1">Phone</label><input type="tel" id="newPatientEmergencyPhone" class="form-input"></div>
        </div>
      </div>
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="modal-close px-5 py-2.5 btn-white rounded-lg" data-modal="addPatientModal">Cancel</button>
        <button type="submit" class="px-5 py-2.5 btn-cyan rounded-lg"><i class="fas fa-user-plus mr-2"></i>Add Patient</button>
      </div>
    </form>
  </div>
</div>

<!-- Apply Leave -->
<div id="applyLeaveModal" class="fixed inset-0 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
  <div class="white-card rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold cyan-text">Apply for Leave</h2>
      <button class="modal-close text-gray-400 hover:text-gray-600 text-2xl" data-modal="applyLeaveModal">&times;</button>
    </div>
    <form id="applyLeaveForm" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium cyan-text mb-1">From Date *</label><input type="date" id="leaveFromDate" required class="form-input"></div>
        <div><label class="block text-sm font-medium cyan-text mb-1">To Date *</label><input type="date" id="leaveToDate" required class="form-input"></div>
      </div>
      <div>
        <label class="block text-sm font-medium cyan-text mb-1">Leave Type</label>
        <select id="leaveType" class="form-select">
          <option value="sick">Sick Leave</option>
          <option value="casual">Casual Leave</option>
          <option value="emergency">Emergency</option>
          <option value="personal">Personal</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div><label class="block text-sm font-medium cyan-text mb-1">Reason *</label><textarea id="leaveReason" rows="3" required class="form-input" placeholder="Please describe the reason for your leave…"></textarea></div>
      <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
        <i class="fas fa-info-circle mr-1"></i> Leave requests are subject to admin approval. Your future appointments will not be auto-cancelled until approved.
      </div>
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="modal-close px-5 py-2.5 btn-white rounded-lg" data-modal="applyLeaveModal">Cancel</button>
        <button type="submit" class="px-5 py-2.5 btn-cyan rounded-lg"><i class="fas fa-paper-plane mr-2"></i>Submit Request</button>
      </div>
    </form>
  </div>
</div>

<!-- Delete Report Confirm -->
<div id="deleteReportModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden p-4">
  <div class="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><i class="fas fa-trash text-2xl text-red-500"></i></div>
    <h3 class="text-xl font-bold text-gray-800 mb-2">Delete Report?</h3>
    <p class="text-gray-500 text-sm mb-1">You are about to delete the report for:</p>
    <p class="font-semibold cyan-text mb-1" id="deleteReportPatient"></p>
    <p class="text-sm text-gray-400 mb-5" id="deleteReportType"></p>
    <p class="text-xs text-red-500 mb-5">This will archive the report and remove it from your view.</p>
    <div class="flex gap-3">
      <button id="cancelDeleteReport" class="flex-1 px-4 py-2 btn-white rounded-lg">Cancel</button>
      <button id="confirmDeleteReport" class="flex-1 px-4 py-2 btn-red rounded-lg"><i class="fas fa-trash mr-1"></i>Delete</button>
    </div>
  </div>
</div>

<!-- Logout Confirm -->
<div id="logoutConfirmModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden p-4">
  <div class="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><i class="fas fa-sign-out-alt text-2xl text-red-500"></i></div>
    <h3 class="text-xl font-bold text-gray-800 mb-2">Confirm Logout</h3>
    <p class="text-gray-500 text-sm mb-5">Are you sure you want to logout?</p>
    <div class="flex gap-3">
      <button id="cancelLogout" class="flex-1 px-4 py-2 btn-white rounded-lg">Cancel</button>
      <button id="confirmLogout" class="flex-1 px-4 py-2 btn-red rounded-lg">Logout</button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="fixed bottom-5 right-5 white-card rounded-xl p-4 max-w-sm hidden z-[60] fade-in">
  <div class="flex items-start gap-3">
    <i id="toastIcon" class="fas fa-info-circle cyan-text mt-0.5 text-lg flex-shrink-0"></i>
    <div class="flex-1 min-w-0">
      <p id="toastTitle" class="font-semibold cyan-text text-sm"></p>
      <p id="toastMessage" class="text-xs text-gray-500 mt-0.5 break-words"></p>
    </div>
    <button id="closeToast" class="text-gray-300 hover:text-gray-500 flex-shrink-0">&times;</button>
  </div>
</div>

<!-- ══════════════════ SCRIPTS ══════════════════ -->
<script>
// Only expose doctorId — never put full patient/report arrays into page source
const SERVER = { doctorId: ${clientDoctorId} };

// Reports page size constant
const REPORTS_PAGE_SIZE = 50;

document.addEventListener('DOMContentLoaded', () => {

  // ─── HTML escape (client-side mirror of server esc()) ──
  function escHTML(s) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(s ?? '')));
    return d.innerHTML;
  }

  // ─── Toast ──────────────────────────────────────
  const toastEl = document.getElementById('toast');
  let toastTimer;
  window.showToast = (title, msg, type = 'info') => {
    document.getElementById('toastTitle').textContent   = title;
    document.getElementById('toastMessage').textContent = msg;
    const icon = document.getElementById('toastIcon');
    const map = { success:'fa-check-circle text-green-500', error:'fa-exclamation-circle text-red-500', warning:'fa-exclamation-triangle text-yellow-500', info:'fa-info-circle cyan-text' };
    icon.className = 'fas ' + (map[type] || map.info) + ' mt-0.5 text-lg flex-shrink-0';
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 4500);
  };
  document.getElementById('closeToast').onclick = () => toastEl.classList.add('hidden');

  // ─── Modal helpers ───────────────────────────────
  const openModal  = id => document.getElementById(id)?.classList.remove('hidden');
  const closeModal = id => document.getElementById(id)?.classList.add('hidden');

  document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.modal)));

  // Close on backdrop click
  ['profileModal','editProfileModal','patientProfileModal','viewReportModal','findingsModal',
   'shareReportModal','chatModal','onlineConsultModal','prescriptionModal','uploadReportModal',
   'addPatientModal','applyLeaveModal','logoutConfirmModal','deleteReportModal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      if (e.target === document.getElementById(id)) closeModal(id);
    });
  });

  // ─── Menu navigation ────────────────────────────
  const sections = {
    appointments: 'appointmentsContent',
    'lab-reports': 'labReportsContent',
    patients: 'patientsContent',
    leave: 'leaveContent'
  };
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function () {
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      Object.values(sections).forEach(id => document.getElementById(id)?.classList.add('hidden'));
      const target = sections[this.dataset.section];
      if (target) {
        document.getElementById(target).classList.remove('hidden');
        if (this.dataset.section === 'leave') loadLeaveHistory();
      }
    });
  });

  // ─── Shared card builders (client-side) ──────────
  // These mirror the server-side builders, using escHTML for safety
  function buildAptCardHTML(apt) {
    const id   = escHTML(apt.appointment_id);
    const pn   = escHTML(apt.patient_name);
    const uuid = escHTML(apt.patient_uuid || (apt.patient_id ? ('PT-' + String(apt.patient_id).replace(/-/g, '').toUpperCase().slice(0, 8)) : 'N/A'));
    const pid  = escHTML(apt.patient_id);
    const reason = escHTML(apt.reason || 'General Consultation');
    const status = escHTML(apt.status || 'pending');
    const time   = escHTML(apt.appointment_time ? String(apt.appointment_time).substring(0,5) : '--:--');
    const isOnline = apt.appointment_type === 'online';
    return \`
      <div class="cyan-light rounded-xl p-5 hover-lift appointment-card" data-id="\${id}">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-14 h-14 cyan-bg rounded-full flex items-center justify-center flex-shrink-0"><i class="fas fa-user-injured text-xl text-white"></i></div>
            <div>
              <h3 class="text-lg font-bold cyan-text">\${pn}</h3>
              <p class="text-gray-500 text-sm">ID: \${uuid}</p>
              <p class="text-gray-700 text-sm mt-1"><i class="fas fa-stethoscope mr-1 cyan-text"></i>\${reason}</p>
            </div>
          </div>
          <div class="flex flex-col items-start md:items-end gap-2">
            <div class="flex items-center gap-3">
              <span class="status-badge status-\${status}">\${status}</span>
              <span class="text-lg font-bold cyan-text">\${time}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="px-3 py-1.5 btn-cyan rounded-lg text-sm start-consult-btn" data-id="\${id}" data-patient="\${pn}" data-patient-id="\${pid}"><i class="fas fa-play-circle mr-1"></i>Start Consult</button>
              \${isOnline ? '<button class="px-3 py-1.5 btn-green rounded-lg text-sm video-btn" data-id="'+id+'"><i class="fas fa-video mr-1"></i>Video Call</button>' : ''}
              <button class="px-3 py-1.5 btn-white rounded-lg text-sm reschedule-btn" data-id="\${id}">Reschedule</button>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <span class="text-xs cyan-text"><i class="fas fa-\${isOnline?'wifi':'hospital'} mr-1"></i>\${isOnline?'Online Consultation':'In-person Visit'}</span>
          <div class="flex gap-2">
            <button class="text-xs cyan-bg text-white px-3 py-1 rounded view-patient-history-btn" data-patient-id="\${pid}" data-patient-name="\${pn}"><i class="fas fa-file-medical mr-1"></i>History</button>
            <button class="text-xs btn-white px-3 py-1 rounded message-patient-btn" data-patient-id="\${pid}" data-patient-name="\${pn}"><i class="fas fa-comment-medical mr-1"></i>Message</button>
            <button class="text-xs btn-cyan px-3 py-1 rounded prescribe-btn" data-patient-id="\${pid}" data-patient-name="\${pn}"><i class="fas fa-prescription mr-1"></i>Prescribe</button>
          </div>
        </div>
      </div>\`;
  }

  function buildReportCardHTML(r) {
    const id       = escHTML(r.report_id);
    const pn       = escHTML(r.patient_name);
    const uuid     = escHTML(r.patient_uuid || (r.patient_id ? ('PT-' + String(r.patient_id).replace(/-/g, '').toUpperCase().slice(0, 8)) : 'N/A'));
    const testType = escHTML(r.test_type);
    const status   = escHTML(r.status);
    const findings = escHTML(r.findings || '');
    const isECG    = r.test_type && r.test_type.toLowerCase().includes('ecg');
    return \`
      <div class="cyan-light rounded-xl p-5 hover-lift report-card" data-id="\${id}">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-14 h-14 \${((r.status||'').toLowerCase()==='verified'||(r.status||'').toLowerCase()==='reviewed')?'cyan-bg':'cyan-dark'} rounded-full flex items-center justify-center flex-shrink-0">
              <i class="fas \${isECG?'fa-heartbeat':'fa-vial'} text-xl text-white"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold cyan-text">\${pn}</h3>
              <p class="text-gray-500 text-sm">ID: \${uuid}</p>
              <p class="text-gray-700 text-sm mt-1"><i class="fas fa-flask mr-1 cyan-text"></i>\${testType}</p>
            </div>
          </div>
          <div class="flex flex-col items-start md:items-end gap-2">
            <div class="flex items-center gap-3">
              <span class="status-badge status-\${status}">\${status}</span>
              <span class="text-sm cyan-text">\${new Date(r.test_date).toLocaleDateString()}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="px-3 py-1.5 btn-cyan rounded-lg text-sm view-report-btn" data-id="\${id}"><i class="fas fa-eye mr-1"></i>View</button>
              <button class="px-3 py-1.5 btn-white rounded-lg text-sm write-findings-btn" data-id="\${id}" data-findings="\${findings}">\${((r.status||'').toLowerCase()==='verified'||(r.status||'').toLowerCase()==='reviewed')?'Update':'Add Findings'}</button>
              <button class="px-3 py-1.5 btn-white rounded-lg text-sm download-report-btn" data-id="\${id}" data-patient="\${pn}" data-type="\${testType}" data-date="\${escHTML(r.test_date)}" data-findings="\${findings}"><i class="fas fa-download mr-1"></i>PDF</button>
              <button class="px-3 py-1.5 btn-white rounded-lg text-sm share-report-btn" data-id="\${id}"><i class="fas fa-share-alt mr-1"></i>Share</button>
              <button class="px-3 py-1.5 btn-red rounded-lg text-sm delete-report-btn" data-id="\${id}" data-patient="\${pn}" data-type="\${testType}"><i class="fas fa-trash mr-1"></i>Delete</button>
            </div>
          </div>
        </div>
        \${r.findings ? '<div class="mt-3 p-3 white-card rounded-lg border-l-4 cyan-border"><p class="text-xs cyan-text font-semibold mb-1">Findings:</p><p class="text-sm text-gray-700">'+findings+'</p></div>' : ''}
      </div>\`;
  }

  // ─── Refresh appointments ─────────────────────────
  async function refreshAppointments() {
    try {
      const res  = await fetch('/api/doctor/appointments/today');
      if (!res.ok) throw new Error('Server error ' + res.status);
      const payload = await res.json();
      const data = Array.isArray(payload) ? payload : (payload.appointments || []);
      document.getElementById('sidebarApptCount').textContent = data.length;
      document.getElementById('statAppointments').textContent = data.length;
      document.getElementById('summaryConfirmed').textContent = data.filter(a => a.status === 'confirmed').length;
      document.getElementById('summaryOnline').textContent    = data.filter(a => a.appointment_type === 'online').length;
      document.getElementById('summaryInPerson').textContent  = data.filter(a => a.appointment_type === 'in-person').length;
      renderAppointments(data);
      showToast('Refreshed', 'Appointments updated from database', 'success');
    } catch(e) {
      console.error('refreshAppointments error:', e);
      showToast('Error', e.message, 'error');
    }
  }
  document.getElementById('refreshAppointmentsBtn')?.addEventListener('click', refreshAppointments);

  async function checkDueOnlineReminders() {
    try {
      const res = await fetch('/api/doctor/reminders/due');
      if (!res.ok) return;
      const reminders = await res.json();
      if (!Array.isArray(reminders) || reminders.length === 0) return;
      reminders.forEach(rem => {
        const patientName = rem.patient_name || 'Patient';
        const apptTime = rem.appointment_time ? String(rem.appointment_time).substring(0,5) : '--:--';
        showToast('Online Appointment Reminder', patientName + ' has an online appointment now (' + apptTime + ')', 'warning');
      });
    } catch (e) {
      console.error('checkDueOnlineReminders error:', e);
    }
  }

  function renderAppointments(list) {
    const el = document.getElementById('appointmentsList');
    if (!list.length) {
      el.innerHTML = '<div class="text-center py-16 text-gray-400"><i class="fas fa-calendar-times text-5xl mb-4 block"></i><p>No appointments today</p></div>';
      return;
    }
    el.innerHTML = list.map(buildAptCardHTML).join('');
    attachApptListeners();
  }

  function attachApptListeners() {
    document.querySelectorAll('.start-consult-btn').forEach(b => b.addEventListener('click', function(){
      showToast('Consultation', 'Starting with ' + this.dataset.patient, 'success');
    }));
    document.querySelectorAll('.video-btn').forEach(b => b.addEventListener('click', function(){
      showToast('Video Call', 'Initiating video consultation…', 'info');
    }));
    document.querySelectorAll('.reschedule-btn').forEach(b => b.addEventListener('click', function(){
      showToast('Reschedule', 'Appt #' + this.dataset.id + ' — reschedule UI coming soon', 'info');
    }));
    document.querySelectorAll('.view-patient-history-btn').forEach(b => b.addEventListener('click', function(){
      window.openPatientProfile(this.dataset.patientId);
    }));
    document.querySelectorAll('.message-patient-btn').forEach(b => b.addEventListener('click', function(){
      window.openChat(this.dataset.patientId, this.dataset.patientName);
    }));
    document.querySelectorAll('.prescribe-btn').forEach(b => b.addEventListener('click', function(){
      window.openPrescription(this.dataset.patientId, this.dataset.patientName);
    }));
  }
  attachApptListeners();

  // ─── Refresh reports ──────────────────────────────
  async function refreshReports() {
    try {
      const res  = await fetch('/api/doctor/reports');
      if (!res.ok) throw new Error('Server error ' + res.status);
      const data = await res.json();
      document.getElementById('sidebarReportCount').textContent = data.length;
      document.getElementById('statReports').textContent = data.filter(r => r.status === 'pending').length;
      renderReports(data);
      showToast('Refreshed', 'Lab reports updated', 'success');
    } catch(e) {
      console.error('refreshReports error:', e);
      showToast('Error', e.message, 'error');
    }
  }
  document.getElementById('refreshReportsBtn')?.addEventListener('click', refreshReports);

  function renderReports(list) {
    const el = document.getElementById('reportsList');
    if (!list.length) {
      el.innerHTML = '<div class="text-center py-16 text-gray-400"><i class="fas fa-file-medical text-5xl mb-4 block"></i><p>No lab reports found</p></div>';
      return;
    }
    el.innerHTML = list.map(buildReportCardHTML).join('');
    attachReportListeners();
    attachDeleteReportListeners();
  }

  function attachReportListeners() {
    // View Report
    document.querySelectorAll('.view-report-btn').forEach(b => {
      b.addEventListener('click', async function () {
        openModal('viewReportModal');
        document.getElementById('reportViewContent').innerHTML = '<div class="text-center py-10"><i class="fas fa-spinner fa-spin text-3xl cyan-text"></i></div>';
        try {
          const res = await fetch(\`/api/doctor/report/\${this.dataset.id}\`);
          if (!res.ok) throw new Error('Report not found');
          const r = await res.json();
          const rId   = escHTML(r.report_id);
          const rPn   = escHTML(r.patient_name);
          const rUuid = escHTML(r.patient_uuid || (r.patient_id ? ('PT-' + String(r.patient_id).replace(/-/g, '').toUpperCase().slice(0, 8)) : 'N/A'));
          const rType = escHTML(r.test_type);
          const rStat = escHTML(r.status);
          const rFind = escHTML(r.findings || '');
          const rDate = escHTML(r.test_date);
          const rCreated = r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A';
          const rFileUrl = r.file_view_url ? escHTML(r.file_view_url) : '';
          document.getElementById('reportViewContent').innerHTML = \`
            <div class="space-y-4">
              <div class="flex items-center gap-4 p-4 cyan-light rounded-xl">
                <div class="w-16 h-16 \${((r.status||'').toLowerCase()==='verified'||(r.status||'').toLowerCase()==='reviewed')?'cyan-bg':'cyan-dark'} rounded-full flex items-center justify-center flex-shrink-0"><i class="fas fa-vial text-2xl text-white"></i></div>
                <div><h3 class="text-xl font-bold cyan-text">\${rPn}</h3><p class="text-gray-500 text-sm">ID: \${rUuid}</p></div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="cyan-light p-3 rounded-xl"><p class="text-xs cyan-text opacity-70">Test Type</p><p class="font-semibold cyan-text mt-1">\${rType}</p></div>
                <div class="cyan-light p-3 rounded-xl"><p class="text-xs cyan-text opacity-70">Date</p><p class="font-semibold cyan-text mt-1">\${new Date(r.test_date).toLocaleDateString()}</p></div>
                <div class="cyan-light p-3 rounded-xl"><p class="text-xs cyan-text opacity-70">Status</p><p class="font-semibold cyan-text mt-1"><span class="status-badge status-\${rStat}">\${rStat}</span></p></div>
                <div class="cyan-light p-3 rounded-xl"><p class="text-xs cyan-text opacity-70">Uploaded</p><p class="font-semibold cyan-text mt-1">\${rCreated}</p></div>
              </div>
              \${r.findings ? '<div class="p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400"><p class="text-sm font-semibold text-blue-700 mb-1">Clinical Findings</p><p class="text-gray-700">'+rFind+'</p></div>' : '<p class="text-gray-400 italic text-sm">No findings added yet.</p>'}
              \${rFileUrl ? '<a href="'+rFileUrl+'" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 p-3 cyan-light rounded-xl cyan-text hover:opacity-80"><i class="fas fa-file-download"></i><span>View Attached File</span></a>' : ''}
              <div class="flex gap-3 pt-2 flex-wrap">
                <button class="px-4 py-2 btn-white rounded-lg text-sm" id="viewFindingsBtn"><i class="fas fa-edit mr-1"></i>\${((r.status||'').toLowerCase()==='verified'||(r.status||'').toLowerCase()==='reviewed')?'Update Findings':'Add Findings'}</button>
                <button class="px-4 py-2 btn-white rounded-lg text-sm" id="viewDownloadBtn"><i class="fas fa-download mr-1"></i>Download PDF</button>
                <button class="px-4 py-2 btn-cyan rounded-lg text-sm" id="viewShareBtn"><i class="fas fa-share-alt mr-1"></i>Share</button>
              </div>
            </div>\`;
          // Attach inline modal buttons safely (no inline event handlers)
          document.getElementById('viewFindingsBtn')?.addEventListener('click', () => {
            document.getElementById('findingsReportId').value = rId;
            document.getElementById('findingsText').value     = r.findings || '';
            closeModal('viewReportModal');
            openModal('findingsModal');
          });
          document.getElementById('viewDownloadBtn')?.addEventListener('click', () => {
            triggerDownload(rId, r.patient_name, r.test_type, r.test_date, r.findings || '');
          });
          document.getElementById('viewShareBtn')?.addEventListener('click', () => {
            openShareModal(rId);
            closeModal('viewReportModal');
          });
        } catch(err) {
          console.error('view report error:', err);
          document.getElementById('reportViewContent').innerHTML = '<p class="text-red-500 text-center py-8">' + escHTML(err.message) + '</p>';
        }
      });
    });

    // Add/Update Findings
    document.querySelectorAll('.write-findings-btn').forEach(b => {
      b.addEventListener('click', function () {
        document.getElementById('findingsReportId').value = this.dataset.id;
        document.getElementById('findingsText').value     = this.dataset.findings || '';
        openModal('findingsModal');
      });
    });

    // Download PDF
    document.querySelectorAll('.download-report-btn').forEach(b => {
      b.addEventListener('click', function () {
        triggerDownload(this.dataset.id, this.dataset.patient, this.dataset.type, this.dataset.date, this.dataset.findings || '');
      });
    });

    // Share
    document.querySelectorAll('.share-report-btn').forEach(b => {
      b.addEventListener('click', function () { openShareModal(this.dataset.id); });
    });
  }
  attachReportListeners();

  // ─── Download helper ──────────────────────────────
  async function triggerDownload(id, patient, type, date, findings) {
    showToast('Generating', 'Preparing PDF…', 'info');
    try {
      const res = await fetch(\`/api/doctor/report/\${id}/download\`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          printFallback(id, patient, type, date, findings);
          return;
        }
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const cd = res.headers.get('content-disposition') || '';
        const m = cd.match(/filename="?([^"]+)"?/i);
        a.href = url; a.download = (m && m[1]) ? m[1] : ('report_' + id + '.pdf');
        document.body.appendChild(a); a.click();
        URL.revokeObjectURL(url); a.remove();
        showToast('Downloaded', 'PDF saved', 'success');
      } else {
        printFallback(id, patient, type, date, findings);
      }
    } catch {
      printFallback(id, patient, type, date, findings);
    }
  }

  // ─── Share modal helper ───────────────────────────
  function openShareModal(reportId) {
    document.getElementById('shareReportId').value         = reportId;
    document.getElementById('shareDoctorEmail').value      = '';
    document.getElementById('shareDoctorName').value       = '';
    document.getElementById('outsideEmailSection').classList.add('hidden');
    document.getElementById('outsideNameSection').classList.add('hidden');
    document.querySelector('input[name="shareScope"][value="hospital"]').checked = true;
    openModal('shareReportModal');
  }

  // Findings form
  document.getElementById('findingsForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id       = document.getElementById('findingsReportId').value;
    const findings = document.getElementById('findingsText').value.trim();
    if (!findings) { showToast('Error', 'Please enter findings', 'error'); return; }
    try {
      const res = await fetch(\`/api/doctor/report/\${id}/findings\`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ findings })
      });
      if (res.ok) { showToast('Saved', 'Findings saved successfully!', 'success'); closeModal('findingsModal'); await refreshReports(); }
      else { const err = await res.json().catch(()=>({})); showToast('Error', err.message||'Failed to save', 'error'); }
    } catch(err) {
      console.error('findings submit error:', err);
      showToast('Error', err.message, 'error');
    }
  });

  // Share form
  document.querySelectorAll('input[name="shareScope"]').forEach(r => {
    r.addEventListener('change', function () {
      const isOut = this.value === 'outside';
      document.getElementById('outsideEmailSection').classList.toggle('hidden', !isOut);
      document.getElementById('outsideNameSection').classList.toggle('hidden', !isOut);
    });
  });
  document.getElementById('shareReportForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id    = document.getElementById('shareReportId').value;
    const scope = document.querySelector('input[name="shareScope"]:checked')?.value;
    const email = document.getElementById('shareDoctorEmail').value.trim();
    const name  = document.getElementById('shareDoctorName').value.trim();
    if (scope === 'outside' && !email) { showToast('Error', "Please enter the doctor's email", 'error'); return; }
    try {
      const res = await fetch(\`/api/doctor/report/\${id}/share\`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ scope, email: email || null, doctor_name: name || null })
      });
      if (res.ok) {
        const msg = scope==='hospital'?'Shared with all hospital doctors':scope==='all'?'Shared with all platform doctors':'Shared with '+email;
        showToast('Shared!', msg, 'success'); closeModal('shareReportModal');
      } else { showToast('Error', 'Failed to share report', 'error'); }
    } catch(err) {
      console.error('share report error:', err);
      showToast('Error', err.message, 'error');
    }
  });

  // PDF fallback: use hidden iframe instead of window.open (less likely to be blocked)
  function printFallback(id, patient, type, date, findings) {
    const html = \`<!DOCTYPE html><html><head><title>Lab Report</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#006064}.row{display:flex;gap:16px;margin-bottom:10px}.label{font-weight:bold;min-width:140px;color:#006064}.box{background:#f0f9ff;padding:16px;border-radius:8px;border-left:4px solid #00bcd4;margin-top:16px}</style>
      </head><body><h1>BondHealth Lab Report</h1><hr>
      <div class="row"><span class="label">Patient:</span><span>\${escHTML(patient)}</span></div>
      <div class="row"><span class="label">Test Type:</span><span>\${escHTML(type)}</span></div>
      <div class="row"><span class="label">Test Date:</span><span>\${escHTML(new Date(date).toLocaleDateString())}</span></div>
      <div class="row"><span class="label">Report ID:</span><span>\${escHTML(id)}</span></div>
      \${findings ? '<div class="box"><strong>Findings:</strong><p>'+escHTML(findings)+'</p></div>' : ''}
      </body></html>\`;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0';
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
    showToast('PDF', 'Print dialog opened', 'success');
  }

  // ─── Upload Document ──────────────────────────────
  const openUpload = () => {
    document.getElementById('uploadTestDate').valueAsDate = new Date();
    openModal('uploadReportModal');
  };
  document.getElementById('uploadReportBtn')?.addEventListener('click', openUpload);
  document.querySelector('.quick-action[data-action="upload-document"]')?.addEventListener('click', openUpload);

  document.getElementById('uploadReportForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const patientId = document.getElementById('uploadPatientId').value;
    if (!patientId) { showToast('Error', 'Please select a patient', 'error'); return; }
    const fd = new FormData();
    fd.append('patient_id', patientId);
    fd.append('test_type',  document.getElementById('uploadTestType').value.trim());
    fd.append('test_date',  document.getElementById('uploadTestDate').value);
    fd.append('findings',   document.getElementById('uploadFindings').value.trim());
    const file = document.getElementById('uploadFile').files[0];
    if (file) fd.append('file', file);
    try {
      const res = await fetch('/api/doctor/report/upload', { method:'POST', body: fd });
      if (res.ok) {
        showToast('Uploaded', 'Document uploaded successfully!', 'success');
        closeModal('uploadReportModal'); e.target.reset();
        await refreshReports();
      } else { const err = await res.json().catch(()=>({})); showToast('Error', err.message||'Upload failed', 'error'); }
    } catch(err) {
      console.error('upload error:', err);
      showToast('Error', err.message, 'error');
    }
  });

  // ─── Profile ──────────────────────────────────────
  document.getElementById('profileBtn')?.addEventListener('click', () => openModal('profileModal'));
  document.getElementById('editProfileHeaderBtn')?.addEventListener('click', () => openModal('editProfileModal'));
  document.getElementById('editFromProfileBtn')?.addEventListener('click', () => { closeModal('profileModal'); openModal('editProfileModal'); });
  document.getElementById('logoutFromProfileBtn')?.addEventListener('click', () => { closeModal('profileModal'); openModal('logoutConfirmModal'); });

  document.getElementById('editProfileForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('editName').value.trim();
    const emailInput = document.getElementById('editEmail');
    let email = (emailInput?.value || '').trim();
    if (email.toLowerCase().startsWith('mailto:')) email = email.slice(7).trim();
    email = email.replace(/\s+/g, '');
    if (!name) { showToast('Error', 'Full name is required', 'error'); return; }
    if (emailInput) emailInput.value = email;
    if (!emailInput || !emailInput.checkValidity()) {
      showToast('Error', 'Valid email is required', 'error');
      emailInput?.focus();
      return;
    }

    const photoFile = document.getElementById('editPhotoFile')?.files[0];
    const body = {
      full_name:        name,
      designation:      document.getElementById('editDesignation').value.trim(),
      specialization:   document.getElementById('editSpecialization').value.trim(),
      experience:       document.getElementById('editExperience').value.trim(),
      qualification:    document.getElementById('editQualification').value.trim(),
      email,
      contact:          document.getElementById('editContact').value.trim(),
      consultation_fee: document.getElementById('editFee').value.trim(),
      available_days:   document.getElementById('editDays').value.trim(),
      available_time:   document.getElementById('editTime').value.trim(),
      address:          document.getElementById('editAddress').value.trim()
    };
    try {
      const res = await fetch('/api/doctor/profile/update', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
      });
      if (!res.ok) { const err = await res.json().catch(()=>({})); showToast('Error', err.message||'Update failed', 'error'); return; }

      if (photoFile) {
        const fd = new FormData(); fd.append('photo', photoFile);
        const photoRes = await fetch('/api/doctor/profile/photo', { method: 'POST', body: fd });
        if (photoRes.ok) {
          const { photo_url } = await photoRes.json();
          if (photo_url) {
            const profileBtn = document.getElementById('profileBtn');
            profileBtn.innerHTML = \`<img src="\${escHTML(photo_url)}" alt="Profile" class="w-full h-full object-cover rounded-full" id="headerPhoto">\`;
          }
        }
      }

      document.getElementById('headerDoctorName').textContent = body.full_name;
      document.getElementById('headerDoctorMeta').textContent = body.designation + ' • ' + body.specialization;
      showToast('Saved', 'Profile updated!', 'success');
      closeModal('editProfileModal');
    } catch(err) {
      console.error('profile update error:', err);
      showToast('Error', err.message, 'error');
    }
  });

  // ─── Logout ───────────────────────────────────────
  document.getElementById('logoutHeaderBtn')?.addEventListener('click', () => openModal('logoutConfirmModal'));
  document.getElementById('cancelLogout')?.addEventListener('click', () => closeModal('logoutConfirmModal'));
  document.getElementById('confirmLogout')?.addEventListener('click', async () => {
    try { await fetch('/api/logout', { method:'POST' }); } catch(e) { console.error('logout error:', e); }
    window.location.href = '/';
  });

  // ─── Patient profile ──────────────────────────────
  window.openPatientProfile = async function(patientId) {
    openModal('patientProfileModal');
    document.getElementById('patientProfileContent').innerHTML = '<div class="text-center py-10"><i class="fas fa-spinner fa-spin text-3xl cyan-text"></i></div>';
    try {
      const res = await fetch(\`/api/doctor/patient/\${patientId}\`);
      if (!res.ok) throw new Error('Patient not found');
      const p = await res.json();
      const init = p.full_name ? p.full_name.split(' ').filter(Boolean).map(n=>n[0]??'').join('').toUpperCase().slice(0,2) : 'P';
      const pid  = escHTML(p.patient_id);
      const pfn  = escHTML(p.full_name);
      document.getElementById('patientProfileContent').innerHTML = \`
        <div class="flex items-center gap-5 mb-5 p-4 cyan-light rounded-xl">
          <div class="w-20 h-20 cyan-bg rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">\${escHTML(init)}</div>
          <div>
            <h3 class="text-xl font-bold cyan-text">\${pfn}</h3>
            <p class="text-gray-500 text-sm">ID: \${escHTML(p.patient_uuid || (p.patient_id ? ('PT-' + String(p.patient_id).replace(/-/g, '').toUpperCase().slice(0, 8)) : 'N/A'))}</p>
            <span class="status-badge status-active">Active Patient</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-4">
          \${[['Age',p.age||'N/A'],['Gender',p.gender||'N/A'],['Blood Group',p.blood_type||p.blood_group||'N/A'],['Contact',p.phone||'N/A'],['Email',p.email||'N/A'],['Address',p.address||'N/A']]
            .map(([k,v])=>'<div class="cyan-light p-3 rounded-xl"><p class="text-xs cyan-text opacity-70">'+escHTML(k)+'</p><p class="font-medium cyan-text text-sm mt-0.5">'+escHTML(v)+'</p></div>').join('')}
        </div>
        \${p.medical_conditions?.length?'<div class="p-3 bg-yellow-50 rounded-xl mb-3 border-l-4 border-yellow-400"><p class="text-xs font-semibold text-yellow-700 mb-1">Medical Conditions</p><p class="text-sm text-gray-700">'+escHTML(p.medical_conditions.join(', '))+'</p></div>':''}
        \${p.allergies?.length?'<div class="p-3 bg-red-50 rounded-xl mb-3 border-l-4 border-red-400"><p class="text-xs font-semibold text-red-700 mb-1">Allergies</p><p class="text-sm text-gray-700">'+escHTML(p.allergies.join(', '))+'</p></div>':''}
        <div class="flex gap-3 mt-4">
          <button id="profileChatBtn" class="flex-1 px-4 py-2 btn-white rounded-lg text-sm"><i class="fas fa-comment mr-1"></i>Message</button>
          <button id="profilePrescribeBtn" class="flex-1 px-4 py-2 btn-cyan rounded-lg text-sm"><i class="fas fa-prescription mr-1"></i>Prescribe</button>
        </div>\`;
      document.getElementById('profileChatBtn')?.addEventListener('click', () => window.openChat(p.patient_id, p.full_name));
      document.getElementById('profilePrescribeBtn')?.addEventListener('click', () => window.openPrescription(p.patient_id, p.full_name));
    } catch(err) {
      console.error('openPatientProfile error:', err);
      document.getElementById('patientProfileContent').innerHTML = '<p class="text-red-500 text-center py-8">' + escHTML(err.message) + '</p>';
    }
  };
  document.querySelectorAll('.view-patient-btn').forEach(b => b.addEventListener('click', function(){
    window.openPatientProfile(this.dataset.patientId);
  }));

  // ─── Chat ──────────────────────────────────────────
  async function refreshUnreadChatDots() {
    try {
      const res = await fetch('/api/doctor/chat/unread');
      if (!res.ok) return;
      const data = await res.json();
      const unreadMap = data.unreadByPatient || {};
      document.querySelectorAll('.message-patient-btn').forEach(btn => {
        const dot = btn.querySelector('.unread-dot');
        if (!dot) return;
        const unreadCount = Number(unreadMap[btn.dataset.patientId] || 0);
        dot.textContent = String(unreadCount);
        dot.classList.toggle('hidden', unreadCount <= 0);
      });
    } catch (e) {
      console.error('refreshUnreadChatDots error:', e);
    }
  }

  async function markChatAsRead(patientId) {
    try {
      await fetch('/api/doctor/chat/' + patientId + '/read', { method: 'POST' });
    } catch (e) {
      console.error('markChatAsRead error:', e);
    }
  }

  let isSendingDoctorChat = false;

  window.openChat = function(patientId, patientName) {
    document.getElementById('chatPatientId').value                = patientId;
    document.getElementById('chatPatientNameDisplay').textContent = patientName;
    document.getElementById('chatAvatar').textContent             = patientName ? patientName[0].toUpperCase() : 'P';
    document.getElementById('chatMessages').innerHTML             = '';
    openModal('chatModal');
    loadChatHistory(patientId);
    markChatAsRead(patientId).then(refreshUnreadChatDots);
  };
  async function loadChatHistory(patientId) {
    try {
      const res = await fetch(\`/api/doctor/chat/\${patientId}/history\`);
      if (!res.ok) return;
      const msgs = await res.json();
      const el = document.getElementById('chatMessages');
      const linkifyMessage = (txt) => {
        const safe = escHTML(txt);
        return safe
          .split(' ')
          .map(part => {
            if (part.startsWith('/chat-room?')) {
              return '<a href="' + part + '" target="_blank" rel="noopener noreferrer" class="underline text-cyan-700">Join consultation room</a>';
            }
            return part;
          })
          .join(' ');
      };
      el.innerHTML = msgs.map(m => \`<div class="\${m.sender==='doctor'?'chat-msg-dr':'chat-msg-pt'}"><span>\${linkifyMessage(m.message)}</span></div>\`).join('');
      el.scrollTop = el.scrollHeight;
      refreshUnreadChatDots();
    } catch(e) { console.error('loadChatHistory error:', e); }
  }
  document.querySelectorAll('.message-patient-btn').forEach(b => b.addEventListener('click', function(){
    window.openChat(this.dataset.patientId, this.dataset.patientName);
  }));
  const doctorChatForm = document.getElementById('chatForm');
  doctorChatForm && (doctorChatForm.onsubmit = async e => {
    e.preventDefault();
    if (isSendingDoctorChat) return;
    const patientId = document.getElementById('chatPatientId').value;
    const message   = document.getElementById('chatInput').value.trim();
    if (!message) return;
    isSendingDoctorChat = true;
    const inputEl = document.getElementById('chatInput');
    const sendBtn = doctorChatForm.querySelector('button[type="submit"]');
    inputEl.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    document.getElementById('chatInput').value = '';
    try {
      await fetch(\`/api/doctor/chat/\${patientId}\`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message })
      });
      await loadChatHistory(patientId);
    } catch {
      showToast('Warning', 'Message may not have been delivered', 'warning');
      inputEl.value = message;
    } finally {
      isSendingDoctorChat = false;
      inputEl.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      inputEl.focus();
    }
  });
  refreshUnreadChatDots();
  setInterval(refreshUnreadChatDots, 8000);

  // ─── Online Consult ───────────────────────────────
  document.querySelectorAll('.online-consult-btn').forEach(b => {
    b.addEventListener('click', function () {
      document.getElementById('onlineConsultPatientName').textContent = this.dataset.patientName;
      document.getElementById('startVideoCallBtn').dataset.patientId    = this.dataset.patientId;
      document.getElementById('scheduleVideoCallBtn').dataset.patientId = this.dataset.patientId;
      openModal('onlineConsultModal');
    });
  });

  document.getElementById('startVideoCallBtn')?.addEventListener('click', function () {
    const patientId   = this.dataset.patientId;
    fetch('/api/doctor/video/initiate', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ patient_id: patientId })
    })
    .then(async res => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.room_url) throw new Error(data.error || 'Could not start consultation');
      window.open(data.room_url, '_blank', 'noopener,noreferrer');
      showToast('Video Call', 'Consultation room opened and patient notified in chat.', 'success');
      closeModal('onlineConsultModal');
    })
    .catch(e => {
      console.error('video initiate error:', e);
      showToast('Error', e.message || 'Failed to start video consultation', 'error');
    });
  });

  document.getElementById('scheduleVideoCallBtn')?.addEventListener('click', function () {
    document.getElementById('scheduleTimeRow').classList.remove('hidden');
    document.getElementById('confirmScheduleBtn').classList.remove('hidden');
    this.classList.add('hidden');
    const dt = new Date(); dt.setDate(dt.getDate() + 1); dt.setHours(10, 0, 0, 0);
    document.getElementById('scheduleDateTime').value          = dt.toISOString().slice(0,16);
    document.getElementById('confirmScheduleBtn').dataset.patientId = this.dataset.patientId;
  });

  document.getElementById('confirmScheduleBtn')?.addEventListener('click', async function () {
    const patientId    = this.dataset.patientId;
    const scheduleTime = document.getElementById('scheduleDateTime').value;
    if (!scheduleTime) { showToast('Error', 'Please pick a date and time', 'error'); return; }
    try {
      const res = await fetch('/api/doctor/video/schedule', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ patient_id: patientId, scheduled_time: scheduleTime })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to schedule consultation');
      showToast('Scheduled', 'Video call scheduled and room link sent to patient chat.', 'success');
    } catch (e) {
      console.error('video schedule error:', e);
      showToast('Error', e.message || 'Failed to schedule consultation', 'error');
      return;
    }
    document.getElementById('scheduleTimeRow').classList.add('hidden');
    document.getElementById('confirmScheduleBtn').classList.add('hidden');
    document.getElementById('scheduleVideoCallBtn').classList.remove('hidden');
    closeModal('onlineConsultModal');
  });

  // ─── Prescriptions ────────────────────────────────
  window.openPrescription = function(patientId, patientName) {
    document.getElementById('prescriptionPatientId').value   = patientId;
    document.getElementById('prescriptionPatientName').value = patientName;
    document.getElementById('prescriptionDiagnosis').value   = '';
    document.getElementById('prescriptionNotes').value       = '';
    document.getElementById('medicationsList').innerHTML = \`
      <div class="flex gap-2 medication-row">
        <input type="text" placeholder="Medication name" class="form-input flex-1 medication-name">
        <input type="text" placeholder="Dosage" class="form-input w-28 medication-dosage">
        <input type="text" placeholder="Frequency" class="form-input w-28 medication-frequency">
        <button type="button" class="text-red-400 hover:text-red-600 remove-medication px-2"><i class="fas fa-times"></i></button>
      </div>\`;
    attachMedEvents();
    openModal('prescriptionModal');
  };
  document.querySelectorAll('.prescribe-btn').forEach(b => b.addEventListener('click', function(){
    window.openPrescription(this.dataset.patientId, this.dataset.patientName);
  }));

  function attachMedEvents() {
    document.querySelectorAll('.remove-medication').forEach(b => {
      b.onclick = function () {
        if (document.querySelectorAll('.medication-row').length > 1) this.closest('.medication-row').remove();
        else showToast('Warning', 'At least one medication required', 'warning');
      };
    });
  }
  attachMedEvents();

  document.getElementById('addMedicationBtn')?.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'flex gap-2 medication-row';
    row.innerHTML = \`<input type="text" placeholder="Medication name" class="form-input flex-1 medication-name"><input type="text" placeholder="Dosage" class="form-input w-28 medication-dosage"><input type="text" placeholder="Frequency" class="form-input w-28 medication-frequency"><button type="button" class="text-red-400 hover:text-red-600 remove-medication px-2"><i class="fas fa-times"></i></button>\`;
    document.getElementById('medicationsList').appendChild(row);
    attachMedEvents();
  });

  document.getElementById('prescriptionForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const diagnosis = document.getElementById('prescriptionDiagnosis').value.trim();
    if (!diagnosis) { showToast('Error', 'Diagnosis is required', 'error'); return; }
    const medications = [];
    document.querySelectorAll('.medication-row').forEach(row => {
      const name = row.querySelector('.medication-name').value.trim();
      if (name) medications.push({ name, dosage: row.querySelector('.medication-dosage').value.trim(), frequency: row.querySelector('.medication-frequency').value.trim() });
    });
    if (!medications.length) { showToast('Error', 'Add at least one medication', 'error'); return; }
    try {
      const res = await fetch('/api/doctor/prescription/create', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          patient_id: document.getElementById('prescriptionPatientId').value,
          diagnosis, medications,
          notes: document.getElementById('prescriptionNotes').value.trim()
        })
      });
      if (res.ok) { showToast('Saved', 'Prescription saved!', 'success'); closeModal('prescriptionModal'); }
      else { const err = await res.json().catch(()=>({})); showToast('Error', err.message||'Failed', 'error'); }
    } catch(err) {
      console.error('prescription error:', err);
      showToast('Error', err.message, 'error');
    }
  });

  // ─── Add Patient ──────────────────────────────────
  document.getElementById('addPatientBtn')?.addEventListener('click', () => openModal('addPatientModal'));
  document.getElementById('addPatientForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('newPatientEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Error', 'Valid email is required', 'error'); return; }
    const password = document.getElementById('newPatientPassword').value;
    const confirmPassword = document.getElementById('newPatientPasswordConfirm').value;
    if (!password || password.length < 8) { showToast('Error', 'Password must be at least 8 characters', 'error'); return; }
    if (password !== confirmPassword) { showToast('Error', 'Passwords do not match', 'error'); return; }
    try {
      const res = await fetch('/api/doctor/patient/add', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          full_name:       document.getElementById('newPatientName').value.trim(),
          email,
          password,
          phone:           document.getElementById('newPatientPhone').value.trim(),
          dob:             document.getElementById('newPatientDob').value,
          gender:          document.getElementById('newPatientGender').value,
          blood_group:     document.getElementById('newPatientBloodGroup').value,
          address:         document.getElementById('newPatientAddress').value.trim(),
          emergency_name:  document.getElementById('newPatientEmergencyName').value.trim(),
          emergency_phone: document.getElementById('newPatientEmergencyPhone').value.trim()
        })
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast('Added', 'Patient added. Login email: ' + email, 'success');
        closeModal('addPatientModal');
        e.target.reset();
        setTimeout(() => window.location.reload(), 1200);
      } else { const err = await res.json().catch(()=>({})); showToast('Error', err.message||'Failed', 'error'); }
    } catch(err) {
      console.error('add patient error:', err);
      showToast('Error', err.message, 'error');
    }
  });

  // ─── Delete Report ────────────────────────────────
  let pendingDeleteReportId = null;
  function attachDeleteReportListeners() {
    document.querySelectorAll('.delete-report-btn').forEach(b => {
      b.addEventListener('click', function(e) {
        e.stopPropagation();
        pendingDeleteReportId = this.dataset.id;
        document.getElementById('deleteReportPatient').textContent = this.dataset.patient;
        document.getElementById('deleteReportType').textContent    = this.dataset.type;
        document.getElementById('deleteReportModal').classList.remove('hidden');
      });
    });
  }
  attachDeleteReportListeners();
  document.getElementById('cancelDeleteReport')?.addEventListener('click', () => {
    pendingDeleteReportId = null;
    document.getElementById('deleteReportModal').classList.add('hidden');
  });
  document.getElementById('confirmDeleteReport')?.addEventListener('click', async () => {
    if (!pendingDeleteReportId) return;
    try {
      const res = await fetch(\`/api/doctor/report/\${pendingDeleteReportId}\`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Deleted', 'Report removed successfully', 'success');
        document.getElementById('deleteReportModal').classList.add('hidden');
        pendingDeleteReportId = null;
        await refreshReports();
      } else {
        const err = await res.json().catch(()=>({}));
        showToast('Error', err.message || 'Delete failed', 'error');
      }
    } catch(err) {
      console.error('delete report error:', err);
      showToast('Error', err.message, 'error');
    }
  });

  // ─── Apply Leave ──────────────────────────────────
  const openLeaveModal = () => {
    const today    = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('leaveFromDate').min   = today;
    document.getElementById('leaveFromDate').value = today;
    document.getElementById('leaveToDate').min     = today;
    document.getElementById('leaveToDate').value   = tomorrow.toISOString().split('T')[0];
    document.getElementById('leaveReason').value   = '';
    openModal('applyLeaveModal');
  };
  document.getElementById('applyLeaveBtn')?.addEventListener('click', openLeaveModal);
  document.querySelector('.quick-action[data-action="apply-leave"]')?.addEventListener('click', openLeaveModal);

  document.getElementById('applyLeaveForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const from   = document.getElementById('leaveFromDate').value;
    const to     = document.getElementById('leaveToDate').value;
    const reason = document.getElementById('leaveReason').value.trim();
    const type   = document.getElementById('leaveType').value;
    if (to < from) { showToast('Error', 'End date cannot be before start date', 'error'); return; }
    if (!reason)   { showToast('Error', 'Please provide a reason', 'error'); return; }
    try {
      const res = await fetch('/api/doctor/leave/apply', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ from, to, reason, type })
      });
      if (res.ok) {
        showToast('Submitted', 'Leave request sent to admin for approval', 'success');
        closeModal('applyLeaveModal'); e.target.reset();
        await loadLeaveHistory();
      } else {
        const err = await res.json().catch(()=>({}));
        showToast('Error', err.message || 'Failed to submit', 'error');
      }
    } catch(err) {
      console.error('apply leave error:', err);
      showToast('Error', err.message, 'error');
    }
  });

  async function loadLeaveHistory() {
    const el = document.getElementById('leaveHistoryList');
    if (!el) return;
    el.innerHTML = '<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin text-3xl mb-3 block cyan-text"></i></div>';
    try {
      const res  = await fetch('/api/doctor/leave');
      if (!res.ok) throw new Error('Could not load leave history');
      const list = await res.json();
      if (!list.length) {
        el.innerHTML = '<div class="text-center py-16 text-gray-400"><i class="fas fa-calendar-check text-5xl mb-4 block"></i><p class="text-lg">No leave records found</p><p class="text-sm mt-1">Use "Apply for Leave" to submit a request</p></div>';
        return;
      }
      const statusColor = {
        Approved: 'text-green-600 bg-green-50 border-green-200',
        Pending:  'text-amber-600 bg-amber-50 border-amber-200',
        Rejected: 'text-red-600 bg-red-50 border-red-200'
      };
      el.innerHTML = list.map(l => {
        const sc = statusColor[l.status] || statusColor.Pending;
        return \`<div class="white-card rounded-xl p-5 border border-gray-100">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <span class="font-semibold cyan-text">\${escHTML(new Date(l.from_date).toLocaleDateString())} → \${escHTML(new Date(l.to_date).toLocaleDateString())}</span>
                <span class="text-xs px-3 py-1 rounded-full border font-semibold \${sc}">\${escHTML(l.status)}</span>
              </div>
              <p class="text-sm text-gray-500 capitalize"><i class="fas fa-tag mr-1"></i>\${escHTML(l.type || 'Leave')}</p>
              <p class="text-sm text-gray-700 mt-2">\${escHTML(l.reason)}</p>
              \${l.admin_note ? \`<p class="text-xs text-gray-400 mt-1"><i class="fas fa-comment mr-1"></i>Admin: \${escHTML(l.admin_note)}</p>\` : ''}
            </div>
            \${l.status === 'Pending' ? \`<button class="cancel-leave-btn text-xs btn-red px-3 py-1 rounded-lg flex-shrink-0" data-id="\${escHTML(l.leave_id)}"><i class="fas fa-times mr-1"></i>Cancel</button>\` : ''}
          </div>
        </div>\`;
      }).join('');
      document.querySelectorAll('.cancel-leave-btn').forEach(b => b.addEventListener('click', async function() {
        if (!confirm('Cancel this leave request?')) return;
        const r = await fetch(\`/api/doctor/leave/\${this.dataset.id}\`, { method: 'DELETE' });
        if (r.ok) { showToast('Cancelled', 'Leave request cancelled', 'success'); loadLeaveHistory(); }
        else showToast('Error', 'Could not cancel leave', 'error');
      }));
    } catch(err) {
      console.error('loadLeaveHistory error:', err);
      el.innerHTML = \`<div class="text-center py-10 text-red-400"><i class="fas fa-exclamation-circle text-3xl mb-3 block"></i><p>\${escHTML(err.message)}</p></div>\`;
    }
  }

  // ─── Profile photo preview ────────────────────────
  document.getElementById('editPhotoFile')?.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('Error', 'Image must be under 10 MB', 'error'); this.value = ''; return; }
    const reader = new FileReader();
    reader.onload = e => {
      const wrap = document.getElementById('photoPreviewWrap');
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'w-full h-full object-cover rounded-full';
      wrap.innerHTML = '';
      wrap.appendChild(img);
    };
    reader.readAsDataURL(file);
  });

  // ─── Delete profile photo ─────────────────────────
  document.getElementById('deletePhotoBtn')?.addEventListener('click', async function () {
    if (!confirm('Remove your profile photo?')) return;
    try {
      const res = await fetch('/api/doctor/profile/photo', { method: 'DELETE' });
      if (res.ok) {
        const wrap = document.getElementById('photoPreviewWrap');
        const nameEl = document.getElementById('headerDoctorName');
        const initials = nameEl?.textContent?.split(' ').filter(Boolean).map(n=>n[0]??'').join('').toUpperCase().slice(0,2) || 'DR';
        wrap.textContent = initials;
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) { profileBtn.innerHTML = ''; profileBtn.textContent = initials; }
        showToast('Removed', 'Profile photo removed', 'success');
      } else { showToast('Error', 'Failed to remove photo', 'error'); }
    } catch(err) {
      console.error('delete photo error:', err);
      showToast('Error', err.message, 'error');
    }
  });

  // ─── Patient search ───────────────────────────────
  document.getElementById('patientSearch')?.addEventListener('input', function () {
    const term = this.value.toLowerCase();
    document.querySelectorAll('.patient-card').forEach(c => {
      c.style.display = (c.querySelector('.patient-name')?.textContent.toLowerCase() || '').includes(term) ? '' : 'none';
    });
  });

  // ─── Auto-refresh stats every 60s ────────────────
  // Store interval ID so it can be cleared if needed
  const statsInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/doctor/stats');
      if (!res.ok) return;
      const s = await res.json();
      if (s.appointments != null) { document.getElementById('statAppointments').textContent = s.appointments; document.getElementById('sidebarApptCount').textContent = s.appointments; }
      if (s.pending_reports != null) { document.getElementById('statReports').textContent = s.pending_reports; document.getElementById('sidebarReportCount').textContent = s.reports ?? s.pending_reports; }
      if (s.patients != null) { document.getElementById('statPatients').textContent = s.patients; document.getElementById('sidebarPatientCount').textContent = s.patients; }
    } catch(e) { console.error('stats refresh error:', e); }
  }, 60000);

  checkDueOnlineReminders();
  const reminderInterval = setInterval(checkDueOnlineReminders, 30000);

  // Clear interval on page unload to prevent leaks
  window.addEventListener('beforeunload', () => {
    clearInterval(statsInterval);
    clearInterval(reminderInterval);
  });

  // ─── Welcome toast ────────────────────────────────
  setTimeout(() => showToast('Welcome', 'Good day, ${esc(doctorData.name)}!', 'success'), 800);

});
</script>
</body>
</html>`;
}

// ============================================
// EXPORT — called by signin.js
// ============================================
module.exports = async function renderDoctorDashboard(userId) {
  try {
    console.log('🔍 renderDoctorDashboard for user:', userId);

    const doctorResult = await query(
      `SELECT d.*,
              COALESCE(d.photo_url, dp.file_url) AS photo_url,
              u.email,
              h.logo_filename,
              h.main_photo_filename,
              CASE
                WHEN h.main_photo_filename IS NOT NULL AND h.main_photo_filename <> ''
                THEN '/uploads/hospitals/photos/' || h.main_photo_filename
                WHEN h.logo_filename IS NOT NULL AND h.logo_filename <> ''
                THEN '/uploads/hospitals/logos/' || h.logo_filename
                ELSE NULL
              END AS hospital_photo_url
       FROM doctors d
       LEFT JOIN LATERAL (
         SELECT file_url
         FROM doctor_documents
         WHERE doctor_id = d.doctor_id AND document_type = 'profile_photo'
         ORDER BY uploaded_at DESC
         LIMIT 1
       ) dp ON true
       LEFT JOIN hospitals h ON d.hospital_id = h.hospital_id
       JOIN users u ON d.user_id = u.user_id
       WHERE d.user_id = $1`,
      [userId]
    );

    if (!doctorResult.rows[0]) {
      console.warn('⚠️ No doctor found for user:', userId);
      return `<div style="font-family:sans-serif;padding:40px;text-align:center">
        <h2 style="color:#ef4444">Doctor profile not found</h2>
        <p>No doctor account is linked to this user. Please contact support.</p>
      </div>`;
    }

    const doctor   = doctorResult.rows[0];
    const doctorId = doctor.doctor_id;
    console.log('🆔 Doctor:', doctor.full_name, '| ID:', doctorId);

    await query(`
      CREATE TABLE IF NOT EXISTS doctor_patient_links (
        link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
        patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(doctor_id, patient_id)
      )
    `);

    const [appointmentsResult, reportsResult, patientsResult] = await Promise.all([
      // Today's appointments with patient info
      query(
        `SELECT a.*, p.full_name AS patient_name, p.patient_uuid, p.patient_id
         FROM appointments a
         JOIN patients p ON a.patient_id = p.patient_id
         WHERE a.doctor_id = $1
           AND a.appointment_date = CURRENT_DATE
         ORDER BY a.appointment_time ASC`,
        [doctorId]
      ),
      // Lab reports with pagination constant
      query(
        `SELECT r.*, p.full_name AS patient_name, p.patient_uuid, p.patient_id
         FROM lab_reports r
         JOIN patients p ON r.patient_id = p.patient_id
         WHERE r.doctor_id = $1
         ORDER BY r.created_at DESC
         LIMIT $2`,
        [doctorId, 50] // matches client-side REPORTS_PAGE_SIZE
      ),
      // Patients — includes both appointment-based and manually linked patients
      query(
        `SELECT p.*,
          p.blood_type AS blood_group,
          CASE
            WHEN p.date_of_birth IS NOT NULL
            THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth))::int
            ELSE NULL
          END AS age,
           sub.last_visit,
           sub.next_visit
         FROM patients p
         LEFT JOIN (
          SELECT patient_id,
                 MAX(CASE WHEN appointment_date <= CURRENT_DATE THEN appointment_date END) AS last_visit,
                 MIN(CASE WHEN appointment_date > CURRENT_DATE THEN appointment_date END) AS next_visit
           FROM appointments
           WHERE doctor_id = $1
           GROUP BY patient_id
         ) sub ON p.patient_id = sub.patient_id
         WHERE p.patient_id IN (
           SELECT patient_id FROM appointments WHERE doctor_id = $1
           UNION
           SELECT patient_id FROM doctor_patient_links WHERE doctor_id = $1
         )
         ORDER BY COALESCE(sub.last_visit, p.created_at) DESC`,
        [doctorId]
      )
    ]);

    console.log('📅 Appointments:', appointmentsResult.rows.length);
    console.log('📄 Reports:',      reportsResult.rows.length);
    console.log('👥 Patients:',     patientsResult.rows.length);

    return generateDoctorHTML(
      doctor,
      appointmentsResult.rows,
      reportsResult.rows,
      patientsResult.rows
    );

  } catch (error) {
    console.error('❌ renderDoctorDashboard error:', error);
    return `<div style="font-family:sans-serif;padding:40px;text-align:center">
      <h2 style="color:#ef4444">Error loading dashboard</h2>
      <p>${error.message}</p>
    </div>`;
  }
};