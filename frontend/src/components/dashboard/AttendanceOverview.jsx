// components/dashboard/AttendanceOverview.jsx
import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Sparkles, UserCheck, AlertTriangle } from 'lucide-react';

export const AttendanceOverview = ({ attendanceStats = {} }) => {
  const {
    present = 45,
    late = 3,
    absent = 1,
    overtime = 4,
    missingCheckouts = 2,
    manualEdits = 1,
    faceRecognitionCheckins = 38,
    coverage = 97.8
  } = attendanceStats;

  const items = [
    { label: 'Present', count: present, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Late', count: late, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Absent', count: absent, color: 'text-rose-700', bg: 'bg-rose-50' },
    { label: 'Overtime', count: overtime, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Missing Check-outs', count: missingCheckouts, color: 'text-purple-700', bg: 'bg-purple-50' },
    { label: 'Manual Edits', count: manualEdits, color: 'text-slate-700', bg: 'bg-slate-100' },
    {
      label: 'Face Recognition',
      count: faceRecognitionCheckins,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      icon: Sparkles
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Attendance Overview</h3>
          <p className="text-xs text-slate-500">Live operational workforce adherence</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Coverage</span>
          <span className="text-sm font-bold font-mono text-emerald-600">{coverage}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {items.map((item, idx) => (
          <div key={idx} className={`p-3 rounded-xl border border-slate-100 ${item.bg} flex flex-col justify-between`}>
            <span className="text-[11px] font-semibold text-slate-600 truncate">{item.label}</span>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-lg font-black ${item.color}`}>{item.count}</span>
              {item.icon && <item.icon className="w-3.5 h-3.5 text-blue-600" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
