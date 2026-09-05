import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Eye, Trash2, CalendarCheck, Check, DollarSign } from 'lucide-react';
import { getTimeOffTypes, deleteTimeOffType } from '../../data/timeOffTypes';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const TimeOffTypes = () => {
  const navigate = useNavigate();
  const { isHRorAdmin } = useAuth();

  const [types, setTypes] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null
  });

  const loadData = () => {
    setTypes(getTimeOffTypes());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeletePrompt = (item) => {
    setDeleteModal({
      isOpen: true,
      item
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.item) return;
    deleteTimeOffType(deleteModal.item.id);
    setToastMessage(`Time off type "${deleteModal.item.name}" removed.`);
    loadData();
    setTimeout(() => setToastMessage(''), 3500);
  };

  const columns = [
    {
      header: 'Name',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">{row.name}</span>
            <span className="text-[11px] text-slate-400 font-mono">{row.id}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Unit',
      key: 'unit',
      render: (row) => (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {row.unit}
        </span>
      )
    },
    {
      header: 'Requires Allocation',
      key: 'requiresAllocation',
      align: 'center',
      render: (row) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
            row.requiresAllocation
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {row.requiresAllocation ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      header: 'Approval Required',
      key: 'requiresApproval',
      align: 'center',
      render: (row) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
            row.requiresApproval
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {row.requiresApproval ? 'Yes' : 'Auto-approved'}
        </span>
      )
    },
    {
      header: 'Payroll Integration',
      key: 'payrollIntegration',
      render: (row) =>
        row.payrollIntegration ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <DollarSign className="w-3 h-3 text-blue-600" />
            Affects Payroll Calculation
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Independent</span>
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
            onClick={() => navigate(`/time-off/types/${row.id}`)}
            className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/time-off/types/${row.id}`)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
          <button
            type="button"
            onClick={() => handleDeletePrompt(row)}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Type"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Time Off Types"
        subtitle={`Corporate leave categories, quota enforcement rules, and payroll linkage (${types.length} types)`}
      >
        <button
          onClick={() => navigate('/time-off/types/new')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Time Off Type
        </button>
      </PageHeader>

      {/* Table */}
      <DataTable
        columns={columns}
        data={types}
        totalItems={types.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        emptyMessage="No time off types configured"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Time Off Type"
        message={`Are you sure you want to delete "${deleteModal.item?.name}"? Any existing allocations linked to this type may become orphaned.`}
        confirmText="Yes, Delete Type"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
      />
    </div>
  );
};
