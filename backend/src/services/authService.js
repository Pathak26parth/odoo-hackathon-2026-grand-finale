const { query, transaction } = require('../config/db');
const { hashPassword, generateSecurePassword } = require('../utils/password');
const { generateCryptoToken, hashCryptoToken } = require('../utils/generateToken');
const { sendEmployeeInvitation, sendPasswordResetEmail } = require('./emailService');
const STATUSES = require('../constants/statuses');
const { ROLES } = require('../constants/roles');

/**
 * Authentication & Account Lifecycle Service
 */
class AuthService {
  /**
   * Helper to resolve role ID from numeric ID or string name
   */
  async resolveRoleId(roleIdentifier) {
    if (!roleIdentifier) {
      const rows = await query('SELECT id FROM roles WHERE name = "EMPLOYEE"');
      return rows.length > 0 ? rows[0].id : 5;
    }

    if (typeof roleIdentifier === 'number' || (!isNaN(parseInt(roleIdentifier, 10)) && String(Number(roleIdentifier)) === String(roleIdentifier).trim())) {
      const rows = await query('SELECT id FROM roles WHERE id = ?', [parseInt(roleIdentifier, 10)]);
      if (rows.length > 0) return rows[0].id;
    }

    const cleanName = String(roleIdentifier).trim().toUpperCase().replace(/\s+/g, '_');
    const rows = await query(
      'SELECT id FROM roles WHERE UPPER(name) = ? OR UPPER(display_name) = ?',
      [cleanName, String(roleIdentifier).trim().toUpperCase()]
    );

    if (rows.length > 0) return rows[0].id;

    // Fallback default
    const empRows = await query('SELECT id FROM roles WHERE name = "EMPLOYEE"');
    return empRows.length > 0 ? empRows[0].id : 5;
  }

  /**
   * Admin Creates Any Type of System User (Admin, HR Manager, HR Payroll Admin, HR Payroll User, Employee)
   */
  async createUserAccount({
    email,
    password = null,
    role,
    roleId = null,
    firstName = null,
    lastName = null,
    name = null,
    departmentId = null,
    jobPosition = null,
    phone = null,
    employeeId = null,
    createEmployeeRecord = true,
    sendInvitation = true,
    createdByUserId = null,
    userIp = null,
    userAgent = null
  }) {
    const cleanEmail = email.toLowerCase().trim();

    return transaction(async (connection) => {
      // 1. Check if user already exists
      const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [cleanEmail]);
      if (existing.length > 0) {
        const err = new Error('A user account with this email address already exists.');
        err.statusCode = 409;
        throw err;
      }

      // 2. Resolve Role
      const finalRoleId = await this.resolveRoleId(roleId || role);
      const [roleInfo] = await connection.execute('SELECT name, display_name FROM roles WHERE id = ?', [finalRoleId]);
      const roleName = roleInfo[0].name;
      const roleDisplayName = roleInfo[0].display_name;

      // 3. Resolve or Create Employee Record if requested
      let targetEmployeeId = employeeId;
      let employeeCode = null;

      if (!targetEmployeeId && createEmployeeRecord) {
        // Parse names
        let fName = firstName;
        let lName = lastName;
        if (!fName && name) {
          const parts = name.trim().split(' ');
          fName = parts[0];
          lName = parts.slice(1).join(' ') || '';
        }
        if (!fName) {
          fName = cleanEmail.split('@')[0];
          lName = '';
        }

        // Generate employee code
        const [lastEmp] = await connection.execute('SELECT id FROM employees ORDER BY id DESC LIMIT 1');
        const nextNum = lastEmp.length > 0 ? lastEmp[0].id + 1 : 1;
        employeeCode = `EMP-${String(nextNum).padStart(3, '0')}`;

        const [empInsert] = await connection.execute(
          `INSERT INTO employees 
            (employee_code, first_name, last_name, email, phone, job_position, department_id, working_schedule_id, gender, joining_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'OTHER', CURRENT_DATE(), 'ACTIVE')`,
          [
            employeeCode,
            fName,
            lName || 'User',
            cleanEmail,
            phone || null,
            jobPosition || roleDisplayName,
            departmentId || null
          ]
        );

        targetEmployeeId = empInsert.insertId;

        // Auto-assign default annual leave allocations for employee
        const [leaveTypes] = await connection.execute('SELECT id, max_days_per_year FROM time_off_types WHERE requires_allocation = TRUE');
        const currentYear = new Date().getFullYear();
        for (const lt of leaveTypes) {
          await connection.execute(
            `INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, allocated_days, taken_days, remaining_days, validity_start, validity_end, status)
             VALUES (?, ?, ?, ?, 0.00, ?, ?, ?, 'APPROVED')`,
            [
              targetEmployeeId,
              lt.id,
              currentYear,
              lt.max_days_per_year,
              lt.max_days_per_year,
              `${currentYear}-01-01`,
              `${currentYear}-12-31`
            ]
          );
        }
      } else if (targetEmployeeId) {
        const [empRow] = await connection.execute('SELECT employee_code FROM employees WHERE id = ?', [targetEmployeeId]);
        if (empRow.length > 0) employeeCode = empRow[0].employee_code;
      }

      // 4. Password setup
      let rawPassword = password;
      let mustChange = false;

      if (!rawPassword) {
        rawPassword = generateSecurePassword(12);
        mustChange = true;
      }

      const passwordHash = await hashPassword(rawPassword);

      // 5. Insert User
      const [userInsert] = await connection.execute(
        `INSERT INTO users (email, password_hash, role_id, employee_id, is_active, is_verified, must_change_password)
         VALUES (?, ?, ?, ?, TRUE, ?, ?)`,
        [cleanEmail, passwordHash, finalRoleId, targetEmployeeId, !mustChange, mustChange]
      );

      const userId = userInsert.insertId;

      // 6. Generate Activation Token if invitation is enabled or password is temporary
      let activationToken = null;
      if (sendInvitation || mustChange) {
        activationToken = generateCryptoToken();
        const tokenHash = hashCryptoToken(activationToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await connection.execute(
          `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
           VALUES (?, ?, ?)`,
          [userId, tokenHash, expiresAt]
        );

        // Send email
        const displayName = firstName ? `${firstName} ${lastName || ''}` : name || cleanEmail;
        sendEmployeeInvitation({
          name: displayName,
          email: cleanEmail,
          activationToken,
          tempPassword: rawPassword
        }).catch(err => console.error('[Invitation Email Error]:', err));
      }

      // 7. Audit Log
      await connection.execute(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
         VALUES (?, 'USER_CREATED', 'Users', ?, ?, ?, ?)`,
        [
          createdByUserId,
          String(userId),
          `Created user ${cleanEmail} with role ${roleName}`,
          userIp,
          userAgent
        ]
      );

      return {
        userId,
        email: cleanEmail,
        role: roleName,
        roleDisplayName,
        roleId: finalRoleId,
        employeeId: targetEmployeeId,
        employeeCode,
        tempPassword: mustChange ? rawPassword : null,
        activationToken,
        message: `User account created successfully with role "${roleDisplayName}".`
      };
    });
  }

  /**
   * Onboard New Employee + Create Linked User + Bank Details + Initial Contract + Send Invitation
   * (Accessible by HR Manager, HR Payroll Admin, and Admin)
   */
  async createEmployeeWithAccount({ employeeData, bankData = null, initialContract = null, roleName = 'EMPLOYEE', createdByUserId, userIp, userAgent }) {
    return transaction(async (connection) => {
      // 1. Check duplicate email
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [employeeData.email.toLowerCase().trim()]
      );

      if (existingUsers.length > 0) {
        const err = new Error('A user account with this email address already exists.');
        err.statusCode = 409;
        throw err;
      }

      // 2. Generate employee code if not provided
      let empCode = employeeData.employeeCode;
      if (!empCode) {
        const [lastEmp] = await connection.execute('SELECT id FROM employees ORDER BY id DESC LIMIT 1');
        const nextNum = lastEmp.length > 0 ? lastEmp[0].id + 1 : 1;
        empCode = `EMP-${String(nextNum).padStart(3, '0')}`;
      }

      // 3. Insert Employee Record
      const [empInsert] = await connection.execute(
        `INSERT INTO employees 
          (employee_code, first_name, last_name, email, phone, job_position, department_id, manager_id, working_schedule_id, gender, date_of_birth, joining_date, status, profile_photo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
        [
          empCode,
          employeeData.firstName,
          employeeData.lastName,
          employeeData.email.toLowerCase().trim(),
          employeeData.phone || null,
          employeeData.jobPosition || null,
          employeeData.departmentId || null,
          employeeData.managerId || null,
          employeeData.workingScheduleId || 1,
          employeeData.gender || 'OTHER',
          employeeData.dateOfBirth || null,
          employeeData.joiningDate || new Date().toISOString().split('T')[0],
          employeeData.profilePhotoUrl || null
        ]
      );

      const employeeId = empInsert.insertId;

      // 4. Insert Bank Details if provided
      if (bankData && bankData.accountNumber && bankData.ifscCode) {
        await connection.execute(
          `INSERT INTO employee_bank_details 
            (employee_id, account_holder_name, bank_name, account_number, ifsc_code, branch_name, account_type, is_primary)
           VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [
            employeeId,
            bankData.accountHolderName || `${employeeData.firstName} ${employeeData.lastName}`,
            bankData.bankName || 'Bank',
            bankData.accountNumber.trim(),
            bankData.ifscCode.trim().toUpperCase(),
            bankData.branchName || null,
            bankData.accountType || 'SALARY'
          ]
        );
      }

      // 5. Create Initial Active Contract if provided
      if (initialContract && initialContract.wage) {
        const contractCode = `CON-${empCode}-${new Date().getFullYear()}`;
        await connection.execute(
          `INSERT INTO contracts 
            (contract_code, employee_id, department_id, job_position, wage, salary_structure_id, working_schedule_id, start_date, end_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
          [
            contractCode,
            employeeId,
            employeeData.departmentId || null,
            employeeData.jobPosition || null,
            parseFloat(initialContract.wage) || 0.00,
            initialContract.salaryStructureId || 1,
            employeeData.workingScheduleId || 1,
            initialContract.startDate || employeeData.joiningDate || new Date().toISOString().split('T')[0],
            initialContract.endDate || null
          ]
        );
      }

      // 6. Auto-assign annual default leave allocations
      const [leaveTypes] = await connection.execute('SELECT id, max_days_per_year FROM time_off_types WHERE requires_allocation = TRUE');
      const currentYear = new Date().getFullYear();
      for (const lt of leaveTypes) {
        await connection.execute(
          `INSERT INTO time_off_allocations (employee_id, time_off_type_id, year, allocated_days, taken_days, remaining_days, validity_start, validity_end, status)
           VALUES (?, ?, ?, ?, 0.00, ?, ?, ?, 'APPROVED')`,
          [
            employeeId,
            lt.id,
            currentYear,
            lt.max_days_per_year,
            lt.max_days_per_year,
            `${currentYear}-01-01`,
            `${currentYear}-12-31`
          ]
        );
      }

      // 7. Generate secure temporary password and create user account
      const tempPassword = generateSecurePassword(12);
      const passwordHash = await hashPassword(tempPassword);

      const finalRoleId = await this.resolveRoleId(roleName);

      const [userInsert] = await connection.execute(
        `INSERT INTO users (email, password_hash, role_id, employee_id, is_active, is_verified, must_change_password)
         VALUES (?, ?, ?, ?, TRUE, FALSE, TRUE)`,
        [employeeData.email.toLowerCase().trim(), passwordHash, finalRoleId, employeeId]
      );

      const userId = userInsert.insertId;

      // 8. Generate Activation Token (expires in 24 hours)
      const activationToken = generateCryptoToken();
      const tokenHash = hashCryptoToken(activationToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await connection.execute(
        `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
         VALUES (?, ?, ?)`,
        [userId, tokenHash, expiresAt]
      );

      // 9. Audit Log
      await connection.execute(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address, user_agent)
         VALUES (?, 'EMPLOYEE_CREATED', 'Employees', ?, ?, ?, ?)`,
        [
          createdByUserId || null,
          String(employeeId),
          `Created employee profile ${empCode} with user account`,
          userIp || null,
          userAgent || null
        ]
      );

      // 10. Send invitation email asynchronously
      sendEmployeeInvitation({
        name: `${employeeData.firstName} ${employeeData.lastName}`,
        email: employeeData.email,
        activationToken,
        tempPassword
      }).catch(err => console.error('[Invitation Email Error]:', err));

      return {
        employeeId,
        employeeCode: empCode,
        userId,
        email: employeeData.email,
        role: roleName,
        roleId: finalRoleId,
        mustChangePassword: true,
        tempPassword,
        activationToken,
        message: 'Employee profile, user account, bank details, and leave allocations created successfully. Invitation email sent.'
      };
    });
  }

  /**
   * Activate Employee Account & Set Permanent Password
   */
  async activateAccount({ token, email, newPassword }) {
    const tokenHash = hashCryptoToken(token);

    // 1. Verify token
    const tokenRows = await query(
      `SELECT evt.*, u.id AS user_id, u.email, u.is_active 
       FROM email_verification_tokens evt
       JOIN users u ON evt.user_id = u.id
       WHERE evt.token_hash = ? AND evt.is_used = FALSE AND evt.expires_at > NOW() AND u.email = ?
       LIMIT 1`,
      [tokenHash, email.toLowerCase().trim()]
    );

    if (tokenRows.length === 0) {
      const err = new Error('Invalid or expired activation link. Please request a new activation email.');
      err.statusCode = 400;
      throw err;
    }

    const tokenData = tokenRows[0];
    const newHash = await hashPassword(newPassword);

    return transaction(async (connection) => {
      // Mark token used
      await connection.execute('UPDATE email_verification_tokens SET is_used = TRUE WHERE id = ?', [tokenData.id]);

      // Update user password, set verified and clear must_change_password
      await connection.execute(
        `UPDATE users 
         SET password_hash = ?, is_verified = TRUE, must_change_password = FALSE, updated_at = NOW() 
         WHERE id = ?`,
        [newHash, tokenData.user_id]
      );

      // Audit Log
      await connection.execute(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description)
         VALUES (?, 'ACCOUNT_ACTIVATED', 'Auth', ?, 'Employee activated account and set permanent password')`,
        [tokenData.user_id, String(tokenData.user_id)]
      );

      return {
        success: true,
        message: 'Account activated successfully. You can now log in to the PeoplePay360 portal.'
      };
    });
  }

  /**
   * Initiate Forgot Password Flow
   */
  async forgotPassword({ email }) {
    const users = await query('SELECT u.id, u.email, e.first_name, e.last_name FROM users u LEFT JOIN employees e ON u.employee_id = e.id WHERE u.email = ?', [email.toLowerCase().trim()]);

    if (users.length === 0) {
      return { message: 'If an account exists with this email, a password reset link has been dispatched.' };
    }

    const user = users[0];
    const resetToken = generateCryptoToken();
    const tokenHash = hashCryptoToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [user.id, tokenHash, expiresAt]
    );

    sendPasswordResetEmail({
      name: user.first_name ? `${user.first_name} ${user.last_name}` : user.email,
      email: user.email,
      resetToken
    }).catch(err => console.error('[Reset Email Error]:', err));

    return { message: 'If an account exists with this email, a password reset link has been dispatched.' };
  }

  /**
   * Reset Password Using Token
   */
  async resetPassword({ token, email, newPassword }) {
    const tokenHash = hashCryptoToken(token);

    const tokenRows = await query(
      `SELECT prt.*, u.id AS user_id, u.email 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token_hash = ? AND prt.is_used = FALSE AND prt.expires_at > NOW() AND u.email = ?
       LIMIT 1`,
      [tokenHash, email.toLowerCase().trim()]
    );

    if (tokenRows.length === 0) {
      const err = new Error('Invalid or expired password reset link.');
      err.statusCode = 400;
      throw err;
    }

    const tokenData = tokenRows[0];
    const newHash = await hashPassword(newPassword);

    return transaction(async (connection) => {
      await connection.execute('UPDATE password_reset_tokens SET is_used = TRUE WHERE id = ?', [tokenData.id]);
      await connection.execute('UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?', [newHash, tokenData.user_id]);
      await connection.execute('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?', [tokenData.user_id]);

      await connection.execute(
        `INSERT INTO audit_logs (user_id, action, module, record_id, description)
         VALUES (?, 'PASSWORD_RESET', 'Auth', ?, 'Password reset via email token')`,
        [tokenData.user_id, String(tokenData.user_id)]
      );

      return { success: true, message: 'Password reset successfully. Please log in with your new credentials.' };
    });
  }
}

module.exports = new AuthService();
