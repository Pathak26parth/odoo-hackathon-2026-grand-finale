// pages/attendance/FaceHistory.jsx
import React, { useState, useEffect } from 'react';
import { getFaceHistory, fetchFaceHistoryAsync } from '../../data/faceAttendance';
import { FaceHistoryTable } from '../../components/faceRecognition/FaceHistoryTable';
import { FACE_ATTENDANCE_PRIVACY_NOTICE } from '../../services/faceRecognitionService';
import { History, Search, Filter, ShieldCheck } from 'lucide-react';

export const FaceHistory = () => {
  const [historyRecords, setHistoryRecords] = useState(getFaceHistory());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    fetchFaceHistoryAsync().then((list) => {
      if (Array.isArray(list)) setHistoryRecords(list);
    }).catch(console.error);
  }, []);

  const filtered = historyRecords.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'All' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Face Attendance History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of all face recognition check-ins, check-outs, and biometric match confidence scores.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by employee, ID, or department..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Event Types</option>
            <option value="Check In">Check In Only</option>
            <option value="Check Out">Check Out Only</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <FaceHistoryTable records={filtered} />

      {/* Privacy Notice Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>{FACE_ATTENDANCE_PRIVACY_NOTICE}</p>
      </div>
    </div>
  );
};
