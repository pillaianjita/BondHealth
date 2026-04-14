const express = require('express');
const { upload, storageService } = require('./storage');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { query, getClient } = require('./db/config');
const multer = require('multer');

const http = require('http');
const chatServer = require('./Chat');
const { generateChatRoomHTML } = require('./Chatroom');
const app = express();
const PORT = process.env.PORT || 3005;
const { handleRegistration } = require('./HospitalRegistration');


// ============================================
// MIDDLEWARE
// ============================================
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

// ============================================
// SESSION TRACKING
// ============================================
let activeSessions = new Map();

// ============================================
// UPLOAD DIRECTORIES
// ============================================
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads'); // go up one level from src/
const uploadDirs = [
    UPLOADS_ROOT,
    path.join(UPLOADS_ROOT, 'reports'),
    path.join(UPLOADS_ROOT, 'scans'),
    path.join(UPLOADS_ROOT, 'temp'),
    path.join(UPLOADS_ROOT, 'photos'),
    path.join(UPLOADS_ROOT, 'hospitals', 'logos'),
    path.join(UPLOADS_ROOT, 'hospitals', 'photos'),
    path.join(UPLOADS_ROOT, 'admins', 'photos'),
];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});



// Add doctor upload directories
const doctorDirs = ['./uploads/doctors', './uploads/doctors/photos', './uploads/doctors/qualifications', './uploads/doctors/specializations', './uploads/doctors/idproofs', './uploads/doctors/appointments'];
doctorDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

const doctorStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        let folder = 'uploads/doctors';
        if (file.fieldname === 'doctorImage') folder = 'uploads/doctors/photos';
        else if (file.fieldname === 'qualificationCertificate') folder = 'uploads/doctors/qualifications';
        else if (file.fieldname === 'specializationCertificate') folder = 'uploads/doctors/specializations';
        else if (file.fieldname === 'govtIdDocument') folder = 'uploads/doctors/idproofs';
        else if (file.fieldname === 'appointmentLetter') folder = 'uploads/doctors/appointments';
        
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
        cb(null, folder);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const doctorUpload = multer({ 
    storage: doctorStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function(req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
        }
    }
});
// =====
// =======================================
// JWT HELPERS
// ============================================
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id || user.user_id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch {
        return null;
    }
};
// ============================================
// DATABASE HELPER FUNCTIONS
// ============================================
async function checkPatientInHospital(patientId, hospitalId) {
    try {
        const result = await query(
            `SELECT EXISTS(
                SELECT 1 FROM appointments a
                JOIN doctors d ON a.doctor_id = d.doctor_id
                WHERE a.patient_id = $1 AND d.hospital_id = $2
                UNION
                SELECT 1 FROM lab_reports lr
                JOIN lab_technicians lt ON lr.lab_tech_id = lt.lab_tech_id
                WHERE lr.patient_id = $1 AND lt.hospital_id = $2
            ) as exists`,
            [patientId, hospitalId]
        );
        return result.rows[0].exists;
    } catch (error) {
        console.error('Error checking patient in hospital:', error);
        return false;
    }
}

// ============================================
// AUTH MIDDLEWARE
// ============================================
const authenticate = (req, res, next) => {
    let token = req.cookies.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
    }
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ success: false, message: 'Invalid or expired token' });

    if (!activeSessions.has(decoded.id)) {
        return res.status(401).json({ success: false, message: 'Session expired' });
    }

    req.user = decoded;
    next();
};

const authorize = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied' });
    next();
};

const requireAuth = (role) => (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/signin');

    const decoded = verifyToken(token);
    if (!decoded || !activeSessions.has(decoded.id)) return res.redirect('/signin');

    if (role && decoded.role !== role) {
        return res.status(403).send(`
            <h1>403 - Access Denied</h1>
            <p>You don't have permission to access this page.</p>
            <a href="/">Go to Home</a>
        `);
    }
    req.user = decoded;
    next();
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Register (patient self-signup)
app.post('/api/auth/register', upload.single('profile_photo'), async (req, res) => {
  console.log('📝 Registration attempt:', req.body);
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const { name, email, password, gender,blood_type, phone, address, dob, ...rest } = req.body;
    const role = 'patient';
    const username = email.split('@')[0]; // Create username from email
    
    console.log('Extracted data:', { name, email, username, gender,blood_type, phone, address, dob });
    
    // Check if user exists
    const existing = await client.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, role`,
      [username, email, hashedPassword, role]
    );
    
    const user = userResult.rows[0];
    console.log('✅ User created:', user);

    let profilePhotoUrl = null;
    if (req.file) {
      const photosDir = path.join(UPLOADS_ROOT, 'photos');
      if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
      const destPath = path.join(photosDir, req.file.filename);
      if (req.file.path !== destPath) fs.renameSync(req.file.path, destPath);
      profilePhotoUrl = '/uploads/photos/' + req.file.filename;
    }

    // Insert patient profile
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const patient_uuid = `PT-${year}${month}${day}-${random}`
    try {
      await client.query(
        `INSERT INTO patients (
           user_id, patient_uuid, full_name, email, phone, address, date_of_birth, gender, blood_type, profile_photo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          user.user_id, patient_uuid, name, email, phone, address, dob, gender, blood_type, profilePhotoUrl
        ]
      );
    } catch (patientInsertError) {
      // Backward compatibility for DBs that do not yet have patients.profile_photo_url
      if (patientInsertError && patientInsertError.code === '42703') {
        await client.query(
          `INSERT INTO patients (
             user_id, patient_uuid, full_name, email, phone, address, date_of_birth, gender, blood_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            user.user_id, patient_uuid, name, email, phone, address, dob, gender, blood_type
          ]
        );
      } else {
        throw patientInsertError;
      }
    }
    console.log('✅ Patient profile created');

    await client.query('COMMIT');
    console.log('✅ Registration successful');

    const token = generateToken({ id: user.user_id, username, role: user.role });
    activeSessions.set(user.user_id, { token, loginTime: new Date().toISOString() });

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    res.json({
      success: true,
      token,
      user: { id: user.user_id, username, email, role: user.role }
    });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Sign in error FULL:', error.message, error.stack);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// Add these routes to home.js - near your other API routes

// ============================================
// HOSPITAL MANAGEMENT API ROUTES
// ============================================

// Get hospital data for dashboard
app.get('/api/hospital/data', authenticate, async (req, res) => {
  try {
    // Get the hospital_id from the admin's hospital
    const adminResult = await query(
      'SELECT hospital_id FROM hospital_admins WHERE user_id = $1',
      [req.user.id]
    );
    
    const hospitalId = adminResult.rows[0]?.hospital_id;
    
    if (!hospitalId) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    const hospitalResult = await query('SELECT * FROM hospitals WHERE hospital_id = $1', [hospitalId]);
    const doctorsResult = await query('SELECT * FROM doctors WHERE hospital_id = $1', [hospitalId]);
    const medicinesResult = await query('SELECT * FROM medicines WHERE hospital_id = $1', [hospitalId]);
    const labsResult = await query('SELECT * FROM lab_technicians WHERE hospital_id = $1', [hospitalId]);
    
    res.json({
      hospitalName: hospitalResult.rows[0]?.name || 'City General Hospital',
      hospitalId: hospitalResult.rows[0]?.hospital_uuid || 'HOS-12345',
      doctors: doctorsResult.rows,
      medicines: medicinesResult.rows,
      labs: labsResult.rows,
      specialities: [...new Set(doctorsResult.rows.map(d => d.specialization).filter(Boolean))]
    });
  } catch (error) {
    console.error('Error fetching hospital data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// REVIEWS API ROUTES - Complete Review System
// ============================================

// Get all approved reviews with sorting and filtering
app.get('/api/legacy/reviews', async (req, res) => {
  try {
    const { 
      sort = 'recent', 
      rating, 
      search, 
      hospital, 
      doctor,
      page = 1, 
      limit = 10 
    } = req.query;
    
    let whereClause = 'WHERE is_approved = true';
    const params = [];
    let paramIndex = 1;
    
    // Filter by rating
    if (rating) {
      if (rating === 'positive') {
        whereClause += ` AND rating >= 4`;
      } else if (rating === 'negative') {
        whereClause += ` AND rating <= 2`;
      } else if (rating === 'neutral') {
        whereClause += ` AND rating = 3`;
      } else if (!isNaN(parseInt(rating))) {
        whereClause += ` AND rating = $${paramIndex}`;
        params.push(parseInt(rating));
        paramIndex++;
      }
    }
    
    // Search in content or title
    if (search) {
      whereClause += ` AND (content ILIKE $${paramIndex} OR title ILIKE $${paramIndex} OR reviewer_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Filter by hospital
    if (hospital) {
      whereClause += ` AND hospital_name ILIKE $${paramIndex}`;
      params.push(`%${hospital}%`);
      paramIndex++;
    }
    
    // Filter by doctor
    if (doctor) {
      whereClause += ` AND doctor_name ILIKE $${paramIndex}`;
      params.push(`%${doctor}%`);
      paramIndex++;
    }
    
    // Determine sort order
    let orderBy = 'created_at DESC';
    if (sort === 'highest') {
      orderBy = 'rating DESC, created_at DESC';
    } else if (sort === 'lowest') {
      orderBy = 'rating ASC, created_at DESC';
    } else if (sort === 'helpful') {
      orderBy = 'helpful_count DESC, created_at DESC';
    }
    
    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) FROM reviews ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Add pagination
    const offset = (page - 1) * limit;
    const paginatedParams = [...params, limit, offset];
    
    const result = await query(
      `SELECT 
        review_id,
        reviewer_name,
        rating,
        title,
        content,
        hospital_name,
        doctor_name,
        is_verified,
        helpful_count,
        created_at,
        updated_at,
        CASE 
          WHEN created_at >= CURRENT_DATE THEN 'Today'
          WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 'Yesterday'
          ELSE TO_CHAR(created_at, 'Mon DD, YYYY')
        END as formatted_date
       FROM reviews 
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      paginatedParams
    );
    
    // Get rating statistics
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM reviews 
       WHERE is_approved = true`
    );
    
    res.json({
      success: true,
      reviews: result.rows,
      stats: statsResult.rows[0],
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit a new review (authenticated users only)
app.post('/api/legacy/reviews', authenticate, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const { rating, title, content, hospital_name, doctor_name } = req.body;
    
    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Review content must be at least 10 characters' });
    }
    
    // Get patient info if user is a patient
    let patientId = null;
    let reviewerName = req.user.username;
    let reviewerEmail = null;
    
    if (req.user.role === 'patient') {
      const patientResult = await client.query(
        'SELECT patient_id, full_name, email FROM patients WHERE user_id = $1',
        [req.user.id]
      );
      if (patientResult.rows.length > 0) {
        patientId = patientResult.rows[0].patient_id;
        reviewerName = patientResult.rows[0].full_name || reviewerName;
        reviewerEmail = patientResult.rows[0].email;
      }
    }
    
    // Insert review
    const result = await client.query(
      `INSERT INTO reviews (
        user_id, patient_id, reviewer_name, reviewer_email, 
        rating, title, content, hospital_name, doctor_name,
        is_verified, is_approved, helpful_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0)
      RETURNING *`,
      [
        req.user.id,
        patientId,
        reviewerName,
        reviewerEmail,
        rating,
        title || null,
        content,
        hospital_name || null,
        doctor_name || null,
        req.user.role === 'patient', // Verified if they're a patient
        true, // Auto-approve for now (change to false if you want moderation)
      ]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// Mark a review as helpful
app.post('/api/legacy/reviews/:id/helpful', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE reviews 
       SET helpful_count = helpful_count + 1 
       WHERE review_id = $1::uuid 
       RETURNING helpful_count`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    res.json({
      success: true,
      helpful_count: result.rows[0].helpful_count
    });
    
  } catch (error) {
    console.error('Error updating helpful count:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unique hospitals and doctors for filters
app.get('/api/legacy/reviews/filters', async (req, res) => {
  try {
    const hospitalsResult = await query(
      `SELECT DISTINCT hospital_name 
       FROM reviews 
       WHERE hospital_name IS NOT NULL AND is_approved = true
       ORDER BY hospital_name
       LIMIT 50`
    );
    
    const doctorsResult = await query(
      `SELECT DISTINCT doctor_name 
       FROM reviews 
       WHERE doctor_name IS NOT NULL AND is_approved = true
       ORDER BY doctor_name
       LIMIT 50`
    );
    
    res.json({
      success: true,
      hospitals: hospitalsResult.rows.map(r => r.hospital_name),
      doctors: doctorsResult.rows.map(r => r.doctor_name)
    });
    
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ============================================
// REPORTS API ROUTES - Add this right after the GET /api/reports route
// ============================================

// Upload a new report
// ============================================
// REPORTS API ROUTES - FIXED WITH FILE UPLOAD
// ============================================

// Upload a new report with file
app.post('/api/reports', authenticate, authorize('patient'), upload.single('report'), async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Get form data from req.body (multer parses text fields)
    const { test_type, test_date, notes, patient_id } = req.body;
    
    console.log('Upload request received:', { test_type, test_date, notes, patient_id, file: req.file ? 'File present' : 'No file' });
    
    // Validate input
    if (!test_type || !test_date) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Test type and date are required' });
    }
    
    // Get patient_id from authenticated user if not provided in body
    let patientId = patient_id;
    if (!patientId) {
      const patientResult = await client.query(
        'SELECT patient_id FROM patients WHERE user_id = $1',
        [req.user.id]
      );
      
      if (patientResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Patient profile not found' });
      }
      
      patientId = patientResult.rows[0].patient_id;
    }
    
    // Handle file upload if present
    let fileUrl = null;
    if (req.file) {
      // Move file from temp to reports folder
      const reportsDir = path.join(UPLOADS_ROOT, 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      // Generate unique filename to prevent overwrites
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExt = path.extname(req.file.originalname);
      const fileName = `report_${timestamp}_${randomStr}${fileExt}`;
      const destPath = path.join(reportsDir, fileName);
      
      // Move file from temp to final destination
      fs.renameSync(req.file.path, destPath);
      fileUrl = `/uploads/reports/${fileName}`;
      
      console.log('File saved:', fileUrl);
    }
    
    // Insert report with file URL
    // Insert report with file URL
const result = await client.query(
  `INSERT INTO lab_reports (
    patient_id, 
    test_type, 
    test_date, 
    results, 
    findings, 
    file_url, 
    shared_with,
    created_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
  RETURNING *`,
  [
    patientId, 
    test_type, 
    test_date, 
    'Pending', 
    notes || 'No findings recorded', 
    fileUrl,
    'patient'  // This tells the system that the patient can see this report
  ]
);
    
    await client.query('COMMIT');
    
    console.log('Report saved successfully:', result.rows[0].report_id);
    
    res.status(201).json({ 
      success: true, 
      message: 'Report uploaded successfully',
      report: result.rows[0] 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading report:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

function resolveExistingReportFile(fileUrl) {
  if (!fileUrl) return null;
  const normalizedUrl = String(fileUrl).replace(/\\/g, '/');
  const fileName = normalizedUrl.split('/').pop();
  const candidates = [
    fileName ? path.join(UPLOADS_ROOT, 'reports', fileName) : null,
    fileName ? path.join(__dirname, 'uploads', 'reports', fileName) : null,
    fileName ? path.join(UPLOADS_ROOT, 'temp', fileName) : null,
    fileName ? path.join(__dirname, 'uploads', 'temp', fileName) : null,
    fileName ? path.join(UPLOADS_ROOT, fileName) : null,
    fileName ? path.join(__dirname, 'uploads', fileName) : null,
    path.join(process.cwd(), normalizedUrl.replace(/^\//, '')),
    path.join(__dirname, normalizedUrl.replace(/^\//, '')),
    path.join(UPLOADS_ROOT, normalizedUrl.replace(/^\/?uploads\//, ''))
  ].filter(Boolean);
  return candidates.find(p => fs.existsSync(p)) || null;
}

function resolveReportViewUrl(filePath) {
  if (!filePath) return null;
  const parent = path.basename(path.dirname(filePath)).toLowerCase();
  const fileName = path.basename(filePath);
  if (parent === 'reports') return '/uploads/reports/' + fileName;
  if (parent === 'temp') return '/uploads/reports/' + fileName;
  return '/uploads/' + fileName;
}

// Get reports for a patient
app.get('/api/reports', authenticate, async (req, res) => {
  try {
    const { patient_id } = req.query;
    
    let result;
    if (req.user.role === 'patient') {
      // If patient, get their own reports
      const patientResult = await query(
        'SELECT patient_id FROM patients WHERE user_id = $1',
        [req.user.id]
      );
      
      const patientId = patientResult.rows[0]?.patient_id;
      
      if (!patientId) {
        return res.json([]);
      }
      
      result = await query(
        `SELECT r.* FROM lab_reports r
         WHERE r.patient_id = $1
         ORDER BY r.created_at DESC`,
        [patientId]
      );
    } else if (patient_id) {
      // If admin/doctor and patient_id provided, get that patient's reports
      result = await query(
        `SELECT r.*, p.full_name as patient_name FROM lab_reports r
         JOIN patients p ON r.patient_id = p.patient_id
         WHERE r.patient_id = $1
         ORDER BY r.created_at DESC`,
        [patient_id]
      );
    } else {
      // Get all reports (for admin/doctor)
      result = await query(
        `SELECT r.*, p.full_name as patient_name FROM lab_reports r
         JOIN patients p ON r.patient_id = p.patient_id
         ORDER BY r.created_at DESC`
      );
    }
    
    const rowsWithResolvedFile = result.rows.map(row => {
      const existingFilePath = resolveExistingReportFile(row.file_url);
      return {
        ...row,
        file_view_url: resolveReportViewUrl(existingFilePath)
      };
    });
    res.json(rowsWithResolvedFile);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error.message });
  }
});

//UPDATE LEAVE
app.post('/api/doctors/:doctorId/leave', authenticate, authorize('admin'), async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const { doctorId } = req.params;
    const { from, to, reason } = req.body;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(doctorId)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid doctor ID format' });
    }
    
    // Get hospital_id from the admin
    const adminResult = await client.query(
      `SELECT hospital_id FROM hospital_admins WHERE user_id = $1`,
      [req.user.id]
    );
    
    const hospitalId = adminResult.rows[0]?.hospital_id;
    
    if (!hospitalId) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Hospital not found for this admin' });
    }
    
    // Verify the doctor belongs to this admin's hospital
    const doctorCheck = await client.query(
      `SELECT * FROM doctors WHERE doctor_id = $1::uuid AND hospital_id = $2::uuid`,
      [doctorId, hospitalId]
    );
    
    if (doctorCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Doctor not found in your hospital' });
    }
    
    // Insert leave record into doctor_leave table
    const leaveResult = await client.query(
      `INSERT INTO doctor_leave (doctor_id, from_date, to_date, reason, status)
       VALUES ($1::uuid, $2::date, $3::date, $4, 'Approved')
       RETURNING *`,
      [doctorId, from, to, reason]
    );
    
    // Update doctor status to 'On Leave'
    await client.query(
      `UPDATE doctors SET status = 'On Leave' WHERE doctor_id = $1::uuid`,
      [doctorId]
    );
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Leave updated successfully',
      data: leaveResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating leave:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// Get all leave records for a specific doctor
app.get('/api/doctors/:doctorId/leave', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID format' });
    }
    
    // Check authorization
    if (req.user.role === 'doctor') {
      // Verify the doctor is viewing their own leave records
      const doctorCheck = await query(
        `SELECT doctor_id FROM doctors WHERE user_id = $1::uuid`,
        [req.user.id]
      );
      
      if (doctorCheck.rows.length === 0 || doctorCheck.rows[0].doctor_id !== doctorId) {
        return res.status(403).json({ success: false, message: 'You can only view your own leave records' });
      }
    }
    
    const result = await query(
      `SELECT * FROM doctor_leave 
       WHERE doctor_id = $1::uuid 
       ORDER BY created_at DESC`,
      [doctorId]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching leave records:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all doctors on leave (for admin dashboard)
app.get('/api/doctors/on-leave', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Get hospital_id from the admin
    const adminResult = await query(
      `SELECT hospital_id FROM hospital_admins WHERE user_id = $1`,
      [req.user.id]
    );
    
    const hospitalId = adminResult.rows[0]?.hospital_id;
    
    if (!hospitalId) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    
    const result = await query(
      `SELECT d.*, dl.from_date, dl.to_date, dl.reason, dl.leave_id
       FROM doctors d
       JOIN doctor_leave dl ON d.doctor_id = dl.doctor_id
       WHERE d.hospital_id = $1::uuid 
         AND d.status = 'On Leave'
         AND dl.status = 'Approved'
         AND dl.from_date <= CURRENT_DATE 
         AND dl.to_date >= CURRENT_DATE
       ORDER BY d.full_name`,
      [hospitalId]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching doctors on leave:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove/end leave (when doctor returns)
// REPLACE the existing DELETE /api/doctors/:doctorId/leave route in home.js with this fixed version.
// Bug fixed: PostgreSQL does not support ORDER BY / LIMIT directly in UPDATE statements.
// Solution: use a subquery to find the leave_id first, then update by that id.

app.delete('/api/doctors/:doctorId/leave', authenticate, authorize('admin'), async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { doctorId } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(doctorId)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid doctor ID format' });
    }

    // Get hospital_id from the admin
    const adminResult = await client.query(
      `SELECT hospital_id FROM hospital_admins WHERE user_id = $1`,
      [req.user.id]
    );

    const hospitalId = adminResult.rows[0]?.hospital_id;
    if (!hospitalId) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    // Update doctor status back to 'Available'
    const doctorUpdate = await client.query(
      `UPDATE doctors SET status = 'Available'
       WHERE doctor_id = $1::uuid AND hospital_id = $2::uuid
       RETURNING *`,
      [doctorId, hospitalId]
    );

    if (doctorUpdate.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Doctor not found in your hospital' });
    }

    // FIX: PostgreSQL does not support ORDER BY / LIMIT in UPDATE.
    // Find the most recent active leave_id first, then update it.
    await client.query(
      `UPDATE doctor_leave
       SET status = 'Completed'
       WHERE leave_id = (
         SELECT leave_id
         FROM doctor_leave
         WHERE doctor_id = $1::uuid
           AND status = 'Approved'
           AND to_date >= CURRENT_DATE
         ORDER BY created_at DESC
         LIMIT 1
       )`,
      [doctorId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Leave removed, doctor is now available',
      data: doctorUpdate.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error removing leave:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// Admin: view pending doctor leave requests for their hospital
app.get('/api/admin/leave/pending', authenticate, authorize('admin'), async (req, res) => {
  try {
    const adminResult = await query(
      'SELECT hospital_id FROM hospital_admins WHERE user_id = $1',
      [req.user.id]
    );
    const hospitalId = adminResult.rows[0]?.hospital_id;
    if (!hospitalId) return res.status(404).json({ success: false, message: 'Hospital not found' });

    const result = await query(
      `SELECT dl.leave_id, dl.doctor_id, dl.from_date, dl.to_date, dl.reason, dl.status, dl.created_at,
              d.full_name as doctor_name, d.specialization, d.hospital_id
       FROM doctor_leave dl
       JOIN doctors d ON d.doctor_id = dl.doctor_id
       WHERE d.hospital_id = $1 AND dl.status = 'Pending'
       ORDER BY dl.created_at DESC`,
      [hospitalId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: approve/reject a leave request
app.post('/api/admin/leave/:leaveId/decision', authenticate, authorize('admin'), async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { leaveId } = req.params;
    const { decision } = req.body;
    if (!['Approved', 'Rejected'].includes(decision)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Decision must be Approved or Rejected' });
    }

    const adminResult = await client.query(
      'SELECT hospital_id FROM hospital_admins WHERE user_id = $1',
      [req.user.id]
    );
    const hospitalId = adminResult.rows[0]?.hospital_id;
    if (!hospitalId) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    const leaveResult = await client.query(
      `SELECT dl.leave_id, dl.doctor_id, d.hospital_id
       FROM doctor_leave dl
       JOIN doctors d ON d.doctor_id = dl.doctor_id
       WHERE dl.leave_id = $1 AND dl.status = 'Pending'`,
      [leaveId]
    );
    if (leaveResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Pending leave request not found' });
    }
    if (String(leaveResult.rows[0].hospital_id) !== String(hospitalId)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Not authorized for this leave request' });
    }

    await client.query(
      'UPDATE doctor_leave SET status = $1 WHERE leave_id = $2',
      [decision, leaveId]
    );

    if (decision === 'Approved') {
      await client.query(
        "UPDATE doctors SET status = 'On Leave' WHERE doctor_id = $1",
        [leaveResult.rows[0].doctor_id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `Leave request ${decision.toLowerCase()}` });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// ... existing leave delete route above ...

app.delete('/api/doctors/:doctorId', authenticate, authorize('admin'), async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { doctorId } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(doctorId)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid doctor ID format' });
    }

    const adminResult = await client.query(
      'SELECT hospital_id FROM hospital_admins WHERE user_id = $1',
      [req.user.id]
    );
    const hospitalId = adminResult.rows[0]?.hospital_id;
    if (!hospitalId) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    const doctorCheck = await client.query(
      'SELECT user_id FROM doctors WHERE doctor_id = $1::uuid AND hospital_id = $2::uuid',
      [doctorId, hospitalId]
    );
    if (doctorCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Doctor not found in your hospital' });
    }

    const doctorUserId = doctorCheck.rows[0].user_id;

    await client.query(`UPDATE appointments SET status = 'cancelled' WHERE doctor_id = $1::uuid AND appointment_date >= CURRENT_DATE`, [doctorId]);
    await client.query(`UPDATE doctors SET status = 'Inactive' WHERE doctor_id = $1::uuid`, [doctorId]);
    await client.query(`UPDATE users SET is_active = false WHERE user_id = $1::uuid`, [doctorUserId]);


    await client.query('COMMIT');
    res.json({ success: true, message: 'Doctor removed successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting doctor:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// Add new doctor
app.post('/api/test-doctor', (req, res) => {
    console.log('TEST ROUTE HIT!');
    console.log('Body:', req.body);
    res.json({ success: true, message: 'Test route working' });
});

// Add new doctor with file upload - USING FORMDATA
app.post('/api/hospital/add/doctor', authenticate, authorize('admin'), doctorUpload.fields([
    { name: 'doctorImage', maxCount: 1 },
    { name: 'qualificationCertificate', maxCount: 1 },
    { name: 'specializationCertificate', maxCount: 1 },
    { name: 'govtIdDocument', maxCount: 1 },
    { name: 'appointmentLetter', maxCount: 1 }
]), async (req, res) => {
    console.log('=== DOCTOR REGISTRATION WITH FILES ===');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files ? Object.keys(req.files) : 'No files');
    console.log('req.user:', req.user);
    
    const client = await getClient();
    try {
        await client.query('BEGIN');
        
        const { name, speciality, phone, email, designation, dateOfBirth, education, 
                medicalCouncil, registrationNumber, idType, idNumber, appointmentDate, password } = req.body;
        
        console.log('Parsed data:', { name, speciality, phone, email, designation, password });
        
        // Get hospital_id from the admin
        const adminResult = await client.query(
            'SELECT hospital_id FROM hospital_admins WHERE user_id = $1',
            [req.user.id]
        );
        
        const hospitalId = adminResult.rows[0]?.hospital_id;
        
        if (!hospitalId) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Hospital not found' });
        }
        
        // Create username from email
        const username = email ? email.split('@')[0] : `doctor_${Date.now()}`;
        
        if (!password || password.trim().length < 6) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Password is required and must be at least 6 characters' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password.trim(), salt);
        
        // Create user account for doctor
        const userResult = await client.query(
            `INSERT INTO users (username, email, password_hash, role, hospital_id, must_change_password) 
            VALUES ($1, $2, $3, $4, $5, true) RETURNING user_id`,
            [username, email || `${username}@bondhealth.com`, hashedPassword, 'doctor', hospitalId]
        );
        
        const userId = userResult.rows[0].user_id;
        
        // Generate doctor_uuid
        const doctorUuid = `DR-${Date.now()}`;
        
        // Add doctor to doctors table
        const doctorResult = await client.query(
            `INSERT INTO doctors (
                user_id, hospital_id, doctor_uuid, full_name, specialization, 
                phone, email, designation, qualification, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                userId, hospitalId, doctorUuid, name, speciality, 
                phone, email, designation || 'Consultant', education || 'MBBS', 'Available'
            ]
        );
        
        const doctorId = doctorResult.rows[0].doctor_id;
        
        // Create doctor_documents table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS doctor_documents (
                doc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                doctor_id UUID NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
                document_type VARCHAR(50) NOT NULL,
                file_url TEXT NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Save uploaded files
        const fileFields = {
            doctorImage: 'profile_photo',
            qualificationCertificate: 'qualification_certificate',
            specializationCertificate: 'specialization_certificate',
            govtIdDocument: 'id_proof',
            appointmentLetter: 'appointment_letter'
        };
        
        for (const [fieldName, docType] of Object.entries(fileFields)) {
            if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
                let fileUrl = '/uploads/doctors/' + 
                    (fieldName === 'doctorImage' ? 'photos/' : 
                     fieldName === 'qualificationCertificate' ? 'qualifications/' :
                     fieldName === 'specializationCertificate' ? 'specializations/' :
                     fieldName === 'govtIdDocument' ? 'idproofs/' : 'appointments/') + 
                    req.files[fieldName][0].filename;

                if (fieldName === 'doctorImage') {
                    const fileName = req.files[fieldName][0].filename;
                    const photoUrl = '/uploads/photos/' + fileName;
                    const destinationDir = path.join(UPLOADS_ROOT, 'photos');
                    const destinationPath = path.join(destinationDir, fileName);
                    if (!fs.existsSync(destinationDir)) fs.mkdirSync(destinationDir, { recursive: true });

                    const sourceCandidates = [
                        req.files[fieldName][0].path,
                        path.join(process.cwd(), 'uploads', 'doctors', 'photos', fileName),
                        path.join(__dirname, '..', 'uploads', 'doctors', 'photos', fileName),
                        path.join(__dirname, 'uploads', 'doctors', 'photos', fileName)
                    ].filter(Boolean);
                    const sourcePath = sourceCandidates.find(p => fs.existsSync(p));
                    if (sourcePath && sourcePath !== destinationPath) {
                        fs.copyFileSync(sourcePath, destinationPath);
                    }

                    await client.query('UPDATE doctors SET photo_url = $1 WHERE doctor_id = $2', [photoUrl, doctorId]);
                    fileUrl = photoUrl;
                }
                
                await client.query(
                    `INSERT INTO doctor_documents (doctor_id, document_type, file_url) 
                     VALUES ($1, $2, $3)`,
                    [doctorId, docType, fileUrl]
                );
                console.log(`Saved ${fieldName} to: ${fileUrl}`);
            }
        }
        
        await client.query('COMMIT');
        
        console.log('Doctor registered successfully:', doctorId);
        
        res.json({ 
            success: true, 
            message: 'Doctor registered successfully',
            initialPassword: password,
            data: doctorResult.rows[0] 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding doctor:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// Add new medicine
app.post('/api/hospital/add/medicine', authenticate, async (req, res) => {
  try {
    const adminResult = await query(
      'SELECT hospital_id FROM hospital_admins WHERE user_id = $1',
      [req.user.id]
    );
    
    const hospitalId = adminResult.rows[0]?.hospital_id;
    
    if (!hospitalId) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }
    
    const { name, quantity, price, expiry } = req.body;
    
    const result = await query(
      `INSERT INTO medicines (hospital_id, name, quantity, price, expiry_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [hospitalId, name, quantity, price, expiry]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error adding medicine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Add new lab technician
app.post('/api/hospital/add/lab', authenticate, async (req, res) => {
  try {
    const adminResult = await query(
      'SELECT hospital_id FROM hospital_admins WHERE user_id = $1',
      [req.user.id]
    );
    const hospitalId = adminResult.rows[0]?.hospital_id;
    if (!hospitalId) {
      return res.status(404).json({ success: false, error: 'Hospital not found' });
    }

    const labData = req.body;
    const rawPassword = labData.password || labData.labPassword;
    if (!rawPassword || rawPassword.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'Password is required and must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword.trim(), salt);
    const username = labData.name.replace(/\s+/g, '').toLowerCase();
    const email = labData.headInCharge?.email || labData.email || `${username}@bondhealth.com`;

    const userResult = await query(
      `INSERT INTO users (username, email, password_hash, role, hospital_id, must_change_password) 
       VALUES ($1, $2, $3, 'lab', $4, true) RETURNING user_id`,
      [username, email, hashedPassword, hospitalId]
    );

    const result = await query(
      `INSERT INTO lab_technicians (user_id, hospital_id, full_name, employee_id, phone, email)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userResult.rows[0].user_id, hospitalId, labData.name, labData.licenseNumber, labData.headInCharge?.phone || labData.phone, email]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error adding lab:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add this route in home.js - place it near your other dashboard routes
app.get('/register-doctor', requireAuth('admin'), async (req, res) => {
    console.log('📝 Registration attempt:', req.body);
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const { name, email, password, gender, blood_type, phone, address, dob } = req.body;
        const role = 'patient';
        const username = email.split('@')[0];

        const existing = await client.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
        const userResult = await client.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, role',
            [username, email, hashedPassword, role]
        );
        const user = userResult.rows[0];

        const date = new Date();
        const patient_uuid = `PT-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;

        await client.query(
            'INSERT INTO patients (user_id, patient_uuid, full_name, email, phone, address, date_of_birth, gender, blood_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
            [user.user_id, patient_uuid, name, email, phone, address, dob, gender, blood_type]
        );

        await client.query('COMMIT');

        const token = generateToken({ id: user.user_id, username, role: user.role });
        activeSessions.set(user.user_id, { token, loginTime: new Date().toISOString() });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({ success: true, token, user: { id: user.user_id, username, email, role: user.role } });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    } finally {
        client.release();
    }
});

// Add these routes to home.js (near your other routes)

// ── Inside your http.createServer request handler ────────────
// Route: POST /api/hospitals/register

// Use multer middleware for file uploads
const hospitalUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

app.post('/api/hospitals/register', 
    hospitalUpload.fields([
        { name: 'hospitalLogo', maxCount: 1 },
        { name: 'hospitalMainPhoto', maxCount: 1 },
        { name: 'hospitalPhotos', maxCount: 5 },
        { name: 'adminPhoto', maxCount: 1 },
        { name: 'regCertificate', maxCount: 1 },
        { name: 'hospitalLicense', maxCount: 1 },
        { name: 'tradeLicense', maxCount: 1 },
        { name: 'panCard', maxCount: 1 }
    ]), 
    async (req, res) => {
        try {
            const logoFile = req.files?.hospitalLogo?.[0] || null;
            const mainPhotoFile = req.files?.hospitalMainPhoto?.[0] || null;
            const photosFiles = req.files?.hospitalPhotos || [];
            const adminPhotoFile = req.files?.adminPhoto?.[0] || null;
            
            const result = await handleRegistration(req.body, logoFile, mainPhotoFile, photosFiles, adminPhotoFile);
            res.status(result.success ? 200 : 400).json(result);
        } catch (err) {
            console.error('Route error /api/hospitals/register:', err.message);
            res.status(500).json({ success: false, error: 'Server error. Please try again.' });
        }
    }
);
// Add Speciality page
app.get('/add-speciality', requireAuth('admin'), async (req, res) => {
    try {
        const Hospital = require('./Hospital.js');
        const html = Hospital.getAddSpecialityHTML();
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error('Error loading add speciality:', err);
        res.status(500).send('Error loading page');
    }
});

// Add Doctor page (what you currently have)
app.get('/add-doctor', requireAuth('admin'), async (req, res) => {
    try {
        const Hospital = require('./Hospital.js');
        const html = Hospital.getAddDoctorHTML();
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error('Error loading add doctor:', err);
        res.status(500).send('Error loading page');
    }
});

// Add Medicine page
app.get('/add-medicine', requireAuth('admin'), async (req, res) => {
    try {
        const Hospital = require('./Hospital.js');
        const html = Hospital.getAddMedicineHTML();
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error('Error loading add medicine:', err);
        res.status(500).send('Error loading page');
    }
});

// Add Lab page
app.get('/add-lab', requireAuth('admin'), async (req, res) => {
    try {
        const Hospital = require('./Hospital.js');
        const html = Hospital.getAddLabHTML();
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error('Error loading add lab:', err);
        res.status(500).send('Error loading page');
    }
});

async function ensurePasswordResetTable() {
    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_otps (
        reset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        otp_hash TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP NULL,
        attempts INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
}

function hashOtp(otp) {
    return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function generateOtpCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizePhoneDigits(value) {
    return String(value || '').replace(/\D/g, '');
}

function looksLikePhoneLogin(value) {
    return /^\+?[0-9][0-9\s\-()]{7,}$/.test(String(value || '').trim());
}

function looksLikeEmailLogin(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

async function resolvePasswordResetUser(loginId) {
    const normalizedLogin = String(loginId || '').trim();
    if (!normalizedLogin) return null;

    // 1) Try email/username first
    const userResult = await query(
        'SELECT user_id, email, username FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1) LIMIT 1',
        [normalizedLogin]
    );
    if (userResult.rows[0]) {
        const baseUser = userResult.rows[0];
        const phoneLookup = await query(
            `WITH profile_phones AS (
                SELECT user_id, phone FROM patients WHERE phone IS NOT NULL
                UNION ALL
                SELECT user_id, phone FROM doctors WHERE phone IS NOT NULL
                UNION ALL
                SELECT user_id, phone FROM hospital_admins WHERE phone IS NOT NULL
                UNION ALL
                SELECT user_id, phone FROM lab_technicians WHERE phone IS NOT NULL
             )
             SELECT phone FROM profile_phones WHERE user_id = $1 LIMIT 1`,
            [baseUser.user_id]
        );
        return { ...baseUser, phone: phoneLookup.rows[0]?.phone || null, matched_via: 'email_or_username' };
    }

    // 2) If input looks like a phone number, resolve via role profile tables
    if (!looksLikePhoneLogin(normalizedLogin)) return null;
    const inputDigits = normalizePhoneDigits(normalizedLogin);
    if (!inputDigits) return null;

    const phoneResult = await query(
        `WITH profile_phones AS (
            SELECT p.user_id, p.phone AS phone FROM patients p WHERE p.phone IS NOT NULL
            UNION ALL
            SELECT d.user_id, d.phone AS phone FROM doctors d WHERE d.phone IS NOT NULL
            UNION ALL
            SELECT ha.user_id, ha.phone AS phone FROM hospital_admins ha WHERE ha.phone IS NOT NULL
            UNION ALL
            SELECT lt.user_id, lt.phone AS phone FROM lab_technicians lt WHERE lt.phone IS NOT NULL
         )
         SELECT u.user_id, u.email, u.username, pp.phone
         FROM profile_phones pp
         JOIN users u ON u.user_id = pp.user_id
         WHERE RIGHT(regexp_replace(pp.phone, '\\D', '', 'g'), 10) = RIGHT($1, 10)
         ORDER BY u.created_at DESC
         LIMIT 1`,
        [inputDigits]
    );

    if (!phoneResult.rows[0]) return null;
    return { ...phoneResult.rows[0], matched_via: 'phone' };
}

async function buildMailTransporter() {
    const host = process.env.SMTP_HOST || process.env.MAIL_HOST || process.env.EMAIL_HOST;
    const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || process.env.EMAIL_PORT || 587);
    const user = process.env.SMTP_USER || process.env.MAIL_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.MAIL_PASS || process.env.EMAIL_PASS;
    const secure = String(process.env.SMTP_SECURE || process.env.MAIL_SECURE || process.env.EMAIL_SECURE || '').toLowerCase() === 'true';

    if (!host || !user || !pass) {
        return { mode: 'console', transporter: null, from: null };
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
    });

    return {
        mode: 'smtp',
        transporter,
        from: process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.EMAIL_FROM || user
    };
}

async function sendPasswordResetOtpEmail(email, otpCode) {
    let mail;
    try {
        mail = await buildMailTransporter();
    } catch (_) {
        return { mode: 'console-unavailable' };
    }

    if (mail.mode === 'console') {
        return { mode: 'console-unavailable' };
    }

    try {
        const info = await mail.transporter.sendMail({
            from: mail.from,
            to: email,
            subject: 'BondHealth Password Reset OTP',
            text: `Your BondHealth OTP is ${otpCode}. It expires in 10 minutes.`,
            html: `<div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5">
              <h2 style="color:#0e7490">BondHealth Password Reset</h2>
              <p>Your one-time password (OTP) is:</p>
              <p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#0f766e">${otpCode}</p>
              <p>This OTP is valid for 10 minutes.</p>
              <p>If you did not request this, please ignore this email.</p>
            </div>`
        });

        return { mode: 'smtp', info };
    } catch (error) {
        console.error('SMTP send failed:', error?.message || error);
        return { mode: 'smtp-failed' };
    }
}

async function sendPasswordResetOtpSms(phone, otpCode) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.SMS_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.SMS_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER || process.env.SMS_FROM_NUMBER;
    if (!accountSid || !authToken || !fromPhone || !phone) {
        return { mode: 'sms-unavailable' };
    }

    let twilioClientFactory;
    try {
        twilioClientFactory = require('twilio');
    } catch (_) {
        return { mode: 'sms-unavailable' };
    }

    try {
        const client = twilioClientFactory(accountSid, authToken);
        const toPhone = String(phone).trim();
        const msg = await client.messages.create({
            from: fromPhone,
            to: toPhone,
            body: `Your BondHealth OTP is ${otpCode}. It expires in 10 minutes.`
        });
        return { mode: 'sms', sid: msg.sid };
    } catch (error) {
        console.error('SMS send failed:', error?.message || error);
        return { mode: 'sms-failed' };
    }
}

async function issuePasswordResetOtp(loginId, isResend = false) {
    await ensurePasswordResetTable();
    const normalizedLogin = String(loginId || '').trim();
    if (!normalizedLogin) {
        return { status: 400, body: { success: false, message: 'Email, username, or phone is required' } };
    }

    const user = await resolvePasswordResetUser(normalizedLogin);
    if (!user) {
        // Privacy-safe response and smoother client UX:
        // never expose whether account exists at request/resend stage.
        return {
            status: 200,
            body: {
                success: true,
                message: isResend
                    ? 'If an account exists, OTP has been resent to the registered channel.'
                    : 'If an account exists, OTP has been sent to the registered channel.'
            }
        };
    }

    await query(
        'UPDATE password_reset_otps SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
        [user.user_id]
    );

    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + (10 * 60 * 1000));
    await query(
        `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.user_id, hashOtp(otpCode), expiresAt]
    );

    const requestedEmail = looksLikeEmailLogin(normalizedLogin) ? normalizedLogin.toLowerCase() : '';
    const requestedPhoneDigits = looksLikePhoneLogin(normalizedLogin) ? normalizePhoneDigits(normalizedLogin) : '';
    const userPhoneDigits = normalizePhoneDigits(user.phone || '');
    const requestedPhoneMatchesUser = !!requestedPhoneDigits && !!userPhoneDigits && userPhoneDigits.endsWith(requestedPhoneDigits.slice(-10));
    const requestedEmailMatchesUser = !!requestedEmail && !!user.email && String(user.email).toLowerCase() === requestedEmail;

    const sendPriority = [];
    if (requestedEmailMatchesUser) sendPriority.push({ channel: 'email', target: user.email });
    if (requestedPhoneMatchesUser) sendPriority.push({ channel: 'sms', target: user.phone });
    if (!sendPriority.some(p => p.channel === 'email') && user.email) sendPriority.push({ channel: 'email', target: user.email });
    if (!sendPriority.some(p => p.channel === 'sms') && user.phone) sendPriority.push({ channel: 'sms', target: user.phone });

    let delivery = { mode: 'console-unavailable' };
    for (const candidate of sendPriority) {
        if (candidate.channel === 'email') {
            const emailDelivery = await sendPasswordResetOtpEmail(candidate.target, otpCode);
            if (emailDelivery.mode === 'smtp') {
                delivery = emailDelivery;
                delivery.sent_to = candidate.target;
                break;
            }
        } else if (candidate.channel === 'sms') {
            const smsDelivery = await sendPasswordResetOtpSms(candidate.target, otpCode);
            if (smsDelivery.mode === 'sms') {
                delivery = smsDelivery;
                delivery.sent_to = candidate.target;
                break;
            }
        }
    }

    if (delivery.mode !== 'smtp' && delivery.mode !== 'sms') {
        const allowDevFallback = String(process.env.OTP_DEV_FALLBACK || process.env.NODE_ENV !== 'production').toLowerCase() !== 'false';
        if (!allowDevFallback) {
            return {
                status: 503,
                body: {
                    success: false,
                    message: 'OTP delivery is not configured. Please configure SMTP for email or Twilio for SMS.'
                }
            };
        }

        return {
            status: 200,
            body: {
                success: true,
                message: isResend
                    ? 'OTP regenerated in local mode. Use the OTP shown below.'
                    : 'OTP generated in local mode. Use the OTP shown below.',
                email: user.email || null,
                phone: user.phone || null,
                channel: 'dev',
                dev_otp: otpCode
            }
        };
    }

    const deliveryMessage = delivery.mode === 'sms'
        ? (isResend ? 'OTP resent to your registered phone number' : 'OTP sent to your registered phone number')
        : (isResend ? 'OTP resent to your registered email' : 'OTP sent to your registered email');

    return {
        status: 200,
        body: {
            success: true,
            message: deliveryMessage,
            email: user.email || null,
            phone: user.phone || null,
            channel: delivery.mode === 'sms' ? 'sms' : 'email',
            sent_to: delivery.sent_to || null
        }
    };
}

app.post('/api/auth/forgot-password/request', async (req, res) => {
    try {
        const result = await issuePasswordResetOtp(req.body.email || req.body.username || req.body.loginId, false);
        res.status(result.status).json(result.body);
    } catch (error) {
        console.error('Forgot password request error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to send OTP' });
    }
});

app.post('/api/auth/forgot-password/resend', async (req, res) => {
    try {
        const result = await issuePasswordResetOtp(req.body.email || req.body.username || req.body.loginId, true);
        res.status(result.status).json(result.body);
    } catch (error) {
        console.error('Forgot password resend error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to resend OTP' });
    }
});

app.post('/api/auth/forgot-password/verify', async (req, res) => {
    try {
        await ensurePasswordResetTable();
        const loginId = String(req.body.email || req.body.username || req.body.loginId || '').trim();
        const otp = String(req.body.otp || '').trim();
        if (!loginId || !otp) {
            return res.status(400).json({ success: false, message: 'Email/username and OTP are required' });
        }
        const user = await resolvePasswordResetUser(loginId);
        if (!user) return res.status(404).json({ success: false, message: 'Account not found' });

        const otpRowResult = await query(
            `SELECT reset_id, otp_hash, expires_at, used_at
             FROM password_reset_otps
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [user.user_id]
        );
        const otpRow = otpRowResult.rows[0];
        if (!otpRow || otpRow.used_at) {
            return res.status(400).json({ success: false, message: 'OTP is invalid or already used' });
        }
        if (new Date(otpRow.expires_at).getTime() < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
        }
        if (hashOtp(otp) !== otpRow.otp_hash) {
            await query('UPDATE password_reset_otps SET attempts = attempts + 1 WHERE reset_id = $1', [otpRow.reset_id]);
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
        res.json({ success: true, message: 'OTP verified' });
    } catch (error) {
        console.error('Forgot password verify error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
});

app.post('/api/auth/forgot-password/reset', async (req, res) => {
    try {
        await ensurePasswordResetTable();
        const loginId = String(req.body.email || req.body.username || req.body.loginId || '').trim();
        const otp = String(req.body.otp || '').trim();
        const newPassword = String(req.body.newPassword || '');
        const confirmPassword = String(req.body.confirmPassword || '');

        if (!loginId || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const user = await resolvePasswordResetUser(loginId);
        if (!user) return res.status(404).json({ success: false, message: 'Account not found' });

        const otpRowResult = await query(
            `SELECT reset_id, otp_hash, expires_at, used_at
             FROM password_reset_otps
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [user.user_id]
        );
        const otpRow = otpRowResult.rows[0];
        if (!otpRow || otpRow.used_at) {
            return res.status(400).json({ success: false, message: 'OTP is invalid or already used' });
        }
        if (new Date(otpRow.expires_at).getTime() < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
        }
        if (hashOtp(otp) !== otpRow.otp_hash) {
            await query('UPDATE password_reset_otps SET attempts = attempts + 1 WHERE reset_id = $1', [otpRow.reset_id]);
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password_hash = $1, must_change_password = false WHERE user_id = $2', [newHash, user.user_id]);
        await query('UPDATE password_reset_otps SET used_at = NOW() WHERE reset_id = $1', [otpRow.reset_id]);

        res.json({ success: true, message: 'Password reset successful. Please sign in with your new password.' });
    } catch (error) {
        console.error('Forgot password reset error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
});

// Login
// Login (generic /api/auth/login)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const loginId = String(username || email || '').trim();
        let result = await query(
            'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
            [loginId]
        );
        if (!result.rows[0] && loginId && !loginId.includes('@')) {
            result = await query(
                "SELECT * FROM users WHERE LOWER(username) LIKE LOWER($1) ORDER BY created_at DESC LIMIT 1",
                [loginId + "\\_%"]
            );
        }
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (role && user.role !== role) {
            return res.status(403).json({ success: false, message: 'Wrong role' });
        }
        await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);
        const token = generateToken({ id: user.user_id, username: user.username, role: user.role });
        activeSessions.set(user.user_id, { token, loginTime: new Date().toISOString() });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ success: true, token, user: { id: user.user_id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Login (signin page uses /api/signin)
app.post('/api/signin', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const loginId = String(username || '').trim();
        let result = await query(
            'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
            [loginId]
        );
        if (!result.rows[0] && loginId && !loginId.includes('@')) {
            result = await query(
                "SELECT * FROM users WHERE LOWER(username) LIKE LOWER($1) ORDER BY created_at DESC LIMIT 1",
                [loginId + "\\_%"]
            );
        }
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (role && user.role !== role) {
            return res.status(403).json({ success: false, message: 'Wrong role' });
        }
        await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);
        const token = generateToken({ id: user.user_id, username: user.username, role: user.role });
        activeSessions.set(user.user_id, { token, loginTime: new Date().toISOString() });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        const redirectMap = { admin: '/admin-dashboard', doctor: '/doctor-dashboard', lab: '/lab-dashboard', patient: '/patient-dashboard' };
        // Check if this user must change their password on first login
        const mustChange = user.must_change_password === true || user.must_change_password === 't';

        res.json({
            success: true,
            message: 'Sign in successful!',
            user: { id: user.user_id, username: user.username, email: user.email, role: user.role },
            redirectTo: mustChange ? '/change-password' : (redirectMap[user.role] || '/')
        });
    } catch (error) {
        console.error('Sign in error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Logout — supports both /api/auth/logout and /api/logout
const logoutHandler = (req, res) => {
    const token = req.cookies.token;
    if (token) {
        const decoded = verifyToken(token);
        if (decoded) activeSessions.delete(decoded.id);
    }
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out' });
};
app.post('/api/auth/logout', logoutHandler);
app.post('/api/logout', logoutHandler);          // ← doctorDashboard.js calls /api/logout

// Get current user
app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT u.user_id, u.username, u.email, u.role, u.created_at,
                    CASE
                        WHEN u.role = 'patient' THEN row_to_json(p.*)
                        WHEN u.role = 'doctor'  THEN row_to_json(d.*)
                        WHEN u.role = 'lab'     THEN row_to_json(l.*)
                        WHEN u.role = 'admin'   THEN row_to_json(a.*)
                    END as profile
             FROM users u
             LEFT JOIN patients p        ON u.user_id = p.user_id
             LEFT JOIN doctors d         ON u.user_id = d.user_id
             LEFT JOIN lab_technicians l ON u.user_id = l.user_id
             LEFT JOIN hospital_admins a ON u.user_id = a.user_id
             WHERE u.user_id = $1`,
            [req.user.id]
        );
        if (!result.rows[0]) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// Change Password page (shown on first login)
app.get('/change-password', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/signin');
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Change Password - BondHealth</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #f0f9ff, #e0ffff); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: white; border-radius: 20px; padding: 40px; max-width: 420px; width: 100%; box-shadow: 0 8px 30px rgba(0,188,212,0.15); border: 2px solid #e0f7fa; }
    input { width: 100%; padding: 12px; border: 2px solid #e0f2fe; border-radius: 10px; font-size: 1rem; transition: border-color 0.3s; box-sizing: border-box; }
    input:focus { outline: none; border-color: #00bcd4; }
    .btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #00bcd4, #00acc1); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,188,212,0.3); }
    .error { color: #ef4444; font-size: 0.875rem; margin-top: 4px; display: none; }
    .strength { height: 4px; border-radius: 2px; margin-top: 6px; transition: all 0.3s; }
  </style>
</head>
<body>
  <div class="card">
    <div style="text-align:center; margin-bottom:28px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#00bcd4,#00acc1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
        <i class="fas fa-lock" style="color:white;font-size:1.5rem;"></i>
      </div>
      <h1 style="color:#006064;font-size:1.5rem;font-weight:700;margin:0 0 6px;">Set Your New Password</h1>
      <p style="color:#666;font-size:0.9rem;margin:0;">Your account requires a password change before you can continue.</p>
    </div>

    <form id="changeForm">
      <div style="margin-bottom:18px;">
        <label style="display:block;margin-bottom:6px;color:#006064;font-weight:500;font-size:0.9rem;">New Password</label>
        <div style="position:relative;">
          <input type="password" id="newPassword" placeholder="Enter new password (min 8 chars)" required>
          <button type="button" onclick="toggleVis('newPassword','eyeNew')" 
                  style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#999;">
            <i class="fas fa-eye" id="eyeNew"></i>
          </button>
        </div>
        <div class="strength" id="strengthBar" style="background:#e5e7eb;"></div>
        <p style="font-size:0.75rem;color:#999;margin-top:4px;" id="strengthLabel">Enter a password</p>
        <p class="error" id="newPassError">Password must be at least 8 characters.</p>
      </div>

      <div style="margin-bottom:24px;">
        <label style="display:block;margin-bottom:6px;color:#006064;font-weight:500;font-size:0.9rem;">Confirm Password</label>
        <div style="position:relative;">
          <input type="password" id="confirmPassword" placeholder="Re-enter new password" required>
          <button type="button" onclick="toggleVis('confirmPassword','eyeConf')" 
                  style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#999;">
            <i class="fas fa-eye" id="eyeConf"></i>
          </button>
        </div>
        <p class="error" id="confirmError">Passwords do not match.</p>
      </div>

      <div style="background:#e0f7fa;border-radius:10px;padding:12px;margin-bottom:20px;font-size:0.8rem;color:#006064;">
        <strong>Password requirements:</strong>
        <ul style="margin:6px 0 0 16px;padding:0;">
          <li id="req-len" style="color:#999;">At least 8 characters</li>
          <li id="req-upper" style="color:#999;">One uppercase letter</li>
          <li id="req-num" style="color:#999;">One number</li>
        </ul>
      </div>

      <button type="submit" class="btn" id="submitBtn">
        <i class="fas fa-check-circle" style="margin-right:8px;"></i>Set New Password
      </button>

      <p id="statusMsg" style="text-align:center;margin-top:12px;font-size:0.875rem;display:none;"></p>
    </form>
  </div>

  <script>
    function toggleVis(inputId, iconId) {
      const input = document.getElementById(inputId);
      const icon  = document.getElementById(iconId);
      if (input.type === 'password') { input.type = 'text'; icon.className = 'fas fa-eye-slash'; }
      else { input.type = 'password'; icon.className = 'fas fa-eye'; }
    }

    function checkStrength(pwd) {
      let score = 0;
      if (pwd.length >= 8)  score++;
      if (/[A-Z]/.test(pwd)) score++;
      if (/[0-9]/.test(pwd)) score++;
      if (/[^A-Za-z0-9]/.test(pwd)) score++;
      return score;
    }

    document.getElementById('newPassword').addEventListener('input', function() {
      const pwd   = this.value;
      const score = checkStrength(pwd);
      const bar   = document.getElementById('strengthBar');
      const label = document.getElementById('strengthLabel');
      const colors = ['#ef4444','#f97316','#eab308','#22c55e'];
      const labels = ['Weak','Fair','Good','Strong'];
      bar.style.width   = (score * 25) + '%';
      bar.style.background = colors[score - 1] || '#e5e7eb';
      label.textContent = score > 0 ? labels[score - 1] : 'Enter a password';
      label.style.color = colors[score - 1] || '#999';

      document.getElementById('req-len').style.color   = pwd.length >= 8   ? '#22c55e' : '#999';
      document.getElementById('req-upper').style.color = /[A-Z]/.test(pwd) ? '#22c55e' : '#999';
      document.getElementById('req-num').style.color   = /[0-9]/.test(pwd) ? '#22c55e' : '#999';
    });

    document.getElementById('changeForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const newPwd  = document.getElementById('newPassword').value;
      const confPwd = document.getElementById('confirmPassword').value;
      const newErr  = document.getElementById('newPassError');
      const confErr = document.getElementById('confirmError');
      const status  = document.getElementById('statusMsg');
      const btn     = document.getElementById('submitBtn');

      newErr.style.display  = 'none';
      confErr.style.display = 'none';
      status.style.display  = 'none';

      if (newPwd.length < 8)      { newErr.style.display = 'block'; return; }
      if (newPwd !== confPwd)      { confErr.style.display = 'block'; return; }

      btn.disabled = true;
      btn.textContent = 'Saving…';

      try {
        const res  = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: newPwd })
        });
        const data = await res.json();
        if (data.success) {
          status.textContent   = '✅ Password updated! Redirecting…';
          status.style.color   = '#22c55e';
          status.style.display = 'block';
          setTimeout(() => window.location.href = data.redirectTo || '/', 1500);
        } else {
          status.textContent   = '❌ ' + (data.message || 'Failed to update password.');
          status.style.color   = '#ef4444';
          status.style.display = 'block';
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-check-circle" style="margin-right:8px;"></i>Set New Password';
        }
      } catch(err) {
        status.textContent   = '❌ Network error. Please try again.';
        status.style.color   = '#ef4444';
        status.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle" style="margin-right:8px;"></i>Set New Password';
      }
    });
  </script>
</body>
</html>`);
});

// API: Change password (clears must_change_password flag)
app.post('/api/auth/change-password', authenticate, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        }
        const salt   = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        await query(
            'UPDATE users SET password_hash = $1, must_change_password = false WHERE user_id = $2',
            [hashed, req.user.id]
        );

        // Determine redirect based on role
        const redirectMap = { admin: '/admin-dashboard', doctor: '/doctor-dashboard', lab: '/lab-dashboard', patient: '/patient-dashboard' };
        res.json({ success: true, message: 'Password changed successfully', redirectTo: redirectMap[req.user.role] || '/' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// ============================================
// FILE UPLOAD ROUTES (Lab)
// ============================================

app.post('/api/lab/upload-report', authenticate, authorize('lab'), upload.single('report'), async (req, res) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const { patientId, doctorId, testType, priority, findings, sendTo } = req.body;

        const labTechResult = await client.query(
            'SELECT lab_tech_id FROM lab_technicians WHERE user_id = $1', [req.user.id]
        );
        if (labTechResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Lab technician not found' });
        }
        const labTechId = labTechResult.rows[0].lab_tech_id;

        const patientResult = await client.query(
            `SELECT patient_id FROM patients
             WHERE patient_uuid = $1
                OR patient_id::text = $1
                OR upper(substr(replace(patient_id::text, '-', ''), 1, 8)) = upper(replace($1, 'PT-', ''))`,
            [patientId]
        );
        if (patientResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient not found with ID: ' + patientId });
        }
        const actualPatientId = patientResult.rows[0].patient_id;

        let actualDoctorId = null;
        if (doctorId?.trim()) {
            const doctorResult = await client.query(
                'SELECT doctor_id FROM doctors WHERE doctor_uuid = $1', [doctorId]
            );
            if (doctorResult.rows.length > 0) actualDoctorId = doctorResult.rows[0].doctor_id;
        }

        const labTechHospitalResult = await client.query(
            'SELECT hospital_id FROM lab_technicians WHERE user_id = $1',
            [req.user.id]
        );
        const labTechHospitalId = labTechHospitalResult.rows[0]?.hospital_id;

        // Check if patient belongs to this hospital
        const patientInHospital = await checkPatientInHospital(actualPatientId, labTechHospitalId);

        // Enforce rules
        if (patientInHospital) {
            if (!doctorId || !doctorId.trim()) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Doctor ID is required for patients from this hospital' 
                });
            }
            if (sendTo === 'patient') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot send only to patient for patients from this hospital' 
                });
            }
        }
        const fileData = await storageService.uploadFile(req.file, 'reports');
        // Ensure report is physically present in canonical reports folder
        const canonicalReportsDir = path.join(UPLOADS_ROOT, 'reports');
        if (!fs.existsSync(canonicalReportsDir)) fs.mkdirSync(canonicalReportsDir, { recursive: true });
        const canonicalReportPath = path.join(canonicalReportsDir, fileData.filename);
        const uploadedPath = req.file.path;
        if (uploadedPath && uploadedPath !== canonicalReportPath && fs.existsSync(uploadedPath) && !fs.existsSync(canonicalReportPath)) {
            fs.copyFileSync(uploadedPath, canonicalReportPath);
        }
        const reportUUID = 'REP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
        const today = new Date().toISOString().split('T')[0];

        // Insert the report with the correct shared_with value
        const result = await client.query(
            `INSERT INTO lab_reports (
                report_uuid, patient_id, doctor_id, lab_tech_id, 
                test_type, test_date, findings, file_url, status, 
                priority, shared_with
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
             RETURNING report_id, report_uuid, shared_with`,
            [
                reportUUID, 
                actualPatientId, 
                actualDoctorId, 
                labTechId, 
                testType, 
                today, 
                findings || 'No findings', 
                `/uploads/reports/${fileData.filename}`, 
                'pending', 
                priority || 'normal', 
                sendTo || 'doctor'  // Use the value from the form, default to 'doctor'
            ]
        );
        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: 'Report uploaded successfully', 
            reportId: result.rows[0].report_uuid, 
            sharedWith: result.rows[0].shared_with 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error uploading report:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
});

// Check if patient belongs to lab tech's hospital
app.get('/api/lab/check-patient-hospital', authenticate, authorize('lab'), async (req, res) => {
    try {
        const { patientId, hospitalId } = req.query;
        
        if (!patientId || !hospitalId) {
            return res.status(400).json({ error: 'Patient ID and Hospital ID required' });
        }
        
        // First get the actual patient_id from patient_uuid
        const patientResult = await query(
            `SELECT patient_id FROM patients
             WHERE patient_uuid = $1
                OR patient_id::text = $1
                OR upper(substr(replace(patient_id::text, '-', ''), 1, 8)) = upper(replace($1, 'PT-', ''))`,
            [patientId]
        );
        
        if (patientResult.rows.length === 0) {
            return res.json({ isInHospital: false });
        }
        
        const actualPatientId = patientResult.rows[0].patient_id;
        
        // Check if patient has any appointments or lab reports in this hospital
        const result = await query(
            `SELECT EXISTS(
                SELECT 1 FROM appointments a
                JOIN doctors d ON a.doctor_id = d.doctor_id
                WHERE a.patient_id = $1 AND d.hospital_id = $2
                UNION
                SELECT 1 FROM lab_reports lr
                JOIN lab_technicians lt ON lr.lab_tech_id = lt.lab_tech_id
                WHERE lr.patient_id = $1 AND lt.hospital_id = $2
            ) as in_hospital`,
            [actualPatientId, hospitalId]
        );
        
        res.json({ isInHospital: result.rows[0].in_hospital });
    } catch (error) {
        console.error('Error checking patient hospital:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve uploaded files
app.get('/uploads/:folder/:file', (req, res) => {
    const { folder, file } = req.params;
    const candidates = [
      path.join(UPLOADS_ROOT, folder, file),
      path.join(__dirname, 'uploads', folder, file)
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (filePath) res.sendFile(filePath);
    else res.status(404).json({ error: 'File not found' });
});

// Legacy report download (by report_uuid, used by lab dashboard)
app.get('/api/reports/:reportId/download', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT file_url, report_uuid, report_id, test_type, patient_id
             FROM lab_reports
             WHERE report_uuid = $1 OR report_id::text = $1
             LIMIT 1`,
            [req.params.reportId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });

        const report = result.rows[0];
        if (req.user.role === 'patient') {
            const patientResult = await query(
                'SELECT patient_id FROM patients WHERE user_id = $1',
                [req.user.id]
            );
            const patientId = patientResult.rows[0]?.patient_id;
            if (!patientId || String(report.patient_id) !== String(patientId)) {
                return res.status(403).json({ error: 'Not authorized to download this report' });
            }
        }

        if (!report.file_url) {
            return res.status(404).json({ error: 'No file attached to this report' });
        }

        const filePath = resolveExistingReportFile(report.file_url);
        if (!filePath) return res.status(404).json({ error: 'File not found on server' });

        const extension = path.extname(filePath) || '.pdf';
        const safeType = (report.test_type || 'report').replace(/[^a-z0-9_-]/gi, '_');
        const safeId = report.report_uuid || report.report_id || req.params.reportId;
        res.download(filePath, `${safeType}_${safeId}${extension}`);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// LAB API ROUTES
// ============================================

app.get('/api/lab/patients', authenticate, authorize('lab'), async (req, res) => {
    try {
        const result = await query('SELECT patient_id, patient_uuid, full_name FROM patients ORDER BY full_name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/lab/doctors', authenticate, authorize('lab'), async (req, res) => {
    try {
        const result = await query(
            "SELECT doctor_id, doctor_uuid, full_name, specialization FROM doctors WHERE status = 'Available' ORDER BY full_name"
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/patient-history', authenticate, authorize('lab'), async (req, res) => {
    try {
        const labTechResult = await query('SELECT lab_tech_id FROM lab_technicians WHERE user_id = $1', [req.user.id]);
        if (labTechResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Lab technician not found' });

        const result = await query(
            `SELECT lr.report_id, lr.report_uuid as id, p.full_name as name, COALESCE(p.patient_uuid, p.patient_id::text) as patient_id,
                    lr.test_type, lr.test_date as date, lr.status, lr.priority, lr.created_at,
                    d.doctor_uuid as doctor_id, d.full_name as doctor_name
             FROM lab_reports lr
             JOIN patients p ON lr.patient_id = p.patient_id
             LEFT JOIN doctors d ON lr.doctor_id = d.doctor_id
             WHERE lr.lab_tech_id = $1
             ORDER BY lr.created_at DESC LIMIT 50`,
            [labTechResult.rows[0].lab_tech_id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// PATIENT API ROUTES
// ============================================

app.get('/api/patient', authenticate, authorize('patient'), async (req, res) => {
    try {
        const result = await query('SELECT p.* FROM patients p WHERE p.user_id = $1', [req.user.id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient chat history with a doctor
app.get('/api/patient/chat/:doctorId/history', authenticate, authorize('patient'), async (req, res) => {
    try {
        await ensureChatMessagesTable();
        const patientRes = await query('SELECT patient_id FROM patients WHERE user_id = $1', [req.user.id]);
        if (!patientRes.rows[0]) return res.status(404).json({ error: 'Patient not found' });

        const patientId = patientRes.rows[0].patient_id;
        const { doctorId } = req.params;
        const roomId = [doctorId, patientId].sort().join('_');

        const result = await query(
            `SELECT m.sender_id, m.message, m.created_at, u.role AS sender_role
             FROM chat_messages m
             JOIN users u ON u.user_id = m.sender_id
             WHERE m.room_id = $1
             ORDER BY m.created_at ASC
             LIMIT 200`,
            [roomId]
        );

        await query(
            `INSERT INTO chat_read_state (user_id, room_id, last_read_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id, room_id)
             DO UPDATE SET last_read_at = EXCLUDED.last_read_at`,
            [req.user.id, roomId]
        );

        res.json(result.rows.map(row => ({
            sender: row.sender_role === 'patient' ? 'patient' : 'doctor',
            message: row.message,
            created_at: row.created_at
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient sends message to a doctor
app.post('/api/patient/chat/:doctorId', authenticate, authorize('patient'), async (req, res) => {
    try {
        await ensureChatMessagesTable();
        const { message } = req.body;
        if (!message || !String(message).trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const patientRes = await query('SELECT patient_id FROM patients WHERE user_id = $1', [req.user.id]);
        if (!patientRes.rows[0]) return res.status(404).json({ error: 'Patient not found' });

        const patientId = patientRes.rows[0].patient_id;
        const { doctorId } = req.params;
        const roomId = [doctorId, patientId].sort().join('_');

        await query(
            `INSERT INTO chat_messages (room_id, sender_id, message, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [roomId, req.user.id, String(message).trim()]
        );

        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/patient/chat/unread', authenticate, authorize('patient'), async (req, res) => {
    try {
        await ensureChatMessagesTable();
        const patientRes = await query('SELECT patient_id FROM patients WHERE user_id = $1', [req.user.id]);
        if (!patientRes.rows[0]) return res.status(404).json({ error: 'Patient not found' });

        const patientId = patientRes.rows[0].patient_id;
        const result = await query(
            `SELECT
                CASE
                  WHEN split_part(m.room_id, '_', 1) = $1::text THEN split_part(m.room_id, '_', 2)
                  ELSE split_part(m.room_id, '_', 1)
                END AS doctor_id,
                COUNT(*)::int AS unread_count
             FROM chat_messages m
             JOIN users su ON su.user_id = m.sender_id
             LEFT JOIN chat_read_state rs ON rs.user_id = $2 AND rs.room_id = m.room_id
             WHERE (split_part(m.room_id, '_', 1) = $1::text OR split_part(m.room_id, '_', 2) = $1::text)
               AND su.role = 'doctor'
               AND (rs.last_read_at IS NULL OR m.created_at > rs.last_read_at)
             GROUP BY 1`,
            [patientId, req.user.id]
        );

        const unreadByDoctor = {};
        let totalUnread = 0;
        result.rows.forEach(row => {
            const count = Number(row.unread_count || 0);
            unreadByDoctor[row.doctor_id] = count;
            totalUnread += count;
        });

        res.json({ success: true, unreadByDoctor, totalUnread });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/patient/chat/:doctorId/read', authenticate, authorize('patient'), async (req, res) => {
    try {
        await ensureChatMessagesTable();
        const patientRes = await query('SELECT patient_id FROM patients WHERE user_id = $1', [req.user.id]);
        if (!patientRes.rows[0]) return res.status(404).json({ error: 'Patient not found' });

        const roomId = [req.params.doctorId, patientRes.rows[0].patient_id].sort().join('_');
        await query(
            `INSERT INTO chat_read_state (user_id, room_id, last_read_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id, room_id)
             DO UPDATE SET last_read_at = EXCLUDED.last_read_at`,
            [req.user.id, roomId]
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/patient', authenticate, authorize('patient'), upload.single('profile_photo'), async (req, res) => {
    try {
        const parseMaybeJsonArray = (value) => {
            if (Array.isArray(value)) return value;
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (!trimmed) return null;
                try {
                    const parsed = JSON.parse(trimmed);
                    return Array.isArray(parsed) ? parsed : null;
                } catch {
                    return trimmed.split(',').map(v => v.trim()).filter(Boolean);
                }
            }
            return null;
        };

        const { 
            full_name, phone, address,
            emergency_contact_name, emergency_contact_phone, emergency_relation,
            medical_conditions, allergies, blood_type, gender, remove_profile_photo
        } = req.body;

        // Keep schema compatible across environments.
        await query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_relation VARCHAR(100)');

        let profilePhotoUrl = null;
        const shouldRemoveProfilePhoto = String(remove_profile_photo || '').toLowerCase() === 'true';
        if (req.file) {
            const photosDir = path.join(UPLOADS_ROOT, 'photos');
            if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
            const destPath = path.join(photosDir, req.file.filename);
            if (req.file.path !== destPath) fs.renameSync(req.file.path, destPath);
            profilePhotoUrl = '/uploads/photos/' + req.file.filename;
        } else if (shouldRemoveProfilePhoto) {
            profilePhotoUrl = '';
        }

        let result;
        try {
            result = await query(
                `UPDATE patients
                 SET full_name                = COALESCE($1, full_name),
                     phone                    = COALESCE($2, phone),
                     address                  = COALESCE($3, address),
                     emergency_contact_name   = COALESCE($4, emergency_contact_name),
                     emergency_contact_phone  = COALESCE($5, emergency_contact_phone),
                     emergency_relation       = COALESCE($6, emergency_relation),
                     medical_conditions       = COALESCE($7, medical_conditions),
                     allergies                = COALESCE($8, allergies),
                     blood_type               = COALESCE($9, blood_type),
                     gender                   = COALESCE($10, gender),
                     profile_photo_url        = CASE 
                           WHEN $11 = '' THEN NULL
                           ELSE COALESCE($11, profile_photo_url)
                     END
                 WHERE user_id = $12
                 RETURNING *`,
                [
                    full_name, phone, address,
                    emergency_contact_name, emergency_contact_phone, emergency_relation,
                    parseMaybeJsonArray(medical_conditions), parseMaybeJsonArray(allergies), blood_type, gender,
                    profilePhotoUrl, req.user.id
                ]
            );
        } catch (updateErr) {
            if (updateErr && updateErr.code === '42703') {
                result = await query(
                    `UPDATE patients
                     SET full_name                = COALESCE($1, full_name),
                         phone                    = COALESCE($2, phone),
                         address                  = COALESCE($3, address),
                         emergency_contact_name   = COALESCE($4, emergency_contact_name),
                         emergency_contact_phone  = COALESCE($5, emergency_contact_phone),
                         medical_conditions       = COALESCE($6, medical_conditions),
                         allergies                = COALESCE($7, allergies),
                         blood_type               = COALESCE($8, blood_type),
                         gender                   = COALESCE($9, gender)
                     WHERE user_id = $10
                     RETURNING *`,
                    [
                        full_name, phone, address, emergency_contact_name, emergency_contact_phone,
                        parseMaybeJsonArray(medical_conditions), parseMaybeJsonArray(allergies), blood_type, gender,
                        req.user.id
                    ]
                );
            } else {
                throw updateErr;
            }
        }

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/appointments', authenticate, async (req, res) => {
    try {
        let result;
        if (req.user.role === 'patient') {
            result = await query(
                `SELECT a.*, d.full_name as doctor_name, d.specialization
                 FROM appointments a
                 JOIN doctors d ON a.doctor_id = d.doctor_id
                 JOIN patients p ON a.patient_id = p.patient_id
                 WHERE p.user_id = $1 ORDER BY a.appointment_date DESC`,
                [req.user.id]
            );
        } else if (req.user.role === 'doctor') {
            result = await query(
                `SELECT a.*, a.type AS appointment_type, p.full_name as patient_name
                 FROM appointments a
                 JOIN patients p ON a.patient_id = p.patient_id
                 JOIN doctors d ON a.doctor_id = d.doctor_id
                 WHERE d.user_id = $1 AND a.appointment_date = CURRENT_DATE
                 ORDER BY a.appointment_time`,
                [req.user.id]
            );
        }
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SLOT AVAILABILITY CHECK (double-booking guard)
// GET /api/appointments/slots?doctor_id=<uuid>&date=<YYYY-MM-DD>
// Returns an array of time strings that are already booked.
// ============================================
app.get('/api/appointments/slots', authenticate, async (req, res) => {
    try {
        const { doctor_id, date } = req.query;

        if (!doctor_id || !date) {
            return res.status(400).json({ error: 'doctor_id and date are required' });
        }

        const result = await query(
            `SELECT appointment_time
             FROM appointments
             WHERE doctor_id = $1
               AND appointment_date = $2::date
               AND status NOT IN ('cancelled')`,
            [doctor_id, date]
        );

        // Return just the time strings so the client can grey them out
        const bookedSlots = result.rows.map(r =>
            // Normalise to "HH:MM AM/PM" — strip seconds if present
            String(r.appointment_time).substring(0, 5)
        );

        res.json({ bookedSlots });
    } catch (error) {
        console.error('Error fetching booked slots:', error);
        res.status(500).json({ error: error.message });
    }
});

function parseAppointmentDateTime(appointmentDate, appointmentTime) {
    if (!appointmentDate || !appointmentTime) return null;
    const datePart = String(appointmentDate).slice(0, 10);
    const rawTime = String(appointmentTime).trim();
    const amPmMatch = rawTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    let hours;
    let minutes;
    if (amPmMatch) {
        hours = parseInt(amPmMatch[1], 10);
        minutes = parseInt(amPmMatch[2], 10);
        const meridiem = amPmMatch[3].toUpperCase();
        if (meridiem === 'PM' && hours !== 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
    } else {
        const hmMatch = rawTime.match(/^(\d{1,2}):(\d{2})/);
        if (!hmMatch) return null;
        hours = parseInt(hmMatch[1], 10);
        minutes = parseInt(hmMatch[2], 10);
    }
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return new Date(`${datePart}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
}

async function ensureHospitalVisitPolicySchema() {
    await query(
        "ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS visit_mode_policy VARCHAR(20) DEFAULT 'both'"
    );
}

async function ensureOnlineReminderSchema() {
    await query(`
      CREATE TABLE IF NOT EXISTS online_appointment_reminders (
        reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID UNIQUE NOT NULL,
        doctor_id UUID NOT NULL,
        remind_at TIMESTAMP NOT NULL,
        delivered_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
}

app.post('/api/appointments', authenticate, authorize('patient'), async (req, res) => {
    try {
        const { doctor_id, appointment_date, appointment_time, reason, type, location } = req.body;
        const appointmentType = String(type || 'in-person').trim().toLowerCase();
        if (!['in-person', 'online'].includes(appointmentType)) {
            return res.status(400).json({ success: false, message: 'Invalid appointment type' });
        }

        await ensureHospitalVisitPolicySchema();
        const policyResult = await query(
            `SELECT COALESCE(h.visit_mode_policy, 'both') AS visit_mode_policy
             FROM doctors d
             JOIN hospitals h ON h.hospital_id = d.hospital_id
             WHERE d.doctor_id = $1`,
            [doctor_id]
        );
        if (!policyResult.rows[0]) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        const visitModePolicy = String(policyResult.rows[0].visit_mode_policy || 'both').toLowerCase();
        if (visitModePolicy === 'in-person-only' && appointmentType === 'online') {
            return res.status(400).json({
                success: false,
                message: 'This hospital currently allows only in-person appointments.'
            });
        }

        const bookingDateTime = parseAppointmentDateTime(appointment_date, appointment_time);
        if (!bookingDateTime || bookingDateTime.getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'Appointments cannot be booked for past date/time.'
            });
        }

        // --- ADD: double-booking guard ---
        const conflict = await query(
            `SELECT 1 FROM appointments
             WHERE doctor_id = $1
               AND appointment_date = $2::date
               AND appointment_time = $3
               AND status NOT IN ('cancelled')
             LIMIT 1`,
            [doctor_id, appointment_date, appointment_time]
        );

        if (conflict.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'This time slot is already booked. Please choose a different time.'
            });
        }
        // --- END ADD ---

        const patientResult = await query('SELECT patient_id FROM patients WHERE user_id = $1', [req.user.id]);
        const result = await query(
            `INSERT INTO appointments (patient_id, doctor_id, hospital_id, appointment_date, appointment_time, reason, type, location, status)
             VALUES ($1, $2, (SELECT hospital_id FROM doctors WHERE doctor_id = $2), $3, $4, $5, $6, $7, 'confirmed') RETURNING *`,
            [
                patientResult.rows[0].patient_id,
                doctor_id,
                appointment_date,
                appointment_time,
                reason,
                appointmentType,
                location
            ]
        );
        if (appointmentType === 'online' && result.rows[0]?.appointment_id) {
            await ensureOnlineReminderSchema();
            await query(
                `INSERT INTO online_appointment_reminders (appointment_id, doctor_id, remind_at)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (appointment_id) DO NOTHING`,
                [result.rows[0].appointment_id, doctor_id, bookingDateTime]
            );
        }
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Reschedule appointment
app.put('/api/appointments/:id/reschedule', authenticate, async (req, res) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { new_date, new_time, reason } = req.body;
        const rescheduleDateTime = parseAppointmentDateTime(new_date, new_time);
        if (!rescheduleDateTime || rescheduleDateTime.getTime() < Date.now()) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Cannot reschedule to a past date/time' });
        }
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        const appointment = await client.query(
            `SELECT a.*, p.user_id as patient_user_id, d.user_id as doctor_user_id
             FROM appointments a
             JOIN patients p ON a.patient_id = p.patient_id
             JOIN doctors d ON a.doctor_id = d.doctor_id
             WHERE ${isUUID ? 'a.appointment_id = $1::uuid' : 'a.appointment_uuid = $1'}`,
            [id]
        );
        if (!appointment.rows[0]) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        const apt = appointment.rows[0];
        if (req.user.role === 'patient' && apt.patient_user_id !== req.user.id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        if (req.user.role === 'doctor' && apt.doctor_user_id !== req.user.id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        const slotCheck = await client.query(
            `SELECT * FROM appointments WHERE doctor_id = $1::uuid AND appointment_date = $2::date
             AND appointment_time = $3::varchar AND status != 'cancelled' AND appointment_id != $4::uuid`,
            [apt.doctor_id, new_date, new_time, apt.appointment_id]
        );
        if (slotCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.json({ success: false, message: 'Time slot not available' });
        }
        await client.query(
            `UPDATE appointments
             SET appointment_date = $1::date, appointment_time = $2::varchar,
                 notes = CASE WHEN $3::text IS NOT NULL AND $3::text != ''
                              THEN COALESCE(notes,'') || ' | Rescheduled: ' || $3::text
                              ELSE notes END,
                 status = 'rescheduled'
             WHERE appointment_id = $4::uuid`,
            [new_date, new_time, reason, apt.appointment_id]
        );
        await client.query('COMMIT');
        res.json({ success: true, message: 'Appointment rescheduled successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
});

// Cancel appointment
app.put('/api/appointments/:id/cancel', authenticate, async (req, res) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { reason } = req.body;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        const appointment = await client.query(
            `SELECT a.*, p.user_id as patient_user_id, d.user_id as doctor_user_id
             FROM appointments a
             JOIN patients p ON a.patient_id = p.patient_id
             JOIN doctors d ON a.doctor_id = d.doctor_id
             WHERE ${isUUID ? 'a.appointment_id = $1::uuid' : 'a.appointment_uuid = $1'}`,
            [id]
        );
        if (!appointment.rows[0]) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        const apt = appointment.rows[0];
        if (req.user.role === 'patient' && apt.patient_user_id !== req.user.id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        if (req.user.role === 'doctor' && apt.doctor_user_id !== req.user.id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        await client.query(
            `UPDATE appointments
             SET status = 'cancelled',
                 notes = CASE WHEN $1::text IS NOT NULL AND $1::text != ''
                              THEN COALESCE(notes,'') || ' | Cancelled: ' || $1::text
                              ELSE COALESCE(notes,'') || ' | Cancelled by patient' END
             WHERE appointment_id = $2::uuid`,
            [reason, apt.appointment_id]
        );
        await client.query('COMMIT');
        res.json({ success: true, message: 'Appointment cancelled successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
});

// Update appointment (status/time/notes — doctor/admin)
app.put('/api/appointments/:id', authenticate, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const result = await query(
            `UPDATE appointments
             SET status = COALESCE($1, status), appointment_time = COALESCE($2, appointment_time),
                 reason = COALESCE($3, reason), notes = COALESCE($4, notes)
             WHERE appointment_id = $5 RETURNING *`,
            [req.body.status, req.body.appointment_time, req.body.reason, req.body.notes, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/prescriptions', authenticate, async (req, res) => {
    try {
        let result;
        if (req.user.role === 'patient') {
            result = await query(
                `SELECT p.* FROM prescriptions p
                 JOIN patients pt ON p.patient_id = pt.patient_id
                 WHERE pt.user_id = $1 AND p.status = 'active' ORDER BY p.created_at DESC`,
                [req.user.id]
            );
        } else if (req.user.role === 'doctor') {
            result = await query(
                `SELECT p.* FROM prescriptions p
                 JOIN doctors d ON p.doctor_id = d.doctor_id
                 WHERE d.user_id = $1
                 ORDER BY p.created_at DESC`,
                [req.user.id]
            );
        } else {
            result = { rows: [] };
        }
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/doctors', authenticate, async (req, res) => {
    try {
        await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS logo_filename TEXT");
        await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS main_photo_filename TEXT");
        const result = await query(
            `SELECT d.*,
                    h.name as hospital_name,
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
             JOIN hospitals h ON d.hospital_id = h.hospital_id
             WHERE d.status NOT IN ('On Leave', 'Inactive') ORDER BY d.full_name`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hospitals', authenticate, async (req, res) => {
    try {
        await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS logo_filename TEXT");
        await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS main_photo_filename TEXT");
        await query("ALTER TABLE hospital_admins ADD COLUMN IF NOT EXISTS photo_url TEXT");
        const result = await query(
            `SELECT h.*,
                    CASE
                      WHEN h.main_photo_filename IS NOT NULL AND h.main_photo_filename <> ''
                      THEN '/uploads/hospitals/photos/' || h.main_photo_filename
                      WHEN h.logo_filename IS NOT NULL AND h.logo_filename <> ''
                      THEN '/uploads/hospitals/logos/' || h.logo_filename
                      ELSE NULL
                    END AS photo_url,
                    (
                      SELECT ha.photo_url
                      FROM hospital_admins ha
                      WHERE ha.hospital_id = h.hospital_id
                      LIMIT 1
                    ) AS admin_photo_url
             FROM hospitals h
             ORDER BY h.name`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// DOCTOR API ROUTES
// ============================================

// Get doctor profile
app.get('/api/doctor', authenticate, authorize('doctor'), async (req, res) => {
    try {
        await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS logo_filename TEXT");
        await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS main_photo_filename TEXT");
        const result = await query(
            `SELECT d.*,
                    h.name as hospital_name,
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
             JOIN hospitals h ON d.hospital_id = h.hospital_id
             WHERE d.user_id = $1`,
            [req.user.id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update doctor profile
app.put('/api/doctor', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const normalizedAvailableDays = Array.isArray(req.body.available_days)
            ? (req.body.available_days.length ? req.body.available_days : null)
            : (typeof req.body.available_days === 'string'
                ? (req.body.available_days.trim()
                    ? req.body.available_days.split(',').map(day => day.trim()).filter(Boolean)
                    : null)
                : null);

        const result = await query(
            `UPDATE doctors
             SET full_name = COALESCE($1, full_name), designation = COALESCE($2, designation),
                 consultation_fee = COALESCE($3, consultation_fee), available_days = COALESCE($4, available_days),
                 available_time = COALESCE($5, available_time), phone = COALESCE($6, phone), address = COALESCE($7, address)
             WHERE user_id = $8 RETURNING *`,
            [req.body.full_name, req.body.designation, req.body.consultation_fee,
             normalizedAvailableDays, req.body.available_time, req.body.phone, req.body.address, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update doctor profile (from dashboard Edit Profile modal)
app.post('/api/doctor/profile/update', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const { full_name, designation, specialization, experience, qualification,
                email, contact, consultation_fee, available_days, available_time, address } = req.body;

        const normalizedAvailableDays = Array.isArray(available_days)
            ? (available_days.length ? available_days : null)
            : (typeof available_days === 'string'
                ? (available_days.trim()
                    ? available_days.split(',').map(day => day.trim()).filter(Boolean)
                    : null)
                : null);

        // Update doctors table
        const result = await query(
            `UPDATE doctors
             SET full_name         = COALESCE($1,  full_name),
                 designation       = COALESCE($2,  designation),
                 specialization    = COALESCE($3,  specialization),
                 experience        = COALESCE($4,  experience),
                 qualification     = COALESCE($5,  qualification),
                 phone             = COALESCE($6,  phone),
                 consultation_fee  = COALESCE($7,  consultation_fee),
                 available_days    = COALESCE($8,  available_days),
                 available_time    = COALESCE($9,  available_time),
                 address           = COALESCE($10, address)
             WHERE user_id = $11 RETURNING *`,
            [full_name, designation, specialization, experience, qualification,
             contact, consultation_fee, normalizedAvailableDays, available_time, address, req.user.id]
        );
        // Update email in users table if provided
        if (email) {
            await query('UPDATE users SET email = $1 WHERE user_id = $2', [email, req.user.id]);
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Today's appointments (used by dashboard refresh)
app.get('/api/doctor/appointments/today', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const result = await query(
            `SELECT a.*, a.type AS appointment_type, p.full_name as patient_name, p.patient_uuid, p.patient_id
             FROM appointments a
             JOIN patients p ON a.patient_id = p.patient_id
             JOIN doctors d ON a.doctor_id = d.doctor_id
             WHERE d.user_id = $1 AND a.appointment_date = CURRENT_DATE
             ORDER BY a.appointment_time`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/doctor/reminders/due', authenticate, authorize('doctor'), async (req, res) => {
    try {
        await ensureOnlineReminderSchema();
        const doctorResult = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        const doctorId = doctorResult.rows[0]?.doctor_id;
        if (!doctorId) return res.json([]);

        const dueResult = await query(
            `SELECT r.reminder_id, r.appointment_id, p.full_name AS patient_name,
                    a.appointment_date, a.appointment_time, a.type AS appointment_type
             FROM online_appointment_reminders r
             JOIN appointments a ON a.appointment_id = r.appointment_id
             JOIN patients p ON p.patient_id = a.patient_id
             WHERE r.doctor_id = $1
               AND r.delivered_at IS NULL
               AND r.remind_at <= NOW()
               AND COALESCE(a.status, '') NOT IN ('cancelled', 'deleted')
               AND COALESCE(a.type, '') = 'online'
             ORDER BY r.remind_at ASC
             LIMIT 10`,
            [doctorId]
        );

        if (dueResult.rows.length > 0) {
            const ids = dueResult.rows.map(r => r.reminder_id);
            await query(
                `UPDATE online_appointment_reminders
                 SET delivered_at = NOW()
                 WHERE reminder_id = ANY($1::uuid[])`,
                [ids]
            );
        }

        res.json(dueResult.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/hospital/visit-policy', authenticate, async (req, res) => {
    try {
        await ensureHospitalVisitPolicySchema();
        const { doctor_id } = req.query;
        if (!doctor_id) return res.status(400).json({ error: 'doctor_id is required' });
        const result = await query(
            `SELECT COALESCE(h.visit_mode_policy, 'both') AS visit_mode_policy
             FROM doctors d
             JOIN hospitals h ON h.hospital_id = d.hospital_id
             WHERE d.doctor_id = $1`,
            [doctor_id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Doctor/hospital not found' });
        res.json({ visit_mode_policy: result.rows[0].visit_mode_policy });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/hospital/visit-policy', authenticate, authorize('admin'), async (req, res) => {
    try {
        await ensureHospitalVisitPolicySchema();
        const adminResult = await query('SELECT hospital_id FROM hospital_admins WHERE user_id = $1', [req.user.id]);
        const hospitalId = adminResult.rows[0]?.hospital_id;
        if (!hospitalId) return res.status(404).json({ error: 'Hospital not found for admin' });
        const hospitalResult = await query(
            "SELECT COALESCE(visit_mode_policy, 'both') AS visit_mode_policy FROM hospitals WHERE hospital_id = $1",
            [hospitalId]
        );
        res.json({ visit_mode_policy: hospitalResult.rows[0]?.visit_mode_policy || 'both' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/hospital/visit-policy', authenticate, authorize('admin'), async (req, res) => {
    try {
        await ensureHospitalVisitPolicySchema();
        const nextPolicy = String(req.body.visit_mode_policy || '').trim().toLowerCase();
        if (!['both', 'in-person-only'].includes(nextPolicy)) {
            return res.status(400).json({ error: 'visit_mode_policy must be either both or in-person-only' });
        }
        const adminResult = await query('SELECT hospital_id FROM hospital_admins WHERE user_id = $1', [req.user.id]);
        const hospitalId = adminResult.rows[0]?.hospital_id;
        if (!hospitalId) return res.status(404).json({ error: 'Hospital not found for admin' });
        const updateResult = await query(
            'UPDATE hospitals SET visit_mode_policy = $1 WHERE hospital_id = $2 RETURNING visit_mode_policy',
            [nextPolicy, hospitalId]
        );
        res.json({ success: true, visit_mode_policy: updateResult.rows[0]?.visit_mode_policy || nextPolicy });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/profile', authenticate, authorize('admin'), async (req, res) => {
    try {
        await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS main_photo_filename TEXT");
        await query("ALTER TABLE hospital_admins ADD COLUMN IF NOT EXISTS photo_url TEXT");
        const result = await query(
            `SELECT h.hospital_id, h.name AS hospital_name, h.type AS hospital_type, h.city AS hospital_city,
                    h.phone AS hospital_phone, h.email AS hospital_email, h.logo_filename, h.main_photo_filename,
                    ha.full_name AS admin_full_name, ha.position AS admin_position, ha.phone AS admin_phone,
                    ha.email AS admin_email, ha.photo_url AS admin_photo_url
             FROM hospital_admins ha
             JOIN hospitals h ON h.hospital_id = ha.hospital_id
             WHERE ha.user_id = $1
             LIMIT 1`,
            [req.user.id]
        );
        if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Admin profile not found' });
        res.json({ success: true, profile: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/admin/profile', authenticate, authorize('admin'),
    hospitalUpload.fields([
        { name: 'hospitalLogo', maxCount: 1 },
        { name: 'hospitalMainPhoto', maxCount: 1 },
        { name: 'adminPhoto', maxCount: 1 }
    ]),
    async (req, res) => {
        const client = await getClient();
        try {
            await client.query('BEGIN');
            await client.query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS main_photo_filename TEXT");
            await client.query("ALTER TABLE hospital_admins ADD COLUMN IF NOT EXISTS photo_url TEXT");

            const adminResult = await client.query(
                'SELECT hospital_id FROM hospital_admins WHERE user_id = $1 LIMIT 1',
                [req.user.id]
            );
            const hospitalId = adminResult.rows[0]?.hospital_id;
            if (!hospitalId) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, error: 'Hospital not found for this admin' });
            }

            const ensureDir = (dirPath) => {
                if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
            };
            const saveBufferFile = (file, dirPath, fileBaseName) => {
                if (!file) return null;
                ensureDir(dirPath);
                const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
                const filename = fileBaseName + '_' + Date.now() + ext;
                fs.writeFileSync(path.join(dirPath, filename), file.buffer);
                return filename;
            };

            const logoFile = req.files?.hospitalLogo?.[0];
            const mainPhotoFile = req.files?.hospitalMainPhoto?.[0];
            const adminPhotoFile = req.files?.adminPhoto?.[0];

            const newLogoFilename = saveBufferFile(logoFile, path.join(UPLOADS_ROOT, 'hospitals', 'logos'), 'hospital_logo');
            const newMainPhotoFilename = saveBufferFile(mainPhotoFile, path.join(UPLOADS_ROOT, 'hospitals', 'photos'), 'hospital_main');
            const newAdminPhotoFilename = saveBufferFile(adminPhotoFile, path.join(UPLOADS_ROOT, 'admins', 'photos'), 'admin_photo');
            const newAdminPhotoUrl = newAdminPhotoFilename ? `/uploads/admins/photos/${newAdminPhotoFilename}` : null;

            const {
                hospital_name,
                hospital_type,
                hospital_city,
                hospital_phone,
                hospital_email,
                admin_full_name,
                admin_position,
                admin_phone,
                admin_email
            } = req.body;

            await client.query(
                `UPDATE hospitals
                 SET name = COALESCE(NULLIF($1, ''), name),
                     type = COALESCE(NULLIF($2, ''), type),
                     city = COALESCE(NULLIF($3, ''), city),
                     phone = COALESCE(NULLIF($4, ''), phone),
                     email = COALESCE(NULLIF($5, ''), email),
                     logo_filename = COALESCE($6, logo_filename),
                     main_photo_filename = COALESCE($7, main_photo_filename)
                 WHERE hospital_id = $8`,
                [
                    hospital_name, hospital_type, hospital_city, hospital_phone, hospital_email,
                    newLogoFilename, newMainPhotoFilename, hospitalId
                ]
            );

            await client.query(
                `UPDATE hospital_admins
                 SET full_name = COALESCE(NULLIF($1, ''), full_name),
                     position = COALESCE(NULLIF($2, ''), position),
                     phone = COALESCE(NULLIF($3, ''), phone),
                     email = COALESCE(NULLIF($4, ''), email),
                     photo_url = COALESCE($5, photo_url)
                 WHERE user_id = $6`,
                [admin_full_name, admin_position, admin_phone, admin_email, newAdminPhotoUrl, req.user.id]
            );

            if (admin_email && String(admin_email).trim()) {
                await client.query('UPDATE users SET email = $1 WHERE user_id = $2', [String(admin_email).trim().toLowerCase(), req.user.id]);
            }

            await client.query('COMMIT');
            res.json({ success: true, message: 'Profile updated successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            res.status(500).json({ success: false, error: error.message });
        } finally {
            client.release();
        }
    }
);

// Lab reports for doctor (dashboard refresh)
app.get('/api/doctor/reports', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const result = await query(
            `SELECT r.*, p.full_name as patient_name, p.patient_uuid, p.patient_id
             FROM lab_reports r
             JOIN patients p ON r.patient_id = p.patient_id
             JOIN doctors d ON r.doctor_id = d.doctor_id
             WHERE d.user_id = $1
             AND (r.shared_with IS NULL OR r.shared_with IN ('doctor', 'both', 'hospital', 'all', 'outside'))
             ORDER BY r.created_at DESC LIMIT 50`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Legacy lab-reports route (pending only)
app.get('/api/lab-reports', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const result = await query(
            `SELECT r.*, p.full_name as patient_name FROM lab_reports r
             JOIN patients p ON r.patient_id = p.patient_id
             JOIN doctors d ON r.doctor_id = d.doctor_id
             WHERE d.user_id = $1 AND r.status IN ('pending', 'Pending')
             AND (r.shared_with IS NULL OR r.shared_with IN ('doctor', 'both', 'hospital', 'all', 'outside'))
             ORDER BY r.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Doctor's patients list
app.get('/api/patients', authenticate, authorize('doctor'), async (req, res) => {
    try {
        await query(`
          CREATE TABLE IF NOT EXISTS doctor_patient_links (
            link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            doctor_id UUID NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
            patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(doctor_id, patient_id)
          )
        `);

        const result = await query(
            `SELECT DISTINCT ON (p.patient_id) p.*,
                    p.blood_type AS blood_group,
                    CASE
                        WHEN p.date_of_birth IS NOT NULL
                        THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth))::int
                        ELSE NULL
                    END AS age,
                    last_seen.last_visit,
                    next_upcoming.next_visit
             FROM patients p
             JOIN appointments a ON p.patient_id = a.patient_id
             JOIN doctors d ON a.doctor_id = d.doctor_id
             LEFT JOIN (
                SELECT patient_id, doctor_id, MAX(appointment_date) AS last_visit
                FROM appointments
                WHERE appointment_date <= CURRENT_DATE
                GROUP BY patient_id, doctor_id
             ) last_seen ON last_seen.patient_id = p.patient_id AND last_seen.doctor_id = d.doctor_id
             LEFT JOIN (
                SELECT patient_id, doctor_id, MIN(appointment_date) AS next_visit
                FROM appointments
                WHERE appointment_date > CURRENT_DATE
                GROUP BY patient_id, doctor_id
             ) next_upcoming ON next_upcoming.patient_id = p.patient_id AND next_upcoming.doctor_id = d.doctor_id
             WHERE d.user_id = $1
                OR p.patient_id IN (
                   SELECT l.patient_id
                   FROM doctor_patient_links l
                   JOIN doctors d2 ON d2.doctor_id = l.doctor_id
                   WHERE d2.user_id = $1
                )
             ORDER BY p.patient_id, a.appointment_date DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new patient (from doctor dashboard)
app.post('/api/doctor/patient/add', authenticate, authorize('doctor'), async (req, res) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const { full_name, email, phone, dob, date_of_birth, gender,
                blood_group, blood_type, address, emergency_name, emergency_phone, password } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

        const dobVal       = dob || date_of_birth || null;
        const bloodVal     = blood_group || blood_type || null;

        const rawPassword  = (password || '').trim();
        if (!rawPassword || rawPassword.length < 8) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Patient password must be at least 8 characters' });
        }
        const usernameBase = (normalizedEmail || `patient_${Date.now()}`).split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        let username = usernameBase || `patient_${Date.now()}`;
        const usernameExists = await client.query('SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [username]);
        if (usernameExists.rows.length > 0) {
            username = `${usernameBase}_${Date.now()}`;
        }
        const hashedPassword = await bcrypt.hash(rawPassword, await bcrypt.genSalt(10));
        const userResult   = await client.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id',
            [username, normalizedEmail || `${username}@bondhealth.com`, hashedPassword, 'patient']
        );
        const userId = userResult.rows[0].user_id;

        const date       = new Date();
        const patient_uuid = `PT-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;

        const patientResult = await client.query(
            `INSERT INTO patients (user_id, patient_uuid, full_name, email, phone, address,
                                   date_of_birth, gender, blood_type, emergency_contact_name, emergency_contact_phone)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
            [userId, patient_uuid, full_name, normalizedEmail || `${username}@bondhealth.com`, phone, address,
             dobVal, gender, bloodVal, emergency_name || null, emergency_phone || null]
        );
        await client.query(`
          CREATE TABLE IF NOT EXISTS doctor_patient_links (
            link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            doctor_id UUID NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
            patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(doctor_id, patient_id)
          )
        `);
        const doctorResult = await client.query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (doctorResult.rows[0]?.doctor_id) {
            await client.query(
              `INSERT INTO doctor_patient_links (doctor_id, patient_id)
               VALUES ($1, $2)
               ON CONFLICT (doctor_id, patient_id) DO NOTHING`,
              [doctorResult.rows[0].doctor_id, patientResult.rows[0].patient_id]
            );
        }
        await client.query('COMMIT');
        res.json({ success: true, data: patientResult.rows[0], credentials: { email: normalizedEmail || `${username}@bondhealth.com`, username } });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// Get single patient profile (for doctor)
app.get('/api/doctor/patient/:patientId', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT p.*,
                    p.blood_type AS blood_group,
                    CASE
                        WHEN p.date_of_birth IS NOT NULL
                        THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth))::int
                        ELSE NULL
                    END AS age
             FROM patients p
             WHERE p.patient_id = $1`,
            [req.params.patientId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single report details
app.get('/api/doctor/report/:reportId', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const result = await query(
            `SELECT r.*, p.full_name as patient_name
             FROM lab_reports r JOIN patients p ON r.patient_id = p.patient_id
             WHERE r.report_id = $1`,
            [req.params.reportId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
        const report = result.rows[0];
        let file_view_url = null;
        if (report.file_url) {
            const normalizedUrl = String(report.file_url).replace(/\\/g, '/');
            const fileName = normalizedUrl.split('/').pop();
            const candidates = [
                fileName ? path.join(UPLOADS_ROOT, 'reports', fileName) : null,
                fileName ? path.join(__dirname, 'uploads', 'reports', fileName) : null,
                fileName ? path.join(UPLOADS_ROOT, fileName) : null,
                fileName ? path.join(__dirname, 'uploads', fileName) : null,
                path.join(process.cwd(), normalizedUrl.replace(/^\//, '')),
                path.join(__dirname, normalizedUrl.replace(/^\//, '')),
                path.join(UPLOADS_ROOT, normalizedUrl.replace(/^\/?uploads\//, ''))
            ].filter(Boolean);
            const existing = candidates.find(p => fs.existsSync(p));
            if (existing) {
                const parent = path.basename(path.dirname(existing)).toLowerCase();
                if (parent === 'reports') file_view_url = '/uploads/reports/' + path.basename(existing);
                else file_view_url = '/uploads/' + path.basename(existing);
            }
        }
        res.json({ ...report, file_view_url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Download report PDF (by report_id UUID — used by doctor dashboard)
// FIX: doctor-apis.js had wrong path construction; corrected here
app.get('/api/doctor/report/:reportId/download', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const result = await query(
            'SELECT file_url, test_type, report_uuid, findings, patient_id FROM lab_reports WHERE report_id = $1',
            [req.params.reportId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
        const report = result.rows[0];

        // If a file was uploaded, serve it directly
        if (report.file_url) {
            const normalizedUrl = String(report.file_url).replace(/\\/g, '/');
            const fileName = normalizedUrl.split('/').pop();
            const tryPaths = [
                fileName ? path.join(UPLOADS_ROOT, 'reports', fileName) : null,
                fileName ? path.join(__dirname, 'uploads', 'reports', fileName) : null,
                path.join(process.cwd(), normalizedUrl.replace(/^\//, '')),
                path.join(__dirname, normalizedUrl.replace(/^\//, '')),
                path.join(UPLOADS_ROOT, normalizedUrl.replace(/^\/?uploads\//, ''))
            ].filter(Boolean);
            const filePath = tryPaths.find(p => fs.existsSync(p));
            if (filePath) {
                const ext = path.extname(filePath) || '.pdf';
                const safeName = `${(report.test_type || 'report').replace(/[^a-zA-Z0-9_-]/g, '_')}_${report.report_uuid || req.params.reportId}${ext}`;
                return res.download(filePath, safeName);
            }
            return res.status(404).json({ error: 'Report file not found on server' });
        }

        // No file — generate a simple PDF-like HTML response the browser can print/save
        const patientRes = await query('SELECT full_name FROM patients WHERE patient_id = $1', [report.patient_id]);
        const patientName = patientRes.rows[0]?.full_name || 'Patient';
        const html = `<!DOCTYPE html><html><head><title>Report</title>
        <style>body{font-family:sans-serif;padding:40px;max-width:700px;margin:0 auto}
        h1{color:#0099cc}table{width:100%;border-collapse:collapse;margin:20px 0}
        td{padding:10px;border-bottom:1px solid #eee}td:first-child{font-weight:bold;color:#555;width:160px}
        .findings{background:#f0f9ff;padding:15px;border-radius:8px;margin-top:20px}
        @media print{button{display:none}}</style></head><body>
        <h1>🏥 Bond Health — Lab Report</h1>
        <table>
          <tr><td>Patient</td><td>${patientName}</td></tr>
          <tr><td>Test Type</td><td>${report.test_type || 'N/A'}</td></tr>
          <tr><td>Report ID</td><td>${report.report_uuid || req.params.reportId}</td></tr>
        </table>
        ${report.findings ? `<div class="findings"><strong>Findings:</strong><p>${report.findings}</p></div>` : '<p><em>No findings recorded.</em></p>'}
        <br><button onclick="window.print()">🖨 Print / Save as PDF</button>
        </body></html>`;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add/update findings on a report
app.post('/api/doctor/report/:reportId/findings', authenticate, authorize('doctor'), async (req, res) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            'UPDATE lab_reports SET findings = $1, status = $2 WHERE report_id = $3 RETURNING *',
            [req.body.findings, 'verified', req.params.reportId]
        );
        await client.query('COMMIT');
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Share report
app.post('/api/doctor/report/:reportId/share', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const { scope } = req.body;
        // Keep storage values compatible with existing queries and visibility logic.
        // hospital/outside => doctors; all => both doctors and patients.
        const sharedWith = scope === 'all' ? 'both' : 'doctor';
        const result = await query(
            'UPDATE lab_reports SET shared_with = $1 WHERE report_id = $2 RETURNING *',
            [sharedWith, req.params.reportId]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Report not found' });
        res.json({ success: true, message: 'Report shared successfully', data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload document (doctor) — multer handles the file field named 'file'
app.post('/api/doctor/report/upload', authenticate, authorize('doctor'), upload.single('file'), async (req, res) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        // Doctor.js sends snake_case via FormData
        const patient_id = req.body.patient_id;
        const test_type  = req.body.test_type;
        const test_date  = req.body.test_date;
        const findings   = req.body.findings;

        if (!patient_id) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'patient_id is required' });
        }

        const doctorRes = await client.query(
            'SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]
        );
        if (!doctorRes.rows[0]) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Build file URL if a file was uploaded
        let file_url = null;
        if (req.file) {
            // Move from temp to reports folder
            const reportsDir = path.join(__dirname, 'uploads', 'reports');
            if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
            const destPath = path.join(reportsDir, req.file.filename);

            fs.renameSync(req.file.path, destPath);
            file_url = `/uploads/reports/${req.file.filename}`;
        }

        const inserted = await client.query(
            `INSERT INTO lab_reports (patient_id, doctor_id, test_type, test_date, findings, file_url, status, shared_with)
             VALUES ($1, $2, $3, $4::date, $5, $6, 'pending', 'doctor') RETURNING *`,
            [patient_id, doctorRes.rows[0].doctor_id, test_type, test_date, findings, file_url]
        );
        await client.query('COMMIT');
        res.json({ success: true, data: inserted.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Create prescription
app.post('/api/doctor/prescription/create', authenticate, authorize('doctor'), async (req, res) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const patientId = req.body.patientId || req.body.patient_id;
        const { diagnosis, medications, notes } = req.body;
        if (!patientId) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'patientId is required' });
        }
        if (!Array.isArray(medications) || medications.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'At least one medication is required' });
        }
        const doctorRes = await client.query(
            'SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]
        );
        if (!doctorRes.rows[0]) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Doctor not found' });
        }
        const doctorId = doctorRes.rows[0].doctor_id;
        const patientExists = await client.query('SELECT 1 FROM patients WHERE patient_id = $1 LIMIT 1', [patientId]);
        if (!patientExists.rows[0]) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Patient not found' });
        }
        const presc = [];
        for (const med of medications) {
            if (!med?.name) continue;
            const row = await client.query(
                'INSERT INTO prescriptions (patient_id, doctor_id, medicine_name, dosage, frequency, instructions, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [patientId, doctorId, med.name, med.dosage, med.frequency, notes, 'active']
            );
            presc.push(row.rows[0]);
        }
        if (presc.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No valid medications were provided' });
        }
        await client.query('COMMIT');
        res.json({ success: true, message: 'Prescriptions created', data: presc });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

async function ensureMedicineOrdersTable() {
    await query(`
      CREATE TABLE IF NOT EXISTS medicine_orders (
        order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(patient_id),
        prescription_id UUID REFERENCES prescriptions(prescription_id),
        medicine_id UUID REFERENCES medicines(medicine_id),
        quantity INTEGER NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'processing',
        delivery_address TEXT,
        payment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await query('ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)');
}

app.post('/api/patient/medicine-orders', authenticate, authorize('patient'), async (req, res) => {
    const client = await getClient();
    try {
        await ensureMedicineOrdersTable();
        await client.query('BEGIN');
        const patientResult = await client.query('SELECT patient_id FROM patients WHERE user_id = $1 LIMIT 1', [req.user.id]);
        const patientId = patientResult.rows[0]?.patient_id;
        if (!patientId) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }

        const prescriptionId = req.body.prescription_id || req.body.prescriptionId;
        const quantity = Number(req.body.quantity);
        const deliveryAddress = String(req.body.delivery_address || req.body.address || '').trim();
        const paymentMethod = String(req.body.payment_method || req.body.payment || '').trim();

        if (!prescriptionId || !quantity || quantity < 1 || !deliveryAddress || !paymentMethod) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Prescription, quantity, address, and payment method are required' });
        }

        const prescriptionResult = await client.query(
            `SELECT prescription_id FROM prescriptions
             WHERE prescription_id = $1 AND patient_id = $2 AND status = 'active' LIMIT 1`,
            [prescriptionId, patientId]
        );
        if (!prescriptionResult.rows[0]) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Prescription not found for this patient' });
        }

        const orderResult = await client.query(
            `INSERT INTO medicine_orders
             (patient_id, prescription_id, quantity, delivery_address, payment_method, payment_status, status)
             VALUES ($1, $2, $3, $4, $5, 'pending', 'processing')
             RETURNING *`,
            [patientId, prescriptionId, quantity, deliveryAddress, paymentMethod]
        );

        await client.query('COMMIT');
        res.json({ success: true, message: 'Medicine order placed successfully', order: orderResult.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message || 'Failed to place medicine order' });
    } finally {
        client.release();
    }
});

app.get('/api/patient/medicine-orders', authenticate, authorize('patient'), async (req, res) => {
    try {
        await ensureMedicineOrdersTable();
        const patientResult = await query('SELECT patient_id FROM patients WHERE user_id = $1 LIMIT 1', [req.user.id]);
        const patientId = patientResult.rows[0]?.patient_id;
        if (!patientId) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }

        const ordersResult = await query(
            `SELECT mo.order_id, mo.quantity, mo.status, mo.payment_status, mo.payment_method,
                    mo.delivery_address, mo.order_date, mo.created_at,
                    p.prescription_id, p.medicine_name, p.dosage, p.frequency
             FROM medicine_orders mo
             LEFT JOIN prescriptions p ON p.prescription_id = mo.prescription_id
             WHERE mo.patient_id = $1
             ORDER BY mo.created_at DESC`,
            [patientId]
        );

        res.json({ success: true, orders: ordersResult.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch medicine orders' });
    }
});

let ensureChatTablesPromise = null;
async function ensureChatMessagesTable() {
    if (!ensureChatTablesPromise) {
        ensureChatTablesPromise = (async () => {
            await query(`
              CREATE TABLE IF NOT EXISTS chat_messages (
                id BIGSERIAL PRIMARY KEY,
                room_id TEXT NOT NULL,
                sender_id UUID NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);

            await query(`
              CREATE TABLE IF NOT EXISTS chat_read_state (
                user_id UUID NOT NULL,
                room_id TEXT NOT NULL,
                last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, room_id)
              )
            `);
        })().catch(err => {
            ensureChatTablesPromise = null;
            throw err;
        });
    }
    return ensureChatTablesPromise;
}

app.get('/api/doctor/chat/unread', authenticate, authorize('doctor'), async (req, res) => {
    try {
        await ensureChatMessagesTable();
        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });

        const doctorId = doctorRes.rows[0].doctor_id;
        const result = await query(
            `SELECT
                CASE
                  WHEN split_part(m.room_id, '_', 1) = $1::text THEN split_part(m.room_id, '_', 2)
                  ELSE split_part(m.room_id, '_', 1)
                END AS patient_id,
                COUNT(*)::int AS unread_count
             FROM chat_messages m
             JOIN users su ON su.user_id = m.sender_id
             LEFT JOIN chat_read_state rs ON rs.user_id = $2 AND rs.room_id = m.room_id
             WHERE (split_part(m.room_id, '_', 1) = $1::text OR split_part(m.room_id, '_', 2) = $1::text)
               AND su.role = 'patient'
               AND (rs.last_read_at IS NULL OR m.created_at > rs.last_read_at)
             GROUP BY 1`,
            [doctorId, req.user.id]
        );

        const unreadByPatient = {};
        result.rows.forEach(row => {
            unreadByPatient[row.patient_id] = row.unread_count;
        });
        res.json({ success: true, unreadByPatient });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chat history (doctor view)
app.get('/api/doctor/chat/:patientId/history', authenticate, authorize('doctor'), async (req, res) => {
    try {
        await ensureChatMessagesTable();
        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });

        const doctorId = doctorRes.rows[0].doctor_id;
        const { patientId } = req.params;
        const roomId = [doctorId, patientId].sort().join('_');

        const result = await query(
            `SELECT m.sender_id, m.message, m.created_at, u.role AS sender_role
             FROM chat_messages m
             JOIN users u ON u.user_id = m.sender_id
             WHERE m.room_id = $1
             ORDER BY m.created_at ASC
             LIMIT 200`,
            [roomId]
        );

        await query(
            `INSERT INTO chat_read_state (user_id, room_id, last_read_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id, room_id)
             DO UPDATE SET last_read_at = EXCLUDED.last_read_at`,
            [req.user.id, roomId]
        );

        res.json(result.rows.map(row => ({
            sender: row.sender_role === 'doctor' ? 'doctor' : 'patient',
            message: row.message,
            created_at: row.created_at
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send chat message (doctor -> patient)
app.post('/api/doctor/chat/:patientId', authenticate, authorize('doctor'), async (req, res) => {
    try {
        await ensureChatMessagesTable();
        const { message } = req.body;
        if (!message || !String(message).trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });

        const doctorId = doctorRes.rows[0].doctor_id;
        const { patientId } = req.params;
        const roomId = [doctorId, patientId].sort().join('_');

        await query(
            `INSERT INTO chat_messages (room_id, sender_id, message, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [roomId, req.user.id, String(message).trim()]
        );

        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/doctor/chat/:patientId/read', authenticate, authorize('doctor'), async (req, res) => {
    try {
        await ensureChatMessagesTable();
        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });

        const doctorId = doctorRes.rows[0].doctor_id;
        const roomId = [doctorId, req.params.patientId].sort().join('_');
        await query(
            `INSERT INTO chat_read_state (user_id, room_id, last_read_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id, room_id)
             DO UPDATE SET last_read_at = EXCLUDED.last_read_at`,
            [req.user.id, roomId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add appointment slot
app.post('/api/doctor/slot/add', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const { date, time, type } = req.body;
        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });
        // Placeholder — create an open slot record in your slots/schedule table
        res.json({ success: true, message: 'Slot added', data: { doctor_id: doctorRes.rows[0].doctor_id, date, time, type } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dashboard stats (auto-refreshed every 60s)
app.get('/api/doctor/stats', authenticate, authorize('doctor'), async (req, res) => {
    try {
        await query(`
          CREATE TABLE IF NOT EXISTS doctor_patient_links (
            link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            doctor_id UUID NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
            patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(doctor_id, patient_id)
          )
        `);
        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });
        const doctorId = doctorRes.rows[0].doctor_id;

        const result = await query(
            `SELECT
                (SELECT COUNT(*) FROM appointments WHERE doctor_id = $1 AND appointment_date = CURRENT_DATE) AS appointments,
                (SELECT COUNT(*) FROM lab_reports     WHERE doctor_id = $1 AND status = 'pending')           AS pending_reports,
                (SELECT COUNT(*) FROM lab_reports     WHERE doctor_id = $1)                                   AS reports,
                (SELECT COUNT(*) FROM (
                    SELECT DISTINCT patient_id FROM appointments WHERE doctor_id = $1
                    UNION
                    SELECT DISTINCT patient_id FROM doctor_patient_links WHERE doctor_id = $1
                 ) px)                                                                                         AS patients`,
            [doctorId]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete (archive) a lab report
app.delete('/api/doctor/report/:reportId', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const { reportId } = req.params;
        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });
        const doctorId = doctorRes.rows[0].doctor_id;
        // Verify ownership before deleting
        const check = await query(
            'SELECT report_id FROM lab_reports WHERE report_id = $1 AND doctor_id = $2',
            [reportId, doctorId]
        );
        if (!check.rows[0]) return res.status(404).json({ error: 'Report not found or access denied' });
        // Soft-delete: set status to 'archived'
        await query(`UPDATE lab_reports SET status = 'archived' WHERE report_id = $1`, [reportId]);
        res.json({ success: true, message: 'Report archived' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Apply for leave (doctor submits request, admin approves)
app.post('/api/doctor/leave/apply', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const { from, to, reason, type } = req.body;
        if (!from || !to || !reason) return res.status(400).json({ error: 'from, to, and reason are required' });
        if (to < from) return res.status(400).json({ error: 'End date cannot be before start date' });
        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });
        const doctorId = doctorRes.rows[0].doctor_id;
        // Check for overlapping pending/approved leave
        const overlap = await query(
            `SELECT leave_id FROM doctor_leave
             WHERE doctor_id = $1 AND status IN ('Pending','Approved')
               AND from_date <= $3 AND to_date >= $2`,
            [doctorId, from, to]
        );
        if (overlap.rows.length) return res.status(409).json({ error: 'You already have a leave request covering these dates' });
        const result = await query(
            `INSERT INTO doctor_leave (doctor_id, from_date, to_date, reason, status, created_at)
             VALUES ($1, $2, $3, $4, 'Pending', NOW()) RETURNING *`,
            [doctorId, from, to, reason]
        );
        res.json({ success: true, leave: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get doctor's own leave history
app.get('/api/doctor/leave', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });
        const doctorId = doctorRes.rows[0].doctor_id;
        const result = await query(
            `SELECT * FROM doctor_leave WHERE doctor_id = $1 ORDER BY created_at DESC LIMIT 30`,
            [doctorId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel a pending leave request (doctor self-cancels)
app.delete('/api/doctor/leave/:leaveId', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const { leaveId } = req.params;
        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });
        const doctorId = doctorRes.rows[0].doctor_id;
        const check = await query(
            `SELECT leave_id FROM doctor_leave WHERE leave_id = $1 AND doctor_id = $2 AND status = 'Pending'`,
            [leaveId, doctorId]
        );
        if (!check.rows[0]) return res.status(404).json({ error: 'Leave not found or cannot be cancelled (already approved/rejected)' });
        await query(`DELETE FROM doctor_leave WHERE leave_id = $1`, [leaveId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload / update profile photo
app.post('/api/doctor/profile/photo', authenticate, authorize('doctor'), upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });
        const doctorId = doctorRes.rows[0].doctor_id;

        // Ensure photos directory exists and move file there (multer may save to temp)
        const photosDir = path.join(UPLOADS_ROOT, 'photos');
        if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
        const destPath = path.join(photosDir, req.file.filename);
        if (req.file.path !== destPath) fs.renameSync(req.file.path, destPath);

        const photo_url = '/uploads/photos/' + req.file.filename;
        await query('UPDATE doctors SET photo_url = $1 WHERE doctor_id = $2', [photo_url, doctorId]);
        res.json({ success: true, photo_url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete profile photo
app.delete('/api/doctor/profile/photo', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const doctorRes = await query('SELECT doctor_id, photo_url FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });
        const { doctor_id, photo_url } = doctorRes.rows[0];
        // Delete file from disk if it exists
        if (photo_url) {
            const fileName = photo_url.split('/').pop();
            const possiblePaths = [
                path.join(UPLOADS_ROOT, 'photos', fileName),
                path.join(__dirname, 'uploads', 'photos', fileName)
            ];
            const filePath = possiblePaths.find(p => fs.existsSync(p));
            if (filePath) fs.unlinkSync(filePath);
        }
        await query('UPDATE doctors SET photo_url = NULL WHERE doctor_id = $1', [doctor_id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Initiate video call — notify patient (stub: store room URL, send notification)
app.post('/api/doctor/video/initiate', authenticate, authorize('doctor'), async (req, res) => {
    try {
        await ensureChatMessagesTable();
        const { patient_id } = req.body;
        if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });
        const doctorId = doctorRes.rows[0].doctor_id;

        const patientRes = await query('SELECT patient_id, full_name FROM patients WHERE patient_id = $1', [patient_id]);
        if (!patientRes.rows[0]) return res.status(404).json({ error: 'Patient not found' });

        const roomUrl = `/chat-room?doctorId=${encodeURIComponent(doctorId)}&patientId=${encodeURIComponent(patient_id)}`;
        const roomId = [doctorId, patient_id].sort().join('_');
        const notice = `Doctor started an online consultation. Join here: ${roomUrl}`;
        await query(
            `INSERT INTO chat_messages (room_id, sender_id, message, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [roomId, req.user.id, notice]
        );

        console.log(`Video call initiated for patient ${patient_id}: ${roomUrl}`);
        res.json({ success: true, room_url: roomUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Schedule video call — send link to patient later
app.post('/api/doctor/video/schedule', authenticate, authorize('doctor'), async (req, res) => {
    try {
        await ensureChatMessagesTable();
        const { patient_id, scheduled_time } = req.body;
        if (!patient_id || !scheduled_time) {
            return res.status(400).json({ error: 'patient_id and scheduled_time are required' });
        }

        const doctorRes = await query('SELECT doctor_id FROM doctors WHERE user_id = $1', [req.user.id]);
        if (!doctorRes.rows[0]) return res.status(404).json({ error: 'Doctor not found' });
        const doctorId = doctorRes.rows[0].doctor_id;

        const roomUrl = `/chat-room?doctorId=${encodeURIComponent(doctorId)}&patientId=${encodeURIComponent(patient_id)}`;
        const roomId = [doctorId, patient_id].sort().join('_');
        const scheduleLabel = new Date(scheduled_time).toLocaleString();
        const notice = `Online consultation scheduled for ${scheduleLabel}. Join room: ${roomUrl}`;
        await query(
            `INSERT INTO chat_messages (room_id, sender_id, message, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [roomId, req.user.id, notice]
        );

        console.log(`Video call scheduled for patient ${patient_id}`);
        res.json({ success: true, room_url: roomUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// HOSPITAL MANAGEMENT API ROUTES
// ============================================

app.get('/api/hospital/data', authenticate, async (req, res) => {
  try {
    const adminResult = await query(
      'SELECT hospital_id FROM hospital_admins WHERE user_id = $1',
      [req.user.id]
    );
    
    const hospitalId = adminResult.rows[0]?.hospital_id;
    
    if (!hospitalId) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    const hospitalResult = await query('SELECT * FROM hospitals WHERE hospital_id = $1', [hospitalId]);
    const doctorsResult = await query('SELECT * FROM doctors WHERE hospital_id = $1', [hospitalId]);
    const medicinesResult = await query('SELECT * FROM medicines WHERE hospital_id = $1', [hospitalId]);
    const labsResult = await query('SELECT * FROM lab_technicians WHERE hospital_id = $1', [hospitalId]);
    
    const hospital = hospitalResult.rows[0];
    let logoUrl = null;
    let mainPhotoUrl = null;
    
    // ✅ Generate logo URL if file exists
    if (hospital?.logo_filename) {
      logoUrl = `/uploads/hospitals/logos/${hospital.logo_filename}`;
    }
    if (hospital?.main_photo_filename) {
      mainPhotoUrl = `/uploads/hospitals/photos/${hospital.main_photo_filename}`;
    }
    
    res.json({
      hospitalName: hospital?.name || 'City General Hospital',
      hospitalId: hospital?.hospital_uuid || 'HOS-12345',
      logoUrl: logoUrl,
      mainPhotoUrl: mainPhotoUrl,
      doctors: doctorsResult.rows,
      medicines: medicinesResult.rows,
      labs: labsResult.rows,
      specialities: [...new Set(doctorsResult.rows.map(d => d.specialization).filter(Boolean))]
    });
  } catch (error) {
    console.error('Error fetching hospital data:', error);
    res.status(500).json({ error: error.message });
  }
});
// Serve uploaded reports
app.get('/uploads/reports/:file', (req, res) => {
    const candidates = [
      path.join(UPLOADS_ROOT, 'reports', req.params.file),
      path.join(__dirname, 'uploads', 'reports', req.params.file),
      path.join(UPLOADS_ROOT, 'temp', req.params.file),
      path.join(__dirname, 'uploads', 'temp', req.params.file)
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (filePath) res.sendFile(filePath);
    else res.status(404).json({ error: 'File not found' });
});

// Legacy direct file URLs like /uploads/placeholder.pdf
app.get('/uploads/:file', (req, res) => {
    const candidates = [
      path.join(UPLOADS_ROOT, req.params.file),
      path.join(__dirname, 'uploads', req.params.file),
      path.join(UPLOADS_ROOT, 'reports', req.params.file),
      path.join(__dirname, 'uploads', 'reports', req.params.file)
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (filePath) res.sendFile(filePath);
    else res.status(404).json({ error: 'File not found' });
});

// Serve doctor profile photos
app.get('/uploads/photos/:file', (req, res) => {
    const candidates = [
      path.join(UPLOADS_ROOT, 'photos', req.params.file),
      path.join(__dirname, 'uploads', 'photos', req.params.file)
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (filePath) res.sendFile(filePath);
    else res.status(404).json({ error: 'Photo not found' });
});

// Serve hospital logos
app.get('/uploads/hospitals/logos/:filename', (req, res) => {
    const candidates = [
      path.join(UPLOADS_ROOT, 'hospitals', 'logos', req.params.filename),
      path.join(__dirname, 'uploads', 'hospitals', 'logos', req.params.filename)
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (filePath) res.sendFile(filePath);
    else res.status(404).json({ error: 'Logo not found' });
});

app.get('/uploads/hospitals/photos/:filename', (req, res) => {
    const candidates = [
      path.join(UPLOADS_ROOT, 'hospitals', 'photos', req.params.filename),
      path.join(__dirname, 'uploads', 'hospitals', 'photos', req.params.filename)
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (filePath) res.sendFile(filePath);
    else res.status(404).json({ error: 'Hospital photo not found' });
});

app.get('/uploads/admins/photos/:filename', (req, res) => {
    const candidates = [
      path.join(UPLOADS_ROOT, 'admins', 'photos', req.params.filename),
      path.join(__dirname, 'uploads', 'admins', 'photos', req.params.filename)
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (filePath) res.sendFile(filePath);
    else res.status(404).json({ error: 'Admin photo not found' });
});



// ============================================
// LEAVE MANAGEMENT ROUTES
// ============================================

app.post('/api/doctors/:doctorId/leave', authenticate, authorize('admin'), async (req, res) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const { doctorId } = req.params;
        const { from, to, reason } = req.body;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(doctorId)) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, message: 'Invalid doctor ID format' }); }

        const adminResult = await client.query('SELECT hospital_id FROM hospital_admins WHERE user_id = $1', [req.user.id]);
        const hospitalId = adminResult.rows[0]?.hospital_id;
        if (!hospitalId) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Hospital not found' }); }

        const doctorCheck = await client.query('SELECT * FROM doctors WHERE doctor_id = $1::uuid AND hospital_id = $2::uuid', [doctorId, hospitalId]);
        if (doctorCheck.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Doctor not found in your hospital' }); }

        const leaveResult = await client.query(
            "INSERT INTO doctor_leave (doctor_id, from_date, to_date, reason, status) VALUES ($1::uuid,$2::date,$3::date,$4,'Approved') RETURNING *",
            [doctorId, from, to, reason]
        );
        await client.query("UPDATE doctors SET status = 'On Leave' WHERE doctor_id = $1::uuid", [doctorId]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'Leave updated successfully', data: leaveResult.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
});

app.get('/api/doctors/:doctorId/leave', authenticate, authorize('admin', 'doctor'), async (req, res) => {
    try {
        const { doctorId } = req.params;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(doctorId)) return res.status(400).json({ success: false, message: 'Invalid doctor ID format' });

        if (req.user.role === 'doctor') {
            const doctorCheck = await query('SELECT doctor_id FROM doctors WHERE user_id = $1::uuid', [req.user.id]);
            if (doctorCheck.rows.length === 0 || doctorCheck.rows[0].doctor_id !== doctorId) {
                return res.status(403).json({ success: false, message: 'You can only view your own leave records' });
            }
        }
        const result = await query('SELECT * FROM doctor_leave WHERE doctor_id = $1::uuid ORDER BY created_at DESC', [doctorId]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/doctors/on-leave', authenticate, authorize('admin'), async (req, res) => {
    try {
        const adminResult = await query('SELECT hospital_id FROM hospital_admins WHERE user_id = $1', [req.user.id]);
        const hospitalId = adminResult.rows[0]?.hospital_id;
        if (!hospitalId) return res.status(404).json({ success: false, message: 'Hospital not found' });

        const result = await query(
            `SELECT d.*, dl.from_date, dl.to_date, dl.reason, dl.leave_id
             FROM doctors d JOIN doctor_leave dl ON d.doctor_id = dl.doctor_id
             WHERE d.hospital_id = $1::uuid AND d.status = 'On Leave' AND dl.status = 'Approved'
             AND dl.from_date <= CURRENT_DATE AND dl.to_date >= CURRENT_DATE ORDER BY d.full_name`,
            [hospitalId]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/doctors/:doctorId/leave', authenticate, authorize('admin'), async (req, res) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const { doctorId } = req.params;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(doctorId)) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, message: 'Invalid doctor ID format' }); }

        const adminResult = await client.query('SELECT hospital_id FROM hospital_admins WHERE user_id = $1', [req.user.id]);
        const hospitalId = adminResult.rows[0]?.hospital_id;
        if (!hospitalId) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Hospital not found' }); }

        const doctorUpdate = await client.query(
            "UPDATE doctors SET status = 'Available' WHERE doctor_id = $1::uuid AND hospital_id = $2::uuid RETURNING *",
            [doctorId, hospitalId]
        );
        if (doctorUpdate.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Doctor not found' }); }

        // FIX: PostgreSQL does not support ORDER BY/LIMIT in UPDATE — use subquery
        await client.query(
            `UPDATE doctor_leave SET status = 'Completed'
             WHERE leave_id = (
               SELECT leave_id FROM doctor_leave
               WHERE doctor_id = $1::uuid AND status = 'Approved' AND to_date >= CURRENT_DATE
               ORDER BY created_at DESC LIMIT 1
             )`,
            [doctorId]
        );
        await client.query('COMMIT');
        res.json({ success: true, message: 'Leave removed, doctor is now available', data: doctorUpdate.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
});

app.delete('/api/doctors/:doctorId', authenticate, authorize('admin'), async (req, res) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const { doctorId } = req.params;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(doctorId)) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, message: 'Invalid doctor ID format' }); }

        const adminResult = await client.query('SELECT hospital_id FROM hospital_admins WHERE user_id = $1', [req.user.id]);
        const hospitalId = adminResult.rows[0]?.hospital_id;
        if (!hospitalId) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Hospital not found' }); }

        const doctorCheck = await client.query('SELECT user_id FROM doctors WHERE doctor_id = $1::uuid AND hospital_id = $2::uuid', [doctorId, hospitalId]);
        if (doctorCheck.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Doctor not found in your hospital' }); }

        await client.query("UPDATE appointments SET status = 'cancelled' WHERE doctor_id = $1::uuid AND appointment_date >= CURRENT_DATE", [doctorId]);
        await client.query("UPDATE doctors SET status = 'Inactive' WHERE doctor_id = $1::uuid", [doctorId]);
        await client.query("UPDATE users SET is_active = false WHERE user_id = $1::uuid", [doctorCheck.rows[0].user_id]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'Doctor removed successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
});

// ============================================
// REVIEWS API ROUTES
// ============================================

app.get('/api/reviews', async (req, res) => {
    try {
        const { sort = 'recent', rating, search, hospital, doctor, page = 1, limit = 10 } = req.query;
        let whereClause = 'WHERE is_approved = true';
        const params = [];
        let paramIndex = 1;

        if (rating) {
            if (rating === 'positive') whereClause += ` AND rating >= 4`;
            else if (rating === 'negative') whereClause += ` AND rating <= 2`;
            else if (rating === 'neutral') whereClause += ` AND rating = 3`;
            else if (!isNaN(parseInt(rating))) { whereClause += ` AND rating = $${paramIndex}`; params.push(parseInt(rating)); paramIndex++; }
        }
        if (search) { whereClause += ` AND (content ILIKE $${paramIndex} OR title ILIKE $${paramIndex} OR reviewer_name ILIKE $${paramIndex})`; params.push(`%${search}%`); paramIndex++; }
        if (hospital) { whereClause += ` AND hospital_name ILIKE $${paramIndex}`; params.push(`%${hospital}%`); paramIndex++; }
        if (doctor) { whereClause += ` AND doctor_name ILIKE $${paramIndex}`; params.push(`%${doctor}%`); paramIndex++; }

        const orderByMap = { highest: 'rating DESC, created_at DESC', lowest: 'rating ASC, created_at DESC', helpful: 'helpful_count DESC, created_at DESC' };
        const orderBy = orderByMap[sort] || 'created_at DESC';

        const countResult = await query(`SELECT COUNT(*) FROM reviews ${whereClause}`, params);
        const totalCount = parseInt(countResult.rows[0].count);
        const offset = (page - 1) * limit;

        const result = await query(
            `SELECT review_id, reviewer_name, rating, title, content, hospital_name, doctor_name,
                    is_verified, helpful_count, created_at, updated_at,
                    CASE WHEN created_at >= CURRENT_DATE THEN 'Today'
                         WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 'Yesterday'
                         ELSE TO_CHAR(created_at, 'Mon DD, YYYY') END as formatted_date
             FROM reviews ${whereClause} ORDER BY ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex+1}`,
            [...params, limit, offset]
        );

        const statsResult = await query(
            `SELECT COUNT(*) as total_reviews, COALESCE(AVG(rating),0) as average_rating,
                    COUNT(CASE WHEN rating=5 THEN 1 END) as five_star, COUNT(CASE WHEN rating=4 THEN 1 END) as four_star,
                    COUNT(CASE WHEN rating=3 THEN 1 END) as three_star, COUNT(CASE WHEN rating=2 THEN 1 END) as two_star,
                    COUNT(CASE WHEN rating=1 THEN 1 END) as one_star
             FROM reviews WHERE is_approved = true`
        );

        res.json({
            success: true, reviews: result.rows, stats: statsResult.rows[0],
            pagination: { currentPage: parseInt(page), totalPages: Math.ceil(totalCount / limit), totalCount, limit: parseInt(limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/reviews', async (req, res) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const { rating, title, content, hospital_name, doctor_name, reviewer_name, reviewer_email } = req.body;
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        if (!content || content.trim().length < 10) return res.status(400).json({ success: false, message: 'Review content must be at least 10 characters' });

        // Check if the request has a valid auth token (optional — enriches the review if logged in)
        let userId = null, patientId = null, isVerified = false;
        let finalName = reviewer_name?.trim() || 'Anonymous';
        let finalEmail = reviewer_email?.trim() || null;

        const token = req.cookies?.token;
        if (token) {
            const decoded = verifyToken(token);
            if (decoded && activeSessions.has(decoded.id)) {
                userId = decoded.id;
                if (decoded.role === 'patient') {
                    const patientResult = await client.query(
                        'SELECT patient_id, full_name, email FROM patients WHERE user_id = $1', [userId]
                    );
                    if (patientResult.rows.length > 0) {
                        patientId   = patientResult.rows[0].patient_id;
                        finalName   = patientResult.rows[0].full_name || finalName;
                        finalEmail  = patientResult.rows[0].email || finalEmail;
                        isVerified  = true;
                    }
                }
            }
        }

        const result = await client.query(
            `INSERT INTO reviews (user_id, patient_id, reviewer_name, reviewer_email, rating, title, content, hospital_name, doctor_name, is_verified, is_approved, helpful_count)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,0) RETURNING *`,
            [userId, patientId, finalName, finalEmail, rating, title || null, content, hospital_name || null, doctor_name || null, isVerified]
        );
        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Review submitted successfully', review: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
});

app.post('/api/reviews/:id/helpful', async (req, res) => {
    try {
        const result = await query(
            'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE review_id = $1::uuid RETURNING helpful_count',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Review not found' });
        res.json({ success: true, helpful_count: result.rows[0].helpful_count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/reviews/filters', async (req, res) => {
    try {
        const [hospitalsResult, doctorsResult] = await Promise.all([
            query("SELECT DISTINCT hospital_name FROM reviews WHERE hospital_name IS NOT NULL AND is_approved = true ORDER BY hospital_name LIMIT 50"),
            query("SELECT DISTINCT doctor_name FROM reviews WHERE doctor_name IS NOT NULL AND is_approved = true ORDER BY doctor_name LIMIT 50")
        ]);
        res.json({ success: true, hospitals: hospitalsResult.rows.map(r => r.hospital_name), doctors: doctorsResult.rows.map(r => r.doctor_name) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// FEEDBACK
// ============================================
app.post('/api/feedback', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        await query('INSERT INTO feedback (name, email, message) VALUES ($1,$2,$3)', [name, email, message]);
        res.json({ success: true, message: 'Thank you for your feedback!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ------------ chat-room page route ---------------
// app.get('/chat-room', requireAuth('doctor', 'patient'), async (req, res) => {
//   Because requireAuth() only accepts a single role, use authenticate + manual check:
 
app.get('/chat-room', authenticate, async (req, res) => {
  try {
    const { doctorId, patientId } = req.query;
    if (!doctorId || !patientId) {
      return res.status(400).send('<h2>Missing doctorId or patientId</h2>');
    }
 
    const userId = req.user.id;
    const role   = req.user.role;
 
    // Only the doctor or patient for this room may enter
    if (role === 'doctor') {
      const check = await query(
        'SELECT doctor_id FROM doctors WHERE user_id = $1 AND doctor_id = $2',
        [userId, doctorId]
      );
      if (!check.rows.length) return res.status(403).send('<h2>Forbidden</h2>');
    } else if (role === 'patient') {
      const check = await query(
        'SELECT patient_id FROM patients WHERE user_id = $1 AND patient_id = $2',
        [userId, patientId]
      );
      if (!check.rows.length) return res.status(403).send('<h2>Forbidden</h2>');
    } else {
      return res.status(403).send('<h2>Forbidden</h2>');
    }
 
    const [docRes, patRes] = await Promise.all([
      query('SELECT full_name FROM doctors  WHERE doctor_id  = $1', [doctorId]),
      query('SELECT full_name FROM patients WHERE patient_id = $1', [patientId])
    ]);
 
    const doctorName      = docRes.rows[0]?.full_name || 'Doctor';
    const patientName     = patRes.rows[0]?.full_name || 'Patient';
    const currentUserName = role === 'doctor' ? doctorName : patientName;
 
    res.setHeader('Content-Type', 'text/html');
    res.send(generateChatRoomHTML({
      doctorId, patientId, doctorName, patientName,
      currentUserId:   userId,
      currentUserRole: role,
      currentUserName
    }));
 
  } catch (err) {
    console.error('[/chat-room]', err);
    res.status(500).send('<h2>Error</h2><p>' + err.message + '</p>');
  }
});

app.get('/api/chat/messages', authenticate, async (req, res) => {
  try {
    const { doctorId, patientId, limit = 50 } = req.query;
    if (!doctorId || !patientId) return res.status(400).json({ error: 'Missing params' });
    const roomId = [doctorId, patientId].sort().join('_');
    const result = await query(
      `SELECT m.*, u.username AS sender_name
         FROM chat_messages m
         JOIN users u ON m.sender_id = u.user_id
        WHERE m.room_id = $1
        ORDER BY m.created_at DESC LIMIT $2`,
      [roomId, parseInt(limit)]
    );
    res.json(result.rows.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================================
// MOCK SDK ROUTES
// ============================================
app.get('/_sdk/element_sdk.js', (req, res) => {
    res.send(`window.elementSdk = { init: function(c){ console.log('SDK init',c); return this; }, setConfig: function(c){ console.log('Config',c); } };`);
});
app.get('/_sdk/data_sdk.js', (req, res) => {
    res.send(`console.log('Data SDK loaded');`);
});

// ============================================
// PAGE ROUTES
// ============================================
const HOMEPAGE_CACHE_TTL_MS = Number(process.env.HOMEPAGE_CACHE_TTL_MS || 60000);
let homepageHtmlCache = { html: null, builtAt: 0 };

app.get('/', async (req, res) => {
    try {
        const now = Date.now();
        if (homepageHtmlCache.html && (now - homepageHtmlCache.builtAt) < HOMEPAGE_CACHE_TTL_MS) {
            return res.send(homepageHtmlCache.html);
        }

        const html = await generateHTML();
        homepageHtmlCache = { html, builtAt: now };
        res.send(html);
    } catch (error) {
        console.error('Homepage render error:', error);
        if (homepageHtmlCache.html) return res.send(homepageHtmlCache.html);
        res.status(500).send('<h1>500</h1><p>Failed to load homepage</p>');
    }
});

app.get('/signin', (req, res) => {
    try { res.setHeader('Content-Type','text/html'); res.send(require('./signin.js')()); }
    catch (err) { res.status(500).send('<h1>500</h1><p>signin.js not found</p><a href="/">Home</a>'); }
});

app.get('/patient-signup', (req, res) => {
    try { res.setHeader('Content-Type','text/html'); res.send(require('./signup_patient.js')()); }
    catch (err) { res.status(500).send('<h1>500</h1><p>signup_patient.js not found</p><a href="/">Home</a>'); }
});

app.get('/admin-signup', (req, res) => {
    try { res.setHeader('Content-Type','text/html'); res.send(require('./HospitalRegistration.js')()); }
    catch (err) { res.status(500).send('<h1>500</h1><p>HospitalRegistration.js not found</p><a href="/signin">Sign In</a>'); }
});

app.get('/help-center', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BondHealth Help Center</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body{font-family:Arial,sans-serif;}</style>
</head>
<body class="bg-slate-50 text-slate-800">
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="bg-white rounded-2xl shadow p-6 mb-6">
      <h1 class="text-2xl font-bold text-cyan-700 mb-2">BondHealth Help Center</h1>
      <p class="text-sm text-slate-600">Support for patients, doctors, and hospital teams.</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white rounded-2xl shadow p-6">
        <h2 class="text-lg font-semibold text-cyan-700 mb-3">Contact Details</h2>
        <p class="text-sm mb-2"><strong>Support Number:</strong> +91 80 4567 9000</p>
        <p class="text-sm mb-2"><strong>Email:</strong> help@bondhealth.com</p>
        <p class="text-sm"><strong>Hours:</strong> Mon-Sat, 9:00 AM - 8:00 PM IST</p>
      </div>
      <div class="bg-white rounded-2xl shadow p-6">
        <h2 class="text-lg font-semibold text-cyan-700 mb-3">About Website Makers</h2>
        <p class="text-sm mb-2">Built and maintained by the BondHealth product and engineering team.</p>
        <p class="text-sm">Our focus is secure healthcare communication, appointment coordination, and patient record access.</p>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow p-6">
      <h2 class="text-lg font-semibold text-cyan-700 mb-3">Chat with Support</h2>
      <p class="text-sm text-slate-600 mb-4">Leave a message and our support team will contact you.</p>
      <form id="supportForm" class="space-y-3">
        <input id="supportName" type="text" placeholder="Your name" class="w-full border border-slate-200 rounded-xl px-3 py-2" required />
        <input id="supportEmail" type="email" placeholder="Your email" class="w-full border border-slate-200 rounded-xl px-3 py-2" required />
        <textarea id="supportMessage" placeholder="Describe your issue..." rows="4" class="w-full border border-slate-200 rounded-xl px-3 py-2" required></textarea>
        <div class="flex gap-3">
          <button type="submit" class="bg-cyan-600 text-white px-4 py-2 rounded-xl">Send Message</button>
          <a href="/patient-dashboard" class="px-4 py-2 rounded-xl border border-slate-300">Back to Dashboard</a>
        </div>
      </form>
      <p id="supportStatus" class="text-sm mt-3 text-slate-600"></p>
    </div>
  </div>
  <script>
    document.getElementById('supportForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const status = document.getElementById('supportStatus');
      status.textContent = 'Sending message...';
      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: document.getElementById('supportName').value,
            email: document.getElementById('supportEmail').value,
            message: '[HELP CENTER] ' + document.getElementById('supportMessage').value
          })
        });
        const data = await res.json();
        status.textContent = data.message || 'Message sent successfully.';
        if (res.ok) document.getElementById('supportForm').reset();
      } catch (err) {
        status.textContent = 'Failed to send message. Please try again.';
      }
    });
  </script>
</body>
</html>`);
});

app.get('/patient-dashboard', requireAuth('patient'), async (req, res) => {
    try { res.setHeader('Content-Type','text/html'); res.send(await require('./Patient.js')(req.user.id)); }
    catch (err) { console.error(err); res.status(500).send('<h1>500 - Patient Dashboard Error</h1><a href="/signin">← Sign In</a>'); }
});

app.get('/doctor-dashboard', requireAuth('doctor'), async (req, res) => {
    try { res.setHeader('Content-Type','text/html'); res.send(await require('./Doctor.js')(req.user.id)); }
    catch (err) { console.error(err); res.status(500).send('<h1>500 - Doctor Dashboard Error</h1><a href="/signin">← Sign In</a>'); }
});
app.get('/api/chat/messages', authenticate, async (req, res) => {
    try {
      const { doctorId, patientId, limit = 50 } = req.query;
      if (!doctorId || !patientId) return res.status(400).json({ error: 'Missing params' });
 
      const roomId = [doctorId, patientId].sort().join('_');
      const result = await query(
        `SELECT m.*, u.username as sender_name
         FROM chat_messages m
         JOIN users u ON m.sender_id = u.user_id
         WHERE m.room_id = $1
         ORDER BY m.created_at DESC
         LIMIT $2`,
        [roomId, parseInt(limit)]
      );
      res.json(result.rows.reverse());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

app.get('/admin-dashboard', requireAuth('admin'), async (req, res) => {
    try { res.setHeader('Content-Type','text/html'); res.send(await require('./admin.js')(req.user.id)); }
    catch (err) { console.error(err); res.status(500).send('<h1>500 - Admin Dashboard Error</h1><a href="/signin">← Sign In</a>'); }
});

app.get('/lab-dashboard', requireAuth('lab'), async (req, res) => {
    try { res.setHeader('Content-Type','text/html'); res.send(await require('./labs.js')(req.user.id)); }
    catch (err) { console.error(err); res.status(500).send('<h1>500 - Lab Dashboard Error</h1><a href="/signin">← Sign In</a>'); }
});

app.get('/hospital-dashboard', requireAuth('admin'), async (req, res) => {
    try {
        const hospitalResult = await query(
            'SELECT h.* FROM hospitals h JOIN hospital_admins ha ON h.hospital_id = ha.hospital_id WHERE ha.user_id = $1',
            [req.user.id]
        );
        const statsResult = await query(
            `SELECT (SELECT COUNT(*) FROM doctors WHERE hospital_id = $1) as total_doctors,
                    (SELECT COUNT(*) FROM appointments WHERE hospital_id = $1 AND appointment_date >= CURRENT_DATE) as upcoming_appointments,
                    (SELECT COUNT(*) FROM medicines WHERE hospital_id = $1) as total_medicines,
                    (SELECT COUNT(*) FROM lab_technicians WHERE hospital_id = $1) as total_labs`,
            [hospitalResult.rows[0]?.hospital_id || null]
        );
        const recentResult = await query(
            `SELECT 'appointment' as type, a.appointment_date as date, p.full_name as patient_name, d.full_name as doctor_name
             FROM appointments a JOIN patients p ON a.patient_id = p.patient_id JOIN doctors d ON a.doctor_id = d.doctor_id
             WHERE a.hospital_id = $1 ORDER BY a.created_at DESC LIMIT 10`,
            [hospitalResult.rows[0]?.hospital_id || null]
        );
        const Hospital = require('./Hospital.js');
        const html = await Hospital.renderHospitalDashboard({ hospital: hospitalResult.rows[0] || null, stats: statsResult.rows[0] || {}, recentActivity: recentResult.rows || [] });
        res.setHeader('Content-Type','text/html');
        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send(`<h1>500 - Hospital Dashboard Error</h1><p>${err.message}</p><a href="/signin">← Sign In</a>`);
    }
});

app.get('/register-doctor', requireAuth('admin'), (req, res) => {
    try { res.setHeader('Content-Type','text/html'); res.send(require('./Hospital.js').getAddDoctorHTML()); }
    catch (err) { res.status(500).send('<h1>500</h1><a href="/admin-dashboard">← Back</a>'); }
});
app.get('/add-doctor',     requireAuth('admin'), (req, res) => { try { res.setHeader('Content-Type','text/html'); res.send(require('./Hospital.js').getAddDoctorHTML()); } catch { res.status(500).send('Error'); } });
app.get('/add-speciality', requireAuth('admin'), (req, res) => { try { res.setHeader('Content-Type','text/html'); res.send(require('./Hospital.js').getAddSpecialityHTML()); } catch { res.status(500).send('Error'); } });
app.get('/add-medicine',   requireAuth('admin'), (req, res) => { try { res.setHeader('Content-Type','text/html'); res.send(require('./Hospital.js').getAddMedicineHTML()); } catch { res.status(500).send('Error'); } });
app.get('/add-lab',        requireAuth('admin'), (req, res) => { try { res.setHeader('Content-Type','text/html'); res.send(require('./Hospital.js').getAddLabHTML()); } catch { res.status(500).send('Error'); } });

// ============================================
// HOMEPAGE HTML
// ============================================
let homepageSchemaEnsured = false;
async function ensureHomepageSchema() {
    if (homepageSchemaEnsured) return;
    await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS main_photo_filename TEXT");
    await query("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS logo_filename TEXT");
    homepageSchemaEnsured = true;
}

async function generateHTML() {
    let networkStats = {
        hospitals: '0',
        patients: '0',
        doctors: '0',
        labs: '0'
    };
    let homepageHospitals = [];
    try {
        await ensureHomepageSchema();
        const [hospitalsCount, patientsCount, doctorsCount, labsCount, frequentHospitals] = await Promise.all([
            query('SELECT COUNT(*)::int AS total FROM hospitals'),
            query("SELECT COUNT(*)::int AS total FROM users WHERE role = 'patient' AND is_active = true"),
            query("SELECT COUNT(*)::int AS total FROM doctors WHERE status != 'Inactive'"),
            query('SELECT COUNT(*)::int AS total FROM lab_technicians'),
            query(
                `SELECT h.name, h.city, h.main_photo_filename, h.logo_filename, COUNT(a.appointment_id)::int AS appointment_count
                 FROM hospitals h
                 LEFT JOIN appointments a ON a.hospital_id = h.hospital_id
                 GROUP BY h.hospital_id, h.name, h.city, h.main_photo_filename, h.logo_filename
                 ORDER BY appointment_count DESC, h.name ASC`
            )
        ]);
        networkStats = {
            hospitals: String(hospitalsCount.rows[0]?.total || 0),
            patients: String(patientsCount.rows[0]?.total || 0),
            doctors: String(doctorsCount.rows[0]?.total || 0),
            labs: String(labsCount.rows[0]?.total || 0)
        };
        homepageHospitals = frequentHospitals.rows || [];
    } catch (error) {
        console.error('Homepage dynamic data fetch failed:', error.message);
    }

    const frequentlyVisitedHospitalsHtml = homepageHospitals.map((h, idx) => {
        const photoUrl = h.main_photo_filename
            ? `/uploads/hospitals/photos/${h.main_photo_filename}`
            : (h.logo_filename ? `/uploads/hospitals/logos/${h.logo_filename}` : '');
        return `<div class="bg-white rounded-2xl shadow-lg overflow-hidden card-hover hospital-slide-item ${idx >= 4 ? 'hidden' : ''}" data-index="${idx}">
          <div class="aspect-video bg-gradient-to-br from-[#0088cc] to-[#00aadd] flex items-center justify-center overflow-hidden">
            ${photoUrl
                ? `<img src="${photoUrl}" alt="${h.name}" class="w-full h-full object-cover">`
                : `<svg class="w-20 h-20 text-white opacity-90" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>`}
          </div>
          <div class="p-5">
            <h3 class="font-bold text-[#006d77] text-lg">${h.name}</h3>
            <p class="text-gray-500 text-sm mb-4">${h.city || 'Network Partner'}</p>
            <button onclick="window.location.href='/signin'" class="w-full bg-gradient-to-r from-[#0088cc] to-[#00aadd] text-white py-2.5 rounded-lg font-medium text-sm hover:shadow-lg hover:scale-105 transition-all">Select Facility</button>
          </div>
        </div>`;
    }).join('');
    const showHospitalControls = homepageHospitals.length > 4;

    return `<!doctype html>
<html lang="en" class="h-full">
 <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BondHealth - Unifying Care, Strengthening Lives</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="/_sdk/element_sdk.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{font-family:'Poppins',sans-serif;box-sizing:border-box;}
    @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes countUp{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
    @keyframes drift{0%,100%{transform:translate(0,0)}25%{transform:translate(20px,-20px)}50%{transform:translate(-20px,20px)}75%{transform:translate(20px,10px)}}
    @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes bounce-subtle{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
    @keyframes pulse-glow{0%,100%{box-shadow:0 0 30px rgba(0,200,255,.5)}50%{box-shadow:0 0 60px rgba(0,200,255,.8)}}
    @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
    @keyframes slide{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    .animate-slide-up{animation:slideUp .8s ease-out forwards}
    .animate-pulse-glow{animation:pulse-glow 2s ease-in-out infinite}
    .stat-card{animation:countUp .6s ease-out forwards}
    .stat-card:nth-child(1){animation-delay:.1s}.stat-card:nth-child(2){animation-delay:.2s}
    .stat-card:nth-child(3){animation-delay:.3s}.stat-card:nth-child(4){animation-delay:.4s}
    .review-bubble{position:relative;transition:all .3s ease}
    .review-bubble:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(0,86,179,.15)}
    .gradient-text{background:linear-gradient(135deg,#00c8ff,#10ebebdc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .hero-gradient{background:linear-gradient(135deg,#53f8f8 0%,#ffffff 50%,#e0ffff 100%)}
    .floating-shape{position:absolute;border-radius:50%;opacity:.15;animation:drift 15s infinite ease-in-out}
    .rotating-ring{animation:spin-slow 20s linear infinite}
    .card-hover{transition:all .3s ease}.card-hover:hover{transform:translateY(-8px);box-shadow:0 20px 40px rgba(0,86,179,.15)}
    .reviews-container{max-height:600px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#0056b3 #e6f2ff;padding-right:8px}
    .reviews-container::-webkit-scrollbar{width:6px}.reviews-container::-webkit-scrollbar-track{background:#e6f2ff;border-radius:3px}
    .reviews-container::-webkit-scrollbar-thumb{background:#0056b3;border-radius:3px}
    .filter-btn.active{background:linear-gradient(135deg,#0088cc,#00aadd);color:white;border-color:transparent}
    .loading-spinner{border:3px solid #f3f3f3;border-top:3px solid #0088cc;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite}
  </style>
  <style>@view-transition{navigation:auto}</style>
  <script src="/_sdk/data_sdk.js"></script>
 </head>
 <body class="h-full bg-white">
  <div id="app-wrapper" class="w-full h-full overflow-auto">
   <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div class="flex justify-between items-center py-4">
      <div class="flex items-center gap-2">
       <svg class="w-10 h-10" viewBox="0 0 50 50" fill="none"><circle cx="25" cy="25" r="23" fill="#0088cc" opacity="0.2"/><path d="M25 8C15.6 8 8 15.6 8 25s7.6 17 17 17 17-7.6 17-17S34.4 8 25 8z" stroke="#0088cc" stroke-width="2" fill="none"/><path d="M25 15v20M15 25h20" stroke="#0088cc" stroke-width="3" stroke-linecap="round"/><circle cx="25" cy="25" r="6" fill="#00aadd" opacity="0.4"/></svg>
       <span class="text-2xl font-bold text-[#006d77]">Bond<span class="text-[#00c8ff]">Health</span></span>
      </div>
      <nav class="hidden md:flex items-center gap-8">
       <a href="#about" class="text-gray-600 hover:text-[#00c8ff] transition-all font-medium hover:scale-110">About</a>
       <a href="#network" class="text-gray-600 hover:text-[#00c8ff] transition-all font-medium hover:scale-110">Network</a>
       <a href="#hospitals" class="text-gray-600 hover:text-[#00c8ff] transition-all font-medium hover:scale-110">Hospitals</a>
       <a href="#reviews" class="text-gray-600 hover:text-[#00c8ff] transition-all font-medium hover:scale-110">Reviews</a>
      </nav>
      <button onclick="window.location.href='/signin'" class="bg-gradient-to-r from-[#00c8ff] to-[#00ffff] hover:from-[#00b0e0] hover:to-[#00e0e0] text-white px-6 py-2.5 rounded-full font-medium transition-all hover:shadow-lg hover:shadow-cyan-300 hover:scale-105">Sign In</button>
     </div>
    </div>
   </header>

   <section id="about" class="hero-gradient py-20 lg:py-28 relative overflow-hidden">
    <div class="floating-shape top-20 right-10 w-64 h-64 bg-[#0088cc]"></div>
    <div class="floating-shape bottom-10 left-10 w-96 h-96 bg-[#00aadd]" style="animation-delay:2s"></div>
    <div class="floating-shape top-40 left-1/4 w-48 h-48 bg-[#0099cc]" style="animation-delay:4s"></div>
    <div class="floating-shape bottom-40 right-1/3 w-72 h-72 bg-[#66ccff]" style="animation-delay:6s"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
     <div class="grid lg:grid-cols-2 gap-12 items-center">
      <div class="animate-slide-up">
       <h1 id="tagline" class="text-4xl md:text-5xl lg:text-6xl font-bold text-[#006d77] leading-tight mb-6">Unifying Care,<br><span class="gradient-text">Strengthening Lives.</span></h1>
       <p id="about-text" class="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">BondHealth is a state-wide digital ecosystem that bridges the gap between you and your medical providers. We securely centralize your health records, ensuring that your medical history, appointments, and lab results are accessible at every hospital you visit.</p>
       <div class="flex flex-wrap gap-4">
        <button onclick="window.location.href='/signin'" class="bg-gradient-to-r from-[#00c8ff] to-[#00ffff] hover:from-[#00b0e0] hover:to-[#00e0e0] text-white px-8 py-3.5 rounded-full font-semibold transition-all hover:shadow-xl hover:shadow-cyan-300 animate-pulse-glow hover:scale-105">Get Started Free</button>
        <button onclick="document.getElementById('network')?.scrollIntoView({ behavior: 'smooth' })" class="border-2 border-[#00c8ff] text-[#00c8ff] hover:bg-[#00c8ff] hover:text-white px-8 py-3.5 rounded-full font-semibold transition-all hover:scale-105 hover:shadow-lg">Learn More</button>
       </div>
      </div>
      <div class="relative hidden lg:block">
       <svg class="w-full max-w-lg mx-auto" viewBox="0 0 400 350" fill="none">
        <circle class="rotating-ring" cx="200" cy="175" r="60" fill="#0088cc" opacity="0.1"/>
        <circle cx="200" cy="175" r="45" fill="#0088cc" opacity="0.2"/>
        <circle cx="200" cy="175" r="30" fill="url(#cg)"/>
        <path d="M200 155v40M180 175h40" stroke="white" stroke-width="4" stroke-linecap="round"/>
        <defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0088cc"/><stop offset="100%" style="stop-color:#00aadd"/></linearGradient></defs>
        <circle cx="80" cy="100" r="25" fill="#0088cc" opacity="0.9"/><text x="80" y="105" text-anchor="middle" fill="white" font-size="20">🏥</text>
        <line x1="105" y1="115" x2="160" y2="155" stroke="#0088cc" stroke-width="2" stroke-dasharray="5,5" opacity="0.6"/>
        <circle cx="320" cy="100" r="25" fill="#0099cc" opacity="0.9"/><text x="320" y="105" text-anchor="middle" fill="white" font-size="20">👨‍⚕️</text>
        <line x1="295" y1="115" x2="240" y2="155" stroke="#0099cc" stroke-width="2" stroke-dasharray="5,5" opacity="0.6"/>
        <circle cx="80" cy="250" r="25" fill="#00aadd" opacity="0.9"/><text x="80" y="255" text-anchor="middle" fill="white" font-size="20">🔬</text>
        <line x1="105" y1="235" x2="160" y2="195" stroke="#00aadd" stroke-width="2" stroke-dasharray="5,5" opacity="0.6"/>
        <circle cx="320" cy="250" r="25" fill="#66ccff" opacity="0.9"/><text x="320" y="255" text-anchor="middle" fill="white" font-size="20">👥</text>
        <line x1="295" y1="235" x2="240" y2="195" stroke="#66ccff" stroke-width="2" stroke-dasharray="5,5" opacity="0.6"/>
       </svg>
      </div>
     </div>
    </div>
   </section>

   <section id="network" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div class="text-center mb-12"><h2 class="text-3xl md:text-4xl font-bold text-[#1a365d] mb-4">The Bond Network</h2><p class="text-gray-600 max-w-2xl mx-auto">Our growing ecosystem connects healthcare providers across the state</p></div>
     <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="stat-card bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl shadow-lg border border-blue-100 card-hover text-center"><div class="text-4xl mb-3">🏥</div><div class="text-3xl md:text-4xl font-bold text-[#0088cc] mb-1">${networkStats.hospitals}</div><div class="text-sm text-gray-600 font-medium">Partner Hospitals</div><div class="text-xs text-gray-400 mt-1">Across the State</div></div>
      <div class="stat-card bg-gradient-to-br from-cyan-50 to-white p-6 rounded-2xl shadow-lg border border-cyan-100 card-hover text-center"><div class="text-4xl mb-3">👥</div><div class="text-3xl md:text-4xl font-bold text-[#0099cc] mb-1">${networkStats.patients}</div><div class="text-sm text-gray-600 font-medium">Active Users</div><div class="text-xs text-gray-400 mt-1">Lives Connected</div></div>
      <div class="stat-card bg-gradient-to-br from-teal-50 to-white p-6 rounded-2xl shadow-lg border border-teal-100 card-hover text-center"><div class="text-4xl mb-3">👨‍⚕️</div><div class="text-3xl md:text-4xl font-bold text-[#00aadd] mb-1">${networkStats.doctors}</div><div class="text-sm text-gray-600 font-medium">Verified Doctors</div><div class="text-xs text-gray-400 mt-1">Specialists On-call</div></div>
      <div class="stat-card bg-gradient-to-br from-sky-50 to-white p-6 rounded-2xl shadow-lg border border-sky-100 card-hover text-center"><div class="text-4xl mb-3">🔬</div><div class="text-3xl md:text-4xl font-bold text-[#66ccff] mb-1">${networkStats.labs}</div><div class="text-sm text-gray-600 font-medium">Diagnostic Labs</div><div class="text-xs text-gray-400 mt-1">Instant Results</div></div>
     </div>
    </div>
   </section>

   <section id="hospitals" class="py-20 bg-gradient-to-b from-gray-50 to-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div class="text-center mb-12"><h2 class="text-3xl md:text-4xl font-bold text-[#1a365d] mb-4">Frequently Visited Hospitals</h2><p class="text-gray-600 max-w-2xl mx-auto">Top registered hospitals by activity</p></div>
     <div class="relative">
      ${showHospitalControls ? `<button id="hospitalPrevBtn" class="absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/95 text-cyan-700 shadow-lg border border-cyan-100 hover:bg-cyan-50 transition-all" aria-label="Previous hospitals">‹</button>` : ''}
      ${showHospitalControls ? `<button id="hospitalNextBtn" class="absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/95 text-cyan-700 shadow-lg border border-cyan-100 hover:bg-cyan-50 transition-all" aria-label="Next hospitals">›</button>` : ''}
     <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      ${frequentlyVisitedHospitalsHtml || '<div class="col-span-4 text-center py-10 text-gray-500">No registered hospitals yet.</div>'}
     </div>
     </div>
    </div>
   </section>

   <section id="reviews" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div class="text-center mb-8"><h2 class="text-3xl md:text-4xl font-bold text-[#1a365d] mb-4">What Our Users Say</h2><p class="text-gray-600 max-w-2xl mx-auto">Real experiences from patients across the state</p></div>
     <div id="rating-summary" class="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl shadow-lg border border-blue-100 mb-8">
      <div class="flex flex-col md:flex-row items-center gap-8">
       <div class="text-center"><div id="average-rating" class="text-5xl font-bold text-[#0088cc]">0.0</div><div class="text-2xl mt-2">☆☆☆☆☆</div><div id="total-reviews" class="text-sm text-gray-600 mt-1">Based on 0 reviews</div></div>
       <div class="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2 w-full">
        <div class="col-span-1 flex items-center gap-2"><span class="text-sm font-medium w-12">5 ★</span><div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div id="five-star-bar" class="h-full bg-green-500" style="width:0%"></div></div><span id="five-star-count" class="text-sm text-gray-600 w-10">0</span></div>
        <div class="col-span-1 flex items-center gap-2"><span class="text-sm font-medium w-12">4 ★</span><div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div id="four-star-bar" class="h-full bg-green-400" style="width:0%"></div></div><span id="four-star-count" class="text-sm text-gray-600 w-10">0</span></div>
        <div class="col-span-1 flex items-center gap-2"><span class="text-sm font-medium w-12">3 ★</span><div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div id="three-star-bar" class="h-full bg-yellow-400" style="width:0%"></div></div><span id="three-star-count" class="text-sm text-gray-600 w-10">0</span></div>
        <div class="col-span-1 flex items-center gap-2"><span class="text-sm font-medium w-12">2 ★</span><div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div id="two-star-bar" class="h-full bg-orange-400" style="width:0%"></div></div><span id="two-star-count" class="text-sm text-gray-600 w-10">0</span></div>
        <div class="col-span-1 flex items-center gap-2"><span class="text-sm font-medium w-12">1 ★</span><div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div id="one-star-bar" class="h-full bg-red-500" style="width:0%"></div></div><span id="one-star-count" class="text-sm text-gray-600 w-10">0</span></div>
       </div>
      </div>
     </div>
     <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div class="flex flex-wrap gap-2">
       <button class="filter-btn active px-4 py-2 rounded-full border border-gray-300 text-sm font-medium transition-all" data-filter="all">All Reviews</button>
       <button class="filter-btn px-4 py-2 rounded-full border border-gray-300 text-sm font-medium transition-all" data-filter="positive">Positive (4-5★)</button>
       <button class="filter-btn px-4 py-2 rounded-full border border-gray-300 text-sm font-medium transition-all" data-filter="neutral">Neutral (3★)</button>
       <button class="filter-btn px-4 py-2 rounded-full border border-gray-300 text-sm font-medium transition-all" data-filter="negative">Negative (1-2★)</button>
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto">
       <select id="sort-select" class="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#0088cc]"><option value="recent">Most Recent</option><option value="highest">Highest Rated</option><option value="lowest">Lowest Rated</option><option value="helpful">Most Helpful</option></select>
       <button id="write-review-btn" class="bg-gradient-to-r from-[#0088cc] to-[#00aadd] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all whitespace-nowrap">Write a Review</button>
      </div>
     </div>
     <div class="relative mb-6">
      <input type="text" id="search-input" placeholder="Search reviews..." class="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-[#0088cc]">
      <svg class="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
     </div>
     <div id="reviews-loading" class="flex justify-center py-12 hidden"><div class="loading-spinner"></div></div>
     <div id="reviews-container" class="reviews-container space-y-6 pr-2"><div class="text-center py-12 text-gray-500">Loading reviews...</div></div>
     <div id="pagination" class="flex justify-center gap-2 mt-8"></div>
    </div>
   </section>

   <div id="review-modal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
    <div class="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
     <div class="flex justify-between items-center mb-6"><h3 class="text-xl font-bold text-[#1a365d]">Write a Review</h3><button id="close-review-modal" class="text-gray-400 hover:text-gray-600 text-2xl">×</button></div>
     <form id="review-form" class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
       <div><label class="block text-sm font-medium text-gray-700 mb-1">Your Name *</label><input type="text" id="review-name" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0088cc]" placeholder="Your name" required></div>
       <div><label class="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label><input type="email" id="review-email" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0088cc]" placeholder="your@email.com"></div>
      </div>
      <div><label class="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label><div class="flex gap-2 text-3xl" id="rating-stars"><span class="star cursor-pointer hover:scale-110 transition" data-rating="1">☆</span><span class="star cursor-pointer hover:scale-110 transition" data-rating="2">☆</span><span class="star cursor-pointer hover:scale-110 transition" data-rating="3">☆</span><span class="star cursor-pointer hover:scale-110 transition" data-rating="4">☆</span><span class="star cursor-pointer hover:scale-110 transition" data-rating="5">☆</span></div><input type="hidden" id="review-rating" name="rating" required></div>
      <div><label class="block text-sm font-medium text-gray-700 mb-1">Review Title</label><input type="text" id="review-title" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0088cc]" placeholder="Summarize your experience"></div>
      <div><label class="block text-sm font-medium text-gray-700 mb-1">Your Review *</label><textarea id="review-content" rows="4" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0088cc] resize-none" placeholder="Tell us about your experience..." required></textarea><p class="text-xs text-gray-500 mt-1">Minimum 10 characters</p></div>
      <div><label class="block text-sm font-medium text-gray-700 mb-1">Hospital (Optional)</label><input type="text" id="review-hospital" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0088cc]" placeholder="e.g., City General Hospital"></div>
      <div><label class="block text-sm font-medium text-gray-700 mb-1">Doctor (Optional)</label><input type="text" id="review-doctor" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0088cc]" placeholder="e.g., Dr. Sarah Johnson"></div>
      <div class="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg"><span class="font-semibold">Note:</span> Your review will be public and help others make informed decisions.</div>
      <button type="submit" class="w-full bg-gradient-to-r from-[#0088cc] to-[#00aadd] hover:from-[#0077bb] hover:to-[#0099cc] text-white py-3 rounded-lg font-semibold transition-all hover:shadow-lg">Submit Review</button>
     </form>
     <div id="review-success" class="hidden text-center py-8"><div class="text-5xl mb-4">✅</div><h4 class="text-xl font-bold text-[#1a365d] mb-2">Thank You!</h4><p class="text-gray-600">Your review has been submitted and will be visible shortly.</p></div>
    </div>
   </div>

   <footer class="bg-gradient-to-br from-[#006d77] to-[#004d55] text-white py-16 relative overflow-hidden">
    <div class="floating-shape top-10 right-20 w-64 h-64 bg-[#0088cc]" style="opacity:.1"></div>
    <div class="floating-shape bottom-10 left-20 w-80 h-80 bg-[#00aadd]" style="animation-delay:3s;opacity:.1"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
     <div class="grid md:grid-cols-4 gap-10">
      <div class="md:col-span-2">
       <div class="flex items-center gap-2 mb-4"><svg class="w-10 h-10" viewBox="0 0 50 50" fill="none"><circle cx="25" cy="25" r="23" fill="#0088cc" opacity="0.2"/><path d="M25 8C15.6 8 8 15.6 8 25s7.6 17 17 17 17-7.6 17-17S34.4 8 25 8z" stroke="#00aadd" stroke-width="2" fill="none"/><path d="M25 15v20M15 25h20" stroke="#00aadd" stroke-width="3" stroke-linecap="round"/></svg><span class="text-2xl font-bold">BondHealth <span class="text-[#00aadd]">Connect</span></span></div>
       <p class="text-gray-400 mb-6 max-w-md">Unifying healthcare across the state. Your health journey, simplified and secured.</p>
       <div class="space-y-2">
        <p class="flex items-center gap-3"><span class="text-[#00aadd]">📧</span><a id="support-email" href="mailto:support@bondhealth.com" class="hover:text-[#00aadd] transition-colors">support@bondhealth.com</a></p>
        <p class="flex items-center gap-3"><span class="text-[#00aadd]">📞</span><span id="helpline">1-800-BOND-HLTH</span><span class="text-xs bg-[#00aadd] text-white px-2 py-0.5 rounded-full">24/7</span></p>
       </div>
      </div>
      <div><h4 class="font-semibold text-lg mb-4">Quick Links</h4><ul class="space-y-3"><li><a href="#" class="text-cyan-100 hover:text-[#00aadd] transition-all hover:translate-x-1 inline-block">Patient Privacy Rights</a></li><li><a href="#" class="text-cyan-100 hover:text-[#00aadd] transition-all hover:translate-x-1 inline-block">Terms of Service</a></li><li><a href="#" class="text-cyan-100 hover:text-[#00aadd] transition-all hover:translate-x-1 inline-block">Help Center</a></li></ul></div>
      <div><h4 class="font-semibold text-lg mb-4">Stay Connected</h4><div class="flex gap-3"><a href="#" class="w-10 h-10 bg-white/10 hover:bg-gradient-to-br hover:from-[#0088cc] hover:to-[#00aadd] rounded-full flex items-center justify-center transition-all hover:scale-110">𝕏</a><a href="#" class="w-10 h-10 bg-white/10 hover:bg-gradient-to-br hover:from-[#0088cc] hover:to-[#00aadd] rounded-full flex items-center justify-center transition-all hover:scale-110">📷</a><a href="#" class="w-10 h-10 bg-white/10 hover:bg-gradient-to-br hover:from-[#0088cc] hover:to-[#00aadd] rounded-full flex items-center justify-center transition-all hover:scale-110">in</a></div></div>
     </div>
     <div class="border-t border-white/10 mt-12 pt-8 text-center text-gray-400 text-sm"><p>© 2024 BondHealth. All rights reserved. | HIPAA Compliant | SOC 2 Certified</p></div>
    </div>
   </footer>

   <button id="feedback-btn" class="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#0088cc] to-[#00aadd] hover:from-[#0077bb] hover:to-[#0099cc] text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-2xl animate-pulse-glow hover:scale-110 z-50">💬</button>
   <div id="feedback-modal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
    <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
     <div class="flex justify-between items-center mb-6"><h3 class="text-xl font-bold text-[#1a365d]">Send Feedback</h3><button id="close-modal" class="text-gray-400 hover:text-gray-600 text-2xl">×</button></div>
     <form id="feedback-form" class="space-y-4">
      <div><label class="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" id="feedback-name" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0088cc]" placeholder="Your name"></div>
      <div><label class="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" id="feedback-email" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0088cc]" placeholder="your@email.com"></div>
      <div><label class="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea id="feedback-message" rows="4" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0088cc] resize-none" placeholder="Tell us what you think..."></textarea></div>
      <button type="submit" class="w-full bg-gradient-to-r from-[#0088cc] to-[#00aadd] hover:from-[#0077bb] hover:to-[#0099cc] text-white py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:scale-105">Send Feedback</button>
     </form>
     <div id="feedback-success" class="hidden text-center py-8"><div class="text-5xl mb-4">✅</div><h4 class="text-xl font-bold text-[#1a365d] mb-2">Thank You!</h4><p class="text-gray-600">Your feedback has been received.</p></div>
    </div>
   </div>
  </div>

  <script>
    // ── Config / SDK ────────────────────────────────────────────────────
    const defaultConfig = {
      tagline:"Unifying Care, Strengthening Lives.", about_title:"About BondHealth",
      about_text:"BondHealth is a state-wide digital ecosystem that bridges the gap between you and your medical providers. We securely centralize your health records, ensuring that your medical history, appointments, and lab results are accessible at every hospital you visit.",
      support_email:"support@bondhealth.com", helpline:"1-800-BOND-HLTH",
      primary_color:"#0088cc", secondary_color:"#00aadd", background_color:"#ffffff",
      text_color:"#006d77", surface_color:"#e0ffff", font_family:"Poppins", font_size:16
    };
    let config = {...defaultConfig};

    async function onConfigChange(newConfig) {
      config = {...config, ...newConfig};
      const taglineEl = document.getElementById('tagline');
      if (taglineEl) {
        const parts = (config.tagline || defaultConfig.tagline).split(',');
        taglineEl.innerHTML = parts.length > 1
          ? parts[0] + ',<br><span class="gradient-text">' + parts.slice(1).join(',').trim() + '</span>'
          : config.tagline;
      }
      const aboutEl = document.getElementById('about-text');
      if (aboutEl) aboutEl.textContent = config.about_text || defaultConfig.about_text;
      const emailEl = document.getElementById('support-email');
      if (emailEl) { const e = config.support_email || defaultConfig.support_email; emailEl.href = 'mailto:'+e; emailEl.textContent = e; }
      const hlEl = document.getElementById('helpline');
      if (hlEl) hlEl.textContent = config.helpline || defaultConfig.helpline;
      document.body.style.fontFamily = (config.font_family || 'Poppins') + ', sans-serif';
      document.documentElement.style.fontSize = (config.font_size || 16) + 'px';
    }

    if (window.elementSdk) {
      window.elementSdk.init({ defaultConfig, onConfigChange,
        mapToCapabilities: (c) => ({ recolorables: [], borderables: [], fontEditable: { get: ()=>c.font_family, set: v=>{ c.font_family=v; } }, fontSizeable: { get: ()=>c.font_size, set: v=>{ c.font_size=v; } } }),
        mapToEditPanelValues: (c) => new Map([["tagline",c.tagline||defaultConfig.tagline],["about_text",c.about_text||defaultConfig.about_text],["support_email",c.support_email||defaultConfig.support_email],["helpline",c.helpline||defaultConfig.helpline]])
      });
    }

    
    // ── Review System ───────────────────────────────────────────────────
    let currentFilter = 'all', currentSort = 'recent', currentSearch = '', currentPage = 1;

    document.addEventListener('DOMContentLoaded', () => {
      loadReviews();
      document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter; currentPage = 1; loadReviews();
      }));
      document.getElementById('sort-select').addEventListener('change', function() { currentSort = this.value; currentPage = 1; loadReviews(); });
      let st; document.getElementById('search-input').addEventListener('input', function() { clearTimeout(st); st = setTimeout(() => { currentSearch = this.value; currentPage = 1; loadReviews(); }, 500); });
      setupReviewModal();
    });

    function loadReviews() {
      const loadingEl = document.getElementById('reviews-loading');
      const container = document.getElementById('reviews-container');
      loadingEl.classList.remove('hidden'); container.innerHTML = '';
      let url = '/api/reviews?sort='+currentSort+'&page='+currentPage+'&limit=10';
      if (currentFilter !== 'all') url += '&rating='+currentFilter;
      if (currentSearch) url += '&search='+encodeURIComponent(currentSearch);
      fetch(url).then(r=>r.json()).then(data => {
        loadingEl.classList.add('hidden');
        if (data.success) { displayReviews(data.reviews); updateRatingStats(data.stats); updatePagination(data.pagination); }
        else container.innerHTML = '<div class="text-center py-12 text-gray-500">Failed to load reviews.</div>';
      }).catch(() => { loadingEl.classList.add('hidden'); container.innerHTML = '<div class="text-center py-12 text-gray-500">Error loading reviews.</div>'; });
    }

    function displayReviews(reviews) {
      const container = document.getElementById('reviews-container');
      if (!reviews || reviews.length === 0) { container.innerHTML = '<div class="text-center py-12 text-gray-500">No reviews found. Be the first to write a review!</div>'; return; }
      container.innerHTML = reviews.map(r => {
        const initials = r.reviewer_name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
        const stars = '★'.repeat(r.rating)+'☆'.repeat(5-r.rating);
        const verified = r.is_verified ? '<span class="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified Patient</span>' : '';
        return '<div class="review-bubble bg-white p-6 rounded-2xl shadow-lg border border-gray-100">' +
          '<div class="flex items-start gap-4">' +
            '<div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#0056b3] to-[#0088cc] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">' + initials + '</div>' +
            '<div class="flex-1">' +
              '<div class="flex flex-wrap items-center gap-2 mb-2"><span class="font-semibold text-[#1a365d]">' + r.reviewer_name + '</span>' + verified + '<div class="flex text-yellow-400 text-sm ml-auto">' + stars + '</div></div>' +
              (r.title ? '<h4 class="font-semibold text-gray-800 mb-2">' + r.title + '</h4>' : '') +
              '<p class="text-gray-600 text-sm leading-relaxed">"' + r.content + '"</p>' +
              '<div class="flex flex-wrap items-center justify-between mt-3">' +
                '<div class="flex items-center gap-4">' +
                  '<span class="text-xs text-gray-400">' + r.formatted_date + '</span>' +
                  (r.hospital_name ? '<span class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">' + r.hospital_name + '</span>' : '') +
                  (r.doctor_name ? '<span class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">' + r.doctor_name + '</span>' : '') +
                '</div>' +
                '<button class="helpful-btn text-xs text-gray-500 hover:text-[#0088cc] transition-colors" data-id="' + r.review_id + '">👍 Helpful (' + r.helpful_count + ')</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      document.querySelectorAll('.helpful-btn').forEach(btn => btn.addEventListener('click', function() {
        fetch('/api/reviews/'+this.dataset.id+'/helpful',{method:'POST'}).then(r=>r.json()).then(d => { if(d.success) this.innerHTML='👍 Helpful ('+d.helpful_count+')'; });
      }));
    }

    function updateRatingStats(stats) {
      if (!stats) return;
      const avg = parseFloat(stats.average_rating || 0);
      document.getElementById('average-rating').textContent = avg.toFixed(1);
      document.querySelector('#rating-summary .text-2xl').textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
      document.getElementById('total-reviews').textContent = 'Based on '+stats.total_reviews+' reviews';
      const total = parseInt(stats.total_reviews)||1;
      ['five','four','three','two','one'].forEach((name,i) => {
        const key = name+'_star';
        document.getElementById(name+'-star-bar').style.width = (stats[key]/total*100)+'%';
        document.getElementById(name+'-star-count').textContent = stats[key];
      });
    }

    function updatePagination(pagination) {
      const el = document.getElementById('pagination');
      if (!pagination || pagination.totalPages <= 1) { el.innerHTML=''; return; }
      let html = '<button class="px-4 py-2 rounded-lg border '+(pagination.currentPage===1?'text-gray-400 border-gray-200 cursor-not-allowed':'text-[#0088cc] border-[#0088cc] hover:bg-[#0088cc] hover:text-white')+' transition-all" '+(pagination.currentPage===1?'disabled':'onclick="goToPage('+(pagination.currentPage-1)+')"')+'>Previous</button>';
      for (let i=1;i<=pagination.totalPages;i++) {
        if (i===pagination.currentPage||i===1||i===pagination.totalPages||Math.abs(i-pagination.currentPage)<=2)
          html += '<button class="px-4 py-2 rounded-lg border '+(i===pagination.currentPage?'bg-[#0088cc] text-white border-[#0088cc]':'text-gray-600 border-gray-300 hover:bg-gray-100')+' transition-all" onclick="goToPage('+i+')">'+i+'</button>';
        else if (i===pagination.currentPage-3||i===pagination.currentPage+3) html += '<span class="px-2">...</span>';
      }
      html += '<button class="px-4 py-2 rounded-lg border '+(pagination.currentPage===pagination.totalPages?'text-gray-400 border-gray-200 cursor-not-allowed':'text-[#0088cc] border-[#0088cc] hover:bg-[#0088cc] hover:text-white')+' transition-all" '+(pagination.currentPage===pagination.totalPages?'disabled':'onclick="goToPage('+(pagination.currentPage+1)+')"')+'>Next</button>';
      el.innerHTML = html;
    }

    window.goToPage = function(page) { currentPage=page; loadReviews(); document.getElementById('reviews').scrollIntoView({behavior:'smooth'}); };

    function setupReviewModal() {
      const modal = document.getElementById('review-modal');
      const form = document.getElementById('review-form');
      const successEl = document.getElementById('review-success');
      const stars = document.querySelectorAll('#rating-stars .star');
      let selectedRating = 0;

      document.getElementById('write-review-btn').addEventListener('click', () => {
        modal.classList.remove('hidden');
      });
      document.getElementById('close-review-modal').addEventListener('click', () => { modal.classList.add('hidden'); resetReviewForm(); });
      modal.addEventListener('click', e => { if(e.target===modal){ modal.classList.add('hidden'); resetReviewForm(); } });

      stars.forEach(star => {
        star.addEventListener('mouseover', function() { const r=parseInt(this.dataset.rating); stars.forEach((s,i)=>s.textContent=i<r?'★':'☆'); });
        star.addEventListener('mouseout', () => stars.forEach((s,i)=>s.textContent=i<selectedRating?'★':'☆'));
        star.addEventListener('click', function() { selectedRating=parseInt(this.dataset.rating); document.getElementById('review-rating').value=selectedRating; stars.forEach((s,i)=>s.textContent=i<selectedRating?'★':'☆'); });
      });

      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!selectedRating) { alert('Please select a rating'); return; }
        const content = document.getElementById('review-content').value;
        if (content.length < 10) { alert('Review content must be at least 10 characters'); return; }
        try {
          const name = document.getElementById('review-name').value.trim();
          if (!name) { alert('Please enter your name'); return; }
          const res = await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rating:selectedRating,title:document.getElementById('review-title').value,content,hospital_name:document.getElementById('review-hospital').value||null,doctor_name:document.getElementById('review-doctor').value||null,reviewer_name:name,reviewer_email:document.getElementById('review-email').value||null})});
          const data = await res.json();
          if (data.success) { form.classList.add('hidden'); successEl.classList.remove('hidden'); setTimeout(()=>{ modal.classList.add('hidden'); resetReviewForm(); loadReviews(); },2000); }
          else alert(data.message||'Failed to submit review');
        } catch { alert('Network error. Please try again.'); }
      });
    }

    function resetReviewForm() {
      const form=document.getElementById('review-form'); const successEl=document.getElementById('review-success');
      form.classList.remove('hidden'); successEl.classList.add('hidden'); form.reset();
      document.querySelectorAll('#rating-stars .star').forEach(s=>s.textContent='☆');
      document.getElementById('review-rating').value='';
    }

    // ── Feedback Modal ──────────────────────────────────────────────────
    const feedbackBtn=document.getElementById('feedback-btn');
    const feedbackModal=document.getElementById('feedback-modal');
    const closeModal=document.getElementById('close-modal');
    const feedbackForm=document.getElementById('feedback-form');
    const feedbackSuccess=document.getElementById('feedback-success');

    feedbackBtn.addEventListener('click',()=>feedbackModal.classList.remove('hidden'));
    const closeFeedback=()=>{ feedbackModal.classList.add('hidden'); feedbackForm.classList.remove('hidden'); feedbackSuccess.classList.add('hidden'); feedbackForm.reset(); };
    closeModal.addEventListener('click',closeFeedback);
    feedbackModal.addEventListener('click',e=>{ if(e.target===feedbackModal) closeFeedback(); });
    feedbackForm.addEventListener('submit',async e=>{
      e.preventDefault();
      try {
        const res=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:document.getElementById('feedback-name').value,email:document.getElementById('feedback-email').value,message:document.getElementById('feedback-message').value})});
        if(res.ok){ feedbackForm.classList.add('hidden'); feedbackSuccess.classList.remove('hidden'); setTimeout(closeFeedback,2000); }
        else alert('Failed to submit feedback. Please try again.');
      } catch { alert('Network error. Please try again.'); }
    });

    document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',function(e){e.preventDefault();const t=document.querySelector(this.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth'});}));
    const allHospitalItems = Array.from(document.querySelectorAll('.hospital-slide-item'));
    if (allHospitalItems.length > 4) {
      let hospitalOffset = 0;
      const redrawHospitalSlides = () => {
        const visibleIndexes = new Set();
        for (let i = 0; i < 4; i++) {
          visibleIndexes.add((hospitalOffset + i) % allHospitalItems.length);
        }
        allHospitalItems.forEach((el, idx) => {
          el.classList.toggle('hidden', !visibleIndexes.has(idx));
        });
      };
      const prevBtn = document.getElementById('hospitalPrevBtn');
      const nextBtn = document.getElementById('hospitalNextBtn');
      if (prevBtn) prevBtn.addEventListener('click', () => {
        hospitalOffset = (hospitalOffset - 4 + allHospitalItems.length) % allHospitalItems.length;
        redrawHospitalSlides();
      });
      if (nextBtn) nextBtn.addEventListener('click', () => {
        hospitalOffset = (hospitalOffset + 4) % allHospitalItems.length;
        redrawHospitalSlides();
      });
      redrawHospitalSlides();
    }
    onConfigChange(config);
  </script>
 </body>
</html>`;
}


// ============================================
// START SERVER
// ============================================
const server = http.createServer(app);
chatServer.attach(server);                    // attaches Socket.IO
 
function startServer(port, maxRetries = 10) {
    let attempts = 0;
    let currentPort = port;

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE' && attempts < maxRetries) {
            attempts += 1;
            currentPort += 1;
            console.warn(`Port ${currentPort - 1} is in use. Retrying on ${currentPort}...`);
            return server.listen(currentPort);
        }

        console.error('Failed to start server:', error);
        process.exit(1);
    });

    server.once('listening', () => {
        const address = server.address();
        const activePort = typeof address === 'object' && address ? address.port : currentPort;
        console.log(`   Home:    http://localhost:${activePort}/`);
        console.log(`   Chat WS: ws://localhost:${activePort}/socket.io`);
        console.log(`   Press Ctrl+C to stop`);
    });

    server.listen(currentPort);
}

startServer(Number(PORT) || 3005);