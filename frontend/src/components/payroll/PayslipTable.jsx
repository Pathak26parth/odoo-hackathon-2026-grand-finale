// components/payroll/PayslipTable.jsx
import React from 'react';
import { Eye, RefreshCw, AlertCircle, Printer, Mail } from 'lucide-react';
import { formatCurrency } from '../../utils/payrollCalculation';

export const PayslipTable = ({
  payslips = [],
  onView,
  onRecompute,
  onPrint,
  isPayrunPaid = false,
  showFullFilters = false
}) => {
  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VALIDATED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPUTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DRAFT':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (payslips.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <p className="text-sm text-slate-500">No payslip records found for this payrun.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
          <tr>
            <th className="py-3 px-4 font-semibold">Employee</th>
            <th className="py-3 px-4 font-semibold text-right">Basic</th>
            <th className="py-3 px-4 font-semibold text-right">Allowances</th>
            <th className="py-3 px-4 font-semibold text-right">Gross</th>
            <th className="py-3 px-4 font-semibold text-right">Deductions</th>
            <th className="py-3 px-4 font-semibold text-right">Net Salary</th>
            <th className="py-3 px-4 font-semibold text-center">Status</th>
            <th className="py-3 px-4 font-semibold">Warnings</th>
            <th className="py-3 px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payslips.map((slip) => {
            const calculatedAllowances = slip.allowances !== undefined ? slip.allowances : Math.max(0, (slip.gross || 0) - (slip.basic || 0));
            return (
            <tr key={slip.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-4">
                <div className="font-bold text-slate-900">{slip.employeeName}</div>
                <div className="text-[11px] text-slate-400">
                  {slip.employeeCode || slip.employeeId} • {slip.department}
                </div>
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-700">
                {formatCurrency(slip.basic)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-indigo-600">
                {formatCurrency(calculatedAllowances)}
              </td>
              <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                {formatCurrency(slip.gross)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-rose-600">
                {formatCurrency(slip.deductions)}
              </td>
              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                {formatCurrency(slip.net)}
              </td>
              <td className="py-3 px-4 text-center">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                    slip.status
                  )}`}
                >
                  {slip.status}
                </span>
              </td>
              <td className="py-3 px-4">
                {slip.warnings && slip.warnings.length > 0 ? (
                  <span
                    title={slip.warnings.join(', ')}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"
                  >
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    {slip.warnings[0]}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">None</span>
                )}
              </td>
              <td className="py-3 px-4 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onView(slip.id)}
                    className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                    title="View Payslip"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {!isPayrunPaid && onRecompute && (
                    <button
                      type="button"
                      onClick={() => onRecompute(slip.id)}
                      className="p-1 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Recompute Payslip"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onPrint && (
                    <button
                      type="button"
                      onClick={() => onPrint(slip.id)}
                      className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Print Payslip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
