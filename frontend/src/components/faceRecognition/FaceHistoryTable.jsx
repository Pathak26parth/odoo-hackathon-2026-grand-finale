// components/faceRecognition/FaceHistoryTable.jsx
import React from 'react';
import { CheckCircle2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const FaceHistoryTable = ({ records = [] }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <p className="text-sm text-slate-500">No face attendance history records found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
          <tr>
            <th className="py-3 px-4 font-semibold">Employee</th>
            <th className="py-3 px-4 font-semibold">Date</th>
            <th className="py-3 px-4 font-semibold">Time</th>
            <th className="py-3 px-4 font-semibold">Type</th>
            <th className="py-3 px-4 font-semibold">Method</th>
            <th className="py-3 px-4 font-semibold">Verification</th>
            <th className="py-3 px-4 font-semibold text-right">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-4">
                <div className="font-semibold text-slate-900">{r.employeeName}</div>
                <div className="text-[11px] text-slate-400">{r.employeeId} • {r.department}</div>
              </td>
              <td className="py-3 px-4 whitespace-nowrap text-slate-700">{r.date}</td>
              <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">{r.time}</td>
              <td className="py-3 px-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    r.type === 'Check In'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {r.type === 'Check In' ? (
                    <ArrowDownLeft className="w-3 h-3 text-blue-500" />
                  ) : (
                    <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  )}
                  {r.type}
                </span>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <span className="text-slate-700 font-medium">{r.method || 'Face Recognition'}</span>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {r.verification || 'Verified'}
                </span>
              </td>
              <td className="py-3 px-4 whitespace-nowrap text-right font-semibold text-slate-900">
                {r.confidence}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
