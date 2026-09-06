// components/dashboard/MetricCard.jsx
import React from 'react';

export const MetricCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  color = 'text-blue-600',
  bgColor = 'bg-blue-50',
  trend,
  trendColor
}) => {
  const getTrendStyle = () => {
    if (trendColor) return trendColor;
    if (!trend) return 'text-slate-600 bg-slate-50 border-slate-200';
    const s = String(trend).trim();
    if (s.startsWith('-') || s.toLowerCase() === 'critical') {
      return 'text-rose-700 bg-rose-50 border-rose-200';
    }
    if (s.toLowerCase() === 'warning' || s === '0.0%' || s === '+0.0%') {
      return 'text-amber-700 bg-amber-50 border-amber-200';
    }
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs">
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
            <span className={`text-[11px] font-semibold px-1.5 py-0.2 rounded border ${getTrendStyle()}`}>
              {trend}
            </span>
          )}
          <span className="text-[11px] text-slate-400 truncate">{subtext}</span>
        </div>
      </div>
    </div>
  );
};
