// components/payroll/PayslipPrint.jsx
import React from 'react';
import { Printer, X } from 'lucide-react';
import { formatCurrency } from '../../utils/payrollCalculation';

export const PayslipPrint = ({ payslip, onClose }) => {
  if (!payslip) return null;

  const handlePrint = () => {
    window.print();
  };

  const earnings = (payslip.lines || []).filter(
    (l) => l.category === 'Basic' || l.category === 'Allowances'
  );
  const deductions = (payslip.lines || []).filter((l) => l.category === 'Deductions');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex justify-center p-4 sm:p-6">
      <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl flex flex-col my-auto overflow-hidden">
        {/* Action Toolbar (Hidden during print) */}
        <div className="no-print flex items-center justify-between p-4 bg-slate-800 text-white border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Printable Payslip Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable A4 Content Area */}
        <div id="printable-payslip" className="p-8 sm:p-12 text-slate-800 bg-white space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                  P
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  People<span className="text-blue-600">Pay</span>360
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                HR &amp; Payroll Management System
              </p>
              <p className="text-[11px] text-slate-400 mt-1">100 Enterprise Way, Tech Park, Suite 400</p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 tracking-wider block">
                PAYSLIP
              </span>
              <span className="text-xs font-mono font-semibold text-slate-600 block mt-0.5">
                {payslip.slipNumber}
              </span>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
                {payslip.status}
              </span>
            </div>
          </div>

          {/* Employee & Payroll Metadata */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Employee Information
              </h4>
              <div>
                <span className="text-slate-500 block text-[11px]">Employee Name:</span>
                <strong className="text-slate-900 text-sm">{payslip.employeeName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Employee ID:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {payslip.employeeCode || payslip.employeeId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Department / Position:</span>
                <span className="text-slate-800">
                  {payslip.department} — {payslip.position}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payroll Period Details
              </h4>
              <div>
                <span className="text-slate-500 block text-[11px]">Pay Period:</span>
                <span className="font-semibold text-slate-900">{payslip.period}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Payrun:</span>
                <span className="text-slate-800">{payslip.payrunName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Working Days:</span>
                <span className="font-semibold text-slate-800">{payslip.workedDays || 22} Days</span>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-2 gap-6">
            {/* Earnings */}
            <div>
              <div className="bg-slate-100 px-3 py-1.5 rounded-t-lg font-bold text-xs uppercase tracking-wider text-slate-700">
                Earnings
              </div>
              <div className="border border-slate-200 rounded-b-lg divide-y divide-slate-100 text-xs">
                {earnings.length > 0 ? (
                  earnings.map((e, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <span className="text-slate-700 font-medium">{e.name}</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-2.5 flex items-center justify-between">
                      <span className="text-slate-700">Basic Salary</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatCurrency(payslip.basic)}
                      </span>
                    </div>
                    <div className="p-2.5 flex items-center justify-between">
                      <span className="text-slate-700">Allowances</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatCurrency(payslip.allowances)}
                      </span>
                    </div>
                  </>
                )}
                <div className="p-2.5 flex items-center justify-between font-bold bg-slate-50/70">
                  <span className="text-slate-900">Gross Salary</span>
                  <span className="font-mono text-blue-700">{formatCurrency(payslip.gross)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <div className="bg-slate-100 px-3 py-1.5 rounded-t-lg font-bold text-xs uppercase tracking-wider text-slate-700">
                Deductions
              </div>
              <div className="border border-slate-200 rounded-b-lg divide-y divide-slate-100 text-xs">
                {deductions.length > 0 ? (
                  deductions.map((d, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <span className="text-slate-700 font-medium">{d.name}</span>
                      <span className="font-mono font-semibold text-rose-600">
                        {formatCurrency(d.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-2.5 flex items-center justify-between">
                    <span className="text-slate-700">Total Deductions</span>
                    <span className="font-mono font-semibold text-rose-600">
                      {formatCurrency(payslip.deductions)}
                    </span>
                  </div>
                )}
                <div className="p-2.5 flex items-center justify-between font-bold bg-slate-50/70">
                  <span className="text-slate-900">Total Deductions</span>
                  <span className="font-mono text-rose-600">{formatCurrency(payslip.deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NET SALARY ROW */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                Total Net Disbursement
              </span>
              <h3 className="text-sm font-bold text-white tracking-wide">NET SALARY PAYABLE</h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {formatCurrency(payslip.net)}
              </span>
            </div>
          </div>

          {/* Footer & Signature lines */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <div className="h-10 border-b border-dashed border-slate-300 w-48 mb-1" />
              <p className="font-medium text-slate-700">Employer Authorized Signature</p>
              <p className="text-[10px] text-slate-400">PeoplePay360 Payroll Division</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="h-10 border-b border-dashed border-slate-300 w-48 mb-1" />
              <p className="font-medium text-slate-700">Employee Signature</p>
              <p className="text-[10px] text-slate-400">Received &amp; Verified</p>
            </div>
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-400">
            This payslip is a system-generated document compliant with PeoplePay360 enterprise payroll guidelines.
          </div>
        </div>
      </div>
    </div>
  );
};
