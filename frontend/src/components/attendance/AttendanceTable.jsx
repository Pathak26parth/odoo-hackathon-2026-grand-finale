import React from 'react';
import { Eye, Edit2, Clock } from 'lucide-react';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';
import { DataTable } from '../common/DataTable';

export const AttendanceTable = ({
  records,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onView,
  onEdit,
  canEdit = true
}) => {
  const columns = [
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
    },
    {
      header: 'Date',
      key: 'date',
      cellClassName: 'text-slate-700 font-mono text-xs'
    },
    {
      header: 'Check In',
      key: 'checkIn',
      render: (row) => (
        <span className="font-mono text-slate-800 text-xs font-medium">
          {row.checkIn ? `${row.checkIn} AM` : <span className="text-slate-400 italic">None</span>}
        </span>
      )
    },
    {
      header: 'Check Out',
      key: 'checkOut',
      render: (row) => (
        <span className="font-mono text-slate-800 text-xs font-medium">
          {row.checkOut ? `${row.checkOut} PM` : <span className="text-rose-500 font-medium">Missing</span>}
        </span>
      )
    },
    {
      header: 'Worked Hours',
      key: 'workedHours',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.workedHours || '0h 00m'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (row) => <AttendanceStatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onView(row.id)}
            className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(row.id)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      totalItems={totalItems}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={onPageChange}
      emptyMessage="No attendance records found matching your filters"
    />
  );
};
