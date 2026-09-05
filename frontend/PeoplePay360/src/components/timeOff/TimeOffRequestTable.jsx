import React from 'react';
import { Check, X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { DataTable } from '../common/DataTable';

export const TimeOffRequestTable = ({
  requests,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onApprove,
  onRefuse,
  canApprove = false
}) => {
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Approved
        </span>
      );
    }
    if (s === 'refused') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Refused
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  };

  const columns = [
    {
      header: 'Employee',
      key: 'employeeName',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-xs border border-purple-200">
            {row.employeeName?.charAt(0) || 'E'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">{row.employeeName}</span>
            <span className="text-[11px] text-slate-400 font-mono">{row.department}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Time Off Type',
      key: 'timeOffTypeName',
      render: (row) => (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {row.timeOffTypeName}
        </span>
      )
    },
    {
      header: 'Start Date',
      key: 'startDate',
      cellClassName: 'font-mono text-xs text-slate-700'
    },
    {
      header: 'End Date',
      key: 'endDate',
      cellClassName: 'font-mono text-xs text-slate-700'
    },
    {
      header: 'Duration',
      key: 'duration',
      render: (row) => (
        <span className="font-bold text-slate-900 font-mono text-xs">
          {row.duration} <span className="text-slate-400 font-normal">{row.unit || 'Days'}</span>
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (row) => getStatusBadge(row.status)
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => {
        const isPending = row.status === 'Pending';
        if (!canApprove) {
          return (
            <span className="text-[11px] text-slate-400 italic">
              {row.status === 'Pending' ? 'Awaiting Review' : 'Processed'}
            </span>
          );
        }

        if (!isPending) {
          return (
            <span className="text-[11px] text-slate-400 font-medium">
              Reviewed by {row.reviewedBy || 'Manager'}
            </span>
          );
        }

        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onApprove(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 transition-colors"
              title="Approve Request"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              type="button"
              onClick={() => onRefuse(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 transition-colors"
              title="Refuse Request"
            >
              <X className="w-3.5 h-3.5" /> Refuse
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={requests}
      totalItems={totalItems}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={onPageChange}
      emptyMessage="No time off requests found"
    />
  );
};
