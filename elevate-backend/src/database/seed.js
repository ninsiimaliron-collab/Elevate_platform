require('dotenv').config();

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { calcAge, slugify } = require('../utils/helpers');

const rounds = Number(process.env.BCRYPT_ROUNDS || 12);

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'elevate_db'
  });

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@1234', rounds);
    await connection.query(
      `INSERT IGNORE INTO users (email, phone, password_hash, role, is_verified, is_active)
       VALUES (?, ?, ?, 'admin', true, true)`,
      [process.env.ADMIN_EMAIL || 'admin@elevate.ug', process.env.ADMIN_PHONE || '+256701000001', adminPassword]
    );
    const [[adminUser]] = await connection.query('SELECT id FROM users WHERE email = ?', [process.env.ADMIN_EMAIL || 'admin@elevate.ug']);
    const adminUserId = adminUser.id;

    // Create employers
    const empPassword = await bcrypt.hash('Employer@123', rounds);
    
    await connection.query(
      `INSERT IGNORE INTO users (email, phone, password_hash, role, is_verified, is_active)
       VALUES (?, ?, ?, 'employer', true, true)`,
      ['jobs@kampalatech.ug', '+256701000101', empPassword]
    );
    const [[emp1User]] = await connection.query('SELECT id FROM users WHERE email = ?', ['jobs@kampalatech.ug']);
    const employerA = emp1User.id;

    await connection.query(
      `INSERT IGNORE INTO users (email, phone, password_hash, role, is_verified, is_active)
       VALUES (?, ?, ?, 'employer', true, true)`,
      ['careers@rubagabuild.ug', '+256702000202', empPassword]
    );
    const [[emp2User]] = await connection.query('SELECT id FROM users WHERE email = ?', ['careers@rubagabuild.ug']);
    const employerB = emp2User.id;

    // Create youth users
    const youthPassword = await bcrypt.hash('Youth@1234', rounds);
    
    await connection.query(
      `INSERT IGNORE INTO users (email, phone, password_hash, role, is_verified, is_active)
       VALUES (?, ?, ?, 'youth', true, true)`,
      ['grace.youth@elevate.ug', '+256703000303', youthPassword]
    );
    const [[youth1User]] = await connection.query('SELECT id FROM users WHERE email = ?', ['grace.youth@elevate.ug']);
    const youth1 = youth1User.id;

    await connection.query(
      `INSERT IGNORE INTO users (email, phone, password_hash, role, is_verified, is_active)
       VALUES (?, ?, ?, 'youth', true, true)`,
      ['sam.youth@elevate.ug', '+256704000404', youthPassword]
    );
    const [[youth2User]] = await connection.query('SELECT id FROM users WHERE email = ?', ['sam.youth@elevate.ug']);
    const youth2 = youth2User.id;

    await connection.query(
      `INSERT IGNORE INTO users (email, phone, password_hash, role, is_verified, is_active)
       VALUES (?, ?, ?, 'youth', true, true)`,
      ['rita.youth@elevate.ug', '+256705000505', youthPassword]
    );
    const [[youth3User]] = await connection.query('SELECT id FROM users WHERE email = ?', ['rita.youth@elevate.ug']);
    const youth3 = youth3User.id;

    // Create employer profiles
    await connection.query(
      `INSERT IGNORE INTO employer_profiles (user_id, company_name, industry, registration_number, registration_status, location_division, address, website, description, contact_person, verified_at)
       VALUES (?, 'Kampala Tech Hub', 'technology', 'REG-001', 'verified', 'Nakawa', 'Ntinda, Kampala', 'https://kampalatech.ug', 'Technology hiring startup talent', 'Asha N.', NOW())`,
      [employerA]
    );

    await connection.query(
      `INSERT IGNORE INTO employer_profiles (user_id, company_name, industry, registration_number, registration_status, location_division, address, website, description, contact_person, verified_at)
       VALUES (?, 'Rubaga BuildWorks', 'construction', 'REG-002', 'verified', 'Rubaga', 'Mengo, Kampala', 'https://rubagabuild.ug', 'Construction and apprenticeships', 'Moses K.', NOW())`,
      [employerB]
    );

    // Create youth profiles
    const dob1 = '2000-02-10';
    const dob2 = '1999-07-21';
    const dob3 = '2003-05-04';

    await connection.query(
      `INSERT IGNORE INTO youth_profiles (user_id, full_name, date_of_birth, age, gender, division, sub_county, skills, education_level, education_details, bio, profile_complete)
       VALUES (?, 'Grace N.', ?, ?, 'female', 'Central', 'Nakasero', JSON_ARRAY('javascript','communication'), 'diploma', JSON_OBJECT('course','ICT'), 'Frontend trainee', true)`,
      [youth1, dob1, calcAge(dob1)]
    );

    await connection.query(
      `INSERT IGNORE INTO youth_profiles (user_id, full_name, date_of_birth, age, gender, division, sub_county, skills, education_level, education_details, bio, profile_complete)
       VALUES (?, 'Sam K.', ?, ?, 'male', 'Kawempe', 'Bwaise', JSON_ARRAY('electrical','maintenance'), 'certificate', JSON_OBJECT('course','Electrical'), 'Electrical apprentice', true)`,
      [youth2, dob2, calcAge(dob2)]
    );

    await connection.query(
      `INSERT IGNORE INTO youth_profiles (user_id, full_name, date_of_birth, age, gender, division, sub_county, skills, education_level, education_details, bio, profile_complete)
       VALUES (?, 'Rita A.', ?, ?, 'female', 'Makindye', 'Kibuye', JSON_ARRAY('data-entry','excel'), 'bachelors', JSON_OBJECT('course','BBA'), 'Business support specialist', true)`,
      [youth3, dob3, calcAge(dob3)]
    );

    // Get employer profiles
    const [[ep1], [ep2]] = await Promise.all([
      connection.query('SELECT id FROM employer_profiles WHERE user_id = ? LIMIT 1', [employerA]),
      connection.query('SELECT id FROM employer_profiles WHERE user_id = ? LIMIT 1', [employerB])
    ]);

    // Create jobs
    const jobs = [
      ['Junior Web Developer', ep1.id, 'internship', 'Nakawa'],
      ['Customer Support Agent', ep1.id, 'full-time', 'Central'],
      ['Electrical Apprentice', ep2.id, 'apprenticeship', 'Rubaga'],
      ['Site Assistant', ep2.id, 'contract', 'Makindye'],
      ['Community Volunteer', ep1.id, 'volunteer', 'Kawempe']
    ];

    for (const [title, employerId, jobType, division] of jobs) {
      await connection.query(
        `INSERT IGNORE INTO jobs (employer_id, title, slug, description, requirements, responsibilities, job_type, division, skills_required, education_level, experience_years, salary_min, salary_max, is_salary_visible, application_deadline, status)
         VALUES (?, ?, ?, 'Sample seeded job description', JSON_ARRAY('Motivation'), JSON_ARRAY('Deliver assigned tasks'), ?, ?, JSON_ARRAY('teamwork'), 'certificate', 0, 300000, 700000, true, DATE_ADD(NOW(), INTERVAL 20 DAY), 'active')`,
        [employerId, title, `${slugify(title)}-${Date.now().toString().slice(-5)}`, jobType, division]
      );
    }

    // Create resources
    await connection.query(
      `INSERT IGNORE INTO resources (created_by, title, slug, description, body, category, is_published)
       VALUES (?, 'Build a Winning CV', 'build-a-winning-cv', 'Resume guidance', 'Detailed resume tips...', 'resume_tips', true)`,
      [adminUserId]
    );

    await connection.query(
      `INSERT IGNORE INTO resources (created_by, title, slug, description, body, category, is_published)
       VALUES (?, 'Free Online Tech Courses', 'free-online-tech-courses', 'Courses for youth', 'Course list and learning plan...', 'free_courses', true)`,
      [adminUserId]
    );

    await connection.query(
      `INSERT IGNORE INTO resources (created_by, title, slug, description, body, category, is_published)
       VALUES (?, 'Mentorship in Kampala', 'mentorship-in-kampala', 'Find mentors', 'Mentorship strategy and programs...', 'mentorship', true)`,
      [adminUserId]
    );

    // Get youth profiles and active jobs
    const [youthProfiles] = await connection.query('SELECT id FROM youth_profiles ORDER BY created_at ASC LIMIT 3');
    const [activeJobs] = await connection.query("SELECT id FROM jobs WHERE status = 'active' ORDER BY created_at ASC LIMIT 3");

    // Create applications
    if (youthProfiles.length >= 3 && activeJobs.length >= 3) {
      await connection.query(
        `INSERT IGNORE INTO applications (job_id, youth_id, cover_letter, status)
         VALUES (?, ?, 'I am interested and ready to learn.', 'pending')`,
        [activeJobs[0].id, youthProfiles[0].id]
      );

      await connection.query(
        `INSERT IGNORE INTO applications (job_id, youth_id, cover_letter, status)
         VALUES (?, ?, 'My skills align with this role.', 'under_review')`,
        [activeJobs[1].id, youthProfiles[1].id]
      );

      await connection.query(
        `INSERT IGNORE INTO applications (job_id, youth_id, cover_letter, status)
         VALUES (?, ?, 'I can start immediately.', 'shortlisted')`,
        [activeJobs[2].id, youthProfiles[2].id]
      );
    }

    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
})();
