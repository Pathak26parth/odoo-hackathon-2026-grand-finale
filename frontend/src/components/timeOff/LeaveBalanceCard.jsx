import React from 'react';
import { Calendar, PieChart, CheckCircle2 } from 'lucide-react';

export const LeaveBalanceCard = ({
  title = 'Annual Leave',
  allocated = 20,
  taken = 5,
  remaining = 15,
  unit = 'Days',
  subtitle
}) => {
  const percentage = allocated > 0 ? Math.min(100, Math.round((taken / allocated) * 100)) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 leading-tight">{title}</h4>
            {subtitle && <p className="text-[10px] text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
          {remaining} {unit} Left
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs py-1 bg-slate-50 rounded-lg border border-slate-100">
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Allocated
          </span>
          <span className="font-bold text-slate-900">{allocated} {unit}</span>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Taken
          </span>
          <span className="font-bold text-amber-600">{taken} {unit}</span>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Remaining
          </span>
          <span className="font-bold text-emerald-600">{remaining} {unit}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>Usage</span>
          <span>{percentage}% utilized</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentage > 85 ? 'bg-rose-500' : percentage > 50 ? 'bg-amber-500' : 'bg-blue-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
