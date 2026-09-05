import React from 'react';
import { Eye, Edit2, Clock, FileEdit } from 'lucide-react';
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
  onRequestCorrection,
  canEdit = true
}) => {
  const formatTimeDisplay = (timeVal) => {
    if (!timeVal) return null;
    const str = String(timeVal).trim();
    if (/am|pm/i.test(str)) {
      return str.toUpperCase();
    }
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
      const parts = str.split(':');
      let h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return str;
  };

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
      render: (row) => {
        const timeStr = formatTimeDisplay(row.checkIn || row.check_in);
        return (
          <span className="font-mono text-slate-800 text-xs font-medium">
            {timeStr || <span className="text-slate-400 italic">None</span>}
          </span>
        );
      }
    },
    {
      header: 'Check Out',
      key: 'checkOut',
      render: (row) => {
        const timeStr = formatTimeDisplay(row.checkOut || row.check_out);
        return (
          <span className="font-mono text-slate-800 text-xs font-medium">
            {timeStr || <span className="text-rose-500 font-medium">Missing</span>}
          </span>
        );
      }
    },
    {
      header: 'Worked Hours',
      key: 'workedHours',
      render: (row) => {
        const hours = typeof row.workedHours === 'number' ? `${row.workedHours}h` : (row.workedHours || '0h 00m');
        return (
          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{hours}</span>
          </div>
        );
      }
    },
    {
      header: 'Method',
      key: 'attendanceMethod',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {row.attendanceMethod || (row.isManualCorrection || row.isManualEdit ? 'Manual Edit' : 'Portal Entry')}
        </span>
      )
    },
    {
      header: 'Verification',
      key: 'faceVerified',
      render: (row) => (
        row.attendanceMethod === 'Face Recognition' || row.verificationMethod === 'FACE' || row.faceVerified ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Verified ✓
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            Manual
          </span>
        )
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
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onView(row.id)}
            className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {canEdit ? (
            <button
              type="button"
              onClick={() => onEdit(row.id)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          ) : (
            onRequestCorrection && (
              <button
                type="button"
                onClick={() => onRequestCorrection(row)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                title="Request Attendance Correction / Regularization from HR"
              >
                <FileEdit className="w-3 h-3 text-amber-600" />
                <span>Regularize</span>
              </button>
            )
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
