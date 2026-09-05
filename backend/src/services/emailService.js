const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

if (env.SMTP_HOST && env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD
    }
  });
}

/**
 * Helper to safely send email with fallback logging
 */
async function sendMail({ to, subject, html, text, attachments = [] }) {
  if (!transporter) {
    console.log('\n--- [EMAIL SERVICE: DEV SIMULATION] ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Attachments: ${attachments.length > 0 ? attachments.map(a => a.filename).join(', ') : 'None'}`);
    console.log('Body Preview:\n', text || html.substring(0, 300) + '...');
    console.log('-----------------------------------------\n');
    return { success: true, simulated: true };
  }

  try {
    const fromAddress = env.SMTP_USER
      ? `PeoplePay360 <${env.SMTP_USER}>`
      : (env.MAIL_FROM || 'PeoplePay360 <no-reply@peoplepay360.com>');

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
      attachments
    });
    console.log(`[Email Service] Delivered email to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

function getRoleTitle(roleName) {
  const map = {
    'ADMIN': 'System Administrator',
    'HR_MANAGER': 'HR Manager',
    'HR_PAYROLL_ADMIN': 'HR Payroll Admin',
    'HR_PAYROLL_USER': 'Payroll User',
    'EMPLOYEE': 'Employee'
  };
  return map[String(roleName || '').toUpperCase()] || roleName || 'Employee';
}

/**
 * Send Account Invitation & Credentials Email for ALL roles (Admin, HR Manager, HR Payroll Admin, Payroll User, Employee)
 */
async function sendEmployeeInvitation({ name, email, activationToken, tempPassword, roleName = 'EMPLOYEE' }) {
  const portalUrl = env.FRONTEND_URL;
  const roleTitle = getRoleTitle(roleName);
  const activationUrl = activationToken ? `${portalUrl}/activate?token=${activationToken}&email=${encodeURIComponent(email)}` : `${portalUrl}/login`;

  const subject = `Welcome to PeoplePay360 — Your ${roleTitle} Account Credentials`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
      <div style="background: #1e293b; padding: 18px; border-radius: 6px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">PeoplePay360</h1>
        <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">HR & Payroll Operations Platform</p>
      </div>

      <div style="padding: 24px 0;">
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 8px;">Hello ${name},</h2>
        <p style="color: #334155; line-height: 1.6; margin-top: 0;">
          Your official account with <strong>${roleTitle}</strong> access has been created in the <strong>PeoplePay360</strong> portal.
        </p>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Your Login Credentials</h3>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Portal URL:</strong> <a href="${portalUrl}" style="color: #2563eb;">${portalUrl}</a></p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Login Email:</strong> <strong style="color: #0f172a;">${email}</strong></p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Assigned Role:</strong> <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">${roleTitle}</span></p>
          ${tempPassword ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #475569;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; color: #0f172a; font-size: 15px; font-weight: bold; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px;">${tempPassword}</code></p>` : ''}
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${activationUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Sign In & Access ${roleTitle} Portal
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
          <strong>Security Notice:</strong> Please sign in using your temporary password and set a new personal password on your first login.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} PeoplePay360 HR & Payroll. All rights reserved.
      </div>
    </div>
  `;

  return sendMail({
    to: email,
    subject,
    html,
    text: `Welcome ${name}! Your PeoplePay360 account (${roleTitle}) has been created.\nLogin Email: ${email}\nTemporary Password: ${tempPassword || '(Set upon activation)'}\nLogin at: ${portalUrl}`
  });
}

/**
 * Send Password Reset Token Email
 */
async function sendPasswordResetEmail({ name, email, resetToken }) {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const subject = 'PeoplePay360 — Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a;">Password Reset Request</h2>
      <p style="color: #334155;">Hello ${name},</p>
      <p style="color: #334155;">We received a request to reset your PeoplePay360 portal password. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #64748b; font-size: 13px;">This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
    </div>
  `;

  return sendMail({ to: email, subject, html, text: `Reset your password here: ${resetUrl}` });
}

/**
 * Send Payslip Delivery Email with Attached PDF
 */
async function sendPayslipEmail({ name, email, period, netSalary, pdfBuffer }) {
  const subject = `Your PeoplePay360 Payslip for ${period}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a;">Salary Payslip — ${period}</h2>
      <p style="color: #334155;">Hello ${name},</p>
      <p style="color: #334155;">Your salary for the payroll period <strong>${period}</strong> has been processed.</p>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px; color: #0f172a;"><strong>Net Salary Paid:</strong> ₹ ${parseFloat(netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
      </div>
      <p style="color: #334155;">Please find your detailed payslip attached as a PDF document.</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">PeoplePay360 Automated Payroll Distribution</p>
    </div>
  `;

  const attachments = [
    {
      filename: `Payslip_${period.replace(/\s+/g, '_')}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }
  ];

  return sendMail({ to: email, subject, html, text: `Your payslip for ${period} is attached.`, attachments });
}

/**
 * Send Schedule Notification Email to Employee
 */
async function sendScheduleNotificationEmail({
  employeeEmail,
  employeeName,
  scheduleName,
  scheduleType,
  scheduleStatus,
  weeklyHours,
  days = []
}) {
  const portalUrl = env.FRONTEND_URL;
  const scheduleUrl = `${portalUrl}/working-schedules`;
  const subject = `📢 Official Work Schedule Notification: ${scheduleName} (${scheduleType})`;

  // Build daily rows HTML
  const dayRowsHtml = days.map(d => {
    const isWorking = d.working !== false && parseFloat(d.workHours || d.dailyHours || 0) > 0;
    const dayLabel = d.dayOfWeek ? (d.dayOfWeek.charAt(0) + d.dayOfWeek.slice(1).toLowerCase()) : (d.day || 'Day');
    const timings = isWorking ? `${d.startTime || '09:00'} – ${d.endTime || '18:00'}` : '<span style="color: #94a3b8; font-style: italic;">Off / Weekend</span>';
    const breakLabel = isWorking ? `${d.breakMinutes || Math.round((d.breakDuration || 1) * 60)} mins` : '-';
    const hoursLabel = isWorking ? `${parseFloat(d.workHours || d.dailyHours || 0).toFixed(1)} hrs` : '0.0 hrs';

    return `
      <tr style="border-bottom: 1px solid #f1f5f9; ${!isWorking ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 10px 14px; font-weight: 600; color: #1e293b;">${dayLabel}</td>
        <td style="padding: 10px 14px; color: #334155;">${timings}</td>
        <td style="padding: 10px 14px; color: #64748b; text-align: center;">${breakLabel}</td>
        <td style="padding: 10px 14px; font-weight: 600; color: ${isWorking ? '#2563eb' : '#94a3b8'}; text-align: right;">${hoursLabel}</td>
      </tr>
    `;
  }).join('');

  const statusBadgeColor = String(scheduleStatus).toUpperCase() === 'ACTIVE'
    ? 'background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;'
    : 'background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; border-radius: 8px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">PeoplePay360</h1>
        <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">HR & Attendance Operations</p>
      </div>

      <div style="padding: 24px 8px 16px 8px;">
        <h2 style="color: #0f172a; font-size: 19px; margin-top: 0;">Work Schedule Assigned / Updated</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Hello <strong>${employeeName}</strong>,
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          A working schedule matching your employment profile (Type: <strong>${scheduleType}</strong>, Status: <strong>${scheduleStatus}</strong>) has been configured in the PeoplePay360 portal.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;">Schedule Name:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${scheduleName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Schedule Type:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #2563eb;">${scheduleType}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Status:</td>
              <td style="padding: 6px 0;">
                <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; ${statusBadgeColor}">
                  ${scheduleStatus}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Total Weekly Hours:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${weeklyHours} hrs / week</td>
            </tr>
          </table>
        </div>

        <h3 style="color: #0f172a; font-size: 15px; margin: 24px 0 12px 0;">Weekly Shift Breakdown</h3>
        <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 10px 14px; color: #475569; font-weight: 600;">Day</th>
                <th style="padding: 10px 14px; color: #475569; font-weight: 600;">Shift Hours</th>
                <th style="padding: 10px 14px; color: #475569; font-weight: 600; text-align: center;">Break</th>
                <th style="padding: 10px 14px; color: #475569; font-weight: 600; text-align: right;">Net Hours</th>
              </tr>
            </thead>
            <tbody>
              ${dayRowsHtml}
            </tbody>
          </table>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 20px;">
          * Please verify your daily attendance clock-in and clock-out align with the assigned hours. If you notice any discrepancy or require shift adjustments, please contact your manager or HR administrator.
        </p>

        <div style="text-align: center; margin: 28px 0 16px 0;">
          <a href="${scheduleUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            View Schedule on Portal
          </a>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 12px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} PeoplePay360 HR & Payroll. All rights reserved.
      </div>
    </div>
  `;

  const plainText = `Hello ${employeeName},\n\nA working schedule (${scheduleName} - ${scheduleType}, Status: ${scheduleStatus}) has been set in PeoplePay360 with total weekly hours: ${weeklyHours} hrs/week.\n\nPlease check your schedule details at: ${scheduleUrl}`;

  return sendMail({
    to: employeeEmail,
    subject,
    html,
    text: plainText
  });
}

/**
 * Send Profile / Email Updated Notification Email for ALL roles
 */
async function sendEmployeeEmailUpdated({ name, oldEmail, newEmail, employeeCode, jobPosition, departmentName, roleName = 'EMPLOYEE', tempPassword, activationToken }) {
  const portalUrl = env.FRONTEND_URL;
  const roleTitle = getRoleTitle(roleName);
  const loginUrl = `${portalUrl}/login`;
  const activationUrl = activationToken ? `${portalUrl}/activate?token=${activationToken}&email=${encodeURIComponent(newEmail)}` : loginUrl;

  const subject = `PeoplePay360 — Your ${roleTitle} Profile & Login Email Updated`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
      <div style="background: #1e293b; padding: 18px; border-radius: 6px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">PeoplePay360</h1>
        <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">HR & Payroll Operations Platform</p>
      </div>

      <div style="padding: 24px 0;">
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 8px;">Hello ${name},</h2>
        <p style="color: #334155; line-height: 1.6; margin-top: 0;">
          Your official account email on the <strong>PeoplePay360</strong> portal has been updated.
        </p>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Updated Login Details</h3>
          ${employeeCode ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Employee ID:</strong> ${employeeCode}</p>` : ''}
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Updated Login Email:</strong> <strong style="color: #2563eb;">${newEmail}</strong></p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Assigned Role:</strong> <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">${roleTitle}</span></p>
          ${jobPosition ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Job Position:</strong> ${jobPosition}</p>` : ''}
          ${departmentName ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Department:</strong> ${departmentName}</p>` : ''}
          ${tempPassword ? `<p style="margin: 10px 0 0 0; font-size: 14px; color: #475569;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; color: #0f172a; font-size: 15px; font-weight: bold; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px;">${tempPassword}</code></p>` : ''}
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${activationUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Sign In to ${roleTitle} Portal
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
          If you did not authorize this change, please contact your HR administrator immediately.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} PeoplePay360 HR & Payroll. All rights reserved.
      </div>
    </div>
  `;

  return sendMail({
    to: newEmail,
    subject,
    html,
    text: `Hello ${name}, your PeoplePay360 account (${roleTitle}) email has been updated to ${newEmail}.\nTemporary Password: ${tempPassword || '(Existing password retained)'}\nLogin at: ${portalUrl}`
  });
}

/**
 * Send Employee Termination / Employment Relieved Notice Email
 */
async function sendEmployeeTerminationEmail({ name, email, employeeCode, jobPosition, departmentName }) {
  const portalUrl = env.FRONTEND_URL;
  const effectiveDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `PeoplePay360 — Official Notice of Employment Termination (Employee ID: ${employeeCode || '—'})`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
      <div style="background: #1e293b; padding: 18px; border-radius: 6px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">PeoplePay360</h1>
        <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">HR & Payroll Operations Platform</p>
      </div>

      <div style="padding: 24px 0;">
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 8px;">Dear ${name},</h2>
        <p style="color: #334155; line-height: 1.6; margin-top: 0;">
          This email serves as official notification that your employment / service with the organization has been <strong>terminated</strong>, effective immediately.
        </p>

        <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #9f1239; border-bottom: 1px solid #ffe4e6; padding-bottom: 6px;">Termination Record Details</h3>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Employee Name:</strong> ${name}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Employee ID:</strong> ${employeeCode || '—'}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Job Position:</strong> ${jobPosition || 'Employee'}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Department:</strong> ${departmentName || 'General'}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Effective Date:</strong> ${effectiveDate}</p>
          <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Employment Status:</strong> <span style="background: #ffe4e6; color: #be123c; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">TERMINATED / RELIEVED</span></p>
        </div>

        <p style="color: #334155; line-height: 1.6;">
          Your portal access and employee account credentials have been deactivated in accordance with company policy.
        </p>

        <p style="color: #334155; line-height: 1.6;">
          Please coordinate with the Human Resources and Payroll departments regarding exit clearance, return of company assets, and processing of your final settlement and benefits.
        </p>

        <p style="color: #64748b; font-size: 12px; margin-top: 24px; line-height: 1.5;">
          If you have any questions regarding your exit clearance or final settlement, please contact the HR department.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} PeoplePay360 HR & Payroll Operations. All rights reserved.
      </div>
    </div>
  `;

  return sendMail({
    to: email,
    subject,
    html,
    text: `Dear ${name},\n\nThis is an official notice that your employment has been terminated effective ${effectiveDate}.\nEmployee ID: ${employeeCode}\nPosition: ${jobPosition}\n\nYour portal access has been deactivated. Please contact HR for exit clearance and final settlement.\n\nPeoplePay360 HR Operations`
  });
}

module.exports = {
  sendMail,
  sendEmployeeInvitation,
  sendEmployeeEmailUpdated,
  sendEmployeeTerminationEmail,
  sendPasswordResetEmail,
  sendPayslipEmail,
  sendScheduleNotificationEmail
};
