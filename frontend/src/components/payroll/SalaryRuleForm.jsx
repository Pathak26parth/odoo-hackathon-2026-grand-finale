import React, { useState } from 'react';
import { Save, ArrowLeft, Info, HelpCircle } from 'lucide-react';

export const SalaryRuleForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  isCreate = false,
  readOnly = false
}) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    code: initialData.code || '',
    category: initialData.category || 'Allowances',
    sequence: initialData.sequence || 1,
    description: initialData.description || '',
    computationType: initialData.computationType || 'Fixed Amount',
    amount: initialData.amount || 5000,
    percentage: initialData.percentage || 10,
    basedOn: initialData.basedOn || 'Basic Salary',
    formula: initialData.formula || '',
    status: initialData.status || 'Active'
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Rule Name is required';
    if (!formData.code.trim()) errs.code = 'Rule Code is required';
    if (formData.computationType === 'Fixed Amount' && (formData.amount === '' || Number(formData.amount) < 0)) {
      errs.amount = 'Valid amount is required';
    }
    if (formData.computationType === 'Percentage' && (formData.percentage === '' || Number(formData.percentage) < 0)) {
      errs.percentage = 'Valid percentage is required';
    }
    if (formData.computationType === 'Formula' && !formData.formula.trim()) {
      errs.formula = 'Formula expression is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const categories = ['Basic', 'Allowances', 'Gross', 'Deductions', 'Net'];
  const computationTypes = ['Fixed Amount', 'Percentage', 'Formula'];
  const basedOnOptions = ['Basic Salary', 'Gross Salary', 'Custom Base'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs">
      {/* Basic Information */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
          Basic Rule Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Rule Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Housing Allowance"
              className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 ${
                errors.name ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {errors.name && <p className="mt-1 text-[11px] text-rose-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Rule Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. HOUSE"
              className={`w-full px-3 py-2 border rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 ${
                errors.code ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {errors.code && <p className="mt-1 text-[11px] text-rose-600">{errors.code}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              disabled={readOnly}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Sequence Order <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              disabled={readOnly}
              value={formData.sequence}
              onChange={(e) => setFormData({ ...formData, sequence: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Evaluation priority (1 = evaluated first)
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status</label>
            <select
              disabled={readOnly}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows="2"
              disabled={readOnly}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide context or statutory description for this rule..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* Computation Method Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
          Computation Method
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Computation Type <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {computationTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setFormData({ ...formData, computationType: type })}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    formData.computationType === type
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC FIELDS: FIXED AMOUNT */}
          {formData.computationType === 'Fixed Amount' && (
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
              <span className="font-bold text-slate-900 block">Fixed Amount Configuration</span>
              <div className="max-w-xs">
                <label className="block font-semibold text-slate-700 mb-1">
                  Fixed Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    disabled={readOnly}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  />
                </div>
                {errors.amount && <p className="mt-1 text-[11px] text-rose-600">{errors.amount}</p>}
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: PERCENTAGE */}
          {formData.computationType === 'Percentage' && (
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
              <span className="font-bold text-slate-900 block">Percentage Configuration</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Percentage (%) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      disabled={readOnly}
                      value={formData.percentage}
                      onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })}
                      className="w-full pr-7 pl-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                  </div>
                  {errors.percentage && (
                    <p className="mt-1 text-[11px] text-rose-600">{errors.percentage}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Based On <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={readOnly}
                    value={formData.basedOn}
                    onChange={(e) => setFormData({ ...formData, basedOn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {basedOnOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FIELDS: FORMULA */}
          {formData.computationType === 'Formula' && (
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Formula Expression Configuration</span>
                <span className="text-[11px] text-blue-600 font-mono font-semibold">
                  e.g. BASIC + HOUSE + TRANS
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Formula Expression <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="3"
                  disabled={readOnly}
                  value={formData.formula}
                  onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                  placeholder="e.g. GROSS - TAX - INSURANCE"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                />
                {errors.formula && <p className="mt-1 text-[11px] text-rose-600">{errors.formula}</p>}
              </div>

              <div className="flex items-start gap-2 text-[11px] text-slate-500 pt-1">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Informational Notice:</strong> Formula rules are evaluated according to their sequence. Ensure referenced codes (e.g. BASIC, GROSS) precede this rule in sequence order.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          {readOnly ? 'Back to Rules' : 'Cancel'}
        </button>
        {!readOnly && (
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {isCreate ? 'Save Rule' : 'Update Rule'}
          </button>
        )}
      </div>
    </form>
  );
};
