import React from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { DataTable } from '../common/DataTable';
import { StatusBadge } from '../common/StatusBadge';
import { SalaryCategoryBadge } from './SalaryCategoryBadge';

export const SalaryRuleTable = ({
  rules,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  canManage = true
}) => {
  const getComputationBadge = (type) => {
    let color = 'bg-slate-100 text-slate-700 border-slate-200';
    if (type === 'Percentage') color = 'bg-amber-50 text-amber-700 border-amber-200';
    if (type === 'Formula') color = 'bg-purple-50 text-purple-700 border-purple-200';
    if (type === 'Fixed Amount') color = 'bg-blue-50 text-blue-700 border-blue-200';

    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${color}`}>
        {type}
      </span>
    );
  };

  const columns = [
    {
      header: 'Seq',
      key: 'sequence',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
          {row.sequence}
        </span>
      )
    },
    {
      header: 'Rule Name',
      key: 'name',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block leading-tight">{row.name}</span>
          <span className="text-[11px] text-slate-400 font-mono">{row.description || row.code}</span>
        </div>
      )
    },
    {
      header: 'Code',
      key: 'code',
      render: (row) => (
        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
          {row.code}
        </span>
      )
    },
    {
      header: 'Category',
      key: 'category',
      render: (row) => <SalaryCategoryBadge category={row.category} />
    },
    {
      header: 'Computation Type',
      key: 'computationType',
      render: (row) => getComputationBadge(row.computationType)
    },
    {
      header: 'Value / Computation',
      key: 'valueDisplay',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-800">
          {row.valueDisplay || (row.amount ? `₹${row.amount}` : row.formula || '—')}
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
            title="View Details"
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
                title="Delete Rule"
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
      data={rules}
      totalItems={totalItems}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={onPageChange}
      emptyMessage="No salary rules defined"
    />
  );
};
