// components/dashboard/TimeOffOverview.jsx
import React from 'react';
import { CalendarCheck, Clock, CheckCircle2, XCircle, PieChart } from 'lucide-react';

export const TimeOffOverview = ({ timeOffStats = {} }) => {
  const {
    approvedDays = 0,
    pendingRequests = 0,
    refusedRequests = 0,
    remainingBalance = 0
  } = timeOffStats;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Time Off Overview</h3>
          <p className="text-xs text-slate-500">Leave requests and aggregate allocation balance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-semibold text-slate-600">Approved Days</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-bold text-emerald-700">{approvedDays} Days</span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-semibold text-slate-600">Pending Requests</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-bold text-amber-700">{pendingRequests}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-semibold text-slate-600">Refused Requests</span>
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-bold text-rose-700">{refusedRequests}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[11px] font-semibold text-slate-600">Total Leave Balance</span>
            <PieChart className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-bold text-blue-700">{remainingBalance} Days</span>
        </div>
      </div>
    </div>
  );
};
