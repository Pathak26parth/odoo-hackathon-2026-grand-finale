import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, SlidersHorizontal, Check, ShieldAlert } from 'lucide-react';
import { getSalaryRules, deleteSalaryRule, fetchSalaryRulesAsync } from '../../data/salaryRules';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { SalaryRuleTable } from '../../components/payroll/SalaryRuleTable';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const SalaryRules = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const role = currentUser?.role || 'Admin';
  const hasAccess = role === 'Admin' || role === 'HR Payroll Manager' || role === 'HR Payroll User';
  const canManage = role === 'Admin' || role === 'HR Payroll Manager';

  const [rules, setRules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [toastMessage, setToastMessage] = useState('');

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    rule: null
  });

  const loadData = () => {
    setRules(getSalaryRules());
  };

  useEffect(() => {
    loadData();
    fetchSalaryRulesAsync().then((list) => {
      if (Array.isArray(list)) setRules(list);
    }).catch(console.error);
  }, []);

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center max-w-lg mx-auto mt-12 space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500">
          Your role (<strong>{role}</strong>) does not have access permissions to view or configure Payroll Salary Rules.
        </p>
      </div>
    );
  }

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const catPrefix = categoryFilter.slice(0, 3).toUpperCase();
    const matchesCat =
      categoryFilter === 'All' ||
      r.category?.toUpperCase().startsWith(catPrefix) ||
      r.category?.toUpperCase() === categoryFilter.toUpperCase();

    const matchesStatus = statusFilter === 'All' || r.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesCat && matchesStatus;
  });

  const paginated = filteredRules.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const categories = ['All', 'Basic', 'Allowances', 'Gross', 'Deductions', 'Net'];

  const handleDeletePrompt = (rule) => {
    setDeleteModal({
      isOpen: true,
      rule
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.rule) return;
    try {
      await deleteSalaryRule(deleteModal.rule.id);
      setToastMessage(`Salary rule "${deleteModal.rule.name}" (${deleteModal.rule.code}) removed.`);
      const list = await fetchSalaryRulesAsync();
      if (Array.isArray(list)) setRules(list);
      setDeleteModal({ isOpen: false, rule: null });
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
        title="Salary Rules"
        subtitle={`Mathematical definitions, allowances, and statutory withholding rules (${rules.length} rules)`}
      >
        {canManage && (
          <button
            onClick={() => navigate('/payroll/salary-rules/new')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Salary Rule
          </button>
        )}
      </PageHeader>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search by rule name, code..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
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
      </div>

      {/* Rules Table */}
      <SalaryRuleTable
        rules={paginated}
        totalItems={filteredRules.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onView={(id) => navigate(`/payroll/salary-rules/${id}`)}
        onEdit={(id) => navigate(`/payroll/salary-rules/${id}`)}
        onDelete={handleDeletePrompt}
        canManage={canManage}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Salary Rule"
        message={`Are you sure you want to delete rule "${deleteModal.rule?.name}" (${deleteModal.rule?.code})? Any salary structures referencing this code may fail validation.`}
        confirmText="Yes, Delete Rule"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
      />
    </div>
  );
};
