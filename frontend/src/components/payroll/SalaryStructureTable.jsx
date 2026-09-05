import React from 'react';
import { Eye, Edit2, Trash2, Layers, Users, SlidersHorizontal } from 'lucide-react';
import { DataTable } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';

export const SalaryStructureTable = ({
  structures,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  canManage = true
}) => {
  const columns = [
    {
      header: 'Structure Name',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">{row.name}</span>
            <span className="text-[11px] text-slate-400 font-mono">{row.id}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Description',
      key: 'description',
      cellClassName: 'text-slate-600 text-xs max-w-sm truncate'
    },
    {
      header: 'Number of Rules',
      key: 'ruleCount',
      align: 'center',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <SlidersHorizontal className="w-3 h-3 text-slate-500" />
          {row.ruleCount ?? row.ruleIds?.length ?? 0} Rules
        </span>
      )
    },
    {
      header: 'Assigned Employees',
      key: 'assignedEmployees',
      align: 'center',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-slate-700 font-semibold text-xs">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          {row.assignedEmployees ?? 0} Staff
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />
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
            title="View Structure"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => onEdit(row.id)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(row)}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete Structure"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={structures}
      totalItems={totalItems}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={onPageChange}
      emptyMessage="No salary structures configured"
    />
  );
};
