// ADD THIS ENTIRE FILE
const { query, getClient } = require('./config');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  console.log('🌱 Seeding database with initial data...');
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Insert Hospitals
    const hospitals = await Promise.all([
      client.query(
        `INSERT INTO hospitals (hospital_uuid, name, type, city, phone, email) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING hospital_id`,
        ['h1', "St Mary's Hospital", 'Private', 'Medical City', '+1 (555) 123-4567', 'contact@stmarys.com']
      ),
      client.query(
        `INSERT INTO hospitals (hospital_uuid, name, type, city, phone, email) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING hospital_id`,
        ['h2', 'Aster Medical Center', 'Private', 'Medical City', '+1 (555) 234-5678', 'contact@aster.com']
      ),
      client.query(
        `INSERT INTO hospitals (hospital_uuid, name, type, city, phone, email) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING hospital_id`,
        ['h3', 'Apollo Hospital', 'Private', 'Medical City', '+1 (555) 345-6789', 'contact@apollo.com']
      ),
      client.query(
        `INSERT INTO hospitals (hospital_uuid, name, type, city, phone, email) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING hospital_id`,
        ['h4', 'City General Hospital', 'Govt', 'Medical City', '+1 (555) 456-7890', 'contact@citygeneral.com']
      )
    ]);

    const hospitalIds = hospitals.map(h => h.rows[0].hospital_id);

    // 2. Insert Users
    const users = await Promise.all([
      client.query(
        `INSERT INTO users (username, email, password_hash, role) 
         VALUES ($1, $2, $3, $4) RETURNING user_id`,
        ['alexjohnson', 'alex.johnson@email.com', passwordHash, 'patient']
      ),
      client.query(
        `INSERT INTO users (username, email, password_hash, role, hospital_id) 
         VALUES ($1, $2, $3, $4, $5) RETURNING user_id`,
        ['drsarahchen', 'sarah.chen@bondhealth.com', passwordHash, 'doctor', hospitalIds[0]]
      ),
      client.query(
        `INSERT INTO users (username, email, password_hash, role) 
         VALUES ($1, $2, $3, $4) RETURNING user_id`,
        ['admin', 'admin@bondhealth.com', passwordHash, 'admin']
      ),
      client.query(
        `INSERT INTO users (username, email, password_hash, role, hospital_id) 
         VALUES ($1, $2, $3, $4, $5) RETURNING user_id`,
        ['labtech', 'lab@bondhealth.com', passwordHash, 'lab', hospitalIds[1]]
      )
    ]);

    const [patientUser, doctorUser, adminUser, labUser] = users.map(u => u.rows[0].user_id);

    // 3. Insert Patient
    await client.query(
      `INSERT INTO patients (
        user_id, patient_uuid, full_name, date_of_birth, gender, 
        blood_type, phone, email, address, emergency_contact_name,
        emergency_contact_phone, medical_conditions, allergies, last_visit, next_appointment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        patientUser, 'PT-2024-0847', 'Alex Johnson', '1992-05-15', 'Male',
        'O+', '+1 (555) 123-4567', 'alex.johnson@email.com', '123 Health Street, Medical City',
        'Jane Johnson (Wife)', '+1 (555) 987-6543', 
        ['Hypertension', 'Asthma'], ['Penicillin'], '2024-11-15', '2024-12-20'
      ]
    );

    // 4. Insert Doctor
    await client.query(
      `INSERT INTO doctors (
        user_id, hospital_id, doctor_uuid, full_name, designation,
        specialization, experience, qualification, consultation_fee,
        email, phone, address, available_days, available_time, rating, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        doctorUser, hospitalIds[0], 'DR-2024-0567', 'Dr. Sarah Chen', 'Senior Cardiologist',
        'Cardiology', '12 years', 'MD, DM Cardiology', '$150',
        'sarah.chen@bondhealth.com', '+1 (555) 234-5678', '456 Medical Center, Cardiology Wing',
        ['Mon', 'Wed', 'Fri'], '9:00 AM - 5:00 PM', 4.9, 'Available'
      ]
    );

    // 5. Insert Lab Technician
    await client.query(
      `INSERT INTO lab_technicians (
        user_id, hospital_id, technician_uuid, full_name, employee_id, phone, email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        labUser, hospitalIds[1], 'LAB-2024-8473', 'Lab Technician', 'LAB-2024-8473',
        '+1 (555) 567-8901', 'lab@bondhealth.com'
      ]
    );

    // 6. Insert Hospital Admin
    await client.query(
      `INSERT INTO hospital_admins (
        user_id, hospital_id, full_name, position, phone, email
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        adminUser, hospitalIds[2], 'Admin User', 'Hospital Administrator',
        '+1 (555) 678-9012', 'admin@bondhealth.com'
      ]
    );

    // 7. Insert Appointments
    await client.query(
      `INSERT INTO appointments (
        appointment_uuid, patient_id, doctor_id, hospital_id,
        appointment_date, appointment_time, reason, status, type, location, notes
      ) VALUES ($1, 
        (SELECT patient_id FROM patients WHERE patient_uuid = $2),
        (SELECT doctor_id FROM doctors WHERE doctor_uuid = $3),
        $4, $5, $6, $7, $8, $9, $10, $11
      )`,
      [
        'APT-001', 'PT-2024-0847', 'DR-2024-0567', hospitalIds[0],
        '2024-12-20', '10:30 AM', 'Routine heart checkup', 'confirmed', 
        'in-person', 'Room 304', 'Bring previous test reports'
      ]
    );

    // 8. Insert Lab Reports
    await client.query(
      `INSERT INTO lab_reports (
        report_uuid, patient_id, doctor_id, lab_tech_id,
        test_type, test_date, findings, status
      ) VALUES (
        $1,
        (SELECT patient_id FROM patients WHERE patient_uuid = $2),
        (SELECT doctor_id FROM doctors WHERE doctor_uuid = $3),
        (SELECT lab_tech_id FROM lab_technicians WHERE technician_uuid = $4),
        $5, $6, $7, $8
      )`,
      [
        'LAB-001', 'PT-2024-0847', 'DR-2024-0567', 'LAB-2024-8473',
        'Complete Blood Count', '2024-12-10', 'Normal ranges, no abnormalities detected', 'reviewed'
      ]
    );

    // 9. Insert Prescriptions
    await client.query(
      `INSERT INTO prescriptions (
        prescription_uuid, patient_id, doctor_id, medicine_name,
        dosage, frequency, valid_until, status
      ) VALUES (
        $1,
        (SELECT patient_id FROM patients WHERE patient_uuid = $2),
        (SELECT doctor_id FROM doctors WHERE doctor_uuid = $3),
        $4, $5, $6, $7, $8
      )`,
      ['RX-001', 'PT-2024-0847', 'DR-2024-0567', 'Metoprolol', '50mg', 'Once daily', '2025-03-15', 'active']
    );

    await client.query('COMMIT');
    console.log('✅ Seed data inserted successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDatabase;