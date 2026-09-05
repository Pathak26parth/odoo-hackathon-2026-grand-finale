const PDFDocument = require('pdfkit');

/**
 * Generate a professional Payslip PDF as a readable stream / buffer
 * @param {Object} payslip - Comprehensive payslip object with employee, lines, company info
 * @returns {Promise<Buffer>}
 */
function generatePayslipPDF(payslip) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Header ---
      doc.rect(40, 40, 515, 60).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('PEOPLEPAY360', 60, 55);
      doc.fontSize(10).font('Helvetica').text('CONFIDENTIAL SALARY PAYSLIP', 60, 80);

      doc.fillColor('#94A3B8').fontSize(9).text(`Payslip Ref: ${payslip.payslip_code || 'PS-' + payslip.id}`, 380, 55, { align: 'right' });
      doc.text(`Period: ${payslip.period_start} to ${payslip.period_end}`, 380, 70, { align: 'right' });
      doc.text(`Status: ${payslip.payment_status || 'PAID'}`, 380, 85, { align: 'right' });

      doc.moveDown(2);

      // --- Employee & Salary Metadata Grid ---
      const startY = 120;
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('EMPLOYEE DETAILS', 40, startY);
      doc.font('Helvetica').fontSize(9).fillColor('#334155');

      const leftColX = 40;
      const rightColX = 300;
      let curY = startY + 20;

      doc.text(`Employee Code: ${payslip.employee_code}`, leftColX, curY);
      doc.text(`Department: ${payslip.department_name || 'N/A'}`, rightColX, curY);
      curY += 15;

      doc.text(`Name: ${payslip.first_name} ${payslip.last_name}`, leftColX, curY);
      doc.text(`Job Position: ${payslip.job_position || 'N/A'}`, rightColX, curY);
      curY += 15;

      doc.text(`Email: ${payslip.email}`, leftColX, curY);
      doc.text(`Bank Account: ${payslip.bank_account_masked || 'On Record'}`, rightColX, curY);
      curY += 15;

      doc.text(`Structure: ${payslip.structure_name || 'Regular Salary'}`, leftColX, curY);
      doc.text(`Worked Days: ${payslip.worked_days} / ${payslip.total_working_days || 30}`, rightColX, curY);
      curY += 25;

      // --- Salary Rules Table ---
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('SALARY COMPUTATION BREAKDOWN', 40, curY);
      curY += 18;

      // Table Header
      doc.rect(40, curY, 515, 22).fill('#F1F5F9');
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
      doc.text('Seq', 50, curY + 6);
      doc.text('Rule / Component', 90, curY + 6);
      doc.text('Category', 280, curY + 6);
      doc.text('Code', 380, curY + 6);
      doc.text('Amount (INR)', 450, curY + 6, { width: 95, align: 'right' });
      curY += 25;

      // Table Rows
      doc.font('Helvetica').fontSize(9).fillColor('#334155');
      const lines = payslip.lines || [];

      lines.forEach((line, idx) => {
        if (idx % 2 === 1) {
          doc.rect(40, curY - 3, 515, 18).fill('#F8FAFC');
          doc.fillColor('#334155');
        }

        doc.text(String(line.sequence || idx + 1), 50, curY);
        doc.text(line.name, 90, curY);
        doc.text(line.category, 280, curY);
        doc.text(line.code, 380, curY);

        const amt = parseFloat(line.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        doc.text(`₹ ${amt}`, 450, curY, { width: 95, align: 'right' });
        curY += 18;
      });

      curY += 10;
      doc.moveTo(40, curY).lineTo(555, curY).strokeColor('#CBD5E1').stroke();
      curY += 15;

      // --- Summary Box ---
      doc.rect(280, curY, 275, 80).fill('#F8FAFC');
      doc.rect(280, curY, 275, 80).strokeColor('#E2E8F0').stroke();

      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
      doc.text('Gross Earnings:', 300, curY + 12);
      doc.text(`₹ ${parseFloat(payslip.gross_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 430, curY + 12, { width: 115, align: 'right' });

      doc.text('Total Deductions:', 300, curY + 30);
      doc.text(`₹ ${parseFloat(payslip.deduction_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 430, curY + 30, { width: 115, align: 'right' });

      doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold');
      doc.text('NET SALARY PAID:', 300, curY + 52);
      doc.fillColor('#16A34A').text(`₹ ${parseFloat(payslip.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 430, curY + 52, { width: 115, align: 'right' });

      // --- Footer ---
      doc.fillColor('#94A3B8').fontSize(8).font('Helvetica');
      doc.text('This is a computer-generated document from PeoplePay360 HR & Payroll Platform. No signature is required.', 40, 760, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generatePayslipPDF
};
