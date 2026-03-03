-- ADD THIS ENTIRE FILE (CREATE ALL TABLES)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin', 'lab')),
    hospital_id UUID,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS hospitals (
    hospital_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_uuid VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('Govt', 'Private', 'Clinic')),
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    patient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    patient_uuid VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_type VARCHAR(5),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    medical_conditions TEXT[],
    allergies TEXT[],
    last_visit DATE,
    next_appointment DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES hospitals(hospital_id),
    doctor_uuid VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100),
    designation VARCHAR(100),
    qualification VARCHAR(255),
    experience VARCHAR(50),
    consultation_fee VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    photo_url TEXT,
    available_days TEXT[],
    available_time VARCHAR(100),
    rating DECIMAL(3,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. DOCTOR LEAVE TABLE
CREATE TABLE IF NOT EXISTS doctor_leave (
    leave_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. LAB TECHNICIANS TABLE
CREATE TABLE IF NOT EXISTS lab_technicians (
    lab_tech_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES hospitals(hospital_id),
    technician_uuid VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_uuid VARCHAR(50) UNIQUE,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES hospitals(hospital_id),
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    type VARCHAR(20) DEFAULT 'in-person',
    token_number VARCHAR(20),
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. LAB REPORTS TABLE
CREATE TABLE IF NOT EXISTS lab_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_uuid VARCHAR(50) UNIQUE,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(doctor_id),
    lab_tech_id UUID REFERENCES lab_technicians(lab_tech_id),
    test_type VARCHAR(100) NOT NULL,
    test_date DATE,
    results TEXT,
    findings TEXT,
    file_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    shared_with VARCHAR(20) DEFAULT 'doctor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS prescriptions (
    prescription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_uuid VARCHAR(50) UNIQUE,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(doctor_id),
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(255),
    valid_until DATE,
    instructions TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. MEDICAL REPORTS TABLE
CREATE TABLE IF NOT EXISTS medical_reports (
    medical_report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_uuid VARCHAR(50) UNIQUE,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50),
    report_date DATE,
    file_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    name VARCHAR(255),
    email VARCHAR(255),
    message TEXT,
    rating INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. MEDICINE INVENTORY TABLE
CREATE TABLE IF NOT EXISTS medicines (
    medicine_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(hospital_id),
    name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 0,
    price VARCHAR(50),
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. MEDICINE ORDERS TABLE
CREATE TABLE IF NOT EXISTS medicine_orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    prescription_id UUID REFERENCES prescriptions(prescription_id),
    medicine_id UUID REFERENCES medicines(medicine_id),
    quantity INTEGER NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'processing',
    delivery_address TEXT,
    payment_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. HOSPITAL ADMINS TABLE
CREATE TABLE IF NOT EXISTS hospital_admins (
    admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES hospitals(hospital_id),
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. FEEDBACK TABLE (with is_read field - combine both feedback tables)
DROP TABLE IF EXISTS feedback CASCADE;
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    name VARCHAR(255),
    email VARCHAR(255),
    message TEXT,
    rating INTEGER,
    is_read BOOLEAN DEFAULT false,  -- Track if you've read it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. REVIEWS TABLE (Public - like Google reviews)
CREATE TABLE IF NOT EXISTS reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(patient_id) ON DELETE SET NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    reviewer_email VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT NOT NULL,
    hospital_name VARCHAR(255),  -- Optional: which hospital they're reviewing
    doctor_name VARCHAR(255),     -- Optional: which doctor they're reviewing
    is_verified BOOLEAN DEFAULT false,  -- Verified patient?
    is_approved BOOLEAN DEFAULT true,   -- Auto-approve or moderate
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital_id ON doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);