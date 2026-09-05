import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ShieldAlert } from 'lucide-react';
import {
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  fetchSalaryStructuresAsync
} from '../../data/salaryStructures';
import { getSalaryRules, fetchSalaryRulesAsync } from '../../data/salaryRules';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { SalaryStructureForm } from '../../components/payroll/SalaryStructureForm';

export const SalaryStructureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'new';

  const { currentUser } = useAuth();
  const role = currentUser?.role || 'Admin';
  const hasAccess = role === 'Admin' || role === 'HR Payroll Manager' || role === 'HR Payroll User';
  const canManage = role === 'Admin' || role === 'HR Payroll Manager';

  const [structure, setStructure] = useState(null);
  const [availableRules, setAvailableRules] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setAvailableRules(getSalaryRules());

    fetchSalaryRulesAsync().then((rules) => {
      if (Array.isArray(rules)) setAvailableRules(rules);
    }).catch(console.error);

    if (!isCreate) {
      const existing = getSalaryStructureById(id);
      if (existing) {
        setStructure(existing);
      }
      fetchSalaryStructuresAsync().then((list) => {
        if (Array.isArray(list)) {
          const match = list.find((s) => String(s.id) === String(id));
          if (match) setStructure(match);
        }
      }).catch(console.error);
    }
  }, [id, isCreate, navigate]);

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center max-w-lg mx-auto mt-12 space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500">
          Your role ({role}) does not have permission to access Payroll Salary Structures.
        </p>
      </div>
    );
  }

  const handleSubmit = async (data) => {
    try {
      if (isCreate) {
        await createSalaryStructure(data);
        setToastMessage(`Salary structure "${data.name}" created!`);
      } else {
        await updateSalaryStructure(id, data);
        setToastMessage(`Salary structure "${data.name}" updated!`);
      }

      setTimeout(() => {
        navigate('/payroll/salary-structures');
      }, 900);
    } catch (err) {
      alert('Error saving salary structure: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title={isCreate ? 'New Salary Structure' : 'Salary Structure Details'}
        subtitle={
          isCreate
            ? 'Define salary rule packages and sequential execution flows'
            : `${structure?.name} (${structure?.ruleCount || structure?.ruleIds?.length || 0} Rules attached)`
        }
      >
        <button
          type="button"
          onClick={() => navigate('/payroll/salary-structures')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Structures
        </button>
      </PageHeader>

      {/* Form */}
      {(isCreate || structure) && (
        <SalaryStructureForm
          initialData={structure || {}}
          availableRules={availableRules}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/payroll/salary-structures')}
          isCreate={isCreate}
          readOnly={!canManage}
        />
      )}
    </div>
  );
};
