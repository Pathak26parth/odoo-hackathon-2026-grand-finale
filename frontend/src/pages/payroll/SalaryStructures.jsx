import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Layers, Check, ShieldAlert } from 'lucide-react';
import { getSalaryStructures, deleteSalaryStructure, fetchSalaryStructuresAsync } from '../../data/salaryStructures';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { SalaryStructureTable } from '../../components/payroll/SalaryStructureTable';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const SalaryStructures = () => {
  const navigate = useNavigate();
  const { currentUser, isHRorAdmin } = useAuth();

  const role = currentUser?.role || 'Admin';
  const hasAccess = role === 'Admin' || role === 'HR Payroll Manager' || role === 'HR Payroll User';
  const canManage = role === 'Admin' || role === 'HR Payroll Manager';

  const [structures, setStructures] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [toastMessage, setToastMessage] = useState('');

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    structure: null
  });

  const loadData = () => {
    setStructures(getSalaryStructures());
  };

  useEffect(() => {
    loadData();
    fetchSalaryStructuresAsync().then((list) => {
      if (Array.isArray(list)) setStructures(list);
    }).catch(console.error);
  }, []);

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center max-w-lg mx-auto mt-12 space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your current account role (<strong>{role}</strong>) does not have access permissions to view or configure Payroll Salary Structures.
        </p>
        <button
          type="button"
          onClick={() => navigate('/employees')}
          className="mt-2 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          Go to Employees
        </button>
      </div>
    );
  }

  const filteredStructures = structures.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const paginated = filteredStructures.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDeletePrompt = (struct) => {
    setDeleteModal({
      isOpen: true,
      structure: struct
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.structure) return;
    try {
      await deleteSalaryStructure(deleteModal.structure.id);
      setToastMessage(`Salary structure "${deleteModal.structure.name}" was deleted.`);
      const list = await fetchSalaryStructuresAsync();
      if (Array.isArray(list)) setStructures(list);
      setDeleteModal({ isOpen: false, structure: null });
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Server error'));
    }
  };

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
        title="Salary Structures"
        subtitle={`Hierarchical rule groupings and compensation schemes (${structures.length} structures)`}
      >
        {canManage && (
          <button
            onClick={() => navigate('/payroll/salary-structures/new')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Salary Structure
          </button>
        )}
      </PageHeader>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search salary structures..."
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <SalaryStructureTable
        structures={paginated}
        totalItems={filteredStructures.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onView={(id) => navigate(`/payroll/salary-structures/${id}`)}
        onEdit={(id) => navigate(`/payroll/salary-structures/${id}`)}
        onDelete={handleDeletePrompt}
        canManage={canManage}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Salary Structure"
        message={`Are you sure you want to delete "${deleteModal.structure?.name}"? Contracts linked to this structure will need to be reassigned.`}
        confirmText="Yes, Delete Structure"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
      />
    </div>
  );
};
