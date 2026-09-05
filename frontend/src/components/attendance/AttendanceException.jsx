import React from 'react';
import { AlertTriangle, Clock, Edit3, ShieldAlert } from 'lucide-react';

export const AttendanceException = ({ exceptions = [], status }) => {
  if (!exceptions || exceptions.length === 0) {
    if (status === 'Missing Check-out' || status === 'Late' || status === 'Manual Edit' || status === 'Absent') {
      exceptions = [status];
    } else {
      return null;
    }
  }

  const getExceptionIcon = (item) => {
    const text = item.toLowerCase();
    if (text.includes('missing')) return <Clock className="w-4 h-4 text-purple-600" />;
    if (text.includes('late')) return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    if (text.includes('manual')) return <Edit3 className="w-4 h-4 text-indigo-600" />;
    return <ShieldAlert className="w-4 h-4 text-rose-600" />;
  };

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
      <div className="flex items-center gap-2 text-amber-900 font-bold">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <span>Attendance Exceptions &amp; Flags</span>
      </div>

      <p className="text-[11px] text-amber-800/90 leading-relaxed">
        This attendance entry has flagged exceptions requiring review or supervisor sign-off:
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        {exceptions.map((exc, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-amber-900 font-medium shadow-2xs"
          >
            {getExceptionIcon(exc)}
            <span>{exc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
