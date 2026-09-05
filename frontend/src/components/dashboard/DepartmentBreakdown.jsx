// components/dashboard/DepartmentBreakdown.jsx
import React from 'react';
import { formatCurrency } from '../../utils/payrollCalculation';
import { Building2 } from 'lucide-react';

export const DepartmentBreakdown = ({ departmentRows = [] }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Department Breakdown</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">Full organizational comparison</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Department</th>
              <th className="py-2.5 px-4 font-semibold text-center">Headcount</th>
              <th className="py-2.5 px-4 font-semibold text-right">Total Salary Expenditure</th>
              <th className="py-2.5 px-4 font-semibold text-right">Average Salary</th>
              <th className="py-2.5 px-4 font-semibold text-right">Attendance %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departmentRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">{row.department}</td>
                <td className="py-3 px-4 text-center font-semibold text-slate-700">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100">
                    {row.headcount}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                  {formatCurrency(row.totalExpenditure)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-700">
                  {formatCurrency(row.averageSalary)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                  {row.attendancePct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
