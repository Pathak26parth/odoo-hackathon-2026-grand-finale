import React, { useState } from 'react';
import { Save, ArrowLeft, CheckCircle, Info, DollarSign, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';

export const TimeOffTypeForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  isCreate = false
}) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    unit: initialData.unit || 'Days',
    requiresAllocation: initialData.requiresAllocation ?? true,
    requiresApproval: initialData.requiresApproval ?? true,
    payrollIntegration: initialData.payrollIntegration ?? true,
    status: initialData.status || 'Active'
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Type Name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payroll Integration Badge Notice */}
      {formData.payrollIntegration && (
        <div className="flex items-center gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 shadow-2xs">
          <DollarSign className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold">Affects Payroll Calculation:</span> Approved leave under this type will automatically feed into payroll payrun deductions and attendance hour tallies.
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6 text-xs">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Type Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Annual Leave, Bereavement Leave..."
                className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.name ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.name && <p className="mt-1 text-[11px] text-rose-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Measurement Unit <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Days">Days</option>
                <option value="Hours">Hours</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the policy, eligibility, and rules for this leave type..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Configuration Toggles */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-1">
            Policy &amp; Workflow Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Requires Allocation Toggle */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Requires Allocation</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, requiresAllocation: !formData.requiresAllocation })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.requiresAllocation ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formData.requiresAllocation ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {formData.requiresAllocation
                  ? 'Employees must have an approved leave allocation balance to request this type.'
                  : 'Open leave type without pre-allocated quota (e.g. Unpaid Leave).'}
              </p>
            </div>

            {/* Requires Approval Toggle */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Requires Approval</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, requiresApproval: !formData.requiresApproval })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.requiresApproval ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formData.requiresApproval ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {formData.requiresApproval
                  ? 'Requests follow the Pending → HR Manager Approval review cycle.'
                  : 'Auto-approved upon employee request submission.'}
              </p>
            </div>

            {/* Payroll Integration Toggle */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Payroll Integration</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, payrollIntegration: !formData.payrollIntegration })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.payrollIntegration ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formData.payrollIntegration ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {formData.payrollIntegration
                  ? 'Displays badge "Affects Payroll Calculation" and maps to payrun.'
                  : 'Not factored into salary deductions or payroll calculations.'}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
          <label className="font-semibold text-slate-700">Status:</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {isCreate ? 'Save Time Off Type' : 'Update Time Off Type'}
        </button>
      </div>
    </form>
  );
};
