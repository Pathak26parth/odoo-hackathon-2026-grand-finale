// pages/payroll/PayrunWizard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, AlertCircle, AlertTriangle, CheckCircle2, Users, Search, Filter, Loader2 } from 'lucide-react';
import payrollService from '../../services/payrollService';
import employeeService from '../../services/employeeService';
import { formatCurrency } from '../../utils/payrollCalculation';

export const PayrunWizard = () => {
  const navigate = useNavigate();

  // Wizard Step: 1 or 2
  const [currentStep, setCurrentStep] = useState(1);

  // Dynamic Metadata
  const [structures, setStructures] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatingScope, setValidatingScope] = useState(false);

  // Dynamic Date calculation
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthName = now.toLocaleString('default', { month: 'long' });
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

  // Step 1 Form state
  const [formData, setFormData] = useState({
    name: `${monthName} ${year} Regular Payroll`,
    salaryStructureId: '',
    periodStart: `${year}-${month}-01`,
    periodEnd: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
  });
  const [errors, setErrors] = useState({});

  // Step 2 Employee selection & Scope validation state
  const [scopeData, setScopeData] = useState({
    eligibleEmployees: [],
    warnings: [],
    blockingErrors: []
  });
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  useEffect(() => {
    async function initData() {
      try {
        setLoadingInitial(true);
        const [structs, depts] = await Promise.all([
          payrollService.getSalaryStructures().catch(() => []),
          employeeService.getDepartments().catch(() => [])
        ]);

        setStructures(structs);
        setDepartments(depts);

        if (structs.length > 0) {
          setFormData((prev) => ({
            ...prev,
            salaryStructureId: String(structs[0].id)
          }));
        }
      } catch (err) {
        console.error('Failed to load payroll wizard data:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    initData();
  }, []);

  const selectedStructure = structures.find((s) => String(s.id) === String(formData.salaryStructureId));

  // Step 1 Validation
  const validateStep1 = () => {
    const errs = {};
    if (!formData.name?.trim()) {
      errs.name = 'Payrun Name is required.';
    }
    if (!formData.salaryStructureId) {
      errs.salaryStructureId = 'Salary Structure is required.';
    }
    if (!formData.periodStart) {
      errs.periodStart = 'Period Start Date is required.';
    }
    if (!formData.periodEnd) {
      errs.periodEnd = 'Period End Date is required.';
    }
    if (formData.periodStart && formData.periodEnd && formData.periodEnd <= formData.periodStart) {
      errs.periodEnd = 'Period End Date must be strictly after Start Date.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    try {
      setValidatingScope(true);
      const res = await payrollService.validateScope({
        salaryStructureId: Number(formData.salaryStructureId),
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd
      });

      const data = res.data || res;
      setScopeData({
        eligibleEmployees: data.eligibleEmployees || [],
        warnings: data.warnings || [],
        blockingErrors: data.blockingErrors || []
      });

      // Default select all eligible employees
      const eligibleIds = (data.eligibleEmployees || []).map((e) => e.id);
      setSelectedEmployees(eligibleIds);
      setCurrentStep(2);
    } catch (err) {
      alert('Scope validation error: ' + (err.message || 'Could not validate payroll scope'));
    } finally {
      setValidatingScope(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  // Step 2 Selection toggles
  const handleToggleSelectAll = (items) => {
    const ids = items.map((i) => i.id);
    const allSelected = ids.every((id) => selectedEmployees.includes(id));
    if (allSelected) {
      setSelectedEmployees(selectedEmployees.filter((id) => !ids.includes(id)));
    } else {
      setSelectedEmployees(Array.from(new Set([...selectedEmployees, ...ids])));
    }
  };

  const handleToggleSelectOne = (id) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter((item) => item !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  // Final Payrun Creation through backend
  const handleCreatePayrun = async () => {
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee for the payrun.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await payrollService.createPayrun({
        name: formData.name,
        salaryStructureId: Number(formData.salaryStructureId),
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        employeeIds: selectedEmployees
      });

      const created = res.data || res;
      const targetId = created.payrunId || created.id || (created.payrun ? created.payrun.id : null);
      if (targetId) {
        navigate(`/payroll/payruns/${targetId}`);
      } else {
        navigate('/payroll/payruns');
      }
    } catch (err) {
      alert('Failed to generate payrun: ' + (err.message || 'Server error occurred'));
      setIsSubmitting(false);
    }
  };

  // Step 2 filtered list
  const filteredEmployeesList = (scopeData.eligibleEmployees || []).filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      item.employeeCode?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesDept = departmentFilter === 'All' || item.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Payrun</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure pay period parameters and select eligible employees for live payroll computation.
          </p>
        </div>
      </div>

      {/* STEP INDICATOR */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl max-w-md mx-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
            currentStep === 1
              ? 'bg-white text-blue-700 shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            1
          </span>
          Period Parameters
        </button>

        <button
          type="button"
          onClick={() => {
            if (validateStep1()) setCurrentStep(2);
          }}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
            currentStep === 2
              ? 'bg-white text-blue-700 shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            2
          </span>
          Select Employees
        </button>
      </div>

      {/* STEP 1: Parameters Form */}
      {currentStep === 1 && (
        <form
          onSubmit={handleContinue}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5 text-xs"
        >
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Step 1 — Payrun Parameters</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set the period name, date range, and the salary structure for this payroll batch.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payrun Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. October 2026 Regular Payroll"
                className={`w-full px-3 py-2 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-rose-400' : 'border-slate-300'
                }`}
              />
              {errors.name && <p className="text-rose-500 text-[11px] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Salary Structure <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.salaryStructureId}
                onChange={(e) => setFormData({ ...formData, salaryStructureId: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.salaryStructureId ? 'border-rose-400' : 'border-slate-300'
                }`}
              >
                {structures.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              {errors.salaryStructureId && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.salaryStructureId}</p>
              )}
              {selectedStructure && (
                <p className="text-[11px] text-slate-500 mt-1">
                  {selectedStructure.description || 'Applies sequential rule calculations including Basic, HRA, Allowances, and Deductions.'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Period Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.periodStart ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.periodStart && (
                  <p className="text-rose-500 text-[11px] mt-1">{errors.periodStart}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Period End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.periodEnd ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.periodEnd && (
                  <p className="text-rose-500 text-[11px] mt-1">{errors.periodEnd}</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/payroll/payruns')}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={validatingScope || loadingInitial}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {validatingScope ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Validating Scope...
                </>
              ) : (
                <>
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Select Employees */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Step 2 — Select Eligible Employees</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated from database contracts and active employee records for period {formData.periodStart} to {formData.periodEnd}.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-700">
              Selected: <strong className="text-blue-600">{selectedEmployees.length}</strong> of{' '}
              {scopeData.eligibleEmployees.length} Eligible
            </div>
          </div>

          {/* Pre-flight Warnings / Blocking Errors */}
          {scopeData.blockingErrors?.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Eligibility Exclusions ({scopeData.blockingErrors.length})</span>
              </div>
              <ul className="list-disc list-inside text-rose-700 pl-1 space-y-0.5">
                {scopeData.blockingErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {scopeData.warnings?.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pre-Flight Warnings ({scopeData.warnings.length})</span>
              </div>
              <ul className="list-disc list-inside text-amber-700 pl-1 space-y-0.5">
                {scopeData.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                placeholder="Search employee or code..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employees Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        filteredEmployeesList.length > 0 &&
                        filteredEmployeesList.every((i) => selectedEmployees.includes(i.id))
                      }
                      onChange={() => handleToggleSelectAll(filteredEmployeesList)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3 px-2 font-semibold">Employee</th>
                  <th className="py-3 px-3 font-semibold">Department</th>
                  <th className="py-3 px-3 font-semibold">Contract Ref</th>
                  <th className="py-3 px-3 font-semibold">Monthly Wage</th>
                  <th className="py-3 px-3 font-semibold text-right">Bank Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployeesList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching eligible employees found for this structure and period.
                    </td>
                  </tr>
                ) : (
                  filteredEmployeesList.map((emp) => {
                    const isChecked = selectedEmployees.includes(emp.id);

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectOne(emp.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{emp.employeeCode}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{emp.department || 'General'}</td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          CON-{emp.contractId}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-900">
                          {emp.wage ? formatCurrency(emp.wage) : '—'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {emp.hasBankDetails ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Check className="w-3 h-3" /> Configured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <AlertCircle className="w-3 h-3" /> Missing
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/payroll/payruns')}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePayrun}
                disabled={isSubmitting || selectedEmployees.length === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Computing & Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Generate & Compute Payrun ({selectedEmployees.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
