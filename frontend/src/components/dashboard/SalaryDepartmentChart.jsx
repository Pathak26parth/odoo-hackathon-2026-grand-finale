// components/dashboard/SalaryDepartmentChart.jsx
import React from 'react';
import { formatCurrency } from '../../utils/payrollCalculation';

export const SalaryDepartmentChart = ({ data = [] }) => {
  // data: [{ department: 'Engineering', amount: 480000, percentage: 38 }, ...]
  const maxAmount = Math.max(...data.map((d) => d.amount), 100000);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Salary Cost by Department</h3>
          <p className="text-xs text-slate-500">Expenditure distribution across operational units</p>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {data.map((item, idx) => {
          const widthPct = Math.round((item.amount / maxAmount) * 100);
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{item.department}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="text-[11px] text-slate-400 w-9 text-right font-medium">
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Bar track */}
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-blue-600"
                  style={{ width: `${Math.max(widthPct, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
