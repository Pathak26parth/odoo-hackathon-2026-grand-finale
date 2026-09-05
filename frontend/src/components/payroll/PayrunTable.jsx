// components/payroll/PayrunTable.jsx
import React from 'react';
import { Eye, Trash2, Calendar, Users, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/payrollCalculation';

export const PayrunTable = ({
  payruns = [],
  onView,
  onDelete,
  canDelete = false
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

  if (payruns.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <p className="text-sm text-slate-500">No payruns found matching the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
          <tr>
            <th className="py-3 px-4 font-semibold">Payrun Name</th>
            <th className="py-3 px-4 font-semibold">Salary Structure</th>
            <th className="py-3 px-4 font-semibold">Period</th>
            <th className="py-3 px-4 font-semibold text-center">Employees</th>
            <th className="py-3 px-4 font-semibold text-right">Total Gross</th>
            <th className="py-3 px-4 font-semibold text-right">Total Deductions</th>
            <th className="py-3 px-4 font-semibold text-right">Total Net</th>
            <th className="py-3 px-4 font-semibold text-center">Status</th>
            <th className="py-3 px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payruns.map((p) => {
            const isDraft = (p.status || '').toUpperCase() === 'DRAFT';
            return (
              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">
                  <button
                    type="button"
                    onClick={() => onView(p.id)}
                    className="hover:text-blue-600 transition-colors text-left"
                  >
                    {p.name}
                  </button>
                  {p.warnings && p.warnings.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium mt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {p.warnings.length} warning{p.warnings.length > 1 ? 's' : ''}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {p.salaryStructureName || p.structure || 'Standard Monthly Salary'}
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                  {p.periodStart} &rarr; {p.periodEnd}
                </td>
                <td className="py-3 px-4 text-center font-semibold text-slate-800">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    <Users className="w-3 h-3 text-slate-400" />
                    {p.employeeCount ?? p.payslipsCount ?? p.selectedEmployeeIds?.length ?? 0}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-medium text-slate-900">
                  {formatCurrency(p.totalGross)}
                </td>
                <td className="py-3 px-4 text-right font-medium text-rose-600">
                  {formatCurrency(p.totalDeductions)}
                </td>
                <td className="py-3 px-4 text-right font-bold text-emerald-700">
                  {formatCurrency(p.totalNet)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                      p.status
                    )}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onView(p.id)}
                      className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="View Payrun"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canDelete && isDraft && (
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Draft Payrun"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
