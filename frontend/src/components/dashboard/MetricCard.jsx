// components/dashboard/MetricCard.jsx
import React from 'react';

export const MetricCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  color = 'text-blue-600',
  bgColor = 'bg-blue-50',
  trend
}) => {
  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-500 truncate">{label}</span>
        <div className={`w-8 h-8 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        <div className="flex items-center gap-1.5 mt-1">
          {trend && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              {trend}
            </span>
          )}
          <span className="text-[11px] text-slate-400 truncate">{subtext}</span>
        </div>
      </div>
    </div>
  );
};
