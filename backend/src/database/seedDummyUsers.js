const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/db');

const JOB_POSITIONS = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'QA Automation Engineer',
  'UI/UX Designer',
  'Data Analyst',
  'HR Specialist',
  'Financial Analyst',
  'Marketing Executive'
];

const BANK_NAMES = [
  'HDFC Bank',
  'State Bank of India',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank'
];

async function seedDummyUsers() {
  console.log('================================================================');
  console.log('  SEEDING 100 DUMMY USERS & EMPLOYEES INTO MYSQL                ');
  console.log('  Emails:    dummy1@gmail.com  -> dummy100@gmail.com            ');
  console.log('  Passwords: dummy@1           -> dummy@100                     ');
  console.log('================================================================\n');

  const startTime = Date.now();
  let createdCount = 0;
  let updatedCount = 0;

  try {
    // 1. Verify default salary structure & schedule exist
    const structures = await query('SELECT id FROM salary_structures WHERE status = "ACTIVE" LIMIT 1');
    const structureId = structures.length > 0 ? structures[0].id : 1;

    const schedules = await query('SELECT id FROM working_schedules WHERE is_active = TRUE LIMIT 1');
    const scheduleId = schedules.length > 0 ? schedules[0].id : 1;

    const roles = await query('SELECT id, name FROM roles WHERE name = "EMPLOYEE" LIMIT 1');
    const employeeRoleId = roles.length > 0 ? roles[0].id : 5;

    for (let i = 1; i <= 100; i++) {
      const email = `dummy${i}@gmail.com`;
      const plainPassword = `dummy@${i}`;
      const passwordHash = await bcrypt.hash(plainPassword, 10);
      const empCode = `EMP-DUMMY-${String(i).padStart(3, '0')}`;
      const firstName = 'Dummy';
      const lastName = String(i);
      const phone = `+91 98000${String(i).padStart(5, '0')}`;
      const jobPosition = JOB_POSITIONS[(i - 1) % JOB_POSITIONS.length];
      const deptId = ((i - 1) % 4) + 1; // 1: ENG, 2: HR, 3: FIN, 4: MKT
      const gender = i % 2 === 0 ? 'FEMALE' : 'MALE';
      const wage = 40000 + (i * 350); // e.g. 40,350 to 75,000

      // 2. Insert or Update Employee
      const empSql = `
        INSERT INTO employees (
          employee_code, first_name, last_name, email, phone,
          job_position, department_id, working_schedule_id, gender,
          joining_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '2025-01-15', 'ACTIVE')
        ON DUPLICATE KEY UPDATE
          first_name = VALUES(first_name),
          last_name = VALUES(last_name),
          phone = VALUES(phone),
          job_position = VALUES(job_position),
          department_id = VALUES(department_id),
          working_schedule_id = VALUES(working_schedule_id),
          gender = VALUES(gender),
          status = 'ACTIVE';
      `;
      await query(empSql, [empCode, firstName, lastName, email, phone, jobPosition, deptId, scheduleId, gender]);

      const empRows = await query('SELECT id FROM employees WHERE email = ? LIMIT 1', [email]);
      const employeeId = empRows[0].id;

      // 3. Insert or Update User
      const userSql = `
        INSERT INTO users (
          email, password_hash, role_id, employee_id,
          is_active, is_verified, must_change_password
        ) VALUES (?, ?, ?, ?, TRUE, TRUE, FALSE)
        ON DUPLICATE KEY UPDATE
          password_hash = VALUES(password_hash),
          role_id = VALUES(role_id),
          employee_id = VALUES(employee_id),
          is_active = TRUE,
          is_verified = TRUE,
          must_change_password = FALSE;
      `;
      const userResult = await query(userSql, [email, passwordHash, employeeRoleId, employeeId]);

      if (userResult.affectedRows === 1) {
        createdCount++;
      } else {
        updatedCount++;
      }

      // 4. Insert or Update Bank Details
      const bankName = BANK_NAMES[(i - 1) % BANK_NAMES.length];
      const accNum = `9876543210${String(i).padStart(4, '0')}`;
      const bankSql = `
        INSERT INTO employee_bank_details (
          employee_id, account_holder_name, bank_name, account_number,
          ifsc_code, branch_name, account_type, is_primary
        ) VALUES (?, ?, ?, ?, 'HDFC0001234', 'Corporate Branch', 'SALARY', TRUE)
        ON DUPLICATE KEY UPDATE
          account_holder_name = VALUES(account_holder_name),
          bank_name = VALUES(bank_name),
          account_number = VALUES(account_number);
      `;
      await query(bankSql, [employeeId, `Dummy ${i}`, bankName, accNum]);

      // 5. Insert or Update Contract
      const contractCode = `CON-DUMMY-${String(i).padStart(3, '0')}`;
      const contractSql = `
        INSERT INTO contracts (
          contract_code, employee_id, department_id, job_position,
          wage, salary_structure_id, working_schedule_id, start_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, '2025-01-15', 'ACTIVE')
        ON DUPLICATE KEY UPDATE
          department_id = VALUES(department_id),
          job_position = VALUES(job_position),
          wage = VALUES(wage),
          status = 'ACTIVE';
      `;
      await query(contractSql, [contractCode, employeeId, deptId, jobPosition, wage, structureId, scheduleId]);

      if (i % 20 === 0 || i === 100) {
        console.log(`  Processed: ${i}/100 users (Latest: ${email} | Password: ${plainPassword})`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n================================================================');
    console.log(`  Successfully seeded 100 dummy users in ${duration}s!           `);
    console.log(`  New: ${createdCount}, Updated: ${updatedCount}                 `);
    console.log('================================================================');
    console.log('Summary of Credentials:');
    console.log('  - Email format:    dummy1@gmail.com  to dummy100@gmail.com');
    console.log('  - Password format: dummy@1           to dummy@100');
    console.log('  - Role:            EMPLOYEE (Self-service portal access)');
    console.log('  - Linked entities: Employee Profile, Bank Details, Active Contract');
    console.log('================================================================\n');

  } catch (error) {
    console.error('[Seeding Error]:', error);
    process.exit(1);
  } finally {
    if (pool && pool.end) {
      await pool.end();
    }
    process.exit(0);
  }
}

if (require.main === module) {
  seedDummyUsers();
}

module.exports = seedDummyUsers;
