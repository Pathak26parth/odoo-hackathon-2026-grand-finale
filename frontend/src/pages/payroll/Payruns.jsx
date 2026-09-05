// pages/payroll/Payruns.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, CreditCard } from 'lucide-react';
import { getPayruns, deletePayrun, fetchPayrunsAsync } from '../../data/payruns';
import { getSalaryStructures, fetchSalaryStructuresAsync } from '../../data/salaryStructures';
import { useAuth } from '../../context/AuthContext';
import { canCreate, canDelete, MODULES } from '../../utils/permissionUtils';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { PayrunTable } from '../../components/payroll/PayrunTable';

export const Payruns = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'Admin';

  const [payruns, setPayruns] = useState([]);
  const [structures, setStructures] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [structureFilter, setStructureFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPayruns(getPayruns());
    setStructures(getSalaryStructures());

    fetchPayrunsAsync().then((list) => {
      if (Array.isArray(list)) setPayruns(list);
    }).catch(console.error);

    fetchSalaryStructuresAsync().then((list) => {
      if (Array.isArray(list)) setStructures(list);
    }).catch(console.error);
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payrun batch?')) {
      await deletePayrun(id);
      const list = await fetchPayrunsAsync();
      if (Array.isArray(list)) setPayruns(list);
    }
  };

  const filtered = payruns.filter((p) => {
    const structName = p.structure || p.salaryStructureName || p.structure_name || '';
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.runCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStructure = structureFilter === 'All' || structName === structureFilter;
    const matchesStatus = statusFilter === 'All' || p.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStructure && matchesStatus;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const canCreatePayrun = canCreate(role, MODULES.PAYRUNS);
  const canDeleteDraft = canDelete(role, MODULES.PAYRUNS);

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Payruns"
        subtitle={`Schedule, calculate, validate, and disburse organization payroll runs (${payruns.length} total)`}
      >
        {canCreatePayrun && (
          <button
            type="button"
            onClick={() => navigate('/payroll/payruns/new')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Payrun
          </button>
        )}
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search payrun name or structure..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Structure:</span>
            <select
              value={structureFilter}
              onChange={(e) => {
                setStructureFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Structures</option>
              {structures.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

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
              <option value="Draft">Draft</option>
              <option value="Computed">Computed</option>
              <option value="Validated">Validated</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payrun Table */}
      <PayrunTable
        payruns={paginated}
        onView={(id) => navigate(`/payroll/payruns/${id}`)}
        onDelete={handleDelete}
        canDelete={canDeleteDraft}
      />
    </div>
  );
};
