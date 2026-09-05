import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ShieldAlert } from 'lucide-react';
import {
  getSalaryRuleById,
  createSalaryRule,
  updateSalaryRule
} from '../../data/salaryRules';
import payrollService from '../../services/payrollService';
import { useAuth } from '../../context/AuthContext';
import { canView, canEdit, MODULES } from '../../utils/permissionUtils';
import { PageHeader } from '../../components/common/PageHeader';
import { SalaryRuleForm } from '../../components/payroll/SalaryRuleForm';
import { SalaryCalculationPreview } from '../../components/payroll/SalaryCalculationPreview';

export const SalaryRuleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'new';

  const { currentUser } = useAuth();
  const role = currentUser?.role || 'Admin';
  const hasAccess = canView(role, MODULES.SALARY_RULES);
  const canManage = canEdit(role, MODULES.SALARY_RULES);

  const [ruleData, setRuleData] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    async function load() {
      if (!isCreate) {
        try {
          const existing = await payrollService.getSalaryRuleById(id);
          if (existing) {
            setRuleData(existing);
          } else {
            alert('Salary rule not found');
            navigate('/payroll/salary-rules');
          }
        } catch (err) {
          console.error('Failed to load salary rule:', err);
        }
      }
    }
    load();
  }, [id, isCreate, navigate]);

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center max-w-lg mx-auto mt-12 space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500">
          Your role ({role}) does not have permission to access Payroll Salary Rules.
        </p>
      </div>
    );
  }

  const handleSubmit = async (data) => {
    try {
      if (isCreate) {
        await createSalaryRule(data);
        setToastMessage(`Salary rule "${data.name}" created!`);
      } else {
        await updateSalaryRule(id, data);
        setToastMessage(`Salary rule "${data.name}" updated!`);
      }

      setTimeout(() => {
        navigate('/payroll/salary-rules');
      }, 900);
    } catch (err) {
      alert('Error saving salary rule: ' + err.message);
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
        title={isCreate ? 'New Salary Rule' : 'Salary Rule Details'}
        subtitle={
          isCreate
            ? 'Define computation formulas, percentages, or fixed values'
            : `${ruleData?.name} [${ruleData?.code}] (${ruleData?.category})`
        }
      >
        <button
          type="button"
          onClick={() => navigate('/payroll/salary-rules')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Rules
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Rule Form */}
        <div className="lg:col-span-7">
          {(isCreate || ruleData) && (
            <SalaryRuleForm
              initialData={ruleData || {}}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/payroll/salary-rules')}
              isCreate={isCreate}
              readOnly={!canManage}
            />
          )}
        </div>

        {/* Vertical Calculation Preview Panel */}
        <div className="lg:col-span-5">
          <SalaryCalculationPreview baseSalary={50000} />
        </div>
      </div>
    </div>
  );
};
