const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const { hashPassword } = require('../utils/password');

const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  multipleStatements: true
};

async function initDatabase() {
  console.log('================================================================');
  console.log('  PEOPLEPAY360 - Complete HR & Payroll Database Initializer    ');
  console.log('================================================================');

  let connection;
  try {
    // 1. Connect to MySQL server
    connection = await mysql.createConnection(dbConfig);
    console.log(`[1/5] Connected to MySQL host ${env.DB_HOST}:${env.DB_PORT}`);

    // 2. Create database
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`[2/5] Database "${env.DB_NAME}" ready.`);
    await connection.query(`USE \`${env.DB_NAME}\`;`);

    // 3. Execute database/schema.sql
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('[3/5] Schema tables created successfully (27 normalized tables).');

    // 4. Execute database/seed.sql
    const seedsPath = path.join(__dirname, '../../database/seed.sql');
    const seedsSql = fs.readFileSync(seedsPath, 'utf8');
    await connection.query(seedsSql);
    console.log('[4/5] Seeded roles, permissions, schedules, rules, structures, employees, and contracts.');

    // 5. Seed Users for All 5 Roles with Secure Bcrypt Passwords
    console.log('[5/5] Seeding user accounts with hashed credentials...');

    const adminHash = await hashPassword('Admin@123');
    const demoHash = await hashPassword('Password@123');

    const usersToSeed = [
      {
        email: 'admin@peoplepay360.com',
        passwordHash: adminHash,
        roleName: 'ADMIN',
        empCode: 'EMP-001',
        isVerified: true,
        mustChange: false
      },
      {
        email: 'payrolladmin@peoplepay360.com',
        passwordHash: demoHash,
        roleName: 'HR_PAYROLL_ADMIN',
        empCode: 'EMP-002',
        isVerified: true,
        mustChange: false
      },
      {
        email: 'payrolluser@peoplepay360.com',
        passwordHash: demoHash,
        roleName: 'HR_PAYROLL_USER',
        empCode: 'EMP-003',
        isVerified: true,
        mustChange: false
      },
      {
        email: 'hrmanager@peoplepay360.com',
        passwordHash: demoHash,
        roleName: 'HR_MANAGER',
        empCode: 'EMP-004',
        isVerified: true,
        mustChange: false
      },
      {
        email: 'employee@peoplepay360.com',
        passwordHash: demoHash,
        roleName: 'EMPLOYEE',
        empCode: 'EMP-005',
        isVerified: true,
        mustChange: false
      },
      {
        email: 'priya.sharma@peoplepay360.com',
        passwordHash: demoHash,
        roleName: 'EMPLOYEE',
        empCode: 'EMP-006',
        isVerified: true,
        mustChange: false
      }
    ];

    for (const u of usersToSeed) {
      const [roleRows] = await connection.query('SELECT id FROM roles WHERE name = ?', [u.roleName]);
      const [empRows] = await connection.query('SELECT id FROM employees WHERE employee_code = ?', [u.empCode]);

      const roleId = roleRows.length > 0 ? roleRows[0].id : null;
      const empId = empRows.length > 0 ? empRows[0].id : null;

      if (!roleId) {
        console.warn(`Role ${u.roleName} not found, skipping user ${u.email}`);
        continue;
      }

      await connection.query(
        `INSERT INTO users (email, password_hash, role_id, employee_id, is_active, is_verified, must_change_password)
         VALUES (?, ?, ?, ?, TRUE, ?, ?)
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           role_id = VALUES(role_id),
           employee_id = VALUES(employee_id),
           is_active = TRUE,
           is_verified = VALUES(is_verified),
           must_change_password = VALUES(must_change_password);`,
        [u.email, u.passwordHash, roleId, empId, u.isVerified, u.mustChange]
      );
    }

    console.log('\n================================================================');
    console.log('  Database Setup & Seeding Completed Successfully!              ');
    console.log('================================================================');
    console.log('Available Demo Accounts (All Roles):');
    console.log('----------------------------------------------------------------');
    console.log('1. Admin:            admin@peoplepay360.com        / Admin@123');
    console.log('2. HR Payroll Admin: payrolladmin@peoplepay360.com / Password@123');
    console.log('3. HR Payroll User:  payrolluser@peoplepay360.com  / Password@123');
    console.log('4. HR Manager:       hrmanager@peoplepay360.com    / Password@123');
    console.log('5. Employee:         employee@peoplepay360.com     / Password@123');
    console.log('----------------------------------------------------------------\n');

  } catch (error) {
    console.error('[DB Initialization Error]:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initDatabase().then(() => process.exit(0));
}

module.exports = initDatabase;
