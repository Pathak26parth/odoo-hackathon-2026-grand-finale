// components/payroll/PayrunWarnings.jsx
import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const PayrunWarnings = ({ warnings = [], isBlocking = false }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div
      className={`p-4 rounded-xl border shadow-2xs ${
        isBlocking
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : 'bg-amber-50/80 border-amber-200 text-amber-900'
      }`}
    >
      <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wider">
        <AlertTriangle className={`w-4 h-4 ${isBlocking ? 'text-rose-600' : 'text-amber-600'}`} />
        <span>
          {isBlocking ? 'Blocking Validation Issues Detected' : 'Payroll Validation Warnings'}
        </span>
        <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/60">
          {warnings.length} issue{warnings.length > 1 ? 's' : ''}
        </span>
      </div>

      <ul className="space-y-1.5 text-xs">
        {warnings.map((warn, index) => {
          const text = typeof warn === 'string' ? warn : warn.message || warn.type;
          return (
            <li key={index} className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span className="leading-tight">{text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
