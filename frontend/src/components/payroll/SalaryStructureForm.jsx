import React, { useState } from 'react';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { SalaryCategoryBadge } from './SalaryCategoryBadge';

export const SalaryStructureForm = ({
  initialData = {},
  availableRules = [],
  onSubmit,
  onCancel,
  isCreate = false,
  readOnly = false
}) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    status: initialData.status || 'Active'
  });

  // Resolve assigned rules
  const [selectedRules, setSelectedRules] = useState(() => {
    if (initialData.ruleIds && initialData.ruleIds.length > 0) {
      return initialData.ruleIds
        .map((rid) => availableRules.find((r) => r.id === rid))
        .filter(Boolean);
    }
    // Default to all standard rules for new structure
    return availableRules.slice(0, 7);
  });

  const [ruleToAddId, setRuleToAddId] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Structure Name is required';
    if (selectedRules.length === 0) errs.rules = 'At least one salary rule must be attached';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleMoveUp = (index) => {
    if (index <= 0 || readOnly) return;
    const next = [...selectedRules];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setSelectedRules(next);
  };

  const handleMoveDown = (index) => {
    if (index >= selectedRules.length - 1 || readOnly) return;
    const next = [...selectedRules];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setSelectedRules(next);
  };

  const handleRemoveRule = (ruleId) => {
    if (readOnly) return;
    setSelectedRules(selectedRules.filter((r) => r.id !== ruleId));
  };

  const handleAddRule = () => {
    if (!ruleToAddId || readOnly) return;
    const rule = availableRules.find((r) => r.id === ruleToAddId);
    if (rule && !selectedRules.some((r) => r.id === rule.id)) {
      setSelectedRules([...selectedRules, rule]);
      setRuleToAddId('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      ruleIds: selectedRules.map((r) => r.id),
      ruleCount: selectedRules.length
    });
  };

  const unselectedRules = availableRules.filter(
    (r) => !selectedRules.some((selected) => selected.id === r.id)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs">
      {/* Visual Execution Flow Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
          Payroll Computation Sequence Flow
        </h4>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            1. Basic Salary
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            2. Allowances
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
            3. Gross Salary
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            4. Deductions
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
            5. Net Salary
          </span>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
          Basic Structure Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Structure Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Standard Monthly Salary"
              className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 ${
                errors.name ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {errors.name && <p className="mt-1 text-[11px] text-rose-600">{errors.name}</p>}
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

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows="2"
              disabled={readOnly}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe which employee groups or contract tiers use this structure..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* Salary Rules Configuration Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Assigned Salary Rules ({selectedRules.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Rules are evaluated sequentially from top to bottom
            </p>
          </div>

          {/* Add Rule Dropdown */}
          {!readOnly && unselectedRules.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={ruleToAddId}
                onChange={(e) => setRuleToAddId(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
              >
                <option value="">Select rule to add...</option>
                {unselectedRules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddRule}
                disabled={!ruleToAddId}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> Add Rule
              </button>
            </div>
          )}
        </div>

        {errors.rules && <p className="text-xs text-rose-600 font-semibold">{errors.rules}</p>}

        {/* Reorderable Rules Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500 tracking-wider">
              <tr>
                <th className="py-2.5 px-3 text-center w-16">Seq</th>
                <th className="py-2.5 px-3">Rule Name</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Computation Type</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedRules.map((rule, idx) => (
                <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{rule.name}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{rule.code}</td>
                  <td className="py-2.5 px-3">
                    <SalaryCategoryBadge category={rule.category} />
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-medium">
                    {rule.computationType}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!readOnly && (
                        <>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveUp(idx)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                            title="Move Up in Sequence"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === selectedRules.length - 1}
                            onClick={() => handleMoveDown(idx)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                            title="Move Down in Sequence"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(rule.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove from Structure"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          {readOnly ? 'Back to Structures' : 'Cancel'}
        </button>
        {!readOnly && (
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {isCreate ? 'Save Salary Structure' : 'Update Salary Structure'}
          </button>
        )}
      </div>
    </form>
  );
};
