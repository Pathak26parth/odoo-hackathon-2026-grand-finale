// components/dashboard/PayrollAlerts.jsx
import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

export const PayrollAlerts = ({ alerts = [] }) => {
  const displayAlerts = alerts;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">Payroll &amp; Compliance Alerts</h3>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${displayAlerts.length > 0
          ? 'text-amber-700 bg-amber-50 border-amber-200'
          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          }`}>
          {displayAlerts.length > 0 ? `${displayAlerts.length} Action Items` : 'All Clear'}
        </span>
      </div>

      <div className="space-y-2.5">
        {displayAlerts.length === 0 ? (
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-900 flex items-center gap-2.5 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">All Compliance &amp; Payroll Checks Clear</span>
              <span className="text-[11px] text-emerald-700">No pending alerts, missing bank details, or contract gaps detected.</span>
            </div>
          </div>
        ) : (
          displayAlerts.map((item, idx) => {
            const isWarning = item.level === 'warning' || !item.level;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${isWarning
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-blue-50/70 border-blue-200 text-blue-900'
                  }`}
              >
                {isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-bold block leading-tight">{item.type}</span>
                  <span className="text-[11px] opacity-90 leading-normal">{item.message}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
