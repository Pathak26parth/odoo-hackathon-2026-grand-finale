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

module.exports = {
  sendMail,
  sendEmployeeInvitation,
  sendPasswordResetEmail,
  sendPayslipEmail,
  sendScheduleNotificationEmail
};
