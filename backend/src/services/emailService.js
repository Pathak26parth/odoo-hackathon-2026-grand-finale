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

module.exports = {
  sendMail,
  sendEmployeeInvitation,
  sendEmployeeEmailUpdated,
  sendPasswordResetEmail,
  sendPayslipEmail
};
