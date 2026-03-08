// admin.js  (hospital-admin-dashboard)
// Exported as: module.exports = async function renderAdminDashboard(userId)
// Registered in home.js at:  app.get('/admin-dashboard', requireAuth('admin'), ...)

const { query } = require('./db/config');

let doctors = [];
let todaysAppointments = [];

// ─────────────────────────────────────────────
// Template helpers
// home.js exports nothing – it IS the server.
// For logout we simply redirect to '/'.
// For hospital registration we use Hospital.js's exported function.
// ─────────────────────────────────────────────
function getHomePageHTML() {
  // home.js is an Express server, not a template file.
  // Return null so logout falls back to window.location.href = '/'.
  return null;
}

function getHospitalRegisterHTML() {
  try {
    const Hospital = require('./Hospital.js');
    if (typeof Hospital.getAddDoctorHTML === 'function') {
      return Hospital.getAddDoctorHTML();
    }
    console.error('Hospital.js does not export getAddDoctorHTML()');
    return null;
  } catch (error) {
    console.error('Error loading Hospital.js:', error.message);
    return null;
  }
}

function generateHTML(doctorsData = [], appointmentsData = []) {
  doctors = doctorsData;
  todaysAppointments = appointmentsData;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hospital Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: #06b6d4;
            --primary-light: #ecfeff;
            --primary-dark: #0891b2;
        }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .sidebar { background: white; border-right: 1px solid #e2e8f0; height: 100vh; position: fixed; width: 260px; box-shadow: 2px 0 10px rgba(0,0,0,0.05); }
        .main-content { margin-left: 260px; min-height: 100vh; }
        .header { background: white; border-bottom: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .nav-item { padding: 12px 20px; color: #64748b; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; }
        .nav-item:hover { background: #f0f9ff; color: #06b6d4; }
        .nav-item.active { background: #f0f9ff; color: #06b6d4; border-left: 3px solid #06b6d4; }
        .doctor-card { background: white; border-radius: 10px; border: 1px solid #e2e8f0; transition: all 0.3s; cursor: pointer; position: relative; }
        .doctor-card:hover { border-color: #06b6d4; box-shadow: 0 4px 12px rgba(6,182,212,0.1); transform: translateY(-2px); }
        .doctor-card.leave { border-left: 4px solid #f59e0b; background: #fffbeb; }
        .doctor-card.available { border-left: 4px solid #10b981; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status-available { background: #d1fae5; color: #059669; }
        .status-leave { background: #fef3c7; color: #d97706; }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; }
        .modal-content { background: white; border-radius: 12px; width: 90%; max-width: 700px; max-height: 80vh; overflow-y: auto; animation: modalSlideIn 0.3s ease; }
        .modal-content.modal-sm { max-width: 440px; }
        @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        .appointment-item { background: #f0f9ff; border-left: 3px solid #06b6d4; border-radius: 8px; transition: all 0.2s; }
        .appointment-item:hover { background: #e0f2fe; }
        .stats-card { background: white; border-radius: 10px; border: 1px solid #e2e8f0; transition: all 0.3s; }
        .stats-card:hover { border-color: #06b6d4; box-shadow: 0 4px 12px rgba(6,182,212,0.1); }
        .schedule-table { width: 100%; border-collapse: collapse; }
        .schedule-table th { background: #f0f9ff; padding: 12px; text-align: left; color: #06b6d4; font-weight: 600; border-bottom: 2px solid #06b6d4; }
        .schedule-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .schedule-table tr:hover { background: #f0f9ff; }
        .token-badge { background: #06b6d4; color: white; padding: 4px 10px; border-radius: 15px; font-weight: 600; font-size: 12px; }
        .logout-btn { background: linear-gradient(135deg, #ef4444, #dc2626); transition: all 0.3s ease; }
        .logout-btn:hover { background: linear-gradient(135deg, #dc2626, #b91c1c); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
        /* Delete button on card */
        .delete-doctor-btn { position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; border-radius: 50%; background: #fee2e2; color: #ef4444; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.2s; z-index: 10; font-size: 12px; }
        .doctor-card:hover .delete-doctor-btn { opacity: 1; }
        .delete-doctor-btn:hover { background: #ef4444; color: white; transform: scale(1.1); }
        .delete-modal-icon { width: 64px; height: 64px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; transition: all 0.3s ease; }
        .btn-danger:hover { background: linear-gradient(135deg, #dc2626, #b91c1c); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
        .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
        @media (max-width: 768px) { .sidebar { transform: translateX(-100%); z-index: 1000; } .sidebar.active { transform: translateX(0); } .main-content { margin-left: 0; } }
    </style>
</head>
<body>
    <!-- Sidebar -->
    <div class="sidebar p-6" id="sidebar">
        <div class="flex items-center gap-3 mb-8">
            <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <i class="fas fa-hospital text-white text-xl"></i>
            </div>
            <div>
                <h1 class="font-bold text-xl text-gray-800">City General Hospital</h1>
                <p class="text-sm text-cyan-600">Admin Dashboard</p>
            </div>
        </div>
        <div class="space-y-1 mb-8">
            <div class="nav-item active" onclick="showSection('dashboard')"><i class="fas fa-tachometer-alt mr-3"></i>Dashboard</div>
            <div class="nav-item" onclick="showSection('doctors')"><i class="fas fa-user-md mr-3"></i>All Doctors</div>
            <div class="nav-item" onclick="showSection('schedule')"><i class="fas fa-calendar-alt mr-3"></i>Today's Schedule</div>
            <div class="nav-item" onclick="showLeaveModal()"><i class="fas fa-calendar-times mr-3"></i>Update Leave</div>
            <div class="nav-item" onclick="openDoctorRegistration()"><i class="fas fa-user-plus mr-3"></i>Add Details</div>
        </div>
        <div class="pt-6 border-t border-gray-200">
            <h3 class="font-semibold text-gray-700 mb-4">Quick Stats</h3>
            <div class="space-y-3">
                <div class="flex justify-between items-center"><span class="text-gray-600">Total Doctors</span><span class="font-bold text-cyan-600">${doctors.length}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600">Available Today</span><span class="font-bold text-green-600">${doctors.filter(d => d.status === 'Available').length}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600">On Leave</span><span class="font-bold text-amber-600">${doctors.filter(d => d.status === 'On Leave').length}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600">Today's Appointments</span><span class="font-bold text-purple-600">${todaysAppointments.length}</span></div>
            </div>
        </div>
        <div class="absolute bottom-6 left-6 right-6 space-y-3">
            <div class="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg">
                <div class="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center"><i class="fas fa-user-cog text-cyan-600"></i></div>
                <div><p class="font-medium text-gray-800">Admin Manager</p><p class="text-sm text-gray-500">Hospital Administrator</p></div>
            </div>
            <button onclick="logout()" class="logout-btn w-full text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                <i class="fas fa-sign-out-alt"></i> Sign Out
            </button>
        </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <header class="header p-6 flex justify-between items-center">
            <div>
                <h2 id="pageTitle" class="text-xl font-bold text-gray-800">Dashboard Overview</h2>
                <p id="pageSubtitle" class="text-gray-500">Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div class="flex items-center gap-4">
                <button class="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2" onclick="openAddDoctorForm()">
                    <i class="fas fa-user-plus"></i> Register Doctor
                </button>
                <div class="relative">
                    <i class="fas fa-bell text-gray-500 text-xl cursor-pointer"></i>
                    <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
                </div>
                <button onclick="logout()" class="md:hidden bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2">
                    <i class="fas fa-sign-out-alt"></i> Sign Out
                </button>
            </div>
        </header>

        <div class="p-6">
            <!-- Dashboard Section -->
            <div id="dashboardSection">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="stats-card p-6"><div class="flex items-center justify-between"><div><p class="text-gray-500">Available Doctors</p><h3 class="text-2xl font-bold text-cyan-600">${doctors.filter(d => d.status === 'Available').length}</h3></div><div class="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center"><i class="fas fa-user-md text-cyan-600 text-xl"></i></div></div></div>
                    <div class="stats-card p-6"><div class="flex items-center justify-between"><div><p class="text-gray-500">Today's Appointments</p><h3 class="text-2xl font-bold text-purple-600">${todaysAppointments.length}</h3></div><div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><i class="fas fa-calendar-check text-purple-600 text-xl"></i></div></div></div>
                    <div class="stats-card p-6"><div class="flex items-center justify-between"><div><p class="text-gray-500">Doctors on Leave</p><h3 class="text-2xl font-bold text-amber-600">${doctors.filter(d => d.status === 'On Leave').length}</h3></div><div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center"><i class="fas fa-umbrella-beach text-amber-600 text-xl"></i></div></div></div>
                    <div class="stats-card p-6"><div class="flex items-center justify-between"><div><p class="text-gray-500">Emergency Cases</p><h3 class="text-2xl font-bold text-red-600">3</h3></div><div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"><i class="fas fa-ambulance text-red-600 text-xl"></i></div></div></div>
                </div>

                <!-- Available Doctors -->
                <div class="mb-8">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-bold text-gray-800">Available Doctors Today</h3>
                        <button class="text-cyan-600 hover:text-cyan-700 font-medium" onclick="showSection('doctors')">View All →</button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${doctors.filter(d => d.status === 'Available').map(doctor => `
                        <div class="doctor-card available p-6" onclick="showDoctorSchedule('${doctor.doctor_id}')">
                            <button class="delete-doctor-btn" onclick="confirmDeleteDoctor(event, '${doctor.doctor_id}', '${doctor.full_name.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                            <div class="flex items-center gap-4">
                                <img src="${doctor.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctor.full_name) + '&background=06b6d4&color=fff'}" alt="${doctor.full_name}" class="w-16 h-16 rounded-full object-cover border-2 border-cyan-200">
                                <div class="flex-1">
                                    <h4 class="font-bold text-gray-800">${doctor.full_name}</h4>
                                    <p class="text-cyan-600 text-sm font-medium">${doctor.specialization || ''}</p>
                                    <div class="mt-2"><span class="status-badge status-available">Available</span></div>
                                </div>
                            </div>
                            <div class="mt-4 pt-4 border-t border-gray-100">
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600 text-sm"><i class="fas fa-calendar-alt mr-1"></i>${todaysAppointments.filter(a => a.doctor_id === doctor.doctor_id).length} appointments</span>
                                    <button class="text-cyan-600 hover:text-cyan-700 text-sm font-medium">View Schedule →</button>
                                </div>
                            </div>
                        </div>
                        `).join('')}
                        ${doctors.filter(d => d.status === 'Available').length === 0 ? `
                        <div class="col-span-3 text-center py-12 text-gray-500">
                            <i class="fas fa-user-md text-4xl mb-3 text-gray-300"></i>
                            <p>No doctors available today</p>
                        </div>` : ''}
                    </div>
                </div>

                <!-- Today's Schedule Preview -->
                <div>
                    <h3 class="text-lg font-bold text-gray-800 mb-6">Today's Appointments</h3>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white rounded-lg border border-gray-200 p-6">
                            <h4 class="font-bold text-gray-800 mb-4">Upcoming Appointments</h4>
                            <div class="space-y-3">${getUpcomingAppointments()}</div>
                        </div>
                        <div class="bg-white rounded-lg border border-gray-200 p-6">
                            <h4 class="font-bold text-gray-800 mb-4">Doctors on Leave</h4>
                            <div class="space-y-3">
                                ${doctors.filter(d => d.status === 'On Leave').map(doctor => `
                                <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <img src="${doctor.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctor.full_name) + '&background=f59e0b&color=fff'}" alt="${doctor.full_name}" class="w-10 h-10 rounded-full object-cover">
                                        <div class="flex-1">
                                            <p class="font-medium text-gray-800">${doctor.full_name}</p>
                                            <p class="text-amber-600 text-sm">${doctor.leaveFrom || 'N/A'} to ${doctor.leaveTo || 'N/A'}</p>
                                        </div>
                                        <span class="status-badge status-leave">On Leave</span>
                                    </div>
                                </div>
                                `).join('')}
                                ${doctors.filter(d => d.status === 'On Leave').length === 0 ? `
                                <div class="text-center py-8 text-gray-500"><i class="fas fa-check-circle text-3xl mb-3 text-gray-300"></i><p>No doctors on leave today</p></div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- All Doctors Section -->
            <div id="doctorsSection" class="hidden">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-bold text-gray-800">All Doctors</h3>
                    <button class="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center gap-2" onclick="openAddDoctorForm()">
                        <i class="fas fa-plus"></i> Add New Doctor
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${doctors.map(doctor => `
                    <div class="doctor-card ${doctor.status === 'Available' ? 'available' : 'leave'} p-6" onclick="showDoctorSchedule('${doctor.doctor_id}')">
                        <button class="delete-doctor-btn" onclick="confirmDeleteDoctor(event, '${doctor.doctor_id}', '${doctor.full_name.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                        <div class="flex items-center gap-4">
                            <img src="${doctor.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctor.full_name) + '&background=06b6d4&color=fff'}" alt="${doctor.full_name}" class="w-16 h-16 rounded-full object-cover border-2 ${doctor.status === 'Available' ? 'border-cyan-200' : 'border-amber-200'}">
                            <div class="flex-1">
                                <h4 class="font-bold text-gray-800">${doctor.full_name}</h4>
                                <p class="text-cyan-600 text-sm font-medium">${doctor.specialization || ''}</p>
                                <div class="mt-2"><span class="status-badge ${doctor.status === 'Available' ? 'status-available' : 'status-leave'}">${doctor.status || 'Available'}</span></div>
                            </div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-gray-100">
                            <div class="space-y-2">
                                <p class="text-gray-600 text-sm"><i class="fas fa-envelope mr-2"></i>${doctor.email || ''}</p>
                                <p class="text-gray-600 text-sm"><i class="fas fa-phone-alt mr-2"></i>${doctor.phone || ''}</p>
                                <div class="flex justify-between items-center mt-2">
                                    <span class="text-gray-600 text-sm"><i class="fas fa-calendar mr-1"></i>${todaysAppointments.filter(a => a.doctor_id === doctor.doctor_id).length} appointments</span>
                                    <button class="text-cyan-600 hover:text-cyan-700 text-sm font-medium">View Schedule →</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>

            <!-- Schedule Section -->
            <div id="scheduleSection" class="hidden">
                <h3 class="text-lg font-bold text-gray-800 mb-6">Today's Complete Schedule</h3>
                <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table class="schedule-table">
                        <thead><tr><th>Time</th><th>Doctor</th><th>Patient</th><th>Token</th><th>Condition</th></tr></thead>
                        <tbody>
                            ${getAllAppointments().map(appt => `
                            <tr onclick="showDoctorSchedule('${appt.doctorId}')" style="cursor:pointer;">
                                <td class="font-medium">${appt.time}</td>
                                <td><div class="flex items-center gap-2"><img src="${appt.doctorPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(appt.doctorName) + '&background=06b6d4&color=fff'}" alt="${appt.doctorName}" class="w-8 h-8 rounded-full object-cover"><span>${appt.doctorName}</span></div></td>
                                <td>${appt.patient}</td>
                                <td><span class="token-badge">${appt.token}</span></td>
                                <td class="text-gray-600">${appt.condition}</td>
                            </tr>
                            `).join('')}
                            ${getAllAppointments().length === 0 ? `<tr><td colspan="5" class="text-center py-8 text-gray-500"><i class="fas fa-calendar-times text-3xl mb-3 text-gray-300 block"></i>No appointments scheduled for today</td></tr>` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Doctor Schedule Modal -->
    <div class="modal" id="scheduleModal">
        <div class="modal-content">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-gray-800" id="scheduleDoctorName"></h2>
                    <button onclick="closeModal('scheduleModal')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-times text-xl"></i></button>
                </div>
                <div id="scheduleContent"></div>
            </div>
        </div>
    </div>

    <!-- Update Leave Modal -->
    <div class="modal" id="leaveModal">
        <div class="modal-content">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-gray-800">Update Doctor Leave</h2>
                    <button onclick="closeModal('leaveModal')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-times text-xl"></i></button>
                </div>
                <form id="leaveForm" onsubmit="submitLeaveForm(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-gray-700 mb-2">Select Doctor</label>
                            <select id="leaveDoctor" class="w-full p-3 border border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" required>
                                <option value="">Choose a doctor</option>
                                ${doctors.map(doctor => `<option value="${doctor.doctor_id}">${doctor.full_name} - ${doctor.specialization || ''}</option>`).join('')}
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div><label class="block text-gray-700 mb-2">From Date</label><input type="date" id="leaveFromDate" class="w-full p-3 border border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" required></div>
                            <div><label class="block text-gray-700 mb-2">To Date</label><input type="date" id="leaveToDate" class="w-full p-3 border border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" required></div>
                        </div>
                        <div><label class="block text-gray-700 mb-2">Reason</label><textarea id="leaveReason" rows="3" class="w-full p-3 border border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200" placeholder="Enter reason for leave..." required></textarea></div>
                        <div class="flex gap-3 pt-4">
                            <button type="submit" class="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 flex-1 flex items-center justify-center gap-2"><i class="fas fa-check"></i>Update Leave Status</button>
                            <button type="button" onclick="closeModal('leaveModal')" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- DELETE DOCTOR CONFIRMATION MODAL -->
    <div class="modal" id="deleteModal">
        <div class="modal-content modal-sm">
            <div class="p-8">
                <div class="delete-modal-icon"><i class="fas fa-user-minus text-red-500 text-2xl"></i></div>
                <h2 class="text-xl font-bold text-gray-800 text-center mb-2">Remove Doctor</h2>
                <p class="text-gray-500 text-center text-sm mb-1">You are about to remove:</p>
                <p class="text-gray-800 font-semibold text-center text-base mb-4" id="deleteDoctorNameDisplay"></p>
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p class="text-red-700 text-sm font-medium mb-2"><i class="fas fa-exclamation-triangle mr-2"></i>This action will permanently:</p>
                    <ul class="text-red-600 text-sm space-y-1 ml-6 list-disc">
                        <li>Remove the doctor from this hospital</li>
                        <li>Delete all associated leave records</li>
                        <li>Cancel all future appointments</li>
                        <li>Remove their user account access</li>
                    </ul>
                    <p class="text-red-700 text-sm font-bold mt-3">This cannot be undone.</p>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm mb-2">Type <span class="font-bold text-red-600">DELETE</span> to confirm</label>
                    <input type="text" id="deleteConfirmInput" placeholder="Type DELETE here"
                        class="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all text-center font-mono tracking-widest uppercase"
                        oninput="checkDeleteConfirm(this.value)">
                </div>
                <div class="flex gap-3">
                    <button onclick="closeModal('deleteModal')" class="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                    <button id="confirmDeleteBtn" onclick="executeDeleteDoctor()" disabled
                        class="btn-danger flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                        <i class="fas fa-trash-alt"></i> Remove Doctor
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        const doctorsData = ${JSON.stringify(doctors)};
        const todaysAppointmentsData = ${JSON.stringify(todaysAppointments)};

        // ── Delete state ──────────────────────────────────────
        let pendingDeleteDoctorId = null;
        let pendingDeleteDoctorName = null;

        function confirmDeleteDoctor(event, doctorId, doctorName) {
            event.stopPropagation();
            pendingDeleteDoctorId = doctorId;
            pendingDeleteDoctorName = doctorName;
            document.getElementById('deleteDoctorNameDisplay').textContent = doctorName;
            document.getElementById('deleteConfirmInput').value = '';
            document.getElementById('confirmDeleteBtn').disabled = true;
            document.getElementById('deleteModal').style.display = 'flex';
        }

        function checkDeleteConfirm(value) {
            document.getElementById('confirmDeleteBtn').disabled = value.trim().toUpperCase() !== 'DELETE';
        }

        async function executeDeleteDoctor() {
            if (!pendingDeleteDoctorId) return;
            const btn = document.getElementById('confirmDeleteBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Removing...';
            try {
                const response = await fetch(\`/api/doctors/\${pendingDeleteDoctorId}\`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    closeModal('deleteModal');
                    showToast(\`Dr. \${pendingDeleteDoctorName} has been removed.\`, 'success');
                    // Fade out and remove matching cards
                    document.querySelectorAll('.doctor-card').forEach(card => {
                        if (card.getAttribute('onclick')?.includes(pendingDeleteDoctorId)) {
                            card.style.transition = 'all 0.4s ease';
                            card.style.opacity = '0';
                            card.style.transform = 'scale(0.9)';
                            setTimeout(() => card.remove(), 400);
                        }
                    });
                    setTimeout(() => window.location.reload(), 1800);
                } else {
                    throw new Error(data.message || 'Delete failed');
                }
            } catch (error) {
                showToast('Failed to remove doctor: ' + error.message, 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-trash-alt mr-2"></i> Remove Doctor';
            } finally {
                pendingDeleteDoctorId = null;
                pendingDeleteDoctorName = null;
            }
        }
        // ─────────────────────────────────────────────────────

        function showSection(sectionId) {
            ['dashboard','doctors','schedule'].forEach(s => document.getElementById(s + 'Section').classList.add('hidden'));
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            document.getElementById(sectionId + 'Section').classList.remove('hidden');
            const navItems = { dashboard: 0, doctors: 1, schedule: 2 };
            document.querySelectorAll('.nav-item')[navItems[sectionId]]?.classList.add('active');
            const titles = { dashboard: 'Dashboard Overview', doctors: 'All Doctors', schedule: "Today's Schedule" };
            document.getElementById('pageTitle').textContent = titles[sectionId] || 'Dashboard';
        }

        function openDoctorRegistration() { window.location.href = '/hospital-dashboard'; }
        function openAddDoctorForm() { window.location.href = '/add-doctor'; }

        function logout() {
            fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
                .then(() => window.location.href = '/')
                .catch(() => window.location.href = '/');
        }

        function showDoctorSchedule(doctorId) {
            const doctor = doctorsData.find(d => d.doctor_id === doctorId);
            if (!doctor) return;
            document.getElementById('scheduleDoctorName').textContent = doctor.full_name + "'s Schedule";
            const doctorAppointments = todaysAppointmentsData.filter(a => a.doctor_id === doctorId);
            let appointmentsHtml = doctorAppointments.length > 0 ? \`
                <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table class="w-full">
                        <thead><tr class="bg-gray-50">
                            <th class="text-left p-3 text-gray-600 font-medium">Time</th>
                            <th class="text-left p-3 text-gray-600 font-medium">Patient</th>
                            <th class="text-left p-3 text-gray-600 font-medium">Token</th>
                            <th class="text-left p-3 text-gray-600 font-medium">Condition</th>
                        </tr></thead>
                        <tbody>
                            \${doctorAppointments.map(appt => \`
                            <tr class="border-t border-gray-100 hover:bg-gray-50">
                                <td class="p-3 font-medium">\${appt.appointment_time}</td>
                                <td class="p-3">\${appt.patient_name}</td>
                                <td class="p-3"><span class="token-badge">\${appt.token_number || 'N/A'}</span></td>
                                <td class="p-3 text-gray-600">\${appt.reason || 'General'}</td>
                            </tr>\`).join('')}
                        </tbody>
                    </table>
                </div>\` : \`<div class="text-center py-8 text-gray-500"><i class="fas fa-calendar-times text-3xl mb-3 text-gray-300 block"></i>No appointments scheduled for today</div>\`;

            document.getElementById('scheduleContent').innerHTML = \`
                <div class="space-y-6">
                    <div class="flex items-center gap-6 p-4 bg-cyan-50 rounded-lg">
                        <img src="\${doctor.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctor.full_name) + '&background=06b6d4&color=fff'}"
                             alt="\${doctor.full_name}" class="w-20 h-20 rounded-full object-cover border-4 \${doctor.status === 'Available' ? 'border-cyan-200' : 'border-amber-200'}">
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">\${doctor.full_name}</h3>
                            <p class="text-cyan-600 font-medium">\${doctor.specialization || ''}</p>
                            <div class="mt-2"><span class="status-badge \${doctor.status === 'Available' ? 'status-available' : 'status-leave'}">\${doctor.status}</span></div>
                        </div>
                    </div>
                    \${doctor.status === 'On Leave' ? \`
                    <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 class="font-bold text-amber-800 mb-2"><i class="fas fa-umbrella-beach mr-2"></i>On Leave</h4>
                        <p class="text-amber-700">From \${doctor.leaveFrom || 'N/A'} to \${doctor.leaveTo || 'N/A'}</p>
                        <p class="text-amber-600 text-sm mt-1">\${doctor.leaveReason || 'Not specified'}</p>
                    </div>\` : ''}
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="font-bold text-gray-800">Today's Appointments</h4>
                        <span class="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm">\${doctorAppointments.length} appointments</span>
                    </div>
                    \${appointmentsHtml}
                    <div class="pt-4 border-t border-gray-200 flex gap-3">
                        <button class="bg-cyan-600 text-white flex-1 py-3 rounded-lg hover:bg-cyan-700 flex items-center justify-center gap-2"
                                onclick="showLeaveModalForDoctor('\${doctor.doctor_id}')">
                            <i class="fas fa-calendar-times"></i> Update Leave Status
                        </button>
                        <button class="btn-danger px-6 py-3 rounded-lg flex items-center justify-center gap-2"
                                onclick="closeModal('scheduleModal'); setTimeout(() => confirmDeleteDoctor({ stopPropagation: ()=>{} }, '\${doctor.doctor_id}', '\${doctor.full_name.replace(/'/g, "\\\\'")}'), 100)">
                            <i class="fas fa-user-minus"></i> Remove Doctor
                        </button>
                    </div>
                </div>\`;
            document.getElementById('scheduleModal').style.display = 'flex';
        }

        function showLeaveModal() { document.getElementById('leaveModal').style.display = 'flex'; }
        function showLeaveModalForDoctor(doctorId) {
            document.getElementById('leaveDoctor').value = doctorId;
            showLeaveModal();
            closeModal('scheduleModal');
        }
        function closeModal(modalId) { document.getElementById(modalId).style.display = 'none'; }

        function submitLeaveForm(event) {
            event.preventDefault();
            const doctorId = document.getElementById('leaveDoctor').value;
            const doctor = doctorsData.find(d => d.doctor_id === doctorId);
            if (!doctor) { alert('Please select a doctor'); return; }
            fetch(\`/api/doctors/\${doctorId}/leave\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: document.getElementById('leaveFromDate').value,
                    to: document.getElementById('leaveToDate').value,
                    reason: document.getElementById('leaveReason').value
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) { showToast(\`Leave updated for \${doctor.full_name}\`); closeModal('leaveModal'); setTimeout(() => window.location.reload(), 1500); }
                else alert('Failed to update leave: ' + (data.message || 'Unknown error'));
            })
            .catch(() => alert('Failed to update leave. Please try again.'));
        }

        function showToast(message, type = 'success') {
            const colors = { success: 'bg-cyan-600', error: 'bg-red-600' };
            const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle' };
            const toast = document.createElement('div');
            toast.className = \`fixed bottom-4 right-4 \${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50\`;
            toast.innerHTML = \`<i class="fas \${icons[type]}"></i><span>\${message}</span>\`;
            document.body.appendChild(toast);
            setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
        }

        document.addEventListener('DOMContentLoaded', () => {
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('leaveFromDate').min = today;
            document.getElementById('leaveFromDate').value = today;
            document.getElementById('leaveToDate').min = today;
            document.getElementById('leaveToDate').value = tomorrow.toISOString().split('T')[0];
            window.addEventListener('click', e => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; });
        });
    </script>
</body>
</html>`;
}

// ── Helper functions ───────────────────────────────────────
function getUpcomingAppointments() {
  if (!todaysAppointments || todaysAppointments.length === 0) {
    return '<div class="text-center py-8 text-gray-500"><i class="fas fa-calendar-times text-3xl mb-3 text-gray-300 block"></i>No appointments scheduled for today</div>';
  }
  return todaysAppointments.slice(0, 3).map(appt => `
    <div class="appointment-item p-4">
      <div class="flex justify-between items-center">
        <div><p class="font-medium text-gray-800">${appt.patient_name}</p><p class="text-sm text-gray-500">${appt.doctor_name}</p></div>
        <div class="text-right"><span class="font-bold text-cyan-600">${appt.token_number || 'N/A'}</span><p class="text-sm text-gray-500">${appt.appointment_time}</p></div>
      </div>
    </div>`).join('');
}

function getAllAppointments() {
  if (!todaysAppointments) return [];
  return todaysAppointments.map(appt => ({
    time: appt.appointment_time,
    patient: appt.patient_name,
    token: appt.token_number || 'N/A',
    condition: appt.reason || 'General',
    doctorId: appt.doctor_id,
    doctorName: appt.doctor_name,
    doctorPhoto: appt.doctor_photo
  }));
}

// ── Main export ────────────────────────────────────────────
module.exports = async function renderAdminDashboard(userId) {
  try {
    const adminResult = await query(
      `SELECT hospital_id FROM hospital_admins WHERE user_id = $1`,
      [userId]
    );

    const hospitalId = adminResult.rows[0]?.hospital_id;
    if (!hospitalId) {
      console.error('No hospital found for admin user:', userId);
      return '<h1>Error: No hospital associated with this admin account</h1>';
    }

    // Load doctors for this hospital
    const doctorsResult = await query(
      `SELECT d.*, h.name as hospital_name,
              dl.from_date as "leaveFrom", dl.to_date as "leaveTo", dl.reason as "leaveReason"
       FROM doctors d
       JOIN hospitals h ON d.hospital_id = h.hospital_id
       LEFT JOIN LATERAL (
           SELECT from_date, to_date, reason
           FROM doctor_leave
           WHERE doctor_id = d.doctor_id
             AND status = 'Approved'
             AND from_date <= CURRENT_DATE
             AND to_date >= CURRENT_DATE
           ORDER BY created_at DESC
           LIMIT 1
       ) dl ON true
       WHERE d.hospital_id = $1
       AND d.status != 'Inactive'
       ORDER BY d.full_name`,
      [hospitalId]
    );

    // Load today's appointments
    // Uses DATE() cast to handle both DATE and TIMESTAMP columns safely
    const appointmentsResult = await query(
      `SELECT a.*,
              p.full_name  AS patient_name,
              d.full_name  AS doctor_name,
              d.photo_url  AS doctor_photo,
              d.doctor_id
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors  d ON a.doctor_id  = d.doctor_id
       WHERE a.hospital_id = $1
         AND DATE(a.appointment_date) = CURRENT_DATE
         AND a.status NOT IN ('cancelled')
       ORDER BY a.appointment_time`,
      [hospitalId]
    );

    return generateHTML(doctorsResult.rows, appointmentsResult.rows);
  } catch (error) {
    console.error('Error loading admin dashboard data:', error);
    return `<h1>Error loading dashboard</h1><p>${error.message}</p>`;
  }
};