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
    const info = await transporter.sendMail({
      from: env.MAIL_FROM,
      to,
      subject,
      text,
      html,
      attachments
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Employee Portal Invitation Email
 */
async function sendEmployeeInvitation({ name, email, activationToken, tempPassword }) {
  const portalUrl = env.FRONTEND_URL;
  const activationUrl = `${portalUrl}/activate?token=${activationToken}&email=${encodeURIComponent(email)}`;

  const subject = 'Welcome to PeoplePay360 — Activate Your Employee Account';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
      <div style="background: #1e293b; padding: 16px; border-radius: 6px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">PeoplePay360</h1>
        <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">HR & Payroll Operations Platform</p>
      </div>

      <div style="padding: 24px 0;">
        <h2 style="color: #0f172a; font-size: 18px;">Hello ${name},</h2>
        <p style="color: #334155; line-height: 1.6;">
          Your official employee profile has been registered in the <strong>PeoplePay360</strong> portal.
          Please activate your account to access your employee self-service dashboard, attendance check-in, and payslips.
        </p>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Login Email:</strong> ${email}</p>
          ${tempPassword ? `<p style="margin: 0; font-size: 14px; color: #475569;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Activate Account & Set Password
          </a>
        </div>

        <p style="color: #64748b; font-size: 13px;">
          Note: This activation link will expire in 24 hours. If you did not expect this email, please contact your HR department.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} PeoplePay360 HR & Payroll. All rights reserved.
      </div>
    </div>
  `;

  return sendMail({ to: email, subject, html, text: `Welcome ${name}! Please activate your PeoplePay360 account at: ${activationUrl}` });
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

module.exports = {
  sendMail,
  sendEmployeeInvitation,
  sendPasswordResetEmail,
  sendPayslipEmail
};
