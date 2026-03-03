const { query } = require('./db/config');

// ============================================
// FUNCTION TO GENERATE DOCTOR DASHBOARD HTML
// ============================================
function generateDoctorHTML(doctor = null, appointments = [], reports = [], patientList = []) {
    // Use provided data or defaults
  const doctorData = doctor || {
    doctor_uuid: 'DR-2024-0567',
    name: 'Dr. Sarah Chen',
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
  };

  const todaysAppointments = appointments.length ? appointments : [];
  const labReports = reports.length ? reports : [];
  const patients = patientList.length ? patientList : [];

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
        
        * {
          font-family: 'Poppins', sans-serif;
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
          overflow-x: hidden;
        }
        
        .cyan-bg {
          background: linear-gradient(135deg, #00bcd4 0%, #00acc1 100%);
        }
        
        .cyan-light {
          background: #e0f7fa;
        }
        
        .cyan-dark {
          background: #00838f;
        }
        
        .cyan-text {
          color: #006064;
        }
        
        .cyan-border {
          border-color: #00bcd4;
        }
        
        .white-card {
          background: white;
          box-shadow: 0 10px 40px rgba(0, 188, 212, 0.1);
        }
        
        .background-animation {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          overflow: hidden;
        }
        
        .floating-circle {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(0, 188, 212, 0.1), rgba(255, 255, 255, 0.1));
          animation: float 25s infinite linear;
        }
        
        .floating-circle:nth-child(1) {
          width: 300px;
          height: 300px;
          top: -100px;
          left: -100px;
        }
        
        .floating-circle:nth-child(2) {
          width: 200px;
          height: 200px;
          top: 50%;
          right: -50px;
          animation-delay: -8s;
        }
        
        .floating-circle:nth-child(3) {
          width: 150px;
          height: 150px;
          bottom: -50px;
          left: 30%;
          animation-delay: -15s;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(40px, 40px) rotate(90deg);
          }
          50% {
            transform: translate(0, 80px) rotate(180deg);
          }
          75% {
            transform: translate(-40px, 40px) rotate(270deg);
          }
        }
        
        .wave-line {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100px;
          background: linear-gradient(90deg, 
            rgba(0, 188, 212, 0.2) 0%, 
            rgba(0, 172, 193, 0.3) 25%, 
            rgba(0, 131, 143, 0.2) 50%, 
            rgba(0, 96, 100, 0.3) 75%, 
            rgba(0, 188, 212, 0.2) 100%);
          opacity: 0.3;
          animation: wave 12s infinite ease-in-out;
        }
        
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(60px); }
        }
        
        .pulse-dot {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .slide-in {
          animation: slideIn 0.5s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .hover-lift {
          transition: all 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 188, 212, 0.15);
        }
        
        .menu-item {
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
        }
        
        .menu-item:hover {
          border-left-color: #00bcd4;
          background: rgba(0, 188, 212, 0.05);
        }
        
        .menu-item.active {
          border-left-color: #00bcd4;
          background: rgba(0, 188, 212, 0.1);
          box-shadow: 0 4px 12px rgba(0, 188, 212, 0.1);
        }
        
        .btn-cyan {
          background: linear-gradient(135deg, #00bcd4, #00acc1);
          color: white;
          transition: all 0.3s ease;
        }
        
        .btn-cyan:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 188, 212, 0.3);
        }
        
        .btn-white {
          background: white;
          color: #006064;
          border: 2px solid #00bcd4;
          transition: all 0.3s ease;
        }
        
        .btn-white:hover {
          background: #00bcd4;
          color: white;
        }
        
        .btn-red {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          transition: all 0.3s ease;
        }
        
        .btn-red:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 188, 212, 0.1);
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #00bcd4;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #00acc1;
        }
        
        .text-cyan-gradient {
          background: linear-gradient(135deg, #00bcd4, #006064);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .modal-backdrop {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(5px);
        }
        
        .shine-effect {
          position: relative;
          overflow: hidden;
        }
        
        .shine-effect::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to bottom right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: rotate(30deg);
          animation: shine 3s infinite;
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(30deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(30deg); }
        }
        
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-confirmed {
          background: #d1fae5;
          color: #065f46;
        }
        
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        
        .status-reviewed {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .status-active {
          background: #dcfce7;
          color: #166534;
        }
        
        .chat-bubble {
          position: absolute;
          width: 40px;
          height: 40px;
          background: #00bcd4;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .ripple-effect {
          position: relative;
          overflow: hidden;
        }
        
        .ripple-effect::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 5px;
          height: 5px;
          background: rgba(255, 255, 255, 0.5);
          opacity: 0;
          border-radius: 100%;
          transform: scale(1, 1) translate(-50%);
          transform-origin: 50% 50%;
        }
        
        .ripple-effect:focus:not(:active)::after {
          animation: ripple 1s ease-out;
        }
        
        @keyframes ripple {
          0% {
            transform: scale(0, 0);
            opacity: 0.5;
          }
          100% {
            transform: scale(20, 20);
            opacity: 0;
          }
        }
        
        .doctor-header-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .logout-btn {
          background: #ef4444;
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }
        
        .logout-btn:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
        }
        
        .edit-profile-btn {
          background: white;
          color: #00bcd4;
          border: 2px solid #00bcd4;
          padding: 0.5rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }
        
        .edit-profile-btn:hover {
          background: #00bcd4;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 188, 212, 0.3);
        }
        
        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e0f2fe;
          border-radius: 0.5rem;
          transition: all 0.3s ease;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #00bcd4;
          box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.1);
        }
        
        .form-select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e0f2fe;
          border-radius: 0.5rem;
          background: white;
        }
        
        @media (max-width: 768px) {
          .responsive-stack {
            flex-direction: column;
          }
          
          .responsive-text {
            font-size: 0.9rem;
          }
          
          .responsive-padding {
            padding: 1rem;
          }
          
          .doctor-header {
            flex-direction: column;
            text-align: left;
          }
          
          .doctor-header-left {
            width: 100%;
            justify-content: space-between;
          }
        }
      </style>
    </head>
    <body class="text-gray-800">
      <div class="background-animation">
        <div class="floating-circle"></div>
        <div class="floating-circle"></div>
        <div class="floating-circle"></div>
        <div class="wave-line"></div>
      </div>
      
      <div class="container mx-auto px-4 py-6">
        <div class="white-card rounded-2xl p-6 mb-6 fade-in shine-effect">
          <div class="flex doctor-header items-center justify-between">
            <div class="doctor-header-left">
              <button id="profileBtn" class="doctor-avatar w-20 h-20 cyan-bg rounded-full flex items-center justify-center text-2xl font-bold text-white hover-lift ripple-effect">
                ${doctorData && doctorData.name ? doctorData.name.split(' ').map(n => n[0]).join('') : 'DR'}
              </button>
              <div>
                <h1 class="text-3xl font-bold cyan-text">${doctorData.name}</h1>
                <p class="text-gray-600">${doctorData.designation} • ${doctorData.specialization}</p>
                <p class="text-sm cyan-text">ID: ${doctorData.doctor_uuid || doctorData.id}</p>
              </div>
            </div>
            
            <div class="flex gap-3">
              <button id="editProfileHeaderBtn" class="edit-profile-btn">
                <i class="fas fa-edit"></i>
                Edit Profile
              </button>
              <button id="logoutHeaderBtn" class="logout-btn">
                <i class="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
        
        <div class="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent my-6 opacity-30"></div>
        
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="lg:w-1/4">
            <div class="white-card rounded-2xl p-6 mb-6 slide-in">
              <div class="space-y-2">
                <button class="menu-item active w-full text-left p-4 rounded-xl flex items-center space-x-4" data-section="appointments">
                  <div class="w-12 h-12 cyan-bg rounded-xl flex items-center justify-center">
                    <i class="fas fa-calendar-day text-xl text-white"></i>
                  </div>
                  <div>
                    <p class="font-semibold cyan-text">Today's Appointments</p>
                    <p class="text-sm cyan-text opacity-75">View daily schedule</p>
                  </div>
                  <span class="ml-auto cyan-bg text-white text-xs px-2 py-1 rounded-full">${todaysAppointments.length}</span>
                </button>
                
                <button class="menu-item w-full text-left p-4 rounded-xl flex items-center space-x-4" data-section="lab-reports">
                  <div class="w-12 h-12 cyan-light rounded-xl flex items-center justify-center">
                    <i class="fas fa-file-medical-alt text-xl cyan-text"></i>
                  </div>
                  <div>
                    <p class="font-semibold cyan-text">Lab Reports</p>
                    <p class="text-sm cyan-text opacity-75">Review test results</p>
                  </div>
                  <span class="ml-auto cyan-dark text-white text-xs px-2 py-1 rounded-full">${labReports.length}</span>
                </button>
                
                <button class="menu-item w-full text-left p-4 rounded-xl flex items-center space-x-4" data-section="patients">
                  <div class="w-12 h-12 cyan-light rounded-xl flex items-center justify-center">
                    <i class="fas fa-user-friends text-xl cyan-text"></i>
                  </div>
                  <div>
                    <p class="font-semibold cyan-text">Patients</p>
                    <p class="text-sm cyan-text opacity-75">Manage patient list</p>
                  </div>
                  <span class="ml-auto cyan-bg text-white text-xs px-2 py-1 rounded-full">${patients.length}</span>
                </button>
              </div>
              
              <div class="mt-8 pt-6 border-t border-gray-200">
                <p class="text-sm font-semibold cyan-text mb-4">Quick Actions</p>
                <div class="grid grid-cols-2 gap-3">
                  <button class="cyan-light rounded-lg p-3 text-center hover:bg-cyan-100 transition-colors quick-action" data-action="online-consult">
                    <i class="fas fa-video cyan-text mb-1"></i>
                    <p class="text-xs cyan-text">Online Consult</p>
                  </button>
                  <button class="cyan-light rounded-lg p-3 text-center hover:bg-cyan-100 transition-colors quick-action" data-action="prescription">
                    <i class="fas fa-prescription cyan-text mb-1"></i>
                    <p class="text-xs cyan-text">Write Prescription</p>
                  </button>
                  <button class="cyan-light rounded-lg p-3 text-center hover:bg-cyan-100 transition-colors quick-action" data-action="analytics">
                    <i class="fas fa-chart-line cyan-text mb-1"></i>
                    <p class="text-xs cyan-text">Analytics</p>
                  </button>
                  <button class="cyan-light rounded-lg p-3 text-center hover:bg-cyan-100 transition-colors quick-action" data-action="settings">
                    <i class="fas fa-cog cyan-text mb-1"></i>
                    <p class="text-xs cyan-text">Settings</p>
                  </button>
                </div>
              </div>
              
              <div class="mt-6 p-4 cyan-light rounded-xl">
                <p class="text-sm font-semibold cyan-text mb-2">Today's Stats</p>
                <div class="flex justify-between">
                  <div class="text-center">
                    <p class="text-2xl font-bold cyan-text">${todaysAppointments.length}</p>
                    <p class="text-xs cyan-text opacity-75">Appointments</p>
                  </div>
                  <div class="text-center">
                    <p class="text-2xl font-bold cyan-text">${labReports.filter(r => r.status === 'pending').length}</p>
                    <p class="text-xs cyan-text opacity-75">Pending Reports</p>
                  </div>
                  <div class="text-center">
                    <p class="text-2xl font-bold cyan-text">${patients.length}</p>
                    <p class="text-xs cyan-text opacity-75">Patients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="lg:w-3/4">
            <div id="contentArea" class="white-card rounded-2xl p-6 min-h-[600px] fade-in scrollbar-thin">
              <!-- Appointments Content -->
              <div id="appointmentsContent">
                <div class="flex justify-between items-center mb-6">
                  <h2 class="text-2xl font-bold cyan-text">Today's Appointments</h2>
                  <div class="flex space-x-3">
                    <button class="px-4 py-2 cyan-light rounded-lg text-sm cyan-text font-medium" id="filterAppointments">
                      <i class="fas fa-filter mr-2"></i>Filter
                    </button>
                    <button class="px-4 py-2 btn-cyan rounded-lg text-sm" id="addAppointmentSlot">
                      <i class="fas fa-plus mr-2"></i>Add Slot
                    </button>
                  </div>
                </div>
                
                <div class="grid gap-6" id="appointmentsList">
                  ${todaysAppointments.length > 0 ? todaysAppointments.map(apt => `
                    <div class="cyan-light rounded-xl p-6 hover-lift appointment-card" data-id="${apt.appointment_id}">
                      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div class="flex items-center space-x-4 mb-4 md:mb-0">
                          <div class="w-16 h-16 cyan-bg rounded-full flex items-center justify-center">
                            <i class="fas fa-user-injured text-xl text-white"></i>
                          </div>
                          <div>
                            <h3 class="text-xl font-bold cyan-text patient-name">${apt.patient_name}</h3>
                            <p class="text-gray-600">ID: ${apt.patient_uuid}</p>
                            <p class="text-gray-700 mt-1"><i class="fas fa-stethoscope mr-2 cyan-text"></i>${apt.reason}</p>
                          </div>
                        </div>
                        <div class="flex flex-col md:items-end space-y-3">
                          <div class="flex items-center space-x-4">
                            <span class="status-badge ${apt.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}">
                              ${apt.status}
                            </span>
                            <span class="text-lg font-bold cyan-text">${apt.appointment_time ? apt.appointment_time.substring(0,5) : ''}</span>
                          </div>
                          <div class="flex space-x-3">
                            <button class="px-4 py-2 btn-cyan rounded-lg start-consult-btn" data-id="${apt.appointment_id}" data-patient="${apt.patient_name}" data-patient-id="${apt.patient_id}">
                              <i class="fas fa-play-circle mr-2"></i>Start Consult
                            </button>
                            <button class="px-4 py-2 btn-white rounded-lg reschedule-btn" data-id="${apt.appointment_id}">
                              Reschedule
                            </button>
                            ${apt.appointment_type === 'online' ? `
                              <button class="px-4 py-2 cyan-light rounded-lg cyan-text video-btn" data-id="${apt.appointment_id}">
                                <i class="fas fa-video mr-2"></i>Video Call
                              </button>
                            ` : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div class="flex items-center space-x-4">
                          <span class="text-sm cyan-text">
                            <i class="fas fa-calendar-alt mr-1"></i>
                            Today • ${apt.appointment_type === 'online' ? 'Online Consultation' : 'In-person Visit'}
                          </span>
                        </div>
                        <div class="flex space-x-2">
                          <button class="text-sm cyan-bg text-white px-3 py-1 rounded view-patient-history" data-patient-id="${apt.patient_id}">
                            <i class="fas fa-file-medical mr-1"></i>View History
                          </button>
                          <button class="text-sm btn-white px-3 py-1 rounded message-patient" data-patient-id="${apt.patient_id}" data-patient-name="${apt.patient_name}">
                            <i class="fas fa-comment-medical mr-1"></i>Message
                          </button>
                        </div>
                      </div>
                    </div>
                  `).join('') : '<p class="text-center text-gray-500 py-8">No appointments for today</p>'}
                </div>
                
                <div class="mt-8 cyan-light rounded-xl p-6">
                  <h3 class="text-lg font-semibold cyan-text mb-4">Schedule Summary</h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="white-card p-4 rounded-xl text-center">
                      <p class="text-3xl font-bold cyan-text">${todaysAppointments.filter(a => a.status === 'confirmed').length}</p>
                      <p class="text-sm cyan-text opacity-75">Confirmed Appointments</p>
                    </div>
                    <div class="white-card p-4 rounded-xl text-center">
                      <p class="text-3xl font-bold cyan-text">${todaysAppointments.filter(a => a.appointment_type === 'online').length}</p>
                      <p class="text-sm cyan-text opacity-75">Online Consults</p>
                    </div>
                    <div class="white-card p-4 rounded-xl text-center">
                      <p class="text-3xl font-bold cyan-text">${todaysAppointments.filter(a => a.appointment_type === 'in-person').length}</p>
                      <p class="text-sm cyan-text opacity-75">In-person Visits</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Lab Reports Content -->
              <div id="labReportsContent" class="hidden">
                <div class="flex justify-between items-center mb-6">
                  <h2 class="text-2xl font-bold cyan-text">Lab Reports</h2>
                  <div class="flex space-x-3">
                    <button class="px-4 py-2 cyan-light rounded-lg text-sm cyan-text font-medium" id="filterReports">
                      <i class="fas fa-filter mr-2"></i>Filter
                    </button>
                    <button class="px-4 py-2 btn-cyan rounded-lg text-sm" id="uploadReportBtn">
                      <i class="fas fa-file-upload mr-2"></i>Upload Report
                    </button>
                  </div>
                </div>
                
                <div class="grid gap-6" id="reportsList">
                  ${labReports.length > 0 ? labReports.map(report => `
                    <div class="cyan-light rounded-xl p-6 hover-lift report-card" data-id="${report.report_id}">
                      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div class="flex items-center space-x-4 mb-4 md:mb-0">
                          <div class="w-16 h-16 ${report.status === 'reviewed' ? 'cyan-bg' : 'cyan-dark'} rounded-full flex items-center justify-center">
                            <i class="fas ${report.test_type && report.test_type.includes('ECG') ? 'fa-heartbeat' : 'fa-vial'} text-xl text-white"></i>
                          </div>
                          <div>
                            <h3 class="text-xl font-bold cyan-text">${report.patient_name}</h3>
                            <p class="text-gray-600">ID: ${report.patient_uuid}</p>
                            <p class="text-gray-700 mt-1"><i class="fas fa-flask mr-2 cyan-text"></i>${report.test_type}</p>
                          </div>
                        </div>
                        <div class="flex flex-col md:items-end space-y-3">
                          <div class="flex items-center space-x-4">
                            <span class="status-badge ${report.status === 'reviewed' ? 'status-reviewed' : 'status-pending'}">
                              ${report.status}
                            </span>
                            <span class="text-sm cyan-text">${new Date(report.test_date).toLocaleDateString()}</span>
                          </div>
                          <div class="flex space-x-3">
                            <button class="px-4 py-2 btn-cyan rounded-lg view-report-btn" data-id="${report.report_id}" data-patient-id="${report.patient_id}">
                              <i class="fas fa-eye mr-2"></i>View Report
                            </button>
                            <button class="px-4 py-2 btn-white rounded-lg write-findings-btn" data-id="${report.report_id}">
                              <i class="fas fa-edit mr-2"></i>${report.status === 'reviewed' ? 'Update' : 'Add Findings'}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      ${report.findings ? `
                        <div class="mt-4 p-4 white-card rounded-lg border cyan-border">
                          <p class="text-sm cyan-text font-medium mb-2">Findings:</p>
                          <p class="text-gray-700">${report.findings}</p>
                        </div>
                      ` : ''}
                      
                      <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div class="flex items-center space-x-4">
                          <button class="text-sm cyan-bg text-white px-3 py-1 rounded download-report" data-id="${report.report_id}">
                            <i class="fas fa-download mr-1"></i>Download PDF
                          </button>
                          <button class="text-sm btn-white px-3 py-1 rounded share-report" data-id="${report.report_id}">
                            <i class="fas fa-share-alt mr-1"></i>Share
                          </button>
                        </div>
                      </div>
                    </div>
                  `).join('') : '<p class="text-center text-gray-500 py-8">No lab reports found</p>'}
                </div>
              </div>
              
              <!-- Patients Content -->
              <div id="patientsContent" class="hidden">
                <div class="flex justify-between items-center mb-6">
                  <h2 class="text-2xl font-bold cyan-text">My Patients</h2>
                  <div class="flex space-x-3">
                    <div class="relative">
                      <input type="text" id="patientSearch" placeholder="Search patients..." class="pl-10 pr-4 py-2 cyan-light rounded-lg text-sm cyan-text focus:outline-none focus:ring-2 focus:ring-cyan-400">
                      <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                    <button class="px-4 py-2 btn-cyan rounded-lg text-sm" id="addPatientBtn">
                      <i class="fas fa-user-plus mr-2"></i>Add Patient
                    </button>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" id="patientsList">
                  ${patients.length > 0 ? patients.map(patient => `
                    <div class="cyan-light rounded-xl p-6 hover-lift relative patient-card" data-id="${patient.patient_id}">
                      <div class="flex items-center space-x-4 mb-4">
                        <div class="w-16 h-16 cyan-bg rounded-full flex items-center justify-center">
                          <i class="fas fa-user-injured text-2xl text-white"></i>
                        </div>
                        <div>
                          <h3 class="text-xl font-bold cyan-text patient-name">${patient.full_name}</h3>
                          <p class="text-gray-600">ID: ${patient.patient_uuid || 'N/A'}</p>
                          <p class="text-sm cyan-text">${patient.age || 'N/A'} years • ${patient.gender || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div class="space-y-3 mb-4">
                        <div class="flex justify-between">
                          <span class="text-sm cyan-text opacity-75">Blood Group:</span>
                          <span class="text-sm font-medium cyan-text">${patient.blood_group || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-sm cyan-text opacity-75">Last Visit:</span>
                          <span class="text-sm cyan-text">${patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span class="status-badge status-active">
                          Active
                        </span>
                        <div class="flex space-x-2">
                          <button class="w-10 h-10 cyan-bg rounded-full flex items-center justify-center text-white view-patient-btn" data-patient-id="${patient.patient_id}" title="View Profile">
                            <i class="fas fa-user-md"></i>
                          </button>
                          <button class="w-10 h-10 cyan-dark rounded-full flex items-center justify-center text-white message-patient-btn" data-patient-id="${patient.patient_id}" data-patient-name="${patient.full_name}" title="Message">
                            <i class="fas fa-comment"></i>
                          </button>
                          <button class="w-10 h-10 btn-white rounded-full flex items-center justify-center cyan-text prescribe-btn" data-patient-id="${patient.patient_id}" data-patient-name="${patient.full_name}" title="Prescribe">
                            <i class="fas fa-prescription"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  `).join('') : '<p class="text-center text-gray-500 py-8 col-span-3">No patients found</p>'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Profile Modal -->
      <div id="profileModal" class="fixed inset-0 bg-white/95 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
        <div class="white-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold cyan-text">Doctor Profile</h2>
            <button id="closeModal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <div class="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
            <div class="w-32 h-32 cyan-bg rounded-full flex items-center justify-center text-4xl font-bold text-white">
              ${doctorData && doctorData.name ? doctorData.name.split(' ').map(n => n[0]).join('') : 'DR'}
            </div>
            <div class="flex-1">
              <h3 class="text-3xl font-bold cyan-text">${doctorData && doctorData.name ? doctorData.name : 'Doctor'}</h3>
              <p class="text-xl cyan-text opacity-80 mt-1">${doctorData && doctorData.designation ? doctorData.designation : 'Doctor'}</p>
              <p class="text-gray-600 mt-2">${doctorData && doctorData.qualification ? doctorData.qualification : ''}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            ${Object.entries({
              'Doctor ID': doctorData.doctor_uuid || doctorData.id,
              'Specialization': doctorData.specialization,
              'Experience': doctorData.experience,
              'Consultation Fee': doctorData.consultation_fee || doctorData.consultationFee,
              'Available Days': doctorData.available_days ? doctorData.available_days.join(', ') : (doctorData.availableDays ? doctorData.availableDays.join(', ') : ''),
              'Available Time': doctorData.available_time || doctorData.availableTime,
              'Email': doctorData.email,
              'Contact': doctorData.contact
            }).map(([key, value]) => `
              <div class="cyan-light p-4 rounded-xl">
                <p class="text-sm cyan-text">${key}</p>
                <p class="font-semibold">${value}</p>
              </div>
            `).join('')}
          </div>
          
          <div class="flex justify-end space-x-4">
            <button id="editProfileModalBtn" class="px-6 py-3 btn-cyan rounded-lg">
              <i class="fas fa-edit mr-2"></i>Edit Profile
            </button>
            <button id="logoutModalBtn" class="px-6 py-3 btn-red rounded-lg">
              <i class="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
          </div>
        </div>
      </div>
      
      <!-- Edit Profile Modal -->
      <div id="editProfileModal" class="fixed inset-0 bg-white/95 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
        <div class="white-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold cyan-text">Edit Profile</h2>
            <button id="closeEditModal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <form id="editProfileForm" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Full Name</label>
                <input type="text" id="editName" value="${doctorData.name}" class="form-input">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Designation</label>
                <input type="text" id="editDesignation" value="${doctorData.designation}" class="form-input">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Specialization</label>
                <input type="text" id="editSpecialization" value="${doctorData.specialization}" class="form-input">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Experience</label>
                <input type="text" id="editExperience" value="${doctorData.experience}" class="form-input">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Qualification</label>
                <input type="text" id="editQualification" value="${doctorData.qualification}" class="form-input">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Email</label>
                <input type="email" id="editEmail" value="${doctorData.email}" class="form-input">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Contact</label>
                <input type="text" id="editContact" value="${doctorData.contact}" class="form-input">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Consultation Fee</label>
                <input type="text" id="editFee" value="${doctorData.consultation_fee || doctorData.consultationFee}" class="form-input">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Available Days</label>
                <input type="text" id="editDays" value="${doctorData.available_days ? doctorData.available_days.join(', ') : (doctorData.availableDays ? doctorData.availableDays.join(', ') : '')}" class="form-input" placeholder="e.g. Mon, Wed, Fri">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Available Time</label>
                <input type="text" id="editTime" value="${doctorData.available_time || doctorData.availableTime}" class="form-input" placeholder="e.g. 9:00 AM - 5:00 PM">
              </div>
            </div>
            
            <div class="mt-6">
              <label class="block text-sm font-medium cyan-text mb-2">Address</label>
              <textarea id="editAddress" rows="3" class="form-input">${doctorData.address}</textarea>
            </div>
            
            <div class="flex justify-end space-x-4 mt-8">
              <button type="button" id="cancelEditBtn" class="px-6 py-3 btn-white rounded-lg">
                Cancel
              </button>
              <button type="submit" class="px-6 py-3 btn-cyan rounded-lg">
                <i class="fas fa-save mr-2"></i>Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Add Patient Modal -->
      <div id="addPatientModal" class="fixed inset-0 bg-white/95 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
        <div class="white-card rounded-2xl p-8 max-w-2xl w-full">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold cyan-text">Add New Patient</h2>
            <button id="closeAddPatientModal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <form id="addPatientForm" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Full Name *</label>
                <input type="text" id="newPatientName" required class="form-input" placeholder="Enter full name">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Email *</label>
                <input type="email" id="newPatientEmail" required class="form-input" placeholder="Enter email">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Phone *</label>
                <input type="tel" id="newPatientPhone" required class="form-input" placeholder="Enter phone number">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Date of Birth *</label>
                <input type="date" id="newPatientDob" required class="form-input">
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Gender</label>
                <select id="newPatientGender" class="form-select">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium cyan-text mb-2">Blood Group</label>
                <select id="newPatientBloodGroup" class="form-select">
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium cyan-text mb-2">Address</label>
              <textarea id="newPatientAddress" rows="2" class="form-input" placeholder="Enter address"></textarea>
            </div>
            
            <div class="border-t border-gray-200 my-4 pt-4">
              <h3 class="text-lg font-semibold cyan-text mb-4">Emergency Contact</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium cyan-text mb-2">Emergency Contact Name</label>
                  <input type="text" id="newPatientEmergencyName" class="form-input" placeholder="Enter name">
                </div>
                <div>
                  <label class="block text-sm font-medium cyan-text mb-2">Emergency Contact Phone</label>
                  <input type="tel" id="newPatientEmergencyPhone" class="form-input" placeholder="Enter phone">
                </div>
              </div>
            </div>
            
            <div class="flex justify-end space-x-4 mt-6">
              <button type="button" id="cancelAddPatientBtn" class="px-6 py-3 btn-white rounded-lg">
                Cancel
              </button>
              <button type="submit" class="px-6 py-3 btn-cyan rounded-lg">
                <i class="fas fa-user-plus mr-2"></i>Add Patient
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Add Appointment Slot Modal -->
      <div id="addSlotModal" class="fixed inset-0 bg-white/95 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
        <div class="white-card rounded-2xl p-8 max-w-md w-full">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold cyan-text">Add Appointment Slot</h2>
            <button id="closeAddSlotModal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <form id="addSlotForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium cyan-text mb-2">Date *</label>
              <input type="date" id="slotDate" required class="form-input">
            </div>
            
            <div>
              <label class="block text-sm font-medium cyan-text mb-2">Time *</label>
              <input type="time" id="slotTime" required class="form-input">
            </div>
            
            <div>
              <label class="block text-sm font-medium cyan-text mb-2">Duration (minutes)</label>
              <select id="slotDuration" class="form-select">
                <option value="15">15 minutes</option>
                <option value="30" selected>30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium cyan-text mb-2">Appointment Type</label>
              <select id="slotType" class="form-select">
                <option value="in-person">In-person</option>
                <option value="online">Online Consultation</option>
              </select>
            </div>
            
            <div class="flex justify-end space-x-4 mt-6">
              <button type="button" id="cancelAddSlotBtn" class="px-6 py-3 btn-white rounded-lg">
                Cancel
              </button>
              <button type="submit" class="px-6 py-3 btn-cyan rounded-lg">
                <i class="fas fa-plus mr-2"></i>Add Slot
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Filter Modal -->
      <div id="filterModal" class="fixed inset-0 bg-white/95 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
        <div class="white-card rounded-2xl p-8 max-w-md w-full">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold cyan-text">Filter Options</h2>
            <button id="closeFilterModal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium cyan-text mb-2">Status</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="checkbox" id="filterConfirmed" class="mr-2"> Confirmed
                </label>
                <label class="flex items-center">
                  <input type="checkbox" id="filterPending" class="mr-2"> Pending
                </label>
                <label class="flex items-center">
                  <input type="checkbox" id="filterCancelled" class="mr-2"> Cancelled
                </label>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium cyan-text mb-2">Type</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="checkbox" id="filterInPerson" class="mr-2"> In-person
                </label>
                <label class="flex items-center">
                  <input type="checkbox" id="filterOnline" class="mr-2"> Online
                </label>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium cyan-text mb-2">Date Range</label>
              <select id="filterDateRange" class="form-select">
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="thisWeek">This Week</option>
                <option value="nextWeek">Next Week</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            <div class="flex justify-end space-x-4 mt-6">
              <button id="clearFilters" class="px-4 py-2 btn-white rounded-lg">
                Clear
              </button>
              <button id="applyFilters" class="px-4 py-2 btn-cyan rounded-lg">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Upload Report Modal -->
      <div id="uploadReportModal" class="fixed inset-0 bg-white/95 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
        <div class="white-card rounded-2xl p-8 max-w-2xl w-full">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold cyan-text">Upload Lab Report</h2>
            <button id="closeUploadModal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <form id="uploadReportForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium cyan-text mb-2">Select Patient *</label>
              <select id="uploadPatientId" required class="form-select">
                <option value="">Choose a patient</option>
                ${patients.map(patient => `
                  <option value="${patient.patient_id}">${patient.full_name} (${patient.patient_uuid || 'N/A'})</option>
                `).join('')}
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium cyan-text mb-2">Test Type *</label>
              <input type="text" id="uploadTestType" required class="form-input" placeholder="e.g. Blood Test, X-Ray, ECG">
            </div>
            
            <div>
              <label class="block text-sm font-medium cyan-text mb-2">Test Date *</label>
              <input type="date" id="uploadTestDate" required class="form-input">
            </div>
            
            <div>
              <label class="block text-sm font-medium cyan-text mb-2">Findings</label>
              <textarea id="uploadFindings" rows="4" class="form-input" placeholder="Enter test findings..."></textarea>
            </div>
            
            <div class="flex justify-end space-x-4 mt-6">
              <button type="button" id="cancelUploadBtn" class="px-6 py-3 btn-white rounded-lg">
                Cancel
              </button>
              <button type="submit" class="px-6 py-3 btn-cyan rounded-lg">
                <i class="fas fa-upload mr-2"></i>Upload Report
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Prescription Modal -->
      <div id="prescriptionModal" class="fixed inset-0 bg-white/95 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
        <div class="white-card rounded-2xl p-8 max-w-2xl w-full">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold cyan-text">Write Prescription</h2>
            <button id="closePrescriptionModal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <form id="prescriptionForm">
            <input type="hidden" id="prescriptionPatientId">
            <div class="mb-4">
              <label class="block text-sm font-medium cyan-text mb-2">Patient</label>
              <input type="text" id="prescriptionPatientName" readonly class="form-input bg-gray-50">
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium cyan-text mb-2">Diagnosis</label>
              <textarea id="prescriptionDiagnosis" rows="2" class="form-input" placeholder="Enter diagnosis..."></textarea>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium cyan-text mb-2">Medications</label>
              <div id="medicationsList">
                <div class="flex gap-2 mb-2 medication-row">
                  <input type="text" placeholder="Medication name" class="form-input flex-1 medication-name">
                  <input type="text" placeholder="Dosage" class="form-input w-24 medication-dosage">
                  <input type="text" placeholder="Frequency" class="form-input w-24 medication-frequency">
                  <button type="button" class="text-red-500 remove-medication"><i class="fas fa-times"></i></button>
                </div>
              </div>
              <button type="button" id="addMedicationBtn" class="text-sm cyan-text mt-2">
                <i class="fas fa-plus mr-1"></i>Add Medication
              </button>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium cyan-text mb-2">Additional Notes</label>
              <textarea id="prescriptionNotes" rows="3" class="form-input" placeholder="Any additional instructions..."></textarea>
            </div>
            
            <div class="flex justify-end space-x-4 mt-6">
              <button type="button" id="cancelPrescriptionBtn" class="px-6 py-3 btn-white rounded-lg">
                Cancel
              </button>
              <button type="submit" class="px-6 py-3 btn-cyan rounded-lg">
                <i class="fas fa-prescription mr-2"></i>Save Prescription
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Logout Confirm Modal -->
      <div id="logoutConfirmModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden p-4">
        <div class="bg-white rounded-2xl p-6 max-w-md w-full">
          <div class="text-center mb-4">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="fas fa-sign-out-alt text-2xl text-red-600"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Confirm Logout</h3>
            <p class="text-gray-600 text-sm">Are you sure you want to logout?</p>
          </div>
          
          <div class="flex space-x-3">
            <button id="cancelLogout" class="flex-1 px-4 py-2 btn-white rounded-lg">
              Cancel
            </button>
            <button id="confirmLogout" class="flex-1 px-4 py-2 btn-red rounded-lg">
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <!-- Toast Notification -->
      <div id="toast" class="fixed bottom-4 right-4 white-card rounded-lg p-4 max-w-sm hidden z-50 fade-in">
        <div class="flex items-center">
          <i id="toastIcon" class="fas fa-info-circle cyan-text mr-3"></i>
          <div>
            <p id="toastTitle" class="font-semibold cyan-text"></p>
            <p id="toastMessage" class="text-sm text-gray-600"></p>
          </div>
          <button id="closeToast" class="ml-auto text-gray-400 hover:text-gray-600">&times;</button>
        </div>
      </div>
      
      <script>
        // Store data for JavaScript functions
        const patientsData = ${JSON.stringify(patients)};
        const reportsData = ${JSON.stringify(labReports)};
        const appointmentsData = ${JSON.stringify(todaysAppointments)};

        document.addEventListener('DOMContentLoaded', function() {
          // Menu Navigation
          const menuItems = document.querySelectorAll('.menu-item');
          const contentSections = {
            appointments: document.getElementById('appointmentsContent'),
            'lab-reports': document.getElementById('labReportsContent'),
            patients: document.getElementById('patientsContent')
          };
          
          menuItems.forEach(item => {
            item.addEventListener('click', function() {
              const section = this.dataset.section;
              
              menuItems.forEach(i => i.classList.remove('active'));
              this.classList.add('active');
              
              Object.values(contentSections).forEach(sec => sec.classList.add('hidden'));
              contentSections[section].classList.remove('hidden');
              contentSections[section].classList.add('fade-in');
              
              setTimeout(() => {
                contentSections[section].classList.remove('fade-in');
              }, 600);
              
              const sectionName = this.querySelector('.font-semibold').textContent;
              showToast('Section Changed', \`Viewing \${sectionName}\`);
            });
          });
          
          // Profile Modal
          const profileModal = document.getElementById('profileModal');
          const editProfileModal = document.getElementById('editProfileModal');
          const addPatientModal = document.getElementById('addPatientModal');
          const addSlotModal = document.getElementById('addSlotModal');
          const filterModal = document.getElementById('filterModal');
          const uploadReportModal = document.getElementById('uploadReportModal');
          const prescriptionModal = document.getElementById('prescriptionModal');
          const logoutConfirmModal = document.getElementById('logoutConfirmModal');
          
          const profileBtn = document.getElementById('profileBtn');
          const editProfileHeaderBtn = document.getElementById('editProfileHeaderBtn');
          const editProfileModalBtn = document.getElementById('editProfileModalBtn');
          const closeModal = document.getElementById('closeModal');
          const closeEditModal = document.getElementById('closeEditModal');
          const cancelEditBtn = document.getElementById('cancelEditBtn');
          
          // Add Patient Button
          document.getElementById('addPatientBtn')?.addEventListener('click', () => {
            addPatientModal.classList.remove('hidden');
          });
          
          document.getElementById('closeAddPatientModal')?.addEventListener('click', () => {
            addPatientModal.classList.add('hidden');
          });
          
          document.getElementById('cancelAddPatientBtn')?.addEventListener('click', () => {
            addPatientModal.classList.add('hidden');
          });
          
          // Add Patient Form
          document.getElementById('addPatientForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Success', 'Patient added successfully!', 'success');
            addPatientModal.classList.add('hidden');
            e.target.reset();
          });
          
          // Add Appointment Slot
          document.getElementById('addAppointmentSlot')?.addEventListener('click', () => {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('slotDate').min = today;
            addSlotModal.classList.remove('hidden');
          });
          
          document.getElementById('closeAddSlotModal')?.addEventListener('click', () => {
            addSlotModal.classList.add('hidden');
          });
          
          document.getElementById('cancelAddSlotBtn')?.addEventListener('click', () => {
            addSlotModal.classList.add('hidden');
          });
          
          document.getElementById('addSlotForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Success', 'Appointment slot added successfully!', 'success');
            addSlotModal.classList.add('hidden');
            e.target.reset();
          });
          
          // Filter Modals
          document.getElementById('filterAppointments')?.addEventListener('click', () => {
            filterModal.classList.remove('hidden');
          });
          
          document.getElementById('filterReports')?.addEventListener('click', () => {
            filterModal.classList.remove('hidden');
          });
          
          document.getElementById('closeFilterModal')?.addEventListener('click', () => {
            filterModal.classList.add('hidden');
          });
          
          document.getElementById('applyFilters')?.addEventListener('click', () => {
            showToast('Success', 'Filters applied successfully!', 'success');
            filterModal.classList.add('hidden');
          });
          
          document.getElementById('clearFilters')?.addEventListener('click', () => {
            document.querySelectorAll('#filterModal input[type="checkbox"]').forEach(cb => cb.checked = false);
            document.getElementById('filterDateRange').value = 'today';
            showToast('Success', 'Filters cleared', 'info');
          });
          
          // Upload Report
          document.getElementById('uploadReportBtn')?.addEventListener('click', () => {
            document.getElementById('uploadTestDate').valueAsDate = new Date();
            uploadReportModal.classList.remove('hidden');
          });
          
          document.getElementById('closeUploadModal')?.addEventListener('click', () => {
            uploadReportModal.classList.add('hidden');
          });
          
          document.getElementById('cancelUploadBtn')?.addEventListener('click', () => {
            uploadReportModal.classList.add('hidden');
          });
          
          document.getElementById('uploadReportForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Success', 'Report uploaded successfully!', 'success');
            uploadReportModal.classList.add('hidden');
            e.target.reset();
          });
          
          // Prescription Modal
          document.querySelectorAll('.prescribe-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const patientId = this.dataset.patientId;
              const patientName = this.dataset.patientName;
              
              document.getElementById('prescriptionPatientId').value = patientId;
              document.getElementById('prescriptionPatientName').value = patientName;
              
              prescriptionModal.classList.remove('hidden');
            });
          });
          
          document.getElementById('closePrescriptionModal')?.addEventListener('click', () => {
            prescriptionModal.classList.add('hidden');
          });
          
          document.getElementById('cancelPrescriptionBtn')?.addEventListener('click', () => {
            prescriptionModal.classList.add('hidden');
          });
          
          document.getElementById('prescriptionForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Success', 'Prescription saved successfully!', 'success');
            prescriptionModal.classList.add('hidden');
            e.target.reset();
          });
          
          // Add Medication
          document.getElementById('addMedicationBtn')?.addEventListener('click', () => {
            const medicationsList = document.getElementById('medicationsList');
            const newRow = document.createElement('div');
            newRow.className = 'flex gap-2 mb-2 medication-row';
            newRow.innerHTML = \`
              <input type="text" placeholder="Medication name" class="form-input flex-1 medication-name">
              <input type="text" placeholder="Dosage" class="form-input w-24 medication-dosage">
              <input type="text" placeholder="Frequency" class="form-input w-24 medication-frequency">
              <button type="button" class="text-red-500 remove-medication"><i class="fas fa-times"></i></button>
            \`;
            medicationsList.appendChild(newRow);
            attachMedicationEvents();
          });
          
          function attachMedicationEvents() {
            document.querySelectorAll('.remove-medication').forEach(btn => {
              btn.addEventListener('click', function() {
                if (document.querySelectorAll('.medication-row').length > 1) {
                  this.closest('.medication-row').remove();
                } else {
                  showToast('Warning', 'At least one medication is required', 'warning');
                }
              });
            });
          }
          
          attachMedicationEvents();
          
          profileBtn.addEventListener('click', () => {
            profileModal.classList.remove('hidden');
          });
          
          editProfileHeaderBtn.addEventListener('click', () => {
            editProfileModal.classList.remove('hidden');
          });
          
          editProfileModalBtn.addEventListener('click', () => {
            profileModal.classList.add('hidden');
            editProfileModal.classList.remove('hidden');
          });
          
          function closeAllModals() {
            profileModal.classList.add('hidden');
            editProfileModal.classList.add('hidden');
            addPatientModal.classList.add('hidden');
            addSlotModal.classList.add('hidden');
            filterModal.classList.add('hidden');
            uploadReportModal.classList.add('hidden');
            prescriptionModal.classList.add('hidden');
            logoutConfirmModal.classList.add('hidden');
          }
          
          closeModal.addEventListener('click', closeAllModals);
          closeEditModal.addEventListener('click', closeAllModals);
          cancelEditBtn.addEventListener('click', closeAllModals);
          
          [profileModal, editProfileModal, addPatientModal, addSlotModal, filterModal, uploadReportModal, prescriptionModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
              if (e.target === modal) {
                closeAllModals();
              }
            });
          });
          
          // Edit Profile Form
          document.getElementById('editProfileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Success', 'Profile updated successfully!', 'success');
            editProfileModal.classList.add('hidden');
          });
          
          // Logout functionality
          const logoutHeaderBtn = document.getElementById('logoutHeaderBtn');
          const logoutModalBtn = document.getElementById('logoutModalBtn');
          const cancelLogout = document.getElementById('cancelLogout');
          const confirmLogout = document.getElementById('confirmLogout');
          
          function showLogoutConfirm() {
            logoutConfirmModal.classList.remove('hidden');
          }
          
          logoutHeaderBtn.addEventListener('click', showLogoutConfirm);
          logoutModalBtn.addEventListener('click', showLogoutConfirm);
          
          cancelLogout.addEventListener('click', () => {
            logoutConfirmModal.classList.add('hidden');
          });
          
          confirmLogout.addEventListener('click', async () => {
            try {
              await fetch('/api/logout', { method: 'POST' });
              window.location.href = '/';
            } catch (error) {
              window.location.href = '/';
            }
          });
          
          logoutConfirmModal.addEventListener('click', (e) => {
            if (e.target === logoutConfirmModal) {
              logoutConfirmModal.classList.add('hidden');
            }
          });
          
          // Quick Actions
          document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', function() {
              const action = this.dataset.action;
              
              switch(action) {
                case 'online-consult':
                  showToast('Online Consult', 'Opening video consultation platform...', 'info');
                  break;
                case 'prescription':
                  showToast('Write Prescription', 'Select a patient to write prescription', 'info');
                  document.querySelector('[data-section="patients"]').click();
                  break;
                case 'analytics':
                  showToast('Analytics', 'Loading practice analytics...', 'info');
                  break;
                case 'settings':
                  showToast('Settings', 'Opening doctor settings...', 'info');
                  editProfileHeaderBtn.click();
                  break;
              }
            });
          });
          
          // Appointments
          document.querySelectorAll('.start-consult-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const appointmentId = this.dataset.id;
              const patientName = this.dataset.patient;
              showToast('Consultation Started', \`Starting consultation with \${patientName}\`, 'success');
            });
          });
          
          document.querySelectorAll('.reschedule-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const appointmentId = this.dataset.id;
              showToast('Reschedule', \`Opening reschedule options for appointment \${appointmentId}\`, 'info');
            });
          });
          
          document.querySelectorAll('.video-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const appointmentId = this.dataset.id;
              showToast('Video Call', 'Initiating video consultation...', 'info');
            });
          });
          
          document.querySelectorAll('.view-patient-history').forEach(btn => {
            btn.addEventListener('click', function() {
              const patientId = this.dataset.patientId;
              showToast('Patient History', \`Loading medical history for patient \${patientId}\`, 'info');
            });
          });
          
          document.querySelectorAll('.message-patient').forEach(btn => {
            btn.addEventListener('click', function() {
              const patientName = this.dataset.patientName;
              showToast('Message', \`Opening chat with \${patientName}\`, 'info');
            });
          });
          
          // Lab Reports
          document.querySelectorAll('.view-report-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const reportId = this.dataset.id;
              const report = reportsData.find(r => r.report_id == reportId);
              if (report) {
                showToast('View Report', \`Opening report for \${report.patient_name}\`, 'info');
              }
            });
          });
          
          document.querySelectorAll('.write-findings-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const reportId = this.dataset.id;
              showToast('Add Findings', \`Opening editor for report \${reportId}\`, 'success');
            });
          });
          
          document.querySelectorAll('.download-report').forEach(btn => {
            btn.addEventListener('click', function() {
              const reportId = this.dataset.id;
              showToast('Download', \`Downloading report \${reportId}\`, 'info');
            });
          });
          
          document.querySelectorAll('.share-report').forEach(btn => {
            btn.addEventListener('click', function() {
              const reportId = this.dataset.id;
              showToast('Share', \`Opening share options for report \${reportId}\`, 'info');
            });
          });
          
          // Patients
          document.querySelectorAll('.view-patient-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const patientId = this.dataset.patientId;
              showToast('Patient Profile', \`Opening profile of patient \${patientId}\`, 'info');
            });
          });
          
          document.querySelectorAll('.message-patient-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const patientName = this.dataset.patientName;
              showToast('Message', \`Opening chat with \${patientName}\`, 'info');
            });
          });
          
          // Patient Search
          document.getElementById('patientSearch')?.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            document.querySelectorAll('.patient-card').forEach(card => {
              const patientName = card.querySelector('.patient-name').textContent.toLowerCase();
              if (patientName.includes(searchTerm)) {
                card.style.display = 'block';
              } else {
                card.style.display = 'none';
              }
            });
          });
          
          // Toast notification system
          const toast = document.getElementById('toast');
          const toastTitle = document.getElementById('toastTitle');
          const toastMessage = document.getElementById('toastMessage');
          const toastIcon = document.getElementById('toastIcon');
          
          window.showToast = function(title, message, type = 'info') {
            toastTitle.textContent = title;
            toastMessage.textContent = message;
            
            const icons = {
              'success': 'fa-check-circle',
              'error': 'fa-exclamation-circle',
              'warning': 'fa-exclamation-triangle',
              'info': 'fa-info-circle'
            };
            
            ['fa-check-circle', 'fa-exclamation-circle', 'fa-exclamation-triangle', 'fa-info-circle']
              .forEach(cls => toastIcon.classList.remove(cls));
            
            toastIcon.classList.add(icons[type] || 'fa-info-circle');
            toastIcon.classList.add('cyan-text');
            
            toast.classList.remove('hidden');
            toast.classList.add('fade-in');
            
            setTimeout(() => {
              toast.classList.add('hidden');
              toast.classList.remove('fade-in');
            }, 4000);
          };
          
          document.getElementById('closeToast').addEventListener('click', () => {
            toast.classList.add('hidden');
            toast.classList.remove('fade-in');
          });
          
          // Welcome message
          setTimeout(() => {
            showToast('Welcome Doctor', 'Your dashboard is ready! Have a productive day.', 'success');
          }, 1000);
        });
      </script>
    </body>
    </html>
  `;
}

// ============================================
// EXPORT FUNCTION for signin.js to use
// ============================================
module.exports = async function renderDoctorDashboard(userId) {
  try {
    console.log('🔍 Starting renderDoctorDashboard for user:', userId);
    
    // Get doctor data using the user_id from the logged-in user
    const doctorResult = await query(
      `SELECT d.*, u.email 
       FROM doctors d
       JOIN users u ON d.user_id = u.user_id
       WHERE d.user_id = $1`,
      [userId]
    );
    
    console.log('📋 Doctor query result:', {
      rowCount: doctorResult.rows.length,
      doctorData: doctorResult.rows[0] || 'No doctor found'
    });
    
    if (!doctorResult.rows[0]) {
      console.log('⚠️ No doctor found for user:', userId);
      return '<h1>Error: Doctor profile not found</h1><p>Please contact support.</p>';
    }
    
    const doctor = doctorResult.rows[0];
    const doctorId = doctor.doctor_id;
    console.log('🆔 Doctor ID:', doctorId);
    
    // Run queries in parallel for better performance
    const [appointmentsResult, reportsResult, patientsResult] = await Promise.all([
      // Get today's appointments for this doctor
      query(
        `SELECT a.*, p.full_name as patient_name, p.patient_uuid, p.patient_id
         FROM appointments a
         JOIN patients p ON a.patient_id = p.patient_id
         WHERE a.doctor_id = $1 AND a.appointment_date = CURRENT_DATE
         ORDER BY a.appointment_time`,
        [doctorId]
      ),
      // Get pending lab reports
      query(
        `SELECT r.*, p.full_name as patient_name, p.patient_uuid, p.patient_id
         FROM lab_reports r
         JOIN patients p ON r.patient_id = p.patient_id
         WHERE r.doctor_id = $1 AND r.status = 'pending'
         ORDER BY r.created_at DESC`,
        [doctorId]
      ),
      // Get patients for this doctor
      query(
        `SELECT DISTINCT p.*, 
          (SELECT MAX(appointment_date) FROM appointments WHERE patient_id = p.patient_id AND doctor_id = $1) as last_visit
         FROM patients p
         JOIN appointments a ON p.patient_id = a.patient_id
         WHERE a.doctor_id = $1
         ORDER BY p.full_name`,
        [doctorId]
      )
    ]);
    
    console.log('📅 Appointments found:', appointmentsResult.rows.length);
    console.log('📄 Reports found:', reportsResult.rows.length);
    console.log('👥 Patients found:', patientsResult.rows.length);
    
    console.log('🎨 Generating HTML...');
    const html = generateDoctorHTML(
      doctor,
      appointmentsResult.rows || [],
      reportsResult.rows || [],
      patientsResult.rows || []
    );
    
    console.log('✅ HTML generated successfully');
    return html;
    
  } catch (error) {
    console.error('❌ Error loading doctor dashboard:', error);
    return '<h1>Error loading dashboard</h1><p>Please try again later.</p>';
  }
};