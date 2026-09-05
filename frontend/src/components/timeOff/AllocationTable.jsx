import React from 'react';
import { Eye, Edit2, Calendar, PieChart } from 'lucide-react';
import { DataTable } from '../common/DataTable';

export const AllocationTable = ({
  allocations,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  canManage = true
}) => {
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active' || s === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {status}
        </span>
      );
    }
    if (s === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {status}
      </span>
    );
  };

  const columns = [
    {
      header: 'Employee',
      key: 'employeeName',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-xs border border-amber-200">
            {row.employeeName?.charAt(0) || 'E'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">{row.employeeName}</span>
            <span className="text-[11px] text-slate-400 font-mono">{row.id}</span>
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
      header: 'Allocated',
      key: 'allocated',
      render: (row) => (
        <span className="font-bold text-slate-900 font-mono text-xs">
          {row.allocated} <span className="text-slate-400 font-normal">{row.unit || 'Days'}</span>
        </span>
      )
    },
    {
      header: 'Taken',
      key: 'taken',
      render: (row) => (
        <span className="font-bold text-amber-600 font-mono text-xs">
          {row.taken} <span className="text-slate-400 font-normal">{row.unit || 'Days'}</span>
        </span>
      )
    },
    {
      header: 'Remaining',
      key: 'remaining',
      render: (row) => (
        <span className="font-extrabold text-emerald-700 font-mono text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {row.remaining} {row.unit || 'Days'}
        </span>
      )
    },
    {
      header: 'Valid From',
      key: 'validFrom',
      cellClassName: 'font-mono text-xs text-slate-700'
    },
    {
      header: 'Valid Until',
      key: 'validUntil',
      cellClassName: 'font-mono text-xs text-slate-700'
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (row) => getStatusBadge(row.status)
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={allocations}
      totalItems={totalItems}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={onPageChange}
      emptyMessage="No time off allocations found"
    />
  );
};
