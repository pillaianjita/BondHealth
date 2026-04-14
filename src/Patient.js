const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const { query } = require('./db/config');

const patient = {};

const appointments = [];

// Enhanced doctors data
const doctors = [];

const hospitals = [];

const reports = [];

const prescriptions = [];


/*
app.get('/api/patient', (req, res) => {
  res.json(patient);
});

app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

app.get('/api/doctors', (req, res) => {
  res.json(doctors);
});

app.get('/api/hospitals', (req, res) => {
  res.json(hospitals);
});

app.get('/api/reports', (req, res) => {
  res.json(reports);
});

app.get('/api/prescriptions', (req, res) => {
  res.json(prescriptions);
});

app.post('/api/appointments', (req, res) => {
  const newAppointment = {
    id: `APT-${Date.now()}`,
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  appointments.push(newAppointment);
  res.status(201).json(newAppointment);
});
*/
app.put('/api/patient', (req, res) => {
  Object.assign(patient, req.body);
  res.json(patient);
});

// ============================================
// FUNCTION TO GENERATE HTML - MOVED OUT OF app.get()
// ============================================
function generatePatientHTML(patientData = null, appointmentsData = [], reportsData = [], prescriptionsData = []) {
    // Map database fields to the format expected by the template
    console.log('🎯 generatePatientHTML called with:', {
        patientData: patientData ? 'Data present' : 'No data',
        appointmentsCount: appointmentsData.length,
        reportsCount: reportsData.length,
        prescriptionsCount: prescriptionsData.length
    });
    
    let patient = patientData ? {
        id: patientData.patient_uuid || 'Unknown ID',
        name: patientData.full_name || 'Name not provided',
        age: patientData.date_of_birth ? calculateAge(patientData.date_of_birth) : 'Date of Birth not provided',
        gender: patientData.gender || 'Gender not provided',
        bloodType: patientData.blood_type || 'Blood Group not provided',
        email: patientData.email ||'Email not provided',
        contact: patientData.phone || 'Phone not provided',
        address: patientData.address || 'Address not provided',
        emergencyContact: (() => {
        const name = patientData.emergency_contact_name;
        const phone = patientData.emergency_contact_phone;
        
        if (name && phone) return `${name} - ${phone}`;
        if (name) return `${name} (no phone provided)`;
        if (phone) return `Emergency contact phone: ${phone} (name not provided)`;
        return 'Emergency contact not provided';
    })(),
    
    // Medical conditions
    conditions: (() => {
        if (Array.isArray(patientData.medical_conditions) && patientData.medical_conditions.length > 0) {
            return patientData.medical_conditions;
        }
        return ['No medical conditions reported'];
    })(),
    
    // Allergies
    allergies: (() => {
        if (Array.isArray(patientData.allergies) && patientData.allergies.length > 0) {
            return patientData.allergies;
        }
        return ['No allergies reported'];
    })(),
    
    // Dates
    lastVisit: patientData.last_visit || 'No previous visits',
    nextAppointment: patientData.next_appointment || 'No upcoming appointments'
    
} : null;

    // Helper function to calculate age from date of birth
    function calculateAge(dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    // Map appointments data
    const appointments = appointmentsData.map(apt => ({
        id: apt.appointment_uuid || apt.appointment_id,
        doctor: apt.doctor || 'Dr. Sarah Chen',
        doctor_id: apt.doctor_id,
        specialization: apt.specialization || 'Cardiology',
        reason: apt.reason || 'Regular checkup',
        status: apt.status || 'confirmed',
        date: apt.appointment_date || new Date().toISOString().split('T')[0],
        time: apt.appointment_time || '10:30 AM',
        location: apt.location || 'Room 304, Cardiology Wing',
        notes: apt.notes || ''
    }));

    // Map reports data
    const reports = reportsData.map(rep => ({
        id: rep.report_uuid || rep.report_id,
        name: rep.test_type || 'Medical Report',
        type: rep.test_type?.toLowerCase().includes('blood') ? 'lab' : 'general',
        date: rep.test_date || rep.created_at || new Date().toISOString().split('T')[0],
        results: rep.results || 'Results pending',
        findings: rep.findings || 'No findings recorded',
        doctor: 'Dr. Sarah Chen',
        file_url: rep.file_url || '#'
    }));

    // Map prescriptions data
    const prescriptions = prescriptionsData.map(rx => ({
        id: rx.prescription_uuid || rx.prescription_id,
        medicine: rx.medicine_name || 'Medication',
        dosage: rx.dosage || 'As prescribed',
        frequency: rx.frequency || 'Daily',
        validUntil: rx.valid_until || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        instructions: rx.instructions || 'Take with food',
        refills: 2
    }));

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BondHealth - Patient Portal</title>
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
          background: linear-gradient(135deg, #ffffff 0%, #f7feff 100%);
          overflow-x: hidden;
        }
        
        .cyan-bg {
          background: #28b8b8;
        }
        
        .cyan-light {
          background: rgba(0, 229, 255, 0.06);
        }
        
        .cyan-dark {
          background: #1ebce8;
        }
        
        .cyan-text {
          color: #159eb0;
        }
        
        .cyan-border {
          border-color: #0f9ec6;
        }
        
        .white-card {
          background: white;
          box-shadow: 0 10px 40px rgba(0, 255, 255, 0.1);
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
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 255, 255, 0.1));
          animation: float 20s infinite linear;
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
          animation-delay: -5s;
        }
        
        .floating-circle:nth-child(3) {
          width: 150px;
          height: 150px;
          bottom: -50px;
          left: 30%;
          animation-delay: -10s;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(50px, 50px) rotate(90deg);
          }
          50% {
            transform: translate(0, 100px) rotate(180deg);
          }
          75% {
            transform: translate(-50px, 50px) rotate(270deg);
          }
        }
        
        .wave-line {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100px;
          background: linear-gradient(90deg, 
            rgba(0, 255, 255, 0.2) 0%, 
            rgba(0, 204, 204, 0.3) 25%, 
            rgba(0, 128, 128, 0.2) 50%, 
            rgba(0, 102, 102, 0.3) 75%, 
            rgba(0, 255, 255, 0.2) 100%);
          opacity: 0.3;
          animation: wave 10s infinite ease-in-out;
        }
        
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(50px); }
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
          box-shadow: 0 20px 40px rgba(0, 255, 255, 0.15);
        }
        
        .menu-item {
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
        }
        
        .menu-item:hover {
          border-left-color: #11b1dd;
          background: rgba(0, 255, 255, 0.05);
        }
        
        .menu-item.active {
          border-left-color: #19a9d1;
          background: rgba(0, 255, 255, 0.1);
        }
        
        .btn-cyan {
          background: #0099cc;
          color: #00363a;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .btn-cyan:hover {
          background: #0c818f;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 229, 255, 0.4);
        }
        
        .btn-white {
          background: white;
          color: #10a6ba;
          border: 2px solid #0099cc;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .btn-white:hover {
          background: #0099cc;
          color: #00363a;
        }
        
        .btn-logout {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .btn-logout:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid;
          box-shadow: 0 8px 32px;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(0, 229, 255, 0.1);
          border-radius: 10px;
          margin: 8px 0; 
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #1ebce8;
          border-radius: 10px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #159eb0;;
        }
        
        .text-cyan-gradient {
          background: linear-gradient(135deg, #0e95ba, #1599be);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .modal-backdrop {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(5px);
        }
        
        .filter-chip {
          transition: all 0.3s ease;
        }
        
        .filter-chip:hover {
          background: #13a0c7;
          color: white;
          transform: translateY(-1px);
        }
        
        .filter-chip.active {
          background: #1492b5;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 229, 255, 0.3);
        }
        
        .book-btn {
          background: linear-gradient(135deg, #118bad 0%, #0099cc 100%);
          transition: all 0.3s ease;
        }
        
        .book-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 30px rgba(0, 229, 255, 0.4);
        }
        
        .time-slot {
          transition: all 0.3s ease;
        }
        
        .time-slot:hover {
          transform: scale(1.05);
          border-color: #18a0c6;
          background: rgba(0, 229, 255, 0.1);
        }
        
        .time-slot.selected {
          background: #15aed8;
          color: white;
          border-color: #1e9dc0;
          box-shadow: 0 4px 12px rgba(0, 229, 255, 0.3);
        }
        
        .doctor-card {
          transition: all 0.3s ease;
        }
        
        .doctor-card:hover {
          border-color: #179abf;
          box-shadow: 0 15px 35px rgba(0, 229, 255, 0.1);
        }
        
        .hospital-card {
          transition: all 0.3s ease;
        }
        
        .hospital-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 229, 255, 0.1);
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease forwards;
        }
        
        .modal-overlay {
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
        }
        
        .report-card {
          transition: all 0.3s ease;
        }
        
        .report-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0, 229, 255, 0.15);
        }
        
        .prescription-card {
          transition: all 0.3s ease;
        }
        
        .prescription-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0, 229, 255, 0.15);
        }
        
        .file-upload-area {
          transition: all 0.3s ease;
        }
        
        .file-upload-area:hover {
          border-color: #0099cc;
          background: rgba(0, 229, 255, 0.02);
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
          
          .carousel-card {
            width: 100% !important;
          }
        }
        
        .modal-medium {
          max-width: 500px;
          max-height: 80vh;
        }
      </style>
    </head>
    <body class="text-gray-800">
      <!-- Hidden input for patient ID -->
      <input type="hidden" id="patientId" value="${patientData?.patient_id || ''}">
      
      <div class="background-animation">
        <div class="floating-circle"></div>
        <div class="floating-circle"></div>
        <div class="floating-circle"></div>
        <div class="wave-line"></div>
      </div>
      
      <div class="container mx-auto px-4 py-6">
        <div class="white-card rounded-2xl p-6 mb-6 fade-in">
          <div class="flex flex-col md:flex-row justify-between items-center">
            <div class="flex items-center space-x-4 mb-4 md:mb-0">
              <div class="w-16 h-16 cyan-bg rounded-full flex items-center justify-center text-2xl font-bold text-white">
                ${patient.name ? patient.name.charAt(0) : 'P'}
              </div>
              <div>
                <h1 class="text-3xl font-bold cyan-text">Welcome back, <span class="text-gray-800">${patient.name || 'Patient'}</span></h1>
                <p class="text-gray-600">Your health, our priority</p>
              </div>
            </div>
            
            <div class="flex space-x-4">
              <div class="cyan-light rounded-xl p-4 min-w-[120px] text-center">
                <p class="text-sm cyan-text font-medium">Patient ID</p>
                <p class="text-xl font-bold cyan-text">${patient.id}</p>
              </div>
              <div class="cyan-light rounded-xl p-4 min-w-[120px] text-center">
                <p class="text-sm cyan-text font-medium">Age</p>
                <p class="text-xl font-bold cyan-text">${patient.age}</p>
              </div>
              <div class="cyan-light rounded-xl p-4 min-w-[120px] text-center relative">
                <p class="text-sm cyan-text font-medium">Next Visit</p>
                <p class="text-xl font-bold cyan-text">
                  ${patient.nextAppointment ? new Date(patient.nextAppointment).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'N/A'}
                </p>
                <div class="absolute -top-2 -right-2 w-4 h-4 cyan-bg rounded-full pulse-dot"></div>
              </div>
              <button id="logoutBtn" class="btn-logout rounded-xl px-6 py-4 flex items-center space-x-2">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent my-6 opacity-30"></div>
        
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="lg:w-1/4">
            <div class="white-card rounded-2xl p-6 mb-6 slide-in">
              <button id="profileBtn" class="w-full cyan-light rounded-xl p-4 mb-6 flex items-center justify-between space-x-3 hover-lift">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-12 cyan-dark rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-xl text-white"></i>
                  </div>
                  <div class="text-left">
                    <p class="font-semibold cyan-text">View Profile</p>
                    <p class="text-sm cyan-text opacity-75">Personal details & settings</p>
                  </div>
                </div>
                <i class="fas fa-chevron-right cyan-text"></i>
              </button>
              
              <div class="space-y-2">
                <button class="menu-item active w-full text-left p-4 rounded-xl flex items-center space-x-4" data-section="appointments">
                  <div class="w-12 h-12 cyan-dark rounded-xl flex items-center justify-center">
                    <i class="fas fa-calendar-check text-xl text-white"></i>
                  </div>
                  <div>
                    <p class="font-semibold cyan-text">Current Appointments</p>
                    <p class="text-sm cyan-text opacity-75">View & manage visits</p>
                  </div>
                  <span class="ml-auto cyan-dark text-white text-xs px-2 py-1 rounded-full">${appointments.length}</span>
                </button>
                
                <button class="menu-item w-full text-left p-4 rounded-xl flex items-center space-x-4" data-section="book">
                  <div class="w-12 h-12 cyan-light rounded-xl flex items-center justify-center">
                    <i class="fas fa-calendar-plus text-xl cyan-text"></i>
                  </div>
                  <div>
                    <p class="font-semibold cyan-text">Book Appointment</p>
                    <p class="text-sm cyan-text opacity-75">Schedule new visit</p>
                  </div>
                  <i class="fas fa-plus ml-auto cyan-text"></i>
                </button>
                
                <button class="menu-item w-full text-left p-4 rounded-xl flex items-center space-x-4" data-section="reports">
                  <div class="w-12 h-12 cyan-light rounded-xl flex items-center justify-center">
                    <i class="fas fa-file-medical text-xl cyan-text"></i>
                  </div>
                  <div>
                    <p class="font-semibold cyan-text">Medical Reports</p>
                    <p class="text-sm cyan-text opacity-75">Test results & history</p>
                  </div>
                  <span class="ml-auto cyan-dark text-white text-xs px-2 py-1 rounded-full">${reports.length}</span>
                </button>
                
                <button class="menu-item w-full text-left p-4 rounded-xl flex items-center space-x-4" data-section="prescriptions">
                  <div class="w-12 h-12 cyan-light rounded-xl flex items-center justify-center">
                    <i class="fas fa-pills text-xl cyan-text"></i>
                  </div>
                  <div>
                    <p class="font-semibold cyan-text">Prescriptions</p>
                    <p class="text-sm cyan-text opacity-75">Medications & refills</p>
                  </div>
                  <span class="ml-auto cyan-dark text-white text-xs px-2 py-1 rounded-full">${prescriptions.length}</span>
                </button>
              </div>
              
              <div class="mt-8 pt-6 border-t border-gray-200">
                <p class="text-sm font-semibold cyan-text mb-4">Quick Actions</p>
                <div class="grid grid-cols-2 gap-3">
                  <button class="cyan-light rounded-lg p-3 text-center hover:bg-cyan-100 transition-colors quick-action" data-action="download">
                    <i class="fas fa-download cyan-text mb-1"></i>
                    <p class="text-xs cyan-text">Download Records</p>
                  </button>
                  <button class="cyan-light rounded-lg p-3 text-center hover:bg-cyan-100 transition-colors quick-action" data-action="notifications">
                    <i class="fas fa-bell cyan-text mb-1"></i>
                    <p class="text-xs cyan-text">Notifications</p>
                  </button>
                  <button class="cyan-light rounded-lg p-3 text-center hover:bg-cyan-100 transition-colors quick-action" data-action="help">
                    <i class="fas fa-question-circle cyan-text mb-1"></i>
                    <p class="text-xs cyan-text">Help Center</p>
                  </button>
                  <button class="cyan-light rounded-lg p-3 text-center hover:bg-cyan-100 transition-colors quick-action" data-action="settings">
                    <i class="fas fa-cog cyan-text mb-1"></i>
                    <p class="text-xs cyan-text">Settings</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="lg:w-3/4">
            <div id="contentArea" class="white-card rounded-2xl p-6 min-h-[600px] fade-in">
              <div id="appointmentsContent">
                <h2 class="text-2xl font-bold mb-6 cyan-text">Current Appointments</h2>
                <div class="grid gap-6">
                  ${appointments.map(apt => `
                    <div class="cyan-light rounded-xl p-6 hover-lift">
                      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div>
                          <div class="flex items-center space-x-3 mb-2">
                            <div class="w-12 h-12 cyan-dark rounded-full flex items-center justify-center">
                              <i class="fas fa-user-md text-white"></i>
                            </div>
                            <div>
                              <h3 class="text-xl font-bold cyan-text">${apt.doctor}</h3>
                              <p class="text-gray-700"><i class="fas fa-stethoscope mr-2 cyan-text"></i>${apt.specialization}</p>
                            </div>
                          </div>
                          <p class="text-gray-700 mt-2"><i class="fas fa-notes-medical mr-2 cyan-text"></i>${apt.reason}</p>
                        </div>
                        <div class="flex items-center space-x-3 mt-4 md:mt-0">
                          <span class="px-3 py-1 bg-cyan-500 text-white rounded-full text-sm font-semibold">
                            ${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                          </span>
                          <button class="px-4 py-2 btn-cyan rounded-lg reschedule-btn" data-id="${apt.id}" data-doctor="${apt.doctor_id}" data-date="${apt.date}" data-time="${apt.time}">
                            Reschedule
                          </button>
                          <button class="px-4 py-2 btn-white rounded-lg cancel-btn" data-id="${apt.id}">
                            Cancel
                          </button>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <div class="text-center">
                          <p class="text-sm cyan-text">Date</p>
                          <p class="font-semibold">${new Date(apt.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div class="text-center">
                          <p class="text-sm cyan-text">Time</p>
                          <p class="font-semibold">${apt.time}</p>
                        </div>
                        <div class="text-center">
                          <p class="text-sm cyan-text">Location</p>
                          <p class="font-semibold">${apt.location}</p>
                        </div>
                      </div>
                      ${apt.notes ? `
                        <div class="mt-4 p-3 cyan-light rounded-lg border cyan-border">
                          <p class="text-sm cyan-text"><i class="fas fa-info-circle mr-2"></i>Note: ${apt.notes}</p>
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div id="bookContent" class="hidden"></div>
              <div id="reportsContent" class="hidden"></div>
              <div id="prescriptionsContent" class="hidden"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div id="profileModal" class="fixed inset-0 bg-white/90 flex items-center justify-center z-50 hidden p-4 modal-backdrop">
        <div class="white-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold cyan-text">Patient Profile</h2>
            <button id="closeModal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            ${Object.entries({
              'Full Name': patient.name,
              'Patient ID': patient.id,
              'Age': `${patient.age} years`,
              'Gender': patient.gender,
              'Blood Type': patient.bloodType,
              'Contact': patient.contact,
              'Email': patient.email,
              'Last Visit': patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'
            }).map(([key, value]) => `
              <div class="cyan-light p-4 rounded-xl">
                <p class="text-sm cyan-text">${key}</p>
                <p class="font-semibold">${value}</p>
              </div>
            `).join('')}
          </div>
          
          <div class="cyan-light p-6 rounded-xl mb-6">
            <h3 class="text-lg font-semibold cyan-text mb-4">Medical Information</h3>
            <div class="space-y-4">
              <div>
                <p class="text-sm text-gray-500">Medical Conditions</p>
                <div class="flex flex-wrap gap-2 mt-2">
                  ${patient.conditions.map(cond => `
                    <span class="px-3 py-1 cyan-bg text-white rounded-full text-sm">${cond}</span>
                  `).join('')}
                </div>
              </div>
              <div>
                <p class="text-sm cyan-text">Allergies</p>
                <div class="flex flex-wrap gap-2 mt-2">
                  ${patient.allergies.map(allergy => `
                    <span class="px-3 py-1 cyan-dark text-white rounded-full text-sm">${allergy}</span>
                  `).join('')}
                </div>
              </div>
              <div>
                <p class="text-sm cyan-text">Emergency Contact</p>
                <p class="font-semibold">${patient.emergencyContact}</p>
              </div>
              <div>
                <p class="text-sm cyan-text">Address</p>
                <p class="font-semibold">${patient.address}</p>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-4">
            <button id="editProfileBtn" class="px-6 py-3 btn-cyan rounded-lg">
              <i class="fas fa-edit mr-2"></i>Edit Profile
            </button>
            <button id="closeModalBtn" class="px-6 py-3 btn-white rounded-lg">
              Close
            </button>
          </div>
        </div>
      </div>
      
      <!-- Edit Profile Modal -->
      <div id="editProfileModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-slide-up scrollbar-thin">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl font-bold cyan-text">Edit Profile</h3>
              <button id="closeEditProfileModal" class="p-2 hover:bg-gray-100 rounded-full transition">
                <i class="fas fa-times text-gray-500"></i>
              </button>
            </div>
            
            <form id="editProfileForm">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label class="block text-sm font-medium cyan-text mb-2">Full Name</label>
                  <input type="text" id="editName" value="${patient.name}" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                </div>
                <div>
                  <label class="block text-sm font-medium cyan-text mb-2">Email</label>
                  <input type="email" id="editEmail" value="${patient.email}" readonly class="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed">
                </div>
                <div>
                  <label class="block text-sm font-medium cyan-text mb-2">Phone</label>
                  <input type="tel" id="editPhone" value="${patient.contact}" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                </div>
                <div>
                  <label class="block text-sm font-medium cyan-text mb-2">Gender</label>
                  <select id="editGender" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="Male" ${patient.gender === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Female" ${patient.gender === 'Female' ? 'selected' : ''}>Female</option>
                    <option value="Other" ${patient.gender === 'Other' ? 'selected' : ''}>Other</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium cyan-text mb-2">Blood Type</label>
                  <select id="editBloodType" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="A+" ${patient.bloodType === 'A+' ? 'selected' : ''}>A+</option>
                    <option value="A-" ${patient.bloodType === 'A-' ? 'selected' : ''}>A-</option>
                    <option value="B+" ${patient.bloodType === 'B+' ? 'selected' : ''}>B+</option>
                    <option value="B-" ${patient.bloodType === 'B-' ? 'selected' : ''}>B-</option>
                    <option value="O+" ${patient.bloodType === 'O+' ? 'selected' : ''}>O+</option>
                    <option value="O-" ${patient.bloodType === 'O-' ? 'selected' : ''}>O-</option>
                    <option value="AB+" ${patient.bloodType === 'AB+' ? 'selected' : ''}>AB+</option>
                    <option value="AB-" ${patient.bloodType === 'AB-' ? 'selected' : ''}>AB-</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium cyan-text mb-2">Date of Birth</label>
                  <input type="date" id="editDob" value="${patientData?.date_of_birth ? new Date(patientData.date_of_birth).toISOString().split('T')[0] : '1992-05-15'}" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium cyan-text mb-2">Address</label>
                  <textarea id="editAddress" rows="2" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">${patient.address}</textarea>
                </div>
              </div>
              
              <div class="border-t border-gray-200 my-4"></div>
              
              <h4 class="text-lg font-semibold cyan-text mb-4">Emergency Contact</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label class="block text-sm font-medium cyan-text mb-2">Contact Name</label>
                  <input type="text" id="editEmergencyName" value="${patient.emergencyContact.split(' ')[0]} ${patient.emergencyContact.split(' ')[1] || ''}" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                </div>
                <div>
                  <label class="block text-sm font-medium cyan-text mb-2">Relationship</label>
                  <input type="text" id="editEmergencyRelation" value="Wife" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium cyan-text mb-2">Emergency Phone</label>
                  <input type="tel" id="editEmergencyPhone" value="+1 (555) 987-6543" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                </div>
              </div>
              
              <div class="border-t border-gray-200 my-4"></div>
              
              <h4 class="text-lg font-semibold cyan-text mb-4">Medical Information</h4>
              <div class="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label class="block text-sm font-medium cyan-text mb-2">Medical Conditions (comma separated)</label>
                  <input type="text" id="editConditions" value="${patient.conditions ? patient.conditions.join(', ') : ''}" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                </div>
                <div>
                  <label class="block text-sm font-medium cyan-text mb-2">Allergies (comma separated)</label>
                  <input type="text" id="editAllergies" value="${patient.allergies ? patient.allergies.join(', ') : ''}" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                </div>
              </div>
              
              <div class="flex justify-end space-x-4">
                <button type="button" id="cancelEditProfile" class="px-6 py-3 btn-white rounded-lg">
                  Cancel
                </button>
                <button type="submit" class="px-6 py-3 btn-cyan rounded-lg">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Booking Modal -->
      <div id="bookingModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto animate-slide-up scrollbar-thin modal-medium">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl font-bold cyan-text">Book Appointment</h3>
              <button id="closeBookingModal" class="p-2 hover:bg-gray-100 rounded-full transition">
                <i class="fas fa-times text-gray-500"></i>
              </button>
            </div>
            
            <div id="modalDoctorInfo" class="flex items-center gap-4 p-4 cyan-light rounded-2xl mb-6 border cyan-border">
            </div>
            
            <form id="bookingForm">
              <div class="mb-4">
                <label class="block text-sm font-medium cyan-text mb-2">Select Date</label>
                <input type="date" id="appointmentDate" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
              </div>
              
              <div class="mb-6">
                <label class="block text-sm font-medium cyan-text mb-2">Select Time Slot</label>
                <div id="timeSlots" class="grid grid-cols-3 gap-2">
                  <button type="button" class="time-slot px-3 py-2 text-sm border border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition" data-time="09:00 AM">09:00</button>
                  <button type="button" class="time-slot px-3 py-2 text-sm border border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition" data-time="10:00 AM">10:00</button>
                  <button type="button" class="time-slot px-3 py-2 text-sm border border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition" data-time="11:00 AM">11:00</button>
                  <button type="button" class="time-slot px-3 py-2 text-sm border border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition" data-time="02:00 PM">02:00</button>
                  <button type="button" class="time-slot px-3 py-2 text-sm border border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition" data-time="03:00 PM">03:00</button>
                  <button type="button" class="time-slot px-3 py-2 text-sm border border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition" data-time="04:00 PM">04:00</button>
                </div>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium cyan-text mb-2">Reason for Visit</label>
                <textarea id="visitReason" rows="2" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Describe your symptoms..."></textarea>
              </div>
              
              <button type="submit" id="confirmBooking" class="w-full book-btn text-white font-semibold py-3 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300" disabled>
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Reschedule Modal -->
      <div id="rescheduleModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto animate-slide-up scrollbar-thin modal-medium">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl font-bold cyan-text">Reschedule Appointment</h3>
              <button id="closeRescheduleModal" class="p-2 hover:bg-gray-100 rounded-full transition">
                <i class="fas fa-times text-gray-500"></i>
              </button>
            </div>
            
            <div id="rescheduleDoctorInfo" class="flex items-center gap-4 p-4 cyan-light rounded-2xl mb-6 border cyan-border">
            </div>
            
            <form id="rescheduleForm">
              <input type="hidden" id="rescheduleAppointmentId">
              <input type="hidden" id="rescheduleDoctorId">
              
              <div class="mb-4">
                <label class="block text-sm font-medium cyan-text mb-2">Select New Date</label>
                <input type="date" id="rescheduleDate" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
              </div>
              
              <div class="mb-6">
                <label class="block text-sm font-medium cyan-text mb-2">Select New Time</label>
                <div id="rescheduleTimeSlots" class="grid grid-cols-3 gap-2">
                  <button type="button" class="time-slot px-3 py-2 text-sm border border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition" data-time="09:00 AM">09:00</button>
                  <button type="button" class="time-slot px-3 py-2 text-sm border border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition" data-time="10:00 AM">10:00</button>
                  <button type="button" class="time-slot px-3 py-2 text-sm border border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition" data-time="11:00 AM">11:00</button>
                  <button type="button" class="time-slot px-3 py-2 text-sm border border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition" data-time="02:00 PM">02:00</button>
                  <button type="button" class="time-slot px-3 py-2 text-sm border border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition" data-time="03:00 PM">03:00</button>
                  <button type="button" class="time-slot px-3 py-2 text-sm border border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition" data-time="04:00 PM">04:00</button>
                </div>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium cyan-text mb-2">Reason for Rescheduling</label>
                <textarea id="rescheduleReason" rows="2" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Please provide a reason..."></textarea>
              </div>
              
              <button type="submit" id="confirmReschedule" class="w-full book-btn text-white font-semibold py-3 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300" disabled>
                Confirm Reschedule
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <!-- View Report Modal -->
      <div id="viewReportModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-slide-up scrollbar-thin">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl font-bold cyan-text" id="reportModalTitle">Medical Report</h3>
              <button id="closeViewReportModal" class="p-2 hover:bg-gray-100 rounded-full transition">
                <i class="fas fa-times text-gray-500"></i>
              </button>
            </div>
            
            <div id="reportModalContent" class="space-y-4">
            </div>
            
            <div class="flex justify-end space-x-4 mt-6">
              <button id="downloadReportBtn" class="px-6 py-3 btn-cyan rounded-lg">
                <i class="fas fa-download mr-2"></i>Download
              </button>
              <button id="closeReportModal" class="px-6 py-3 btn-white rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- View Prescription Modal -->
      <div id="viewPrescriptionModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-slide-up scrollbar-thin">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl font-bold cyan-text" id="prescriptionModalTitle">Prescription Details</h3>
              <button id="closeViewPrescriptionModal" class="p-2 hover:bg-gray-100 rounded-full transition">
                <i class="fas fa-times text-gray-500"></i>
              </button>
            </div>
            
            <div id="prescriptionModalContent" class="space-y-4">
            </div>
            
            <div class="flex justify-end space-x-4 mt-6">
              <button id="refillPrescriptionBtn" class="px-6 py-3 btn-cyan rounded-lg">
                <i class="fas fa-sync-alt mr-2"></i>Request Refill
              </button>
              <button id="closePrescriptionModal" class="px-6 py-3 btn-white rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Upload Report Modal -->
      <div id="uploadReportModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-slide-up">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl font-bold cyan-text">Upload Medical Report</h3>
              <button id="closeUploadReportModal" class="p-2 hover:bg-gray-100 rounded-full transition">
                <i class="fas fa-times text-gray-500"></i>
              </button>
            </div>
            
            <form id="uploadReportForm" enctype="multipart/form-data">
              <div class="mb-4">
                <label class="block text-sm font-medium cyan-text mb-2">Test Type</label>
                <select id="reportTestType" name="test_type" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">Select test type</option>
                  <option value="Blood Test">Blood Test</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="MRI">MRI</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="ECG">ECG</option>
                  <option value="Urinalysis">Urinalysis</option>
                </select>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium cyan-text mb-2">Test Date</label>
                <input type="date" id="reportTestDate" name="test_date" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium cyan-text mb-2">Upload File</label>
                <div class="border-2 border-dashed cyan-border rounded-xl p-4 text-center file-upload-area cursor-pointer" onclick="document.getElementById('reportFile').click()">
                  <i class="fas fa-cloud-upload-alt text-3xl cyan-text mb-2"></i>
                  <p class="cyan-text text-sm mb-2">Drag & drop or click to upload</p>
                  <input type="file" id="reportFile" name="report" class="hidden" accept=".pdf,.jpg,.jpeg,.png">
                  <button type="button" id="browseFileBtn" class="px-4 py-2 btn-cyan rounded-lg text-sm">
                    Browse Files
                  </button>
                  <p class="text-xs text-gray-500 mt-3">PDF, JPG, PNG (Max 10MB)</p>
                </div>
                <div id="selectedFile" class="mt-2 hidden">
                  <p class="text-sm cyan-text">Selected: <span id="fileName"></span></p>
                </div>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium cyan-text mb-2">Notes (Optional)</label>
                <textarea id="reportNotes" name="notes" rows="2" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Any additional notes..."></textarea>
              </div>
              
              <button type="submit" class="w-full book-btn text-white font-semibold py-3 rounded-xl text-base hover:shadow-lg transition-all duration-300">
                Upload Report
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Order Medicines Modal -->
      <div id="orderMedicinesModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto animate-slide-up scrollbar-thin">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl font-bold cyan-text">Order Medicines</h3>
              <button id="closeOrderMedicinesModal" class="p-2 hover:bg-gray-100 rounded-full transition">
                <i class="fas fa-times text-gray-500"></i>
              </button>
            </div>
            
            <form id="orderMedicinesForm">
              <div class="mb-4">
                <label class="block text-sm font-medium cyan-text mb-2">Select Prescription</label>
                <select id="orderPrescription" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">Choose a prescription</option>
                  ${prescriptions.map(rx => `
                    <option value="${rx.id}">${rx.medicine} - ${rx.dosage}</option>
                  `).join('')}
                </select>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium cyan-text mb-2">Quantity</label>
                <input type="number" id="orderQuantity" min="1" max="10" value="1" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium cyan-text mb-2">Delivery Address</label>
                <textarea id="orderAddress" required rows="2" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">${patient.address}</textarea>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium cyan-text mb-2">Payment Method</label>
                <select id="orderPayment" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">Select payment method</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="cash">Cash on Delivery</option>
                </select>
              </div>
              
              <button type="submit" class="w-full book-btn text-white font-semibold py-3 rounded-xl text-base hover:shadow-lg transition-all duration-300">
                Place Order
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Logout Confirm Modal -->
      <div id="logoutConfirmModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-slide-up">
          <div class="p-6">
            <div class="text-center mb-4">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i class="fas fa-sign-out-alt text-2xl text-gray-600"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">Confirm Logout</h3>
              <p class="text-gray-600 text-sm">Are you sure you want to logout?</p>
            </div>
            
            <div class="flex space-x-3">
              <button id="cancelLogout" class="flex-1 px-4 py-2 btn-white rounded-lg">
                Cancel
              </button>
              <button id="confirmLogout" class="flex-1 px-4 py-2 btn-logout rounded-lg">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Success Toast -->
      <div id="successToast" class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-xl shadow-2xl hidden transform transition-all duration-300 translate-y-4 opacity-0 z-50">
        <div class="flex items-center gap-3">
          <div class="bg-white/20 p-1.5 rounded-full">
            <i class="fas fa-check text-sm"></i>
          </div>
          <span class="text-sm font-medium" id="successToastMessage">Appointment booked successfully!</span>
        </div>
      </div>
      
      <div id="toast" class="fixed bottom-4 right-4 white-card rounded-lg p-3 max-w-sm hidden z-50">
        <div class="flex items-center">
          <i id="toastIcon" class="fas fa-info-circle cyan-text mr-2"></i>
          <div>
            <p id="toastTitle" class="font-semibold cyan-text text-sm"></p>
            <p id="toastMessage" class="text-xs text-gray-600"></p>
          </div>
          <button id="closeToast" class="ml-auto text-gray-400 hover:text-gray-600">&times;</button>
        </div>
      </div>
      
      <script>
        let selectedDoctor = null;
        let selectedDate = '';
        let selectedTime = '';
        let currentFilter = 'all';
        let searchQuery = '';
        
        let rescheduleAppointmentId = null;
        let rescheduleDoctorId = null;
        let rescheduleDate = '';
        let rescheduleTime = '';
        
        let selectedFile = null;
        
        const reportsData = ${JSON.stringify(reports)};
        let currentReports = [...reportsData];
        const prescriptionsData = ${JSON.stringify(prescriptions)};

        function normalizeReport(report) {
          const id = report?.id || report?.report_uuid || report?.report_id;
          return {
            id,
            name: report?.name || report?.test_type || 'Medical Report',
            date: report?.date || report?.test_date || report?.created_at || new Date().toISOString(),
            results: report?.results || 'Results pending',
            findings: report?.findings || report?.notes || 'No findings recorded',
            file_url: report?.file_url || null
          };
        }

        function getReportById(reportId) {
          return currentReports.find(r => String(r.id) === String(reportId));
        }

        function getReportDownloadUrl(report) {
          if (!report) return null;
          if (report.id) return '/api/reports/' + encodeURIComponent(report.id) + '/download';
          return report.file_url || null;
        }

        document.addEventListener('DOMContentLoaded', function() {
          const menuItems = document.querySelectorAll('.menu-item');
          const contentSections = {
            appointments: document.getElementById('appointmentsContent'),
            book: document.getElementById('bookContent'),
            reports: document.getElementById('reportsContent'),
            prescriptions: document.getElementById('prescriptionsContent')
          };
          
          loadBookContent();
          loadReportsContent();
          loadPrescriptionsContent();
          
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
          
          const profileModal = document.getElementById('profileModal');
          const profileBtn = document.getElementById('profileBtn');
          const closeModalBtns = document.querySelectorAll('#closeModal, #closeModalBtn');
          
          profileBtn.addEventListener('click', () => {
            profileModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
          });
          
          closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
              profileModal.classList.add('hidden');
              document.body.style.overflow = '';
            });
          });
          
          profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
              profileModal.classList.add('hidden');
              document.body.style.overflow = '';
            }
          });
          
          const editProfileBtn = document.getElementById('editProfileBtn');
          const editProfileModal = document.getElementById('editProfileModal');
          const closeEditProfileModal = document.getElementById('closeEditProfileModal');
          const cancelEditProfile = document.getElementById('cancelEditProfile');
          
          editProfileBtn.addEventListener('click', () => {
            profileModal.classList.add('hidden');
            editProfileModal.classList.remove('hidden');
          });
          
          closeEditProfileModal.addEventListener('click', () => {
            editProfileModal.classList.add('hidden');
          });
          
          cancelEditProfile.addEventListener('click', () => {
            editProfileModal.classList.add('hidden');
          });
          
          editProfileModal.addEventListener('click', (e) => {
            if (e.target === editProfileModal) {
              editProfileModal.classList.add('hidden');
            }
          });
          
          document.getElementById('editProfileForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
              full_name: document.getElementById('editName').value,
              email: document.getElementById('editEmail').value,
              phone: document.getElementById('editPhone').value,
              gender: document.getElementById('editGender').value,
              blood_type: document.getElementById('editBloodType').value,
              date_of_birth: document.getElementById('editDob').value,
              address: document.getElementById('editAddress').value,
              emergency_contact_name: document.getElementById('editEmergencyName').value,
              emergency_contact_phone: document.getElementById('editEmergencyPhone').value,
              emergency_relation: document.getElementById('editEmergencyRelation').value,
              medical_conditions: document.getElementById('editConditions').value.split(',').map(c => c.trim()).filter(c => c),
              allergies: document.getElementById('editAllergies').value.split(',').map(a => a.trim()).filter(a => a)
            };
            
            try {
              const response = await fetch('/api/patient', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
              });
              
              if (response.ok) {
                showToast('Success', 'Profile updated successfully!', 'success');
                editProfileModal.classList.add('hidden');
                setTimeout(() => window.location.reload(), 1500);
              } else {
                showToast('Error', 'Failed to update profile', 'error');
              }
            } catch (error) {
              console.error('Error updating profile:', error);
              showToast('Error', 'Network error. Please try again.', 'error');
            }
          });
          
          document.addEventListener('click', function(e) {
            if (e.target.classList.contains('reschedule-btn')) {
              const appointmentId = e.target.dataset.id;
              const doctorId = e.target.dataset.doctor;
              const currentDate = e.target.dataset.date;
              const currentTime = e.target.dataset.time;
              
              openRescheduleModal(appointmentId, doctorId, currentDate, currentTime);
            }
            
            if (e.target.classList.contains('cancel-btn')) {
              const appointmentId = e.target.dataset.id;
              if (confirm('Are you sure you want to cancel this appointment?')) {
                cancelAppointment(appointmentId);
              }
            }
            
            if (e.target.closest('.quick-action')) {
              const action = e.target.closest('.quick-action').dataset.action;
              handleQuickAction(action);
            }
          });
          
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
            
            toastIcon.className = toastIcon.className.replace(/text-\\S+/g, '');
            toastIcon.classList.add('cyan-text');
            
            toast.classList.remove('hidden');
            toast.classList.add('fade-in');
            
            setTimeout(() => {
              toast.classList.add('hidden');
              toast.classList.remove('fade-in');
            }, 3000);
          };
          
          document.getElementById('closeToast').addEventListener('click', () => {
            toast.classList.add('hidden');
            toast.classList.remove('fade-in');
          });
          
          setTimeout(() => {
            showToast('Welcome', 'Your patient portal is ready!', 'success');
          }, 1000);
          
          document.getElementById('closeBookingModal').addEventListener('click', () => {
            document.getElementById('bookingModal').classList.add('hidden');
          });
          
          document.getElementById('bookingModal').addEventListener('click', (e) => {
            if (e.target.id === 'bookingModal') {
              document.getElementById('bookingModal').classList.add('hidden');
            }
          });
          
          document.getElementById('closeRescheduleModal').addEventListener('click', () => {
            document.getElementById('rescheduleModal').classList.add('hidden');
          });
          
          document.getElementById('rescheduleModal').addEventListener('click', (e) => {
            if (e.target.id === 'rescheduleModal') {
              document.getElementById('rescheduleModal').classList.add('hidden');
            }
          });
          
          document.querySelectorAll('#timeSlots .time-slot').forEach(slot => {
            slot.addEventListener('click', () => {
              if (slot.disabled) return;                  // ignore clicks on booked slots
              document.querySelectorAll('#timeSlots .time-slot').forEach(s => {
                s.classList.remove('selected');
              });
              slot.classList.add('selected');
              updateConfirmButton();
            });
          });
          
          document.querySelectorAll('#rescheduleTimeSlots .time-slot').forEach(slot => {
            slot.addEventListener('click', () => {
              document.querySelectorAll('#rescheduleTimeSlots .time-slot').forEach(s => {
                s.classList.remove('selected');
              });
              slot.classList.add('selected');
              updateRescheduleConfirmButton();
            });
          });
          
          document.getElementById('appointmentDate').addEventListener('change', async function () {
            selectedDate = this.value;
            selectedTime = '';                            // reset previously selected time
            document.getElementById('confirmBooking').disabled = true;

            if (!selectedDate || !selectedDoctor) {
              resetTimeSlots([]);
              return;
            }

            try {
              const res = await fetch(
                '/api/appointments/slots?doctor_id=' + selectedDoctor.doctor_id + '&date=' + selectedDate
              );
              const data = await res.json();
              resetTimeSlots(data.bookedSlots || []);
            } catch (e) {
              console.error('Could not fetch booked slots:', e);
              resetTimeSlots([]);
            }
          });
          
          document.getElementById('rescheduleDate').addEventListener('change', updateRescheduleConfirmButton);
          
          document.getElementById('bookingForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            await bookAppointment();
          });
          
          document.getElementById('rescheduleForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            await rescheduleAppointment();
          });
          
          const logoutBtn = document.getElementById('logoutBtn');
          const logoutModal = document.getElementById('logoutConfirmModal');
          const cancelLogout = document.getElementById('cancelLogout');
          const confirmLogout = document.getElementById('confirmLogout');

          logoutBtn.addEventListener('click', () => {
            logoutModal.classList.remove('hidden');
          });

          cancelLogout.addEventListener('click', () => {
            logoutModal.classList.add('hidden');
          });

          confirmLogout.addEventListener('click', () => {
            window.location.href = '/';
          });

          logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
              logoutModal.classList.add('hidden');
            }
          });
          
          document.getElementById('closeViewReportModal').addEventListener('click', () => {
            document.getElementById('viewReportModal').classList.add('hidden');
          });
          
          document.getElementById('closeReportModal').addEventListener('click', () => {
            document.getElementById('viewReportModal').classList.add('hidden');
          });
          
          document.getElementById('viewReportModal').addEventListener('click', (e) => {
            if (e.target.id === 'viewReportModal') {
              document.getElementById('viewReportModal').classList.add('hidden');
            }
          });
          
          document.getElementById('closeViewPrescriptionModal').addEventListener('click', () => {
            document.getElementById('viewPrescriptionModal').classList.add('hidden');
          });
          
          document.getElementById('closePrescriptionModal').addEventListener('click', () => {
            document.getElementById('viewPrescriptionModal').classList.add('hidden');
          });
          
          document.getElementById('viewPrescriptionModal').addEventListener('click', (e) => {
            if (e.target.id === 'viewPrescriptionModal') {
              document.getElementById('viewPrescriptionModal').classList.add('hidden');
            }
          });
          
          const uploadReportModal = document.getElementById('uploadReportModal');
          const closeUploadReportModal = document.getElementById('closeUploadReportModal');
          const browseFileBtn = document.getElementById('browseFileBtn');
          const reportFile = document.getElementById('reportFile');
          
          closeUploadReportModal.addEventListener('click', () => {
            uploadReportModal.classList.add('hidden');
          });
          
          uploadReportModal.addEventListener('click', (e) => {
            if (e.target === uploadReportModal) {
              uploadReportModal.classList.add('hidden');
            }
          });
          
          browseFileBtn.addEventListener('click', () => {
            reportFile.click();
          });
          
          reportFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
              selectedFile = e.target.files[0];
              document.getElementById('fileName').textContent = selectedFile.name;
              document.getElementById('selectedFile').classList.remove('hidden');
            }
          });
          
          // ============================================
          // UPDATED UPLOAD REPORT FORM SUBMISSION
          // ============================================
          document.getElementById('uploadReportForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const testType = document.getElementById('reportTestType').value;
            const testDate = document.getElementById('reportTestDate').value;
            const notes = document.getElementById('reportNotes').value;
            
            if (!testType || !testDate) {
              showToast('Error', 'Please fill all required fields', 'error');
              return;
            }
            
            const patientId = document.getElementById('patientId')?.value;
            
            if (!patientId) {
              showToast('Error', 'Patient ID not found', 'error');
              return;
            }
            
            if (!selectedFile) {
              showToast('Error', 'Please select a file to upload', 'error');
              return;
            }
            
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Uploading...';
            
            try {
              // Create FormData to handle file upload
              const formData = new FormData();
              formData.append('patient_id', patientId);
              formData.append('test_type', testType);
              formData.append('test_date', testDate);
              formData.append('notes', notes);
              formData.append('report', selectedFile);
              
              const response = await fetch('/api/reports', {
                method: 'POST',
                body: formData
              });
              
              if (response.ok) {
                showToast('Success', 'Report uploaded successfully!', 'success');
                uploadReportModal.classList.add('hidden');
                
                // Reset form
                document.getElementById('uploadReportForm').reset();
                document.getElementById('selectedFile').classList.add('hidden');
                selectedFile = null;
                
                // Wait a moment and then reload the reports section
                setTimeout(() => {
                  loadReportsContent();
                }, 1500);
              } else {
                const error = await response.json();
                showToast('Error', error.error || 'Failed to upload report', 'error');
              }
            } catch (error) {
              console.error('Error uploading report:', error);
              showToast('Error', 'Network error. Please try again.', 'error');
            }
            
            btn.disabled = false;
            btn.textContent = originalText;
          });
          
          // ============================================
          // UPDATED ORDER MEDICINES FORM SUBMISSION
          // ============================================
          document.getElementById('orderMedicinesForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const prescription = document.getElementById('orderPrescription').value;
            const quantity = document.getElementById('orderQuantity').value;
            const address = document.getElementById('orderAddress').value;
            const payment = document.getElementById('orderPayment').value;
            
            if (!prescription || !quantity || !address || !payment) {
              showToast('Error', 'Please fill all fields', 'error');
              return;
            }
            
            showToast('Success', 'Order placed successfully!', 'success');
            orderMedicinesModal.classList.add('hidden');
            
            // In a real app, you would send the order to server here
            
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          });
        });
        
        // ============================================
        // UPDATED QUICK ACTIONS HANDLER
        // ============================================
        function handleQuickAction(action) {
          switch(action) {
            case 'download':
              showToast('Download', 'Downloading your medical records...', 'info');
              // Simulate download after 1 second
              setTimeout(() => {
                showToast('Success', 'Records downloaded successfully!', 'success');
              }, 1000);
              break;
              
            case 'notifications':
              showToast('Notifications', 'You have 2 unread notifications', 'info');
              break;
              
            case 'help':
              showToast('Help Center', 'Opening help center...', 'info');
              // Open help modal or redirect
              setTimeout(() => {
                showToast('Info', 'Contact support: help@bondhealth.com', 'info');
              }, 1000);
              break;
              
            case 'settings':
              showToast('Settings', 'Opening settings...', 'info');
              // Open profile modal as settings
              setTimeout(() => {
                document.getElementById('profileBtn').click();
              }, 500);
              break;
              
            default:
              showToast('Info', 'Action not implemented yet', 'info');
          }
        }
        
        async function loadBookContent() {
          try {
            const response = await fetch('/api/doctors');
            const doctors = await response.json();
            const hospitalsResponse = await fetch('/api/hospitals');
            const hospitals = await hospitalsResponse.json();
          
          const bookContent = document.getElementById('bookContent');
          bookContent.innerHTML = \`
            <div class="fade-in">
              <div class="flex items-center gap-4 mb-6">
                <div class="cyan-bg p-3 rounded-2xl">
                  <i class="fas fa-search-plus text-xl text-white"></i>
                </div>
                <div>
                  <h2 class="text-2xl font-bold cyan-text">Find & Book Appointments</h2>
                  <p class="cyan-text opacity-75 text-sm">Connect with top specialists</p>
                </div>
              </div>
              
              <div class="relative mb-6">
                <div class="absolute left-4 top-1/2 -translate-y-1/2">
                  <i class="fas fa-search text-gray-400"></i>
                </div>
                <input type="text" id="searchInput" placeholder="Search by doctor, hospital, or specialty..." 
                       class="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-base">
              </div>
              
              <div class="mb-6">
                <p class="cyan-text font-medium mb-3">Specialties</p>
                <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  <button class="filter-chip active px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 whitespace-nowrap" data-filter="all"> 
                    All 
                  </button>
                  <button class="filter-chip px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 whitespace-nowrap" data-filter="Cardiology"> 
                    Cardiology 
                  </button>
                  <button class="filter-chip px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 whitespace-nowrap" data-filter="Neurology"> 
                    Neurology 
                  </button>
                  <button class="filter-chip px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 whitespace-nowrap" data-filter="Dermatology"> 
                    Dermatology 
                  </button>
                  <button class="filter-chip px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 whitespace-nowrap" data-filter="Orthopedics"> 
                    Orthopedics 
                  </button>
                </div>
              </div>
              
              <div class="mb-8">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold cyan-text">Available Doctors</h3>
                  <span class="text-sm cyan-text opacity-75" id="doctorCount">\${doctors.length} doctors</span>
                </div>
                
                <div id="doctorsGrid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                </div>
              </div>
              
              <div class="border-t border-gray-200 my-6"></div>
              
              <div class="mb-6">
                <div class="flex items-center gap-2 mb-4">
                  <div class="cyan-light p-2 rounded-xl">
                    <i class="fas fa-hospital text-lg cyan-text"></i>
                  </div>
                  <h3 class="text-lg font-bold cyan-text">Partner Hospitals</h3>
                </div>
                
                <div id="hospitalsGrid" class="grid grid-cols-2 md:grid-cols-3 gap-3">
                  \${hospitals.map(hospital => \`
                    <div class="hospital-card white-card rounded-xl p-3 cursor-pointer hover-lift text-center" onclick="filterByHospital('\${hospital.name}')">
                      <div class="w-full h-16 rounded-lg flex items-center justify-center mb-2 cyan-light">
                        <i class="fas fa-hospital-alt text-2xl cyan-text"></i>
                      </div>
                      <p class="text-xs font-semibold cyan-text">\${hospital.name}</p>
                    </div>
                  \`).join('')}
                </div>
              </div>
            </div>
          \`;
          
          renderDoctors(doctors);
          setupBookingEventListeners();
          } catch (error) {
            console.error('Error loading book content:', error);
          }
        }
        
        function renderDoctors(doctorsData) {
          const filtered = doctorsData.filter(doc => {
            const matchesFilter = currentFilter === 'all' || doc.specialization?.toLowerCase() === currentFilter.toLowerCase();
            const matchesSearch = searchQuery === '' || 
              (doc.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
              (doc.hospital_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
              (doc.specialization || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch && doc.status === 'Available';
          });
          
          document.getElementById('doctorCount').textContent = \`\${filtered.length} \${filtered.length === 1 ? 'doctor' : 'doctors'}\`;
          
          const doctorsGrid = document.getElementById('doctorsGrid');
          doctorsGrid.innerHTML = filtered.map((doc, index) => \`
            <div class="doctor-card white-card rounded-xl p-4 hover-lift fade-in" style="animation-delay: \${index * 0.1}s">
              <div class="flex gap-3 mb-3">
                <div class="w-12 h-12 rounded-lg cyan-light border-2 cyan-border flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-user-md text-xl cyan-text"></i>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold cyan-text text-base mb-0.5">\${doc.full_name}</h3>
                  <p class="cyan-text text-xs mb-1">\${doc.specialization}</p>
                  <div class="flex items-center cyan-text opacity-75 text-xs">
                    <i class="fas fa-hospital mr-1"></i>
                    <span>\${doc.hospital_name}</span>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                <div class="flex items-center gap-2 text-xs">
                  <span class="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                    <i class="fas fa-star text-yellow-500 text-xs"></i>
                    <span>\${doc.rating || '4.5'}</span>
                  </span>
                  <span class="bg-gray-100 px-2 py-0.5 rounded-full">\${doc.experience || '10+ yrs'}</span>
                </div>
                <button class="book-btn px-3 py-1.5 rounded-lg text-xs text-white font-medium" onclick="openBookingModal('\${doc.doctor_id}')">
                  Book
                </button>
              </div>
            </div>
          \`).join('');
        }
        
        function setupBookingEventListeners() {
          document.getElementById('searchInput')?.addEventListener('input', async (e) => {
            searchQuery = e.target.value;
            const doctors = await fetch('/api/doctors').then(res => res.json());
            renderDoctors(doctors);
          });
          
          document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', async () => {
              document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
              chip.classList.add('active');
              currentFilter = chip.dataset.filter;
              const doctors = await fetch('/api/doctors').then(res => res.json());
              renderDoctors(doctors);
            });
          });
        }
        
        async function openBookingModal(doctorId) {
          const doctors = await fetch('/api/doctors').then(res => res.json());
          selectedDoctor = doctors.find(d => d.doctor_id === doctorId);
          if (!selectedDoctor) return;

          const modal = document.getElementById('bookingModal');
          const doctorInfo = document.getElementById('modalDoctorInfo');

          doctorInfo.innerHTML = \`
            <div class="w-12 h-12 rounded-lg cyan-light border-2 cyan-border flex items-center justify-center flex-shrink-0">
              <i class="fas fa-user-md text-xl cyan-text"></i>
            </div>
            <div class="flex-1">
              <h4 class="font-bold cyan-text text-base">\${selectedDoctor.full_name}</h4>
              <p class="cyan-text text-xs">\${selectedDoctor.specialization}</p>
              <div class="flex items-center cyan-text opacity-75 text-xs mt-1">
                <i class="fas fa-hospital mr-1"></i>
                <span>\${selectedDoctor.hospital_name}</span>
              </div>
            </div>
          \`;

          const today = new Date().toISOString().split('T')[0];
          document.getElementById('appointmentDate').min = today;
          document.getElementById('appointmentDate').value = '';

          selectedDate = '';
          selectedTime = '';
          resetTimeSlots([]);                          // reset with no booked info yet
          document.getElementById('visitReason').value = '';
          document.getElementById('confirmBooking').disabled = true;
          modal.classList.remove('hidden');
        }
        
        // Resets all time-slot buttons; greys out any that are in bookedSlots.
        // bookedSlots: string[] like ["09:00", "14:00"]
        function resetTimeSlots(bookedSlots) {
          document.querySelectorAll('#timeSlots .time-slot').forEach(slot => {
            slot.classList.remove('selected');

            // Each slot's data-time is like "09:00 AM"; normalise to "HH:MM" for comparison
            const slotTime = slot.dataset.time.substring(0, 5);
            const isBooked = bookedSlots.includes(slotTime);

            if (isBooked) {
              slot.disabled = true;
              slot.classList.add('opacity-40', 'cursor-not-allowed', 'line-through');
              slot.title = 'This slot is already booked';
            } else {
              slot.disabled = false;
              slot.classList.remove('opacity-40', 'cursor-not-allowed', 'line-through');
              slot.title = '';
            }
          });
        }

        window.openBookingModal = openBookingModal;
        
        function filterByHospital(hospitalName) {
          searchQuery = hospitalName;
          const searchInput = document.getElementById('searchInput');
          if (searchInput) {
            searchInput.value = hospitalName;
          }
          loadBookContent();
        }
        
        window.filterByHospital = filterByHospital;
        
        function updateConfirmButton() {
          const dateInput = document.getElementById('appointmentDate');
          const timeSlot = document.querySelector('#timeSlots .time-slot.selected:not(:disabled)');
          const btn = document.getElementById('confirmBooking');

          selectedDate = dateInput.value;
          selectedTime = timeSlot ? timeSlot.dataset.time : '';

          btn.disabled = !selectedDate || !selectedTime;
        }
        
        function updateRescheduleConfirmButton() {
          const dateInput = document.getElementById('rescheduleDate');
          const timeSlot = document.querySelector('#rescheduleTimeSlots .time-slot.selected');
          const btn = document.getElementById('confirmReschedule');
          
          rescheduleDate = dateInput.value;
          rescheduleTime = timeSlot ? timeSlot.dataset.time : '';
          
          btn.disabled = !rescheduleDate || !rescheduleTime;
        }
        
        async function bookAppointment() {
          if (!selectedDoctor || !selectedDate || !selectedTime) return;
          
          const btn = document.getElementById('confirmBooking');
          const reason = document.getElementById('visitReason').value;
          
          btn.disabled = true;
          btn.textContent = 'Booking...';
          
          try {
            const response = await fetch('/api/appointments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                doctor_id: selectedDoctor.doctor_id,
                appointment_date: selectedDate,
                appointment_time: selectedTime,
                reason: reason || 'General consultation',
                type: 'in-person',
                location: selectedDoctor.hospital_name
              })
            });
            
            if (response.ok) {
              showToast('Success', 'Appointment booked successfully!', 'success');
              document.getElementById('bookingModal').classList.add('hidden');
              setTimeout(() => {
                document.querySelector('[data-section="appointments"]').click();
                window.location.reload();
              }, 1500);
            } else if (response.status === 409) {
              // Slot was grabbed by someone else between open and submit
              const error = await response.json();
              showToast('Slot Unavailable', error.message || 'This slot was just booked. Please pick another time.', 'error');
              // Re-fetch booked slots so the UI reflects the new reality
              if (selectedDoctor && selectedDate) {
                const slotsRes = await fetch(
                  '/api/appointments/slots?doctor_id=' + selectedDoctor.doctor_id + '&date=' + selectedDate
                );
                const slotsData = await slotsRes.json();
                resetTimeSlots(slotsData.bookedSlots || []);
              }
              selectedTime = '';
              document.getElementById('confirmBooking').disabled = true;
            } else {
              const error = await response.json();
              showToast('Error', error.message || 'Failed to book appointment', 'error');
            }
          } catch (error) {
            console.error('Error booking appointment:', error);
            showToast('Error', 'Network error. Please try again.', 'error');
          }
          
          btn.disabled = false;
          btn.textContent = 'Confirm Booking';
        }
        
        function openRescheduleModal(appointmentId, doctorId, currentDate, currentTime) {
          rescheduleAppointmentId = appointmentId;
          rescheduleDoctorId = doctorId;
          
          document.getElementById('rescheduleAppointmentId').value = appointmentId;
          document.getElementById('rescheduleDoctorId').value = doctorId;
          
          const today = new Date().toISOString().split('T')[0];
          document.getElementById('rescheduleDate').min = today;
          document.getElementById('rescheduleDate').value = '';
          
          rescheduleDate = '';
          rescheduleTime = '';
          document.querySelectorAll('#rescheduleTimeSlots .time-slot').forEach(slot => {
            slot.classList.remove('selected');
          });
          document.getElementById('rescheduleReason').value = '';
          document.getElementById('confirmReschedule').disabled = true;
          
          fetch('/api/doctors').then(res => res.json()).then(doctors => {
            const doctor = doctors.find(d => d.doctor_id === doctorId);
            if (doctor) {
              document.getElementById('rescheduleDoctorInfo').innerHTML = \`
                <div class="w-12 h-12 rounded-lg cyan-light border-2 cyan-border flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-user-md text-xl cyan-text"></i>
                </div>
                <div class="flex-1">
                  <h4 class="font-bold cyan-text text-base">\${doctor.full_name}</h4>
                  <p class="cyan-text text-xs">\${doctor.specialization}</p>
                  <p class="text-xs text-gray-500 mt-1">Current: \${new Date(currentDate).toLocaleDateString()} at \${currentTime}</p>
                </div>
              \`;
            }
          });
          
          document.getElementById('rescheduleModal').classList.remove('hidden');
        }
        
        async function rescheduleAppointment() {
          if (!rescheduleAppointmentId || !rescheduleDate || !rescheduleTime) return;
          
          const btn = document.getElementById('confirmReschedule');
          const reason = document.getElementById('rescheduleReason').value;
          
          btn.disabled = true;
          btn.textContent = 'Rescheduling...';
          
          try {
            const response = await fetch(\`/api/appointments/\${rescheduleAppointmentId}/reschedule\`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                new_date: rescheduleDate,
                new_time: rescheduleTime,
                reason: reason || 'Patient requested reschedule'
              })
            });
            
            if (response.ok) {
              showToast('Success', 'Appointment rescheduled successfully!', 'success');
              document.getElementById('rescheduleModal').classList.add('hidden');
              
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              const error = await response.json();
              showToast('Error', error.message || 'Failed to reschedule', 'error');
            }
          } catch (error) {
            console.error('Error rescheduling appointment:', error);
            showToast('Error', 'Network error. Please try again.', 'error');
          }
          
          btn.disabled = false;
          btn.textContent = 'Confirm Reschedule';
        }
        
        async function cancelAppointment(appointmentId) {
          try {
            const response = await fetch(\`/api/appointments/\${appointmentId}/cancel\`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reason: 'Cancelled by patient'
              })
            });
            
            if (response.ok) {
              showToast('Success', 'Appointment cancelled successfully!', 'success');
              
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              const error = await response.json();
              showToast('Error', error.message || 'Failed to cancel', 'error');
            }
          } catch (error) {
            console.error('Error cancelling appointment:', error);
            showToast('Error', 'Network error. Please try again.', 'error');
          }
        }
        
        function showBookingSuccessToast() {
          const toast = document.getElementById('successToast');
          toast.classList.remove('hidden', 'translate-y-4', 'opacity-0');
          
          setTimeout(() => {
            toast.classList.add('translate-y-4', 'opacity-0');
            setTimeout(() => toast.classList.add('hidden'), 300);
          }, 3000);
        }
        
        async function loadReportsContent() {
          const patientId = document.getElementById('patientId')?.value;
          console.log('Loading reports for patient ID:', patientId);
          
          if (!patientId) {
            console.error('No patient ID found');
            return;
          }
          
          try {
            // Fetch latest reports from server
            const url = '/api/reports?patient_id=' + patientId;
            console.log('Fetching from URL:', url);
            
            const response = await fetch(url);
            console.log('Response status:', response.status);
            
            if (response.ok) {
              const latestReports = await response.json();
              currentReports = latestReports.map(normalizeReport);
              console.log('Reports received:', latestReports);
              console.log('Number of reports:', latestReports.length);
              
              const reportsContent = document.getElementById('reportsContent');
              const reportsGridHtml = latestReports.length
                ? \`
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    \${latestReports.map(report => {
                      const reportId = report.report_uuid || report.report_id || '';
                      return \`
                      <div class="report-card white-card rounded-xl p-4 hover-lift">
                        <div class="flex items-center justify-between mb-3">
                          <div class="w-10 h-10 cyan-light rounded-lg flex items-center justify-center">
                            <i class="fas \${report.test_type?.toLowerCase().includes('blood') ? 'fa-vial' : 'fa-x-ray'} cyan-text"></i>
                          </div>
                          <span class="text-xs cyan-dark text-white px-2 py-0.5 rounded-full">\${report.test_type}</span>
                        </div>
                        <h3 class="text-base font-semibold cyan-text mb-1">\${report.test_type}</h3>
                        <p class="text-xs cyan-text opacity-75 mb-2">\${new Date(report.test_date).toLocaleDateString()}</p>
                        <div class="flex justify-between">
                          <button class="text-xs cyan-dark text-white px-3 py-1.5 rounded-lg" onclick="viewReport('\${reportId}')">
                            <i class="fas fa-eye mr-1"></i>View
                          </button>
                          <button class="text-xs btn-white px-3 py-1.5 rounded-lg" onclick="downloadReport('\${reportId}')">
                            <i class="fas fa-download mr-1"></i>Download
                          </button>
                        </div>
                      </div>
                    \`;
                    }).join('')}
                  </div>
                \`
                : \`
                  <div class="white-card rounded-xl p-8 text-center">
                    <div class="w-14 h-14 cyan-light rounded-full flex items-center justify-center mx-auto mb-3">
                      <i class="fas fa-file-medical cyan-text text-xl"></i>
                    </div>
                    <h3 class="text-base font-semibold cyan-text mb-1">No reports available yet</h3>
                    <p class="text-sm text-gray-500">Once doctors, labs, or you upload reports, they will appear here.</p>
                  </div>
                \`;
              reportsContent.innerHTML = \`
                <h2 class="text-xl font-bold mb-4 cyan-text">Medical Reports</h2>
                \${reportsGridHtml}
                
                <div class="mt-6 cyan-light rounded-xl p-4">
                  <h3 class="text-base font-semibold cyan-text mb-3">Upload New Report</h3>
                  <div class="border-2 border-dashed cyan-border rounded-lg p-4 text-center file-upload-area cursor-pointer" onclick="openUploadReportModal()">
                    <i class="fas fa-cloud-upload-alt text-2xl cyan-text mb-2"></i>
                    <p class="cyan-text text-sm mb-1">Click to upload</p>
                    <p class="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                  </div>
                </div>
              \`;
            } else {
              console.error('Failed to fetch reports, status:', response.status);
            }
          } catch (error) {
            console.error('Error fetching reports:', error);
          }
        }
        
        async function loadPrescriptionsContent() {
          const prescriptionsContent = document.getElementById('prescriptionsContent');
          prescriptionsContent.innerHTML = \`
            <h2 class="text-xl font-bold mb-4 cyan-text">Active Prescriptions</h2>
            <div class="space-y-4">
              \${prescriptionsData.map(rx => \`
                <div class="prescription-card cyan-light rounded-xl p-4 hover-lift">
                  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
                    <div class="flex items-center space-x-3 mb-2 md:mb-0">
                      <div class="w-10 h-10 cyan-dark rounded-lg flex items-center justify-center">
                        <i class="fas fa-pills text-white"></i>
                      </div>
                      <div>
                        <h3 class="text-base font-bold cyan-text">\${rx.medicine}</h3>
                        <p class="cyan-text opacity-75 text-xs">\${rx.dosage} • \${rx.frequency}</p>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span class="px-2 py-0.5 cyan-dark text-white rounded-full text-xs">
                        <i class="fas fa-check-circle mr-1 text-xs"></i>Active
                      </span>
                      <button class="px-3 py-1.5 btn-cyan rounded-lg text-xs refill-btn" data-id="\${rx.id}">
                        <i class="fas fa-sync-alt mr-1 text-xs"></i>Refill
                      </button>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 text-xs">
                    <div>
                      <p class="text-xs cyan-text">Valid Until</p>
                      <p class="font-semibold">\${new Date(rx.validUntil).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p class="text-xs cyan-text">Refills Left</p>
                      <p class="font-semibold">\${rx.refills}</p>
                    </div>
                  </div>
                  
                  <div class="mt-3">
                    <p class="text-xs text-gray-600 mb-2">\${rx.instructions || 'Take as directed by physician'}</p>
                    <div class="flex justify-end">
                      <button class="text-xs btn-white px-3 py-1.5 rounded-lg" onclick="viewPrescription('\${rx.id}')">
                        <i class="fas fa-info-circle mr-1"></i>Details
                      </button>
                    </div>
                  </div>
                </div>
              \`).join('')}
            </div>
            
            <div class="mt-6 cyan-light rounded-xl p-4">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-base font-semibold cyan-text">Pharmacy Services</h3>
                <button class="px-4 py-2 btn-cyan rounded-lg text-sm" onclick="openOrderMedicinesModal()">
                  <i class="fas fa-shopping-cart mr-1"></i>Order Medicines
                </button>
              </div>
              <div class="grid grid-cols-1 gap-2 text-xs text-gray-600">
                <p><i class="fas fa-truck mr-2 cyan-text"></i>Free home delivery on orders above $50</p>
                <p><i class="fas fa-clock mr-2 cyan-text"></i>24/7 pharmacist support</p>
                <p><i class="fas fa-shield-alt mr-2 cyan-text"></i>100% authentic medicines guaranteed</p>
              </div>
            </div>
          \`;
          
          document.querySelectorAll('.refill-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const prescriptionId = this.dataset.id;
              requestRefill(prescriptionId);
            });
          });
        }
        
        function viewReport(reportId) {
          const report = getReportById(reportId);
          if (!report) {
            showToast('Error', 'Report details not found', 'error');
            return;
          }
          const downloadUrl = getReportDownloadUrl(report);
          
          document.getElementById('reportModalTitle').textContent = report.name;
          document.getElementById('reportModalContent').innerHTML = \`
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="cyan-light p-3 rounded-lg">
                  <p class="text-xs cyan-text">Test Type</p>
                  <p class="text-sm font-semibold">\${report.name}</p>
                </div>
                <div class="cyan-light p-3 rounded-lg">
                  <p class="text-xs cyan-text">Date</p>
                  <p class="text-sm font-semibold">\${new Date(report.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div class="cyan-light p-3 rounded-lg">
                <p class="text-xs cyan-text mb-1">Results</p>
                <p class="text-sm">\${report.results}</p>
              </div>
              <div class="cyan-light p-3 rounded-lg">
                <p class="text-xs cyan-text mb-1">Findings</p>
                <p class="text-sm">\${report.findings}</p>
              </div>
              \${downloadUrl ? \`
                <a href="\${downloadUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 cyan-dark text-white px-4 py-2 rounded-lg text-sm">
                  <i class="fas fa-file-medical"></i>Open Attached Report
                </a>
              \` : ''}
            </div>
          \`;
          
          document.getElementById('downloadReportBtn').onclick = () => downloadReport(reportId);
          document.getElementById('viewReportModal').classList.remove('hidden');
        }
        
        window.viewReport = viewReport;
        
        async function downloadReport(reportId) {
          const report = getReportById(reportId);
          if (!report) {
            showToast('Error', 'Report not found', 'error');
            return;
          }
          
          const downloadUrl = getReportDownloadUrl(report);
          if (!downloadUrl) {
            showToast('Error', 'No file available for this report', 'error');
            return;
          }
          
          try {
            const response = await fetch(downloadUrl, { credentials: 'include' });
            if (!response.ok) {
              let message = 'Failed to download report';
              try {
                const err = await response.json();
                message = err.error || message;
              } catch (_) {}
              showToast('Error', message, 'error');
              return;
            }

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json') || contentType.includes('text/html')) {
              showToast('Error', 'Downloaded response is not a valid report file', 'error');
              return;
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition') || '';
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
            const fallbackName = report.name ? (report.name + '_report') : 'medical_report';
            const fileName = filenameMatch?.[1] || fallbackName;

            const blobUrl = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(blobUrl);
            showToast('Download', 'Report download started', 'info');
          } catch (error) {
            console.error('Report download failed:', error);
            showToast('Error', 'Network error while downloading report', 'error');
          }
        }
        
        window.downloadReport = downloadReport;
        
        function viewPrescription(prescriptionId) {
          const prescription = prescriptionsData.find(p => p.id === prescriptionId);
          if (!prescription) return;
          
          document.getElementById('prescriptionModalTitle').textContent = \`\${prescription.medicine}\`;
          document.getElementById('prescriptionModalContent').innerHTML = \`
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="cyan-light p-3 rounded-lg">
                  <p class="text-xs cyan-text">Medicine</p>
                  <p class="text-sm font-semibold">\${prescription.medicine}</p>
                </div>
                <div class="cyan-light p-3 rounded-lg">
                  <p class="text-xs cyan-text">Dosage</p>
                  <p class="text-sm font-semibold">\${prescription.dosage}</p>
                </div>
                <div class="cyan-light p-3 rounded-lg">
                  <p class="text-xs cyan-text">Frequency</p>
                  <p class="text-sm font-semibold">\${prescription.frequency}</p>
                </div>
                <div class="cyan-light p-3 rounded-lg">
                  <p class="text-xs cyan-text">Valid Until</p>
                  <p class="text-sm font-semibold">\${new Date(prescription.validUntil).toLocaleDateString()}</p>
                </div>
              </div>
              <div class="cyan-light p-3 rounded-lg">
                <p class="text-xs cyan-text mb-1">Instructions</p>
                <p class="text-sm">\${prescription.instructions}</p>
              </div>
            </div>
          \`;
          
          document.getElementById('refillPrescriptionBtn').onclick = () => requestRefill(prescriptionId);
          document.getElementById('viewPrescriptionModal').classList.remove('hidden');
        }
        
        window.viewPrescription = viewPrescription;
        
        function requestRefill(prescriptionId) {
          const prescription = prescriptionsData.find(p => p.id === prescriptionId);
          if (prescription) {
            showToast('Success', \`Refill requested for \${prescription.medicine}\`, 'success');
          }
        }
        
        function openUploadReportModal() {
          document.getElementById('uploadReportModal').classList.remove('hidden');
          document.getElementById('reportTestDate').valueAsDate = new Date();
        }
        
        window.openUploadReportModal = openUploadReportModal;
        
        function openOrderMedicinesModal() {
          if (prescriptionsData.length === 0) {
            showToast('Info', 'No active prescriptions to order', 'info');
            return;
          }
          document.getElementById('orderMedicinesModal').classList.remove('hidden');
        }
        
        window.openOrderMedicinesModal = openOrderMedicinesModal;
        
        function downloadAllRecords() {
          showToast('Info', 'Preparing your records for download...', 'info');
        }
        
        window.downloadAllRecords = downloadAllRecords;
        
        function viewNotifications() {
          showToast('Info', 'No new notifications', 'info');
        }
        
        window.viewNotifications = viewNotifications;
        
        function openHelpCenter() {
          showToast('Info', 'Opening help center...', 'info');
        }
        
        window.openHelpCenter = openHelpCenter;
        
        function openSettings() {
          showToast('Info', 'Opening settings...', 'info');
        }
        
        window.openSettings = openSettings;
        
        // Make doctorsData available globally for reschedule modal
        const doctorsData = [];
      </script>
    </body>
    </html>
  `;
}

// ============================================
// ROUTES - Use the generatePatientHTML function
// ============================================


// ============================================
// START SERVER - ONLY when run directly
// ============================================


// ============================================
// EXPORT for signin.js
// ============================================
module.exports = async function renderPatientDashboard(userId) {
  try {
    console.log('🔍 Starting renderPatientDashboard for user:', userId);
    
    // Get patient data using the user_id from the logged-in user
    const patientResult = await query(
      `SELECT * FROM patients WHERE user_id = $1`,
      [userId]
    );
    
    console.log('📋 Patient query result:', {
      rowCount: patientResult.rows.length,
      patientData: patientResult.rows[0] || 'No patient found'
    });
    
    if (!patientResult.rows[0]) {
      console.log('⚠️ No patient found for user:', userId);
      return '<h1>Error: Patient profile not found</h1><p>Please contact support.</p>';
    }
    
    const patientId = patientResult.rows[0]?.patient_id;
    console.log('🆔 Patient ID:', patientId);
    
    const appointmentsResult = await query(
      `SELECT a.*, d.full_name as doctor, d.specialization, d.doctor_id
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE a.patient_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [patientId]
    );
    console.log('📅 Appointments found:', appointmentsResult.rows.length);
    
    const reportsResult = await query(
      `SELECT * FROM lab_reports WHERE patient_id = $1 ORDER BY created_at DESC`,
      [patientId]
    );
    console.log('📄 Reports found:', reportsResult.rows.length);
    
    const prescriptionsResult = await query(
      `SELECT * FROM prescriptions WHERE patient_id = $1 AND status = 'active' ORDER BY created_at DESC`,
      [patientId]
    );
    console.log('💊 Prescriptions found:', prescriptionsResult.rows.length);
    
    // Get doctors for booking
    const doctorsResult = await query(
      `SELECT d.*, h.name as hospital_name 
       FROM doctors d
       JOIN hospitals h ON d.hospital_id = h.hospital_id
       WHERE d.status = 'Available'
       ORDER BY d.full_name`
    );
    
    console.log('🎨 Generating HTML...');
    const html = generatePatientHTML(
      patientResult.rows[0] || null,
      appointmentsResult.rows || [],
      reportsResult.rows || [],
      prescriptionsResult.rows || []
    );
    
    console.log('✅ HTML generated successfully');
    return html;
    
  } catch (error) {
    console.error('❌ Error loading patient dashboard:', error);
    return '<h1>Error loading dashboard</h1><p>Please try again later.</p>';
  }
};