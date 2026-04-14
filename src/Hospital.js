//Hospital.js


const { query, getClient } = require('./db/config');  // ← ONLY this line

// Data storage (simulating localStorage on server)
/*const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // API Routes
  if (path === '/api/hospital/data' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(hospitalData));
  }
  
  else if (path === '/api/hospital/data' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const newData = JSON.parse(body);
        hospitalData = { ...hospitalData, ...newData };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: hospitalData }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
  
  else if (path === '/api/hospital/stats' && req.method === 'GET') {
    const stats = {
      totalDoctors: hospitalData.doctors.length,
      totalSpecialities: hospitalData.specialities.length,
      totalMedicines: hospitalData.medicines.length,
      totalLabs: hospitalData.labs.length
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
  }
  
  else if (path === '/api/hospital/add/speciality' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { specialityDetails } = JSON.parse(body);
        
        if (specialityDetails && specialityDetails.name) {
          // Add to simple list
          if (!hospitalData.specialities.includes(specialityDetails.name)) {
            hospitalData.specialities.push(specialityDetails.name);
          }
          
          // Add to detailed list
          if (!hospitalData.specialityDetails) {
            hospitalData.specialityDetails = [];
          }
          hospitalData.specialityDetails.push(specialityDetails);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: hospitalData }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
  
  else if (path === '/api/hospital/add/doctor' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const doctorData = {
          id: 'DR-' + Date.now(),
          ...JSON.parse(body),
          registeredOn: new Date().toISOString(),
          status: 'active'
        };
        
        hospitalData.doctors.push(doctorData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: hospitalData }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
  
  else if (path === '/api/hospital/add/medicine' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        hospitalData.medicines.push(JSON.parse(body));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: hospitalData }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
  
  else if (path === '/api/hospital/add/lab' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const labData = JSON.parse(body);
        hospitalData.labs.push(labData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: hospitalData }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }

  // HTML Routes
  else if (path === '/' || path === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getMainDashboardHTML());
  }
  
  else if (path === '/add-speciality') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getAddSpecialityHTML());
  }
  
  else if (path === '/add-doctor') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getAddDoctorHTML());
  }
  
  else if (path === '/add-medicine') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getAddMedicineHTML());
  }
  
  else if (path === '/add-lab') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getAddLabHTML());
  }
  
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});*/
// Add this near the top of Hospital.js after your existing requires
const path = require('path');

// Add this route to handle redirects from registration
// app.get('/', async (req, res) => {
//     try {
//         // Check if this is a new registration redirect
//         const hospitalData = await module.exports.renderHospitalDashboard();
//         res.send(hospitalData);
//     } catch (error) {
//         console.error('Error loading dashboard:', error);
//         res.status(500).send('Error loading dashboard');
//     }
// });

// // Add this route to handle the dashboard display
// app.get('/dashboard', async (req, res) => {
//     try {
//         // You can pass hospital ID as query parameter
//         // For now, just render the dashboard
//         const html = await module.exports.renderHospitalDashboard();
//         res.send(html);
//     } catch (error) {
//         console.error('Error loading dashboard:', error);
//         res.status(500).send('Error loading dashboard');
//     }
// });

// HTML Template Functions
function getMainDashboardHTML(hospitalData = null, doctors = [], medicines = [], labs = []) {
    const currentHospitalData = {
        hospitalName: hospitalData?.name || 'City General Hospital',
        hospitalId: hospitalData?.hospital_uuid || 'HOS-12345',
        stats: {
            total_doctors: doctors.length,
            total_medicines: medicines.length,
            total_labs: labs.length
        },
        specialities: [...new Set(doctors.map(d => d.specialization).filter(Boolean))]
    };
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BondHealth - Hospital Dashboard</title>
    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #06b6d4;
            --light: #ecfeff;
            --dark: #0891b2;
            --white: #ffffff;
            --shadow: 0 8px 25px rgba(6, 182, 212, 0.1);
            --success: #4caf50;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5fbff 0%, #edf7ff 100%);
            min-height: 100vh;
            padding: 20px;
            position: relative;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            padding: 20px;
            background: white;
            border-radius: 20px;
            box-shadow: var(--shadow);
            border: 2px solid var(--light);
            animation: fadeIn 0.8s ease-out 0.2s both;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .title h1 {
            color: var(--dark);
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .title p {
            color: #666;
            font-size: 1rem;
        }

        .hospital-info {
            text-align: right;
        }

        .hospital-name {
            font-size: 1.6rem;
            font-weight: 600;
            color: var(--dark);
            margin-bottom: 8px;
        }

        .hospital-id {
            background: var(--light);
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 500;
            color: var(--dark);
            display: inline-block;
            border: 2px solid rgba(30, 136, 229, 0.2);
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .stat-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: var(--shadow);
            border: 2px solid var(--light);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            animation: scaleIn 0.5s ease-out;
        }

        @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }

        .stat-card:hover {
            transform: translateY(-8px);
            border-color: var(--primary);
            box-shadow: 0 15px 35px rgba(6, 182, 212, 0.15);
        }

        .stat-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: var(--light);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            color: var(--primary);
            margin: 0 auto 15px;
            transition: transform 0.3s ease;
        }

        .stat-card:hover .stat-icon {
            transform: scale(1.1);
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--dark);
            margin-bottom: 5px;
        }

        .stat-label {
            color: #666;
            font-size: 0.9rem;
        }

        .services {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 25px;
            margin-bottom: 40px;
        }

        .service-card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            text-decoration: none;
            border: 2px solid var(--light);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: flex;
            flex-direction: column;
            align-items: center;
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
            height: 250px;
            animation: slideIn 0.6s ease-out;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
        }

        .service-card:nth-child(even) {
            animation: slideInRight 0.6s ease-out;
        }

        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
        }

        .service-card:hover {
            transform: translateY(-8px);
            border-color: var(--primary);
            box-shadow: 0 15px 35px rgba(6, 182, 212, 0.15);
        }

        .icon-with-add {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            position: relative;
            background: var(--white);
            border: 3px solid var(--light);
            transition: all 0.3s ease;
        }

        .service-card:hover .icon-with-add {
            border-color: var(--primary);
            transform: scale(1.1);
        }

        .icon-with-add i {
            font-size: 2rem;
            color: var(--dark);
        }

        .icon-with-add .add-badge {
            position: absolute;
            bottom: -5px;
            right: -5px;
            width: 30px;
            height: 30px;
            background: var(--primary);
            border-radius: 50%;
            color: white;
            font-size: 1rem;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 3px 10px rgba(6, 182, 212, 0.3);
        }

        .service-card h3 {
            font-size: 1.4rem;
            font-weight: 600;
            color: var(--dark);
            margin-bottom: 10px;
            text-align: center;
        }

        .service-card p {
            color: #666;
            font-size: 0.9rem;
            text-align: center;
            margin-bottom: 20px;
            line-height: 1.5;
        }

        .action-buttons {
            display: flex;
            gap: 10px;
            width: 90%;
            justify-content: center;
        }

        .btn-add {
            background: var(--primary);
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 15px;
            font-weight: 500;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: flex;
            align-items: center;
            gap: 5px;
            flex: 1;
            justify-content: center;
            max-width: 120px;
            text-decoration: none;
        }

        .btn-view {
            background: var(--light);
            color: var(--dark);
            border: none;
            padding: 8px 20px;
            border-radius: 15px;
            font-weight: 500;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: flex;
            align-items: center;
            gap: 5px;
            flex: 1;
            justify-content: center;
            max-width: 120px;
            text-decoration: none;
        }

        .btn-add:hover, .btn-view:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(6, 182, 212, 0.2);
        }

        .btn-add:hover {
            background: var(--dark);
            color: white;
            text-decoration: none;
        }

        .btn-view:hover {
            background: var(--primary);
            color: white;
            text-decoration: none;
        }

        .logout {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid var(--light);
        }

        .logout-btn {
            background: transparent;
            color: #666;
            border: 2px solid #ddd;
            padding: 10px 30px;
            border-radius: 20px;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: inline-flex;
            align-items: center;
            gap: 10px;
        }

        .logout-btn:hover {
            background: #f8f9fa;
            color: #333;
            border-color: #ccc;
            transform: translateY(-2px);
            text-decoration: none;
        }

        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
            padding: 20px;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease-out;
        }

        .modal-content {
            background: white;
            border-radius: 20px;
            padding: 30px;
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 15px 40px rgba(0,0,0,0.2);
            animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid var(--light);
        }

        .modal-header h3 {
            color: var(--dark);
            font-size: 1.5rem;
            font-weight: 600;
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: #666;
            transition: all 0.3s ease;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }

        .modal-close:hover {
            background: #ffebee;
            color: #f44336;
            transform: rotate(90deg);
        }

        /* Notification Styles */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 2000;
            animation: slideInRight 0.4s ease-out;
            font-weight: 500;
        }

        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 992px) {
            .services {
                grid-template-columns: 1fr;
                max-width: 500px;
                margin: 0 auto 40px;
            }
            
            .header {
                flex-direction: column;
                text-align: center;
                gap: 15px;
            }
            
            .hospital-info {
                text-align: center;
            }
        }

        @media (max-width: 576px) {
            .service-card {
                height: 230px;
                padding: 20px;
            }
            
            .action-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .btn-add, .btn-view {
                max-width: 100%;
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">
                <h1>🏥 Hospital Management</h1>
                <p>Manage all healthcare services</p>
            </div>
            <div class="hospital-info">
                <div class="hospital-name" id="hospitalName">${currentHospitalData.hospitalName}</div>
                <div class="hospital-id" id="hospitalId">${currentHospitalData.hospitalId}</div>
            </div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-user-md"></i>
                </div>
                <div class="stat-value" id="totalDoctors">${currentHospitalData.stats.total_doctors}</div>
                <div class="stat-label">Total Doctors</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-heartbeat"></i>
                </div>
                <div class="stat-value" id="totalSpecialities">${currentHospitalData.specialities.length}</div>
                <div class="stat-label">Specialities</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-pills"></i>
                </div>
                <div class="stat-value" id="totalMedicines">${currentHospitalData.stats.total_medicines}</div>
                <div class="stat-label">Medicines</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-flask"></i>
                </div>
                <div class="stat-value" id="totalLabs">${currentHospitalData.stats.total_labs}</div>
                <div class="stat-label">Laboratories</div>
            </div>
        </div>

        <div class="services">
            <div class="service-card">
                <div class="icon-with-add">
                    <i class="fas fa-heartbeat"></i>
                    <div class="add-badge">+</div>
                </div>
                <h3>Specialities</h3>
                <p>Manage medical departments and specialities</p>
                <div class="action-buttons">
                    <a href="/add-speciality" class="btn-add">
                        <i class="fas fa-plus"></i> Add
                    </a>
                    <button class="btn-view" onclick="viewSpecialities()">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>

            <div class="service-card">
                <div class="icon-with-add">
                    <i class="fas fa-user-md"></i>
                    <div class="add-badge">+</div>
                </div>
                <h3>Doctors</h3>
                <p>Manage doctor profiles and schedules</p>
                <div class="action-buttons">
                    <a href="/add-doctor" class="btn-add">
                        <i class="fas fa-plus"></i> Add
                    </a>
                    <button class="btn-view" onclick="viewDoctors()">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>

            <div class="service-card">
                <div class="icon-with-add">
                    <i class="fas fa-pills"></i>
                    <div class="add-badge">+</div>
                </div>
                <h3>Pharmacy</h3>
                <p>Manage medicine inventory and stock</p>
                <div class="action-buttons">
                    <a href="/add-medicine" class="btn-add">
                        <i class="fas fa-plus"></i> Add
                    </a>
                    <button class="btn-view" onclick="viewMedicines()">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>

            <div class="service-card">
                <div class="icon-with-add">
                    <i class="fas fa-flask"></i>
                    <div class="add-badge">+</div>
                </div>
                <h3>Laboratories</h3>
                <p>Manage lab services and tests</p>
                <div class="action-buttons">
                    <a href="/add-lab" class="btn-add">
                        <i class="fas fa-plus"></i> Add
                    </a>
                    <button class="btn-view" onclick="viewLabs()">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        </div>

        <div class="logout">
            <a href="http://localhost:3005/" class="logout-btn">
                <i class="fas fa-sign-out-alt"></i> log out
            </a>
        </div>
    </div>

    <div id="viewModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle">View Data</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div id="modalContent"></div>
        </div>
    </div>

    <script>
        async function loadData() {
            try {
                const response = await fetch('/api/hospital/data');
                const data = await response.json();
                
                document.getElementById('hospitalName').textContent = data.hospitalName;
                document.getElementById('hospitalId').textContent = data.hospitalId;
                document.getElementById('totalDoctors').textContent = data.doctors.length;
                document.getElementById('totalSpecialities').textContent = data.specialities.length;
                document.getElementById('totalMedicines').textContent = data.medicines.length;
                document.getElementById('totalLabs').textContent = data.labs.length;
                
                window.hospitalData = data;
            } catch (error) {
                console.error('Error loading data:', error);
                showNotification('Failed to load data', 'error');
            }
        }

        async function viewSpecialities() {
            const data = window.hospitalData || await loadData();
            const modal = document.getElementById('viewModal');
            const title = document.getElementById('modalTitle');
            const content = document.getElementById('modalContent');
            
            title.textContent = 'Specialities List';
            content.innerHTML = \`
                <div style="margin-bottom: 20px;">
                    <h4>Total: \${data.specialities.length} Specialities</h4>
                </div>
                <div style="display: grid; gap: 15px;">
                    \${data.specialities.map((item, index) => \`
                        <div style="background: #f8fdff; padding: 15px; border-radius: 10px; border: 2px solid #e3f2fd; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <i class="fas fa-heartbeat" style="color: #06b6d4; margin-right: 10px;"></i>
                                <strong>\${item}</strong>
                            </div>
                            <button onclick="removeSpeciality('\${item}')" style="background: #ff4757; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    \`).join('')}
                </div>
                <div style="margin-top: 20px; text-align: center;">
                    <a href="/add-speciality" style="background: #06b6d4; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; text-decoration: none; display: inline-block;">
                        <i class="fas fa-plus"></i> Add New Speciality
                    </a>
                </div>
            \`;
            
            modal.style.display = 'flex';
        }

        async function viewDoctors() {
            const data = window.hospitalData || await loadData();
            const modal = document.getElementById('viewModal');
            const title = document.getElementById('modalTitle');
            const content = document.getElementById('modalContent');
            
            title.textContent = 'Doctors List';
            content.innerHTML = \`
                <div style="margin-bottom: 20px;">
                    <h4>Total: \${data.doctors.length} Doctors</h4>
                </div>
                <div style="display: grid; gap: 15px;">
                    \${data.doctors.map((doctor, index) => \`
                        <div style="background: #f8fdff; padding: 15px; border-radius: 10px; border: 2px solid #e3f2fd;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <div>
                                    <i class="fas fa-user-md" style="color: #06b6d4; margin-right: 10px;"></i>
                                    <strong style="font-size: 1.1rem;">\${doctor.name}</strong>
                                </div>
                                <button onclick="removeDoctor(\${index})" style="background: #ff4757; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div style="color: #666; font-size: 0.9rem;">
                                <div><strong>Speciality:</strong> \${doctor.speciality || 'Not specified'}</div>
                                <div><strong>Contact:</strong> \${doctor.phone || 'Not provided'}</div>
                                <div><strong>Email:</strong> \${doctor.email || 'Not provided'}</div>
                                \${doctor.designation ? \`<div><strong>Designation:</strong> \${doctor.designation}</div>\` : ''}
                            </div>
                        </div>
                    \`).join('')}
                </div>
                <div style="margin-top: 20px; text-align: center;">
                    <a href="/add-doctor" style="background: #06b6d4; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; text-decoration: none; display: inline-block;">
                        <i class="fas fa-user-plus"></i> Add New Doctor
                    </a>
                </div>
            \`;
            
            modal.style.display = 'flex';
        }

        async function viewMedicines() {
            const data = window.hospitalData || await loadData();
            const modal = document.getElementById('viewModal');
            const title = document.getElementById('modalTitle');
            const content = document.getElementById('modalContent');
            
            title.textContent = 'Medicine Inventory';
            content.innerHTML = \`
                <div style="margin-bottom: 20px;">
                    <h4>Total: \${data.medicines.length} Medicines</h4>
                </div>
                <div style="display: grid; gap: 15px;">
                    \${data.medicines.map((medicine, index) => \`
                        <div style="background: #f8fdff; padding: 15px; border-radius: 10px; border: 2px solid #e3f2fd;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <div>
                                    <i class="fas fa-pills" style="color: #06b6d4; margin-right: 10px;"></i>
                                    <strong style="font-size: 1.1rem;">\${medicine.name}</strong>
                                </div>
                                <button onclick="removeMedicine(\${index})" style="background: #ff4757; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div style="color: #666; font-size: 0.9rem;">
                                <div><strong>Quantity:</strong> \${medicine.quantity} units</div>
                                <div><strong>Price:</strong> \${medicine.price}</div>
                                \${medicine.expiry ? \`<div><strong>Expiry:</strong> \${medicine.expiry}</div>\` : ''}
                            </div>
                        </div>
                    \`).join('')}
                </div>
                <div style="margin-top: 20px; text-align: center;">
                    <a href="/add-medicine" style="background: #06b6d4; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; text-decoration: none; display: inline-block;">
                        <i class="fas fa-plus-circle"></i> Add New Medicine
                    </a>
                </div>
            \`;
            
            modal.style.display = 'flex';
        }

        async function viewLabs() {
            const data = window.hospitalData || await loadData();
            const modal = document.getElementById('viewModal');
            const title = document.getElementById('modalTitle');
            const content = document.getElementById('modalContent');
            
            title.textContent = 'Laboratories List';
            content.innerHTML = \`
                <div style="margin-bottom: 20px;">
                    <h4>Total: \${data.labs.length} Laboratories</h4>
                </div>
                <div style="display: grid; gap: 20px;">
                    \${data.labs.map((lab, index) => \`
                        <div style="background: #f8fdff; padding: 20px; border-radius: 10px; border: 2px solid #e3f2fd;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <i class="fas fa-flask" style="color: #06b6d4;"></i>
                                        <div>
                                            <strong style="font-size: 1.2rem;">\${typeof lab === 'object' ? lab.name : lab}</strong>
                                            \${typeof lab === 'object' && lab.type ? \`
                                                <div style="color: #666; font-size: 0.9rem; margin-top: 2px;">
                                                    \${lab.type} • License: \${lab.licenseNumber || 'N/A'}
                                                </div>
                                            \` : ''}
                                        </div>
                                    </div>
                                </div>
                                <button onclick="removeLab(\${index})" style="background: #ff4757; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            
                            \${typeof lab === 'object' ? \`
                                \${lab.headInCharge ? \`
                                    <div style="margin-top: 10px; padding: 10px; background: #f0f7ff; border-radius: 8px;">
                                        <strong>Head In Charge:</strong> \${lab.headInCharge.name}
                                        \${lab.headInCharge.qualification ? ' • ' + lab.headInCharge.qualification : ''}
                                        \${lab.headInCharge.experience ? ' • ' + lab.headInCharge.experience + ' years exp.' : ''}
                                    </div>
                                \` : ''}
                                
                                \${lab.location ? \`
                                    <div style="margin-top: 8px;">
                                        <strong>Location:</strong> \${lab.location.address}
                                        \${lab.location.floor ? ' (Floor: ' + lab.location.floor + ')' : ''}
                                    </div>
                                \` : ''}
                                
                                \${lab.operatingHours ? \`
                                    <div style="margin-top: 8px;">
                                        <strong>Hours:</strong> \${lab.operatingHours.openingTime} - \${lab.operatingHours.closingTime}
                                        \${lab.operatingHours.days ? ' • ' + lab.operatingHours.days : ''}
                                    </div>
                                \` : ''}
                                
                                \${lab.services && lab.services.description ? \`
                                    <div style="margin-top: 8px;">
                                        <strong>Services:</strong> 
                                        <div style="color: #666; margin-top: 4px; font-size: 0.9rem;">
                                            \${lab.services.description.substring(0, 100)}\${lab.services.description.length > 100 ? '...' : ''}
                                        </div>
                                    </div>
                                \` : ''}
                            \` : ''}
                        </div>
                    \`).join('')}
                </div>
                <div style="margin-top: 20px; text-align: center;">
                    <a href="/add-lab" style="background: #06b6d4; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; text-decoration: none; display: inline-block;">
                        <i class="fas fa-plus"></i> Add New Laboratory
                    </a>
                </div>
            \`;
            
            modal.style.display = 'flex';
        }

        async function removeSpeciality(specialityName) {
            if (confirm('Are you sure you want to remove this speciality?')) {
                try {
                    hospitalData.specialities = hospitalData.specialities.filter(s => s !== specialityName);
                    
                    const response = await fetch('/api/hospital/data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ specialities: hospitalData.specialities })
                    });
                    
                    if (response.ok) {
                        await loadData();
                        viewSpecialities();
                        showNotification('Speciality removed successfully');
                    }
                } catch (error) {
                    console.error('Error removing speciality:', error);
                    showNotification('Failed to remove speciality', 'error');
                }
            }
        }

        async function removeDoctor(index) {
            if (confirm('Are you sure you want to remove this doctor?')) {
                try {
                    hospitalData.doctors.splice(index, 1);
                    
                    const response = await fetch('/api/hospital/data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ doctors: hospitalData.doctors })
                    });
                    
                    if (response.ok) {
                        await loadData();
                        viewDoctors();
                        showNotification('Doctor removed successfully');
                    }
                } catch (error) {
                    console.error('Error removing doctor:', error);
                    showNotification('Failed to remove doctor', 'error');
                }
            }
        }

        async function removeMedicine(index) {
            if (confirm('Are you sure you want to remove this medicine?')) {
                try {
                    hospitalData.medicines.splice(index, 1);
                    
                    const response = await fetch('/api/hospital/data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ medicines: hospitalData.medicines })
                    });
                    
                    if (response.ok) {
                        await loadData();
                        viewMedicines();
                        showNotification('Medicine removed successfully');
                    }
                } catch (error) {
                    console.error('Error removing medicine:', error);
                    showNotification('Failed to remove medicine', 'error');
                }
            }
        }

        async function removeLab(index) {
            if (confirm('Are you sure you want to remove this laboratory?')) {
                try {
                    if (typeof hospitalData.labs[index] === 'object') {
                        hospitalData.labs.splice(index, 1);
                    } else {
                        const labName = hospitalData.labs[index];
                        hospitalData.labs = hospitalData.labs.filter(l => l !== labName);
                    }
                    
                    const response = await fetch('/api/hospital/data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ labs: hospitalData.labs })
                    });
                    
                    if (response.ok) {
                        await loadData();
                        viewLabs();
                        showNotification('Laboratory removed successfully');
                    }
                } catch (error) {
                    console.error('Error removing lab:', error);
                    showNotification('Failed to remove laboratory', 'error');
                }
            }
        }

        function closeModal() {
            document.getElementById('viewModal').style.display = 'none';
        }

        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.style.background = type === 'success' ? '#4caf50' : '#f44336';
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        document.addEventListener('DOMContentLoaded', function() {
            loadData();
            
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeModal();
                }
            });

            document.getElementById('viewModal').addEventListener('click', function(e) {
                if (e.target === this) closeModal();
            });
        });
    </script>
</body>
</html>`;
}

function getAddSpecialityHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Speciality - BondHealth</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #06b6d4;
            --light: #ecfeff;
            --dark: #0891b2;
            --success: #4caf50;
            --warning: #ff9800;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5fbff 0%, #edf7ff 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .form-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 25px rgba(6, 182, 212, 0.1);
            width: 100%;
            max-width: 700px;
            border: 2px solid var(--light);
            animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .back-btn {
            background: var(--light);
            color: var(--dark);
            border: none;
            padding: 10px 15px;
            border-radius: 10px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .back-btn:hover {
            background: var(--primary);
            color: white;
            transform: translateY(-2px);
            text-decoration: none;
        }
        
        h2 {
            color: var(--dark);
            margin-bottom: 5px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        
        .section-title {
            color: var(--dark);
            font-size: 1.2rem;
            font-weight: 600;
            margin-top: 25px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--light);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-title i {
            color: var(--primary);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: var(--dark);
            font-weight: 500;
        }
        
        .required::after {
            content: " *";
            color: #f44336;
        }
        
        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e3f2fd;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }
        
        .facilities-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .facility-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .facility-checkbox:hover {
            background: var(--light);
            transform: translateY(-2px);
        }
        
        .facility-checkbox input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: var(--primary);
            cursor: pointer;
        }
        
        .facility-checkbox label {
            margin: 0;
            cursor: pointer;
            font-weight: 400;
            color: #333;
        }
        
        .doctors-list {
            max-height: 200px;
            overflow-y: auto;
            border: 2px solid var(--light);
            border-radius: 10px;
            padding: 15px;
            background: #f8f9fa;
            margin-bottom: 20px;
        }
        
        .doctor-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .doctor-item:last-child {
            border-bottom: none;
        }
        
        .doctor-info {
            flex: 1;
        }
        
        .doctor-name {
            font-weight: 600;
            color: var(--dark);
            margin-bottom: 2px;
        }
        
        .doctor-speciality {
            font-size: 0.9rem;
            color: #666;
        }
        
        .status-badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-align: center;
            min-width: 80px;
        }
        
        .status-active {
            background: #e8f5e9;
            color: #2e7d32;
        }
        
        .status-inactive {
            background: #ffebee;
            color: #c62828;
        }
        
        .btn-submit {
            background: var(--primary);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            width: 100%;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            margin-top: 25px;
        }
        
        .btn-submit:hover {
            background: var(--dark);
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(6, 182, 212, 0.3);
        }
        
        .btn-submit:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .form-icon {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .form-icon i {
            font-size: 3rem;
            color: var(--primary);
            background: var(--light);
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            transition: transform 0.3s ease;
        }

        .form-icon i:hover {
            transform: scale(1.1);
        }
        
        .no-doctors {
            text-align: center;
            padding: 30px;
            color: #666;
        }
        
        .no-doctors i {
            font-size: 2rem;
            color: #ccc;
            margin-bottom: 10px;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .facilities-container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="form-container">
        <a href="/admin-dashboard" class="back-btn">
            <i class="fas fa-arrow-left"></i> Back to Dashboard
        </a>
        
        <div class="form-icon">
            <i class="fas fa-heartbeat"></i>
        </div>
        
        <h2>Add New Speciality/Department</h2>
        <p class="subtitle">Register a new medical department with doctors and facilities</p>
        
        <form id="specialityForm">
            <div class="section-title">
                <i class="fas fa-info-circle"></i> Basic Information
            </div>
            
            <div class="form-group">
                <label for="name" class="required">Department Name</label>
                <input type="text" id="name" name="name" required placeholder="e.g., Cardiology, Neurology, Orthopedics">
            </div>
            
            <div class="form-group">
                <label for="description" class="required">Description</label>
                <textarea id="description" name="description" rows="3" required placeholder="Brief description of the department's services and focus"></textarea>
            </div>
            
            <div class="section-title">
                <i class="fas fa-user-md"></i> Department Head
            </div>
            
            <div class="form-group">
                <label for="departmentHead" class="required">Select Department Head</label>
                <select id="departmentHead" name="departmentHead" required>
                    <option value="">Select Head of Department</option>
                </select>
                <div id="headDoctorInfo" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; display: none;">
                    <div><strong>Selected Doctor:</strong> <span id="selectedDoctorName"></span></div>
                    <div><strong>Speciality:</strong> <span id="selectedDoctorSpeciality"></span></div>
                    <div><strong>Contact:</strong> <span id="selectedDoctorContact"></span></div>
                </div>
            </div>
            
            <div class="section-title">
                <i class="fas fa-user-friends"></i> Available Doctors
            </div>
            
            <div class="form-group">
                <label>Doctors matching this speciality:</label>
                <div id="doctorsList" class="doctors-list">
                    <div class="no-doctors" id="noDoctorsMessage">
                        <i class="fas fa-user-md"></i>
                        <p>No doctors found with this speciality.<br>Add doctors first in the Doctors section.</p>
                    </div>
                </div>
            </div>
            
            <div class="section-title">
                <i class="fas fa-clinic-medical"></i> Facilities & Services
            </div>
            
            <div class="form-group">
                <label>Select Available Facilities</label>
                <div class="facilities-container" id="facilitiesContainer"></div>
            </div>
            
            <div class="form-group">
                <label for="additionalServices">Additional Services</label>
                <textarea id="additionalServices" name="additionalServices" rows="2" placeholder="Any additional services or special procedures offered"></textarea>
            </div>
            
            <div class="section-title">
                <i class="fas fa-bed"></i> Department Capacity
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="totalBeds">Total Beds</label>
                    <input type="number" id="totalBeds" name="totalBeds" min="0" placeholder="Number of beds">
                </div>
                
                <div class="form-group">
                    <label for="icuBeds">ICU Beds</label>
                    <input type="number" id="icuBeds" name="icuBeds" min="0" placeholder="ICU beds count">
                </div>
            </div>
            
            <div class="form-group">
                <label for="operatingHours">Operating Hours</label>
                <input type="text" id="operatingHours" name="operatingHours" placeholder="e.g., 24/7, 8:00 AM - 8:00 PM">
            </div>
            
            <div class="form-group">
                <label class="facility-checkbox" style="display: flex; align-items: center; gap: 10px; padding: 0;">
                    <input type="checkbox" id="emergencyServices" name="emergencyServices">
                    <span>24/7 Emergency Services Available</span>
                </label>
            </div>
            
            <button type="submit" class="btn-submit">
                <i class="fas fa-plus"></i> Create Department
            </button>
        </form>
    </div>

    <script>
        const facilitiesList = [
            'Consultation Rooms', 'Operation Theater', 'ICU', 'CCU', 'NICU',
            'Emergency Room', 'Diagnostic Lab', 'X-Ray Facility', 'Ultrasound',
            'CT Scan', 'MRI', 'Pharmacy', 'Ward Rooms', 'Private Rooms',
            'Ambulance Service', 'Blood Bank', 'Physiotherapy'
        ];
        
        document.addEventListener('DOMContentLoaded', async function() {
            loadFacilities();
            await loadDoctors();
            setupDepartmentHeadSelection();
            document.getElementById('specialityForm').addEventListener('submit', handleSubmit);
        });
        
        function loadFacilities() {
            const container = document.getElementById('facilitiesContainer');
            container.innerHTML = '';
            
            facilitiesList.forEach(facility => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'facility-checkbox';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = 'facility_' + facility.replace(/\\s+/g, '_');
                checkbox.name = 'facilities';
                checkbox.value = facility;
                
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = facility;
                
                checkboxDiv.appendChild(checkbox);
                checkboxDiv.appendChild(label);
                container.appendChild(checkboxDiv);
            });
        }
        
        async function loadDoctors() {
            try {
                const response = await fetch('/api/hospital/data');
                const data = await response.json();
                const doctors = data.doctors || [];
                const headSelect = document.getElementById('departmentHead');
                const doctorsListDiv = document.getElementById('doctorsList');
                
                headSelect.innerHTML = '<option value="">Select Head of Department</option>';
                doctorsListDiv.innerHTML = '';
                
                if (doctors.length === 0) {
                    const noDoctorsMsg = document.createElement('div');
                    noDoctorsMsg.className = 'no-doctors';
                    noDoctorsMsg.innerHTML = \`
                        <i class="fas fa-user-md"></i>
                        <p>No doctors found in the database.<br>Add doctors first in the Doctors section.</p>
                    \`;
                    doctorsListDiv.appendChild(noDoctorsMsg);
                    return;
                }
                
                doctors.forEach((doctor, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = doctor.name + ' (' + (doctor.speciality || 'Not specified') + ')';
                    headSelect.appendChild(option);
                });
                
                doctors.forEach((doctor, index) => {
                    const doctorItem = document.createElement('div');
                    doctorItem.className = 'doctor-item';
                    
                    doctorItem.innerHTML = \`
                        <i class="fas fa-user-md" style="color: #06b6d4; font-size: 1.2rem;"></i>
                        <div class="doctor-info">
                            <div class="doctor-name">\${doctor.name}</div>
                            <div class="doctor-speciality">\${doctor.speciality || 'Not specified'}</div>
                        </div>
                        <div class="status-badge status-active">Active</div>
                    \`;
                    
                    doctorsListDiv.appendChild(doctorItem);
                });
            } catch (error) {
                console.error('Error loading doctors:', error);
            }
        }
        
        function setupDepartmentHeadSelection() {
            const headSelect = document.getElementById('departmentHead');
            const infoDiv = document.getElementById('headDoctorInfo');
            
            headSelect.addEventListener('change', async function() {
                try {
                    const response = await fetch('/api/hospital/data');
                    const data = await response.json();
                    const doctors = data.doctors || [];
                    const selectedIndex = parseInt(this.value);
                    
                    if (selectedIndex >= 0 && selectedIndex < doctors.length) {
                        const doctor = doctors[selectedIndex];
                        
                        document.getElementById('selectedDoctorName').textContent = doctor.name;
                        document.getElementById('selectedDoctorSpeciality').textContent = doctor.speciality || 'Not specified';
                        document.getElementById('selectedDoctorContact').textContent = doctor.phone || 'Not available';
                        
                        infoDiv.style.display = 'block';
                        
                        const specialityInput = document.getElementById('name');
                        if (!specialityInput.value.trim() && doctor.speciality) {
                            specialityInput.value = doctor.speciality;
                        }
                    } else {
                        infoDiv.style.display = 'none';
                    }
                } catch (error) {
                    console.error('Error loading doctor details:', error);
                }
            });
        }
        
        async function handleSubmit(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const description = document.getElementById('description').value.trim();
            const departmentHeadIndex = document.getElementById('departmentHead').value;
            const additionalServices = document.getElementById('additionalServices').value.trim();
            const totalBeds = document.getElementById('totalBeds').value;
            const icuBeds = document.getElementById('icuBeds').value;
            const operatingHours = document.getElementById('operatingHours').value.trim();
            const emergencyServices = document.getElementById('emergencyServices').checked;
            
            if (!name || !description || !departmentHeadIndex) {
                alert('Please fill all required fields: Department Name, Description, and Department Head');
                return;
            }
            
            const selectedFacilities = [];
            document.querySelectorAll('input[name="facilities"]:checked').forEach(checkbox => {
                selectedFacilities.push(checkbox.value);
            });
            
            try {
                const response = await fetch('/api/hospital/data');
                let data = await response.json();
                const doctors = data.doctors || [];
                
                const headIndex = parseInt(departmentHeadIndex);
                const departmentHead = headIndex >= 0 && headIndex < doctors.length ? 
                    doctors[headIndex] : null;
                
                const speciality = {
                    id: 'DEPT_' + Date.now(),
                    name: name,
                    description: description,
                    departmentHead: departmentHead ? {
                        name: departmentHead.name,
                        speciality: departmentHead.speciality,
                        phone: departmentHead.phone,
                        email: departmentHead.email
                    } : null,
                    facilities: selectedFacilities,
                    additionalServices: additionalServices,
                    capacity: {
                        totalBeds: parseInt(totalBeds) || 0,
                        icuBeds: parseInt(icuBeds) || 0
                    },
                    operatingHours: operatingHours,
                    emergencyServices: emergencyServices,
                    createdAt: new Date().toISOString(),
                    doctorsCount: doctors.filter(d => d.speciality === name).length,
                    status: 'Active'
                };
                
                if (!data.specialities.includes(name)) {
                    data.specialities.push(name);
                }
                
                if (!data.specialityDetails) {
                    data.specialityDetails = [];
                }
                data.specialityDetails.push(speciality);
                
                const saveResponse = await fetch('/api/hospital/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (saveResponse.ok) {
                    alert('Department created successfully!');

                    window.location.href = '/admin-dashboard';

                } else {
                    alert('Failed to create department');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to create department. Please try again.');
            }
        }
        
        document.getElementById('name').addEventListener('input', async function() {
            const specialityName = this.value.trim();
            if (specialityName) {
                await filterDoctorsBySpeciality(specialityName);
            }
        });
        
        async function filterDoctorsBySpeciality(speciality) {
            try {
                const response = await fetch('/api/hospital/data');
                const data = await response.json();
                const doctors = data.doctors || [];
                const doctorsListDiv = document.getElementById('doctorsList');
                
                doctorsListDiv.innerHTML = '';
                
                const matchingDoctors = doctors.filter(doctor => 
                    doctor.speciality && 
                    doctor.speciality.toLowerCase().includes(speciality.toLowerCase())
                );
                
                if (matchingDoctors.length === 0) {
                    const noDoctorsMsg = document.createElement('div');
                    noDoctorsMsg.className = 'no-doctors';
                    noDoctorsMsg.innerHTML = \`
                        <i class="fas fa-user-md"></i>
                        <p>No doctors found for "\${speciality}" speciality.<br>Add doctors with this speciality first.</p>
                    \`;
                    doctorsListDiv.appendChild(noDoctorsMsg);
                    return;
                }
                
                matchingDoctors.forEach((doctor, index) => {
                    const doctorItem = document.createElement('div');
                    doctorItem.className = 'doctor-item';
                    
                    doctorItem.innerHTML = \`
                        <i class="fas fa-user-md" style="color: #06b6d4; font-size: 1.2rem;"></i>
                        <div class="doctor-info">
                            <div class="doctor-name">\${doctor.name}</div>
                            <div class="doctor-speciality">\${doctor.speciality || 'Not specified'}</div>
                        </div>
                        <div class="status-badge status-active">Active</div>
                    \`;
                    
                    doctorsListDiv.appendChild(doctorItem);
                });
            } catch (error) {
                console.error('Error filtering doctors:', error);
            }
        }
    </script>
</body>
</html>`;
}

function getAddDoctorHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Doctor - BondHealth</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #06b6d4;
            --light: #ecfeff;
            --dark: #0891b2;
            --success: #4caf50;
            --warning: #ff9800;
            --danger: #f44336;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5fbff 0%, #edf7ff 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .form-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 25px rgba(6, 182, 212, 0.1);
            width: 100%;
            max-width: 800px;
            border: 2px solid var(--light);
            margin: 20px auto;
            animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .back-btn {
            background: var(--light);
            color: var(--dark);
            border: none;
            padding: 10px 15px;
            border-radius: 10px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .back-btn:hover {
            background: var(--primary);
            color: white;
            transform: translateY(-2px);
            text-decoration: none;
        }
        
        h2 {
            color: var(--dark);
            margin-bottom: 5px;
            text-align: center;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .section-title {
            color: var(--dark);
            font-size: 1.2rem;
            font-weight: 600;
            margin-top: 30px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--light);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-title i {
            color: var(--primary);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: var(--dark);
            font-weight: 500;
        }
        
        .required::after {
            content: " *";
            color: var(--danger);
        }
        
        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e3f2fd;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .file-upload-container {
            border: 2px dashed #e3f2fd;
            border-radius: 10px;
            padding: 20px;
            background: #fafafa;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        }
        
        .file-upload-container:hover {
            border-color: var(--primary);
            background: var(--light);
        }
        
        .file-upload-label {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            text-align: center;
        }
        
        .file-upload-label i {
            font-size: 2rem;
            color: var(--primary);
            margin-bottom: 10px;
            transition: transform 0.3s ease;
        }

        .file-upload-label:hover i {
            transform: scale(1.1);
        }
        
        .file-upload-label span {
            color: #666;
            margin-bottom: 10px;
        }
        
        .file-upload-label .file-info {
            font-size: 0.9rem;
            color: #999;
        }
        
        input[type="file"] {
            display: none;
        }
        
        .file-preview {
            display: none;
            margin-top: 10px;
            padding: 10px;
            background: #e8f5e9;
            border-radius: 5px;
            font-size: 0.9rem;
            color: #2e7d32;
        }
        
        .checkbox-group {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .checkbox-group input[type="checkbox"] {
            width: auto;
            margin-top: 4px;
            cursor: pointer;
        }
        
        .checkbox-group label {
            margin-bottom: 0;
            cursor: pointer;
            font-weight: 400;
        }
        
        .consent-box {
            background: #fafafa;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid var(--light);
            margin-bottom: 20px;
        }
        
        .btn-submit {
            background: var(--primary);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            width: 100%;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            margin-top: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .btn-submit:hover {
            background: var(--dark);
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(6, 182, 212, 0.3);
        }
        
        .btn-submit:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .form-icon {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .form-icon i {
            font-size: 3rem;
            color: var(--primary);
            background: var(--light);
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease;
        }

        .form-icon i:hover {
            transform: scale(1.1);
        }
        
        .upload-status {
            display: none;
            padding: 10px;
            border-radius: 5px;
            margin-top: 5px;
            font-size: 0.9rem;
        }
        
        .upload-status.success {
            background: #e8f5e9;
            color: #2e7d32;
            display: block;
        }
        
        .upload-status.error {
            background: #ffebee;
            color: #c62828;
            display: block;
        }
        
        .medical-council-section {
            background: #f0f8ff;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 2px solid var(--light);
        }
        
        .medical-council-section h4 {
            color: var(--dark);
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .form-container {
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="form-container">
        <a href="/admin-dashboard" class="back-btn">
            <i class="fas fa-arrow-left"></i> Back to Dashboard
        </a>
        
        <div class="form-icon">
            <i class="fas fa-user-md"></i>
        </div>
        
        <h2>Doctor Registration</h2>
        <p class="subtitle">Complete all required information to register a new doctor</p>
        
        <form id="doctorForm">
            <div class="section-title">
                <i class="fas fa-user"></i> Personal Information
            </div>
            
            <div class="form-group">
                <label for="fullName" class="required">Full Name</label>
                <input type="text" id="fullName" name="fullName" placeholder="Enter doctor's full name" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="speciality" class="required">Speciality</label>
                    <select id="speciality" name="speciality" required>
                        <option value="">Select Speciality</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="Psychiatry">Psychiatry</option>
                        <option value="Radiology">Radiology</option>
                        <option value="General Medicine">General Medicine</option>
                        <option value="General Surgery">General Surgery</option>
                        <option value="Gynecology">Gynecology</option>
                        <option value="ENT">ENT</option>
                        <option value="Ophthalmology">Ophthalmology</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="phoneNumber" class="required">Phone Number</label>
                    <input type="tel" id="phoneNumber" name="phoneNumber" placeholder="+91 XXXXXXXXXX" pattern="[0-9]{10}" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="doctorEmail" class="required">Email Address</label>
                <input type="email" id="doctorEmail" name="doctorEmail" 
                    placeholder="doctor@hospital.com" required>
                <small style="color:#666;font-size:.85rem;">
                    This will be the doctor's login username.
                </small>
            </div>

            <div class="form-group">
                <label for="dateOfBirth" class="required">Date of Birth</label>
                <input type="date" id="dateOfBirth" name="dateOfBirth" required>
            </div>
            
            <div class="form-group">
                <label for="doctorImage" class="required">Doctor's Profile Image</label>
                <div class="file-upload-container">
                    <label for="doctorImage" class="file-upload-label">
                        <i class="fas fa-camera"></i>
                        <span>Click to upload profile photo</span>
                        <div class="file-info">Accepted: JPG, PNG (Max: 5MB)</div>
                    </label>
                    <input type="file" id="doctorImage" name="doctorImage" accept="image/*">
                    <div class="file-preview" id="imagePreview"></div>
                </div>
            </div>
            
            <div class="section-title">
                <i class="fas fa-graduation-cap"></i> Education & Qualification
            </div>
            
            <div class="form-group">
                <label for="educationQualification" class="required">Education Qualification</label>
                <select id="educationQualification" name="educationQualification" required>
                    <option value="">Select Qualification</option>
                    <option value="MBBS">MBBS</option>
                    <option value="MD">MD (Doctor of Medicine)</option>
                    <option value="MS">MS (Master of Surgery)</option>
                    <option value="DNB">DNB (Diplomate of National Board)</option>
                    <option value="DM">DM (Doctorate of Medicine)</option>
                    <option value="MCh">MCh (Master of Chirurgiae)</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="qualificationCertificate" class="required">Education Qualification Certificate</label>
                <div class="file-upload-container">
                    <label for="qualificationCertificate" class="file-upload-label">
                        <i class="fas fa-certificate"></i>
                        <span>Upload Qualification Certificate</span>
                        <div class="file-info">Accepted: PDF, JPG, PNG (Max: 10MB)</div>
                    </label>
                    <input type="file" id="qualificationCertificate" name="qualificationCertificate" accept=".pdf,image/*">
                    <div class="file-preview" id="qualificationPreview"></div>
                </div>
            </div>
            
            <div class="section-title">
                <i class="fas fa-award"></i> Medical Council & Registration
            </div>
            
            <div class="medical-council-section">
                <h4><i class="fas fa-stethoscope"></i> Specialization & Medical Council Recognition</h4>
                
                <div class="form-group">
                    <label for="medicalCouncil" class="required">Medical Council Registration</label>
                    <select id="medicalCouncil" name="medicalCouncil" required>
                        <option value="">Select Medical Council</option>
                        <option value="MCI">Medical Council of India (MCI)</option>
                        <option value="NMC">National Medical Commission (NMC)</option>
                        <option value="State">State Medical Council</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="registrationNumber" class="required">Registration Number</label>
                    <input type="text" id="registrationNumber" name="registrationNumber" placeholder="Enter medical registration number" required>
                </div>
                
                <div class="form-group">
                    <label for="specializationCertificate" class="required">Specialization Certificate</label>
                    <div class="file-upload-container">
                        <label for="specializationCertificate" class="file-upload-label">
                            <i class="fas fa-file-medical"></i>
                            <span>Upload Specialization Certificate</span>
                            <div class="file-info">Accepted: PDF, JPG, PNG (Max: 10MB)</div>
                        </label>
                        <input type="file" id="specializationCertificate" name="specializationCertificate" accept=".pdf,image/*">
                        <div class="file-preview" id="specializationPreview"></div>
                    </div>
                </div>
            </div>
            
            <div class="section-title">
                <i class="fas fa-id-card"></i> Government Issued ID
            </div>
            
            <div class="form-group">
                <label for="idType" class="required">ID Type</label>
                <select id="idType" name="idType" required>
                    <option value="">Select ID Type</option>
                    <option value="Aadhar">Aadhar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter">Voter's ID</option>
                    <option value="Driving">Driving License</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="govtIdNumber" class="required">ID Number</label>
                <input type="text" id="govtIdNumber" name="govtIdNumber" placeholder="Enter ID number" required>
            </div>
            
            <div class="form-group">
                <label for="govtIdDocument" class="required">ID Document Upload</label>
                <div class="file-upload-container">
                    <label for="govtIdDocument" class="file-upload-label">
                        <i class="fas fa-file-upload"></i>
                        <span>Upload ID Document</span>
                        <div class="file-info">Accepted: PDF, JPG, PNG (Max: 10MB)</div>
                    </label>
                    <input type="file" id="govtIdDocument" name="govtIdDocument" accept=".pdf,image/*">
                    <div class="file-preview" id="govtIdPreview"></div>
                </div>
            </div>
            
            <div class="section-title">
                <i class="fas fa-hospital"></i> Hospital Appointment
            </div>
            
            <div class="form-group">
                <label for="appointmentDate" class="required">Appointment Date</label>
                <input type="date" id="appointmentDate" name="appointmentDate" required>
            </div>
            
            <div class="form-group">
                <label for="designation" class="required">Designation</label>
                <input type="text" id="designation" name="designation" placeholder="e.g., Senior Consultant, Head of Department" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="doctorPassword" class="required">Initial Password</label>
                    <input type="text" id="doctorPassword" name="doctorPassword"
                           placeholder="Set a password for the doctor"
                           autocomplete="new-password" required>
                    <small style="color:#666;font-size:.85rem;">
                        This password will be shared with the doctor for first login.
                    </small>
                </div>
                <div class="form-group" style="display:flex;align-items:flex-end;">
                    <button type="button" onclick="generatePassword()"
                            style="background:var(--primary);color:white;border:none;padding:12px 16px;border-radius:10px;cursor:pointer;font-size:.9rem;font-weight:500;white-space:nowrap;transition:all .3s ease;">
                        🔀 Generate Password
                    </button>
                </div>
            </div>

            <div class="form-group">
                <label for="appointmentLetter" class="required">Appointment Letter</label>
                <div class="file-upload-container">
                    <label for="appointmentLetter" class="file-upload-label">
                        <i class="fas fa-file-contract"></i>
                        <span>Upload Appointment Letter</span>
                        <div class="file-info">Accepted: PDF, JPG, PNG (Max: 10MB)</div>
                    </label>
                    <input type="file" id="appointmentLetter" name="appointmentLetter" accept=".pdf,image/*">
                    <div class="file-preview" id="appointmentPreview"></div>
                </div>
            </div>
            
            <div class="section-title">
                <i class="fas fa-file-signature"></i> Consent & Declaration
            </div>
            
            <div class="consent-box">
                <div class="checkbox-group">
                    <input type="checkbox" id="dataConsent" name="dataConsent" required>
                    <label for="dataConsent">
                        I hereby give consent for the collection, storage, and processing of my personal and professional data by BondHealth for registration and verification purposes.
                        <span class="required"></span>
                    </label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="declarationConsent" name="declarationConsent" required>
                    <label for="declarationConsent">
                        I declare that all the information provided above is true and accurate to the best of my knowledge.
                        <span class="required"></span>
                    </label>
                </div>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="verificationConsent" name="verificationConsent" required>
                    <label for="verificationConsent">
                        I consent to the verification of all submitted documents and information by BondHealth.
                        <span class="required"></span>
                    </label>
                </div>
            </div>
            
            <button type="submit" class="btn-submit">
                <i class="fas fa-user-plus"></i> Register Doctor
            </button>
        </form>
    </div>

    <script>
        // File preview functionality
        const fileConfigs = [
            { inputId: 'doctorImage', previewId: 'imagePreview', maxMB: 5, types: ['image/jpeg','image/jpg','image/png'] },
            { inputId: 'qualificationCertificate', previewId: 'qualificationPreview', maxMB: 10, types: ['application/pdf','image/jpeg','image/jpg','image/png'] },
            { inputId: 'specializationCertificate', previewId: 'specializationPreview', maxMB: 10, types: ['application/pdf','image/jpeg','image/jpg','image/png'] },
            { inputId: 'govtIdDocument', previewId: 'govtIdPreview', maxMB: 10, types: ['application/pdf','image/jpeg','image/jpg','image/png'] },
            { inputId: 'appointmentLetter', previewId: 'appointmentPreview', maxMB: 10, types: ['application/pdf','image/jpeg','image/jpg','image/png'] }
        ];

        fileConfigs.forEach(cfg => {
            const input = document.getElementById(cfg.inputId);
            const preview = document.getElementById(cfg.previewId);
            if (!input || !preview) return;

            input.addEventListener('change', function() {
                if (!this.files || !this.files[0]) {
                    preview.style.display = 'none';
                    preview.textContent = '';
                    return;
                }
                const file = this.files[0];
                
                if (file.size > cfg.maxMB * 1024 * 1024) {
                    alert('File too large. Max ' + cfg.maxMB + 'MB allowed.');
                    this.value = '';
                    preview.style.display = 'none';
                    return;
                }
                if (!cfg.types.includes(file.type)) {
                    alert('Invalid file type. Allowed: ' + cfg.types.join(', '));
                    this.value = '';
                    preview.style.display = 'none';
                    return;
                }
                
                preview.textContent = 'Selected: ' + file.name + ' (' + (file.size / 1024 / 1024).toFixed(2) + ' MB)';
                preview.style.display = 'block';
                preview.className = 'file-preview success';
            });
        });
        
        // Date constraints
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - 24, today.getMonth(), today.getDate());
        document.getElementById('dateOfBirth').max = maxDate.toISOString().split('T')[0];
        document.getElementById('appointmentDate').min = new Date().toISOString().split('T')[0];
        
        // Form submission - Using FormData for file upload
        document.getElementById('doctorForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate required fields
            const requiredFields = this.querySelectorAll('[required]');
            let allValid = true;
            
            requiredFields.forEach(field => {
                if (field.type === 'checkbox') {
                    if (!field.checked) {
                        field.parentElement.style.color = '#f44336';
                        allValid = false;
                    } else {
                        field.parentElement.style.color = '';
                    }
                } else if (field.type !== 'file') {
                    if (!field.value.trim()) {
                        field.style.borderColor = '#f44336';
                        allValid = false;
                    } else {
                        field.style.borderColor = '#e3f2fd';
                    }
                }
            });
            
            if (!allValid) {
                alert('Please fill all required fields.');
                return;
            }
            
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('name', document.getElementById('fullName').value);
            formData.append('email', document.getElementById('doctorEmail').value);
            formData.append('speciality', document.getElementById('speciality').value);
            formData.append('phone', document.getElementById('phoneNumber').value);
            formData.append('dateOfBirth', document.getElementById('dateOfBirth').value);
            formData.append('education', document.getElementById('educationQualification').value);
            formData.append('medicalCouncil', document.getElementById('medicalCouncil').value);
            formData.append('registrationNumber', document.getElementById('registrationNumber').value);
            formData.append('idType', document.getElementById('idType').value);
            formData.append('idNumber', document.getElementById('govtIdNumber').value);
            formData.append('appointmentDate', document.getElementById('appointmentDate').value);
            formData.append('designation', document.getElementById('designation').value);
            formData.append('password', document.getElementById('doctorPassword').value);
            
            // Append files
            const fileInputs = ['doctorImage', 'qualificationCertificate', 'specializationCertificate', 'govtIdDocument', 'appointmentLetter'];
            fileInputs.forEach(inputId => {
                const fileInput = document.getElementById(inputId);
                if (fileInput.files && fileInput.files[0]) {
                    formData.append(inputId, fileInput.files[0]);
                }
            });
            
            const btn = document.querySelector('.btn-submit');
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
            
            try {
                const response = await fetch('/api/hospital/add/doctor', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                
                const result = await response.json();
                console.log('Response:', result);
                
                if (response.ok && result.success) {
                    const pwd = result.initialPassword || document.getElementById('doctorPassword').value;
                    const email = document.getElementById('doctorEmail').value;
                    alert(
                        '✅ Doctor registered successfully!\\n\\n' +
                        '📋 Share these credentials with the doctor:\\n' +
                        '   Email:    ' + email + '\\n' +
                        '   Password: ' + pwd + '\\n\\n' +
                        '⚠️  Ask them to change the password on first login.'
                    );
                    this.reset();
                    document.querySelectorAll('.file-preview').forEach(el => {
                        el.style.display = 'none';
                        el.textContent = '';
                    });
                    setTimeout(() => {
                        window.location.href = '/admin-dashboard';
                    }, 1500);
                } else {
                    alert('❌ ' + (result.error || result.message || 'Registration failed.'));
                    btn.disabled = false;
                    btn.innerHTML = originalHTML;
                }
            } catch (error) {
                console.error('Submit error:', error);
                alert('❌ Network error: ' + error.message);
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        });
        
        function generatePassword() {
            const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
            let pwd = '';
            for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
            document.getElementById('doctorPassword').value = pwd;
        }
    </script>
</body>
</html>`;
}

function getAddMedicineHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Medicine - BondHealth</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #06b6d4;
            --light: #ecfeff;
            --dark: #0891b2;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5fbff 0%, #edf7ff 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .form-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 25px rgba(6, 182, 212, 0.1);
            width: 100%;
            max-width: 500px;
            border: 2px solid var(--light);
            animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .back-btn {
            background: var(--light);
            color: var(--dark);
            border: none;
            padding: 10px 15px;
            border-radius: 10px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .back-btn:hover {
            background: var(--primary);
            color: white;
            transform: translateY(-2px);
            text-decoration: none;
        }
        
        h2 {
            color: var(--dark);
            margin-bottom: 5px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: var(--dark);
            font-weight: 500;
        }
        
        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e3f2fd;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }
        
        .btn-submit {
            background: var(--primary);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            width: 100%;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            margin-top: 10px;
        }
        
        .btn-submit:hover {
            background: var(--dark);
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(6, 182, 212, 0.3);
        }
        
        .form-icon {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .form-icon i {
            font-size: 3rem;
            color: var(--primary);
            background: var(--light);
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            transition: transform 0.3s ease;
        }

        .form-icon i:hover {
            transform: scale(1.1);
        }
    </style>
</head>
<body>
    <div class="form-container">
        <a href="/admin-dashboard" class="back-btn">
            <i class="fas fa-arrow-left"></i> Back to Dashboard
        </a>
        
        <div class="form-icon">
            <i class="fas fa-pills"></i>
        </div>
        
        <h2>Add New Medicine</h2>
        <p class="subtitle">Register medicine to inventory</p>
        
        <form id="medicineForm">
            <div class="form-group">
                <label for="name">Medicine Name *</label>
                <input type="text" id="name" required placeholder="e.g., Paracetamol, Amoxicillin">
            </div>
            
            <div class="form-group">
                <label for="quantity">Quantity *</label>
                <input type="number" id="quantity" required placeholder="Number of units">
            </div>
            
            <div class="form-group">
                <label for="price">Price per Unit *</label>
                <input type="text" id="price" required placeholder="e.g., ₹10">
            </div>
            
            <div class="form-group">
                <label for="expiryDate">Expiry Date</label>
                <input type="date" id="expiryDate">
            </div>
            
            <button type="submit" class="btn-submit">
                <i class="fas fa-plus-circle"></i> Add Medicine
            </button>
        </form>
    </div>

    <script>
        document.getElementById('medicineForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const quantity = document.getElementById('quantity').value;
            const price = document.getElementById('price').value.trim();
            const expiryDate = document.getElementById('expiryDate').value;
            
            if (!name || !quantity || !price) {
                alert('Please fill all required fields');
                return;
            }
            
            try {
                const response = await fetch('/api/hospital/add/medicine', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, quantity, price, expiry: expiryDate })
                });
                
                if (response.ok) {
                    alert('Medicine added successfully!');

                    window.location.href = '/admin-dashboard';

                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to add medicine');
            }
        });
    </script>
</body>
</html>`;
}

function getAddLabHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Laboratory - BondHealth</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #06b6d4;
            --light: #ecfeff;
            --dark: #0891b2;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5fbff 0%, #edf7ff 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .form-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 25px rgba(6, 182, 212, 0.1);
            width: 100%;
            max-width: 600px;
            border: 2px solid var(--light);
            animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .back-btn {
            background: var(--light);
            color: var(--dark);
            border: none;
            padding: 10px 15px;
            border-radius: 10px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .back-btn:hover {
            background: var(--primary);
            color: white;
            transform: translateY(-2px);
            text-decoration: none;
        }
        
        h2 {
            color: var(--dark);
            margin-bottom: 5px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        
        .section-title {
            color: var(--dark);
            font-size: 1.1rem;
            font-weight: 600;
            margin-top: 25px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--light);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-title i {
            color: var(--primary);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: var(--dark);
            font-weight: 500;
        }
        
        .required::after {
            content: " *";
            color: #f44336;
        }
        
        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e3f2fd;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .btn-submit {
            background: var(--primary);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            width: 100%;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            margin-top: 20px;
        }
        
        .btn-submit:hover {
            background: var(--dark);
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(6, 182, 212, 0.3);
        }
        
        .form-icon {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .form-icon i {
            font-size: 3rem;
            color: var(--primary);
            background: var(--light);
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            transition: transform 0.3s ease;
        }

        .form-icon i:hover {
            transform: scale(1.1);
        }
        
        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="form-container">
        <a href="/admin-dashboard" class="back-btn">
            <i class="fas fa-arrow-left"></i> Back to Dashboard
        </a>
        
        <div class="form-icon">
            <i class="fas fa-flask"></i>
        </div>
        
        <h2>Add New Laboratory</h2>
        <p class="subtitle">Register a new laboratory service with complete details</p>
        
        <form id="labForm">
            <div class="section-title">
                <i class="fas fa-info-circle"></i> Basic Information
            </div>
            
            <div class="form-group">
                <label for="name" class="required">Laboratory Name</label>
                <input type="text" id="name" required placeholder="e.g., Pathology Lab, Radiology Department">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="type" class="required">Laboratory Type</label>
                    <select id="type" required>
                        <option value="">Select Type</option>
                        <option value="Pathology">Pathology</option>
                        <option value="Radiology">Radiology</option>
                        <option value="Blood Bank">Blood Bank</option>
                        <option value="Microbiology">Microbiology</option>
                        <option value="Biochemistry">Biochemistry</option>
                        <option value="Histopathology">Histopathology</option>
                        <option value="Cytology">Cytology</option>
                        <option value="Molecular Lab">Molecular Lab</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="licenseNumber" class="required">License Number</label>
                    <input type="text" id="licenseNumber" required placeholder="e.g., LAB-2024-001">
                </div>
            </div>
            
            <div class="section-title">
                <i class="fas fa-user-md"></i> Head In Charge
            </div>
            
            <div class="form-group">
                <label for="headName" class="required">Head Name</label>
                <input type="text" id="headName" required placeholder="Enter name of lab head">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="headQualification" class="required">Qualification</label>
                    <input type="text" id="headQualification" required placeholder="e.g., MD, MSc, PhD">
                </div>
                
                <div class="form-group">
                    <label for="headExperience">Experience (Years)</label>
                    <input type="number" id="headExperience" min="0" placeholder="Years of experience">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="headPhone">Phone Number</label>
                    <input type="tel" id="headPhone" placeholder="Contact number">
                </div>
                
                <div class="form-group">
                    <label for="headEmail">Email Address</label>
                    <input type="email" id="headEmail" placeholder="Email address">
                </div>
            </div>
            
            <div class="section-title">
                <i class="fas fa-map-marker-alt"></i> Location Details
            </div>
            
            <div class="form-group">
                <label for="location" class="required">Location in Hospital</label>
                <input type="text" id="location" required placeholder="e.g., Ground Floor, Block A, Wing 2">
            </div>
            
            <div class="form-group">
                <label for="floor">Floor Number</label>
                <input type="text" id="floor" placeholder="e.g., G, 1, 2, 3">
            </div>
            
            <div class="section-title">
                <i class="fas fa-clock"></i> Operating Hours
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="openingTime" class="required">Opening Time</label>
                    <input type="time" id="openingTime" required>
                </div>
                
                <div class="form-group">
                    <label for="closingTime" class="required">Closing Time</label>
                    <input type="time" id="closingTime" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="operatingDays" class="required">Operating Days</label>
                <select id="operatingDays" required>
                    <option value="">Select Days</option>
                    <option value="Monday-Friday">Monday - Friday</option>
                    <option value="Monday-Saturday">Monday - Saturday</option>
                    <option value="All Days">All Days (Including Sunday)</option>
                    <option value="24/7">24/7 Operation</option>
                    <option value="Custom">Custom Days</option>
                </select>
            </div>
            
            <div class="section-title">
                <i class="fas fa-stethoscope"></i> Services Provided
            </div>
            
            <div class="form-group">
                <label for="services" class="required">Services Description</label>
                <textarea id="services" rows="4" required placeholder="Describe in detail the tests and services offered..."></textarea>
            </div>
            
            <div class="form-group">
                <label for="equipment">Major Equipment</label>
                <textarea id="equipment" rows="2" placeholder="List major equipment available"></textarea>
            </div>
            
            <div class="form-group">
                <label for="specializations">Specializations</label>
                <textarea id="specializations" rows="2" placeholder="Special areas of expertise"></textarea>
            </div>
            
            <div class="section-title">
                <i class="fas fa-file-alt"></i> Additional Information
            </div>
            
            <div class="form-group">
                <label for="capacity">Daily Capacity</label>
                <input type="text" id="capacity" placeholder="e.g., 200 tests/day">
            </div>
            
            <div class="form-group">
                <label for="status">Current Status</label>
                <select id="status">
                    <option value="Operational">Operational</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Temporarily Closed">Temporarily Closed</option>
                    <option value="New Setup">New Setup</option>
                </select>
            </div>
            <div class="section-title">
                <i class="fas fa-lock"></i> Login Credentials
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="labPassword" class="required">Initial Password</label>
                    <input type="text" id="labPassword" name="labPassword" 
                        placeholder="Set a password for the lab technician" required>
                    <small style="color:#666;font-size:.85rem;">
                        Share this password with the lab technician for first login.
                    </small>
                </div>
                <div class="form-group" style="display:flex;align-items:flex-end;">
                    <button type="button" onclick="generateLabPassword()"
                            style="background:var(--primary);color:white;border:none;padding:12px 16px;border-radius:10px;cursor:pointer;font-size:.9rem;font-weight:500;white-space:nowrap;">
                        🔀 Generate Password
                    </button>
                </div>
            </div>
            <button type="submit" class="btn-submit">
                <i class="fas fa-plus"></i> Add Laboratory
            </button>
        </form>
    </div>

    <script>
        document.getElementById('labForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const labData = {
                name: document.getElementById('name').value.trim(),
                password: document.getElementById('labPassword').value.trim(),
                type: document.getElementById('type').value,
                licenseNumber: document.getElementById('licenseNumber').value.trim(),
                
                headInCharge: {
                    name: document.getElementById('headName').value.trim(),
                    qualification: document.getElementById('headQualification').value.trim(),
                    experience: document.getElementById('headExperience').value || 0,
                    phone: document.getElementById('headPhone').value.trim(),
                    email: document.getElementById('headEmail').value.trim()
                },
                
                location: {
                    address: document.getElementById('location').value.trim(),
                    floor: document.getElementById('floor').value.trim()
                },
                
                operatingHours: {
                    openingTime: document.getElementById('openingTime').value,
                    closingTime: document.getElementById('closingTime').value,
                    days: document.getElementById('operatingDays').value
                },
                
                services: {
                    description: document.getElementById('services').value.trim(),
                    equipment: document.getElementById('equipment').value.trim(),
                    specializations: document.getElementById('specializations').value.trim()
                },
                
                additionalInfo: {
                    capacity: document.getElementById('capacity').value.trim(),
                    status: document.getElementById('status').value || 'Operational'
                },
                
                createdAt: new Date().toISOString()
            };
            
            if (!labData.name || !labData.type || !labData.licenseNumber || !labData.headInCharge.name || 
                !labData.headInCharge.qualification || !labData.location.address || 
                !labData.operatingHours.openingTime || !labData.operatingHours.closingTime || 
                !labData.operatingHours.days || !labData.services.description) {
                alert('Please fill all required fields marked with *');
                return;
            }
            
            try {
                const response = await fetch('/api/hospital/add/lab', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(labData)
                });
                
                if (response.ok) {
                    alert('Laboratory added successfully!');
                    window.location.href = '/admin-dashboard';
                } else {
                    alert('Failed to add laboratory');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to add laboratory');
            }
        });
        
        document.getElementById('openingTime').value = '08:00';
        document.getElementById('closingTime').value = '18:00';

        function generateLabPassword() {
            const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
            let pwd = '';
            for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
            document.getElementById('labPassword').value = pwd;
        }
    </script>
</body>
</html>`;
}

/*app.get('/api/hospital/data', async (req, res) => {
  try {
    // For now, get the first hospital (you'll need to pass hospital_id)
    const hospitalResult = await query('SELECT * FROM hospitals LIMIT 1');
    const doctorsResult = await query('SELECT * FROM doctors WHERE hospital_id = $1', [hospitalResult.rows[0]?.hospital_id]);
    const medicinesResult = await query('SELECT * FROM medicines WHERE hospital_id = $1', [hospitalResult.rows[0]?.hospital_id]);
    const labsResult = await query('SELECT * FROM lab_technicians WHERE hospital_id = $1', [hospitalResult.rows[0]?.hospital_id]);
    
    res.json({
      hospitalName: hospitalResult.rows[0]?.name || 'City General Hospital',
      hospitalId: hospitalResult.rows[0]?.hospital_uuid || 'HOS-12345',
      doctors: doctorsResult.rows,
      medicines: medicinesResult.rows,
      labs: labsResult.rows,
      specialities: [...new Set(doctorsResult.rows.map(d => d.specialization).filter(Boolean))]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hospital/add/doctor', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const { name, speciality, phone, email, designation } = req.body;
    
    // Create user account for doctor
    const userResult = await client.query(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING user_id`,
      [email.split('@')[0], email, 'temporary_hash', 'doctor']
    );
    
    // Add doctor to doctors table
    const doctorResult = await client.query(
      `INSERT INTO doctors (user_id, hospital_id, full_name, specialization, phone, email, designation)
       VALUES ($1, (SELECT hospital_id FROM hospitals LIMIT 1), $2, $3, $4, $5, $6)
       RETURNING *`,
      [userResult.rows[0].user_id, name, speciality, phone, email, designation]
    );
    
    await client.query('COMMIT');
    res.json({ success: true, data: doctorResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

app.post('/api/hospital/add/medicine', async (req, res) => {
  try {
    const { name, quantity, price, expiry } = req.body;
    
    const result = await query(
      `INSERT INTO medicines (hospital_id, name, quantity, price, expiry_date)
       VALUES ((SELECT hospital_id FROM hospitals LIMIT 1), $1, $2, $3, $4)
       RETURNING *`,
      [name, quantity, price, expiry]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/hospital/add/lab', async (req, res) => {
  try {
    const labData = req.body;
    
    // Store lab data in a labs table (you may need to create this table)
    const result = await query(
      `INSERT INTO lab_technicians (hospital_id, full_name, employee_id, phone, email)
       VALUES ((SELECT hospital_id FROM hospitals LIMIT 1), $1, $2, $3, $4)
       RETURNING *`,
      [labData.name, labData.licenseNumber, labData.phone, labData.email]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});*/


module.exports = {
  // REPLACE the existing renderHospitalDashboard function with this:
    renderHospitalDashboard: async function(data = null) {
        try {
            // If data is provided with hospital info, use it
            if (data && data.hospital) {
                // Get doctors for this hospital
                const doctorsResult = await query(
                    'SELECT * FROM doctors WHERE hospital_id = $1', 
                    [data.hospital.hospital_id]
                );
                
                // Get medicines for this hospital
                const medicinesResult = await query(
                    'SELECT * FROM medicines WHERE hospital_id = $1', 
                    [data.hospital.hospital_id]
                );
                
                // Get labs for this hospital
                const labsResult = await query(
                    'SELECT * FROM lab_technicians WHERE hospital_id = $1', 
                    [data.hospital.hospital_id]
                );
                
                return getMainDashboardHTML(
                    data.hospital,
                    doctorsResult.rows || [],
                    medicinesResult.rows || [],
                    labsResult.rows || []
                );
            }
            
            // Fallback: Get first hospital from database
            const hospitalResult = await query('SELECT * FROM hospitals LIMIT 1');
            const doctorsResult = await query('SELECT * FROM doctors WHERE hospital_id = $1', [hospitalResult.rows[0]?.hospital_id]);
            const medicinesResult = await query('SELECT * FROM medicines WHERE hospital_id = $1', [hospitalResult.rows[0]?.hospital_id]);
            const labsResult = await query('SELECT * FROM lab_technicians WHERE hospital_id = $1', [hospitalResult.rows[0]?.hospital_id]);
            
            return getMainDashboardHTML(
                hospitalResult.rows[0] || null,
                doctorsResult.rows || [],
                medicinesResult.rows || [],
                labsResult.rows || []
            );
        } catch (error) {
            console.error('Error loading hospital dashboard:', error);
            return '<h1>Error loading dashboard</h1><p>Please try again later.</p>';
        }
    },
  
  getAddDoctorHTML: function() {
    return getAddDoctorHTML();
  },
  
  getAddSpecialityHTML: function() {
    return getAddSpecialityHTML();
  },
  
  getAddMedicineHTML: function() {
    return getAddMedicineHTML();
  },
  
  getAddLabHTML: function() {
    return getAddLabHTML();
  }
};