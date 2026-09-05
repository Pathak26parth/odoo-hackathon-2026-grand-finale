import React from 'react';
import { AlertTriangle, Clock, Edit3, ShieldAlert } from 'lucide-react';

export const AttendanceException = ({ exceptions = [], status }) => {
  let list = Array.isArray(exceptions) ? [...exceptions] : [];

  if (list.length === 0) {
    if (status === 'Missing Check-out' || status === 'Late' || status === 'Manual Edit' || status === 'Absent') {
      list = [status];
    } else {
      return null;
    }
  }

  const getExceptionIcon = (val) => {
    const text = String(val || '').toLowerCase();
    if (text.includes('missing')) return <Clock className="w-4 h-4 text-purple-600 shrink-0" />;
    if (text.includes('late')) return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
    if (text.includes('manual')) return <Edit3 className="w-4 h-4 text-indigo-600 shrink-0" />;
    return <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />;
  };

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
      <div className="flex items-center gap-2 text-amber-900 font-bold">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Attendance Exceptions &amp; Flags</span>
      </div>

      <p className="text-[11px] text-amber-800/90 leading-relaxed">
        This attendance entry has flagged exceptions requiring review or supervisor sign-off:
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        {list.map((exc, i) => {
          const label = typeof exc === 'object' && exc !== null ? (exc.type || exc.message || 'Exception') : String(exc || 'Exception');
          const detail = typeof exc === 'object' && exc !== null && exc.message && exc.message !== label ? exc.message : null;

          return (
            <div
              key={i}
              className="inline-flex flex-col gap-0.5 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-amber-900 font-medium shadow-2xs"
            >
              <div className="inline-flex items-center gap-1.5">
                {getExceptionIcon(label)}
                <span className="font-semibold">{label}</span>
              </div>
              {detail && (
                <span className="text-[10px] text-amber-700/80 font-normal pl-5">
                  {detail}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
