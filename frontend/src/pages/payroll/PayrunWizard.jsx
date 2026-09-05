// pages/payroll/PayrunWizard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, AlertCircle, CheckCircle2, Users, Search, Filter } from 'lucide-react';
import { getSalaryStructures } from '../../data/salaryStructures';
import { getEmployees } from '../../data/employees';
import { getContracts } from '../../data/contracts';
import { createPayrun } from '../../data/payruns';
import { createPayslipsBatch } from '../../data/payslips';
import { evaluateEmployeeEligibility } from '../../utils/contractUtils';
import { formatCurrency } from '../../utils/payrollCalculation';

export const PayrunWizard = () => {
  const navigate = useNavigate();

  // Wizard Step: 1 or 2
  const [currentStep, setCurrentStep] = useState(1);

  // Data
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);

  // Step 1 Form state
  const [formData, setFormData] = useState({
    name: 'October 2026 Regular Payroll',
    salaryStructureId: 'struct-1',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31'
  });
  const [errors, setErrors] = useState({});

  // Step 2 Employee selection state
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  useEffect(() => {
    const loadedStructures = getSalaryStructures();
    const loadedEmployees = getEmployees();
    const loadedContracts = getContracts();

    setStructures(loadedStructures);
    setEmployees(loadedEmployees);
    setContracts(loadedContracts);

    if (loadedStructures.length > 0 && !formData.salaryStructureId) {
      setFormData((prev) => ({ ...prev, salaryStructureId: loadedStructures[0].id }));
    }
  }, []);

  const selectedStructure = structures.find((s) => s.id === formData.salaryStructureId);

  // Evaluate employee eligibility list for Step 2
  const evaluatedEmployees = employees.map((emp) => {
    const evalResult = evaluateEmployeeEligibility(
      emp,
      formData.periodStart,
      formData.periodEnd,
      selectedStructure?.name || 'Standard Monthly Salary'
    );
    return {
      employee: emp,
      ...evalResult
    };
  });

  // Set default selected employees to eligible ones when transitioning to step 2
  useEffect(() => {
    if (currentStep === 2 && selectedEmployees.length === 0) {
      const eligibleIds = evaluatedEmployees
        .filter((item) => item.isEligible)
        .map((item) => item.employee.id);
      setSelectedEmployees(eligibleIds);
    }
  }, [currentStep]);

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

  const handleContinue = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  // Step 2 Selection toggles
  const handleToggleSelectAll = (filteredItems) => {
    const eligibleFilteredIds = filteredItems
      .filter((i) => i.isEligible)
      .map((i) => i.employee.id);

    const allSelected = eligibleFilteredIds.every((id) => selectedEmployees.includes(id));
    if (allSelected) {
      setSelectedEmployees(selectedEmployees.filter((id) => !eligibleFilteredIds.includes(id)));
    } else {
      setSelectedEmployees(Array.from(new Set([...selectedEmployees, ...eligibleFilteredIds])));
    }
  };

  const handleToggleSelectOne = (id) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter((item) => item !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  // Final Payrun Creation
  const handleCreatePayrun = () => {
    const chosenStructure = structures.find((s) => s.id === formData.salaryStructureId);

    // Create the Payrun in Draft status
    const created = createPayrun({
      name: formData.name,
      salaryStructureId: formData.salaryStructureId,
      salaryStructureName: chosenStructure?.name || 'Standard Monthly Salary',
      periodStart: formData.periodStart,
      periodEnd: formData.periodEnd,
      selectedEmployeeIds: selectedEmployees,
      employeeCount: selectedEmployees.length,
      warnings: []
    });

    // Generate initial Draft Payslips for the selected employees
    const initialPayslips = selectedEmployees.map((empId, index) => {
      const emp = employees.find((e) => e.id === empId);
      const evalItem = evaluatedEmployees.find((item) => item.employee.id === empId);
      const wage = evalItem?.contract?.wage || 50000;

      return {
        id: `slip-${created.id}-${index + 1}`,
        slipNumber: `SLIP-${created.periodStart.slice(0, 7)}-${String(index + 1).padStart(3, '0')}`,
        payrunId: created.id,
        payrunName: created.name,
        employeeId: emp.id,
        employeeCode: emp.employeeId,
        employeeName: emp.name,
        department: emp.department,
        position: emp.position,
        contractId: evalItem?.contract?.id || 'CTR-001',
        salaryStructureId: created.salaryStructureId,
        salaryStructureName: created.salaryStructureName,
        periodStart: created.periodStart,
        periodEnd: created.periodEnd,
        period: `${created.periodStart} - ${created.periodEnd}`,
        workedDays: 22,
        basic: wage,
        allowances: 0,
        gross: wage,
        deductions: 0,
        net: wage,
        status: 'Draft',
        emailStatus: 'Not Sent',
        warnings: evalItem?.warning ? [evalItem.warning] : [],
        lines: []
      };
    });

    createPayslipsBatch(initialPayslips);

    // Navigate to Payrun Detail processing screen
    navigate(`/payroll/payruns/${created.id}`);
  };

  // Step 2 filtered list
  const filteredEmployeesList = evaluatedEmployees.filter((item) => {
    const matchesSearch =
      item.employee.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      item.employee.employeeId.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      item.employee.department.toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesDept = departmentFilter === 'All' || item.employee.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Payrun</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure pay period parameters and select eligible employees for payroll computation.
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
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px]">
            1
          </span>
          Payrun Details
        </button>

        <button
          type="button"
          onClick={() => validateStep1() && setCurrentStep(2)}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
            currentStep === 2
              ? 'bg-white text-blue-700 shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px]">
            2
          </span>
          Select Employees
        </button>
      </div>

      {/* STEP 1: Payrun Details */}
      {currentStep === 1 && (
        <form onSubmit={handleContinue} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Step 1 — Payrun Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">Define name, salary structure, and date range.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
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

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Salary Structure <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.salaryStructureId}
                onChange={(e) => setFormData({ ...formData, salaryStructureId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {structures.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.ruleCount} Rules configured)
                  </option>
                ))}
              </select>
              {errors.salaryStructureId && (
                <p className="text-rose-500 text-[11px] mt-1">{errors.salaryStructureId}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Period Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Select Employees */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Step 2 — Select Employees</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify employee eligibility against active contracts and salary structure match.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-700">
              Selected: <strong className="text-blue-600">{selectedEmployees.length}</strong> of{' '}
              {evaluatedEmployees.filter((e) => e.isEligible).length} Eligible
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                placeholder="Search employee or ID..."
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
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Sales">Sales</option>
                <option value="Design">Design</option>
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
                        filteredEmployeesList.filter((i) => i.isEligible).length > 0 &&
                        filteredEmployeesList
                          .filter((i) => i.isEligible)
                          .every((i) => selectedEmployees.includes(i.employee.id))
                      }
                      onChange={() => handleToggleSelectAll(filteredEmployeesList)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3 px-2 font-semibold">Employee</th>
                  <th className="py-3 px-3 font-semibold">Department</th>
                  <th className="py-3 px-3 font-semibold">Position</th>
                  <th className="py-3 px-3 font-semibold">Contract</th>
                  <th className="py-3 px-3 font-semibold">Wage</th>
                  <th className="py-3 px-3 font-semibold text-right">Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployeesList.map((item) => {
                  const emp = item.employee;
                  const isChecked = selectedEmployees.includes(emp.id);
                  const isEligible = item.isEligible;

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !isEligible ? 'opacity-60 bg-slate-50/30' : ''
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!isEligible}
                          onChange={() => handleToggleSelectOne(emp.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[11px] text-slate-400">{emp.employeeId}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{emp.department}</td>
                      <td className="py-3 px-3 text-slate-700">{emp.position}</td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {item.contract ? item.contract.id : <span className="text-slate-400">None</span>}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-900">
                        {item.wage ? formatCurrency(item.wage) : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isEligible
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.status === 'No Active Contract'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Details
            </button>

            <button
              type="button"
              onClick={handleCreatePayrun}
              disabled={selectedEmployees.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> Create Payrun ({selectedEmployees.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
