import React, { useState } from 'react';
import { PieChart, Save, ArrowLeft } from 'lucide-react';
import { LeaveBalanceCard } from './LeaveBalanceCard';

export const AllocationForm = ({
  employees = [],
  timeOffTypes = [],
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    employeeId: employees[0]?.id || 'emp-1',
    employeeName: employees[0]?.name || 'Amelia Johnson',
    timeOffTypeId: timeOffTypes[0]?.id || 'tot-1',
    timeOffTypeName: timeOffTypes[0]?.name || 'Annual Leave',
    unit: timeOffTypes[0]?.unit || 'Days',
    allocated: 20,
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    status: 'Active'
  });

  const handleEmployeeChange = (empId) => {
    const emp = employees.find((e) => e.id === empId);
    setFormData((prev) => ({
      ...prev,
      employeeId: empId,
      employeeName: emp ? emp.name : prev.employeeName
    }));
  };

  const handleTypeChange = (typeId) => {
    const t = timeOffTypes.find((item) => item.id === typeId);
    setFormData((prev) => ({
      ...prev,
      timeOffTypeId: typeId,
      timeOffTypeName: t ? t.name : prev.timeOffTypeName,
      unit: t ? t.unit : 'Days'
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      allocated: Number(formData.allocated) || 0,
      taken: 0,
      remaining: Number(formData.allocated) || 0
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Live Leave Balance Preview Card */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Allocation Preview
        </h4>
        <LeaveBalanceCard
          title={`${formData.employeeName} — ${formData.timeOffTypeName}`}
          allocated={Number(formData.allocated) || 0}
          taken={0}
          remaining={Number(formData.allocated) || 0}
          unit={formData.unit}
          subtitle={`Period: ${formData.validFrom} to ${formData.validUntil}`}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5 text-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
          Allocation Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Employee */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          {/* Time Off Type */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Time Off Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.timeOffTypeId}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {timeOffTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Allocation Amount */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Allocation Amount ({formData.unit}) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={formData.allocated}
              onChange={(e) => setFormData({ ...formData, allocated: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Active">Active</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Valid From */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Valid From <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Valid Until */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Valid Until <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.validUntil}
              min={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
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
          Save Allocation
        </button>
      </div>
    </form>
  );
};
