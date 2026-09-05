import React from 'react';
import { Check, X, Clock, AlertCircle, Ban } from 'lucide-react';
import { DataTable } from '../common/DataTable';

export const CorrectionRequestsTable = ({
  requests = [],
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onApprove,
  onReject,
  onCancel,
  isHR = false,
  isEmployee = false
}) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <Check className="w-3 h-3" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            <X className="w-3 h-3" /> Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <Ban className="w-3 h-3" /> Cancelled
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
    }
  };

  const columns = [
    ...(isHR
      ? [
          {
            header: 'Employee',
            key: 'employeeName',
            render: (row) => (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
                  {row.employeeName?.charAt(0) || 'E'}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block leading-tight">{row.employeeName}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{row.department}</span>
                </div>
              </div>
            )
          }
        ]
      : []),
    {
      header: 'Date',
      key: 'requestDate',
      cellClassName: 'text-slate-700 font-mono text-xs font-semibold'
    },
    {
      header: 'Proposed Times',
      key: 'proposedTimes',
      render: (row) => (
        <div className="text-xs font-mono">
          <span className="text-emerald-700 font-semibold">{row.proposedCheckIn}</span>
          <span className="text-slate-400 mx-1">→</span>
          <span className="text-emerald-700 font-semibold">{row.proposedCheckOut}</span>
        </div>
      )
    },
    {
      header: 'Original Punches',
      key: 'originalPunches',
      render: (row) => (
        <div className="text-xs font-mono text-slate-500">
          {row.originalCheckIn ? (
            <span>
              {row.originalCheckIn} → {row.originalCheckOut || <span className="text-rose-500">Missing</span>}
            </span>
          ) : (
            <span className="italic text-slate-400">No punch logged</span>
          )}
        </div>
      )
    },
    {
      header: 'Reason / Explanation',
      key: 'reason',
      render: (row) => (
        <div className="max-w-xs text-xs text-slate-700">
          <p className="truncate" title={row.reason}>{row.reason}</p>
          {row.reviewerNotes && (
            <p className="text-[11px] text-slate-500 mt-0.5 italic">
              HR note: {row.reviewerNotes}
            </p>
          )}
        </div>
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
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {isHR && row.status === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => onApprove(row)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                title="Approve & Apply to Attendance"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                type="button"
                onClick={() => onReject(row)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                title="Reject Request"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}

          {isEmployee && row.status === 'PENDING' && (
            <button
              type="button"
              onClick={() => onCancel(row.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Cancel your request"
            >
              <Ban className="w-3 h-3" /> Cancel
            </button>
          )}
        </div>
      )
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
      emptyMessage="No attendance correction requests found."
    />
  );
};
