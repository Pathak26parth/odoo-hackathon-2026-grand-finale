import React, { useState, useEffect } from 'react';
import { Calendar, Save, ArrowLeft, Clock, Info, CheckCircle2 } from 'lucide-react';
import { calculateDuration } from '../../data/timeOffRequests';
import { getEmployeeAllocations } from '../../data/allocations';
import { LeaveBalanceCard } from './LeaveBalanceCard';

export const TimeOffRequestForm = ({
  employees = [],
  timeOffTypes = [],
  currentEmployeeId,
  onSubmit,
  onCancel,
  canSelectAnyEmployee = false
}) => {
  const defaultEmp = employees.find((e) => e.id === currentEmployeeId) || employees[0] || {};

  const [formData, setFormData] = useState({
    employeeId: defaultEmp.id || '',
    employeeName: defaultEmp.name || '',
    department: defaultEmp.department || '',
    timeOffTypeId: timeOffTypes[0]?.id || '',
    timeOffTypeName: timeOffTypes[0]?.name || '',
    unit: timeOffTypes[0]?.unit || 'Days',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    duration: 1,
    reason: ''
  });

  const [employeeAllocations, setEmployeeAllocations] = useState([]);
  const [matchingAlloc, setMatchingAlloc] = useState(null);

  // Update allocations when selected employee changes
  useEffect(() => {
    if (formData.employeeId) {
      const allocs = getEmployeeAllocations(formData.employeeId);
      setEmployeeAllocations(allocs);
    }
  }, [formData.employeeId]);

  // Update matching allocation whenever selected type changes
  useEffect(() => {
    const match = employeeAllocations.find(
      (a) =>
        a.timeOffTypeId === formData.timeOffTypeId ||
        a.timeOffTypeName.toLowerCase() === formData.timeOffTypeName.toLowerCase()
    );
    setMatchingAlloc(match || null);
  }, [employeeAllocations, formData.timeOffTypeId, formData.timeOffTypeName]);

  // Recalculate duration automatically when dates change
  useEffect(() => {
    const dur = calculateDuration(formData.startDate, formData.endDate);
    setFormData((prev) => ({ ...prev, duration: dur }));
  }, [formData.startDate, formData.endDate]);

  const handleEmployeeChange = (empId) => {
    const emp = employees.find((e) => e.id === empId);
    setFormData((prev) => ({
      ...prev,
      employeeId: empId,
      employeeName: emp ? emp.name : prev.employeeName,
      department: emp ? emp.department : prev.department
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
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Leave Balance Preview if allocation exists */}
      {matchingAlloc && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Current Leave Balance for {formData.employeeName}
          </h4>
          <LeaveBalanceCard
            title={matchingAlloc.timeOffTypeName}
            allocated={matchingAlloc.allocated}
            taken={matchingAlloc.taken}
            remaining={matchingAlloc.remaining}
            unit={matchingAlloc.unit}
            subtitle={`Valid: ${matchingAlloc.validFrom} to ${matchingAlloc.validUntil}`}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5 text-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
          New Leave Request Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Employee */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Employee <span className="text-rose-500">*</span>
            </label>
            <select
              disabled={!canSelectAnyEmployee}
              value={formData.employeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600"
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

          {/* Start Date */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              End Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.endDate}
              min={formData.startDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Automatically calculated duration */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Calculated Duration
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-sm">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{formData.duration} {formData.unit}</span>
              <span className="text-xs text-slate-400 font-normal ml-auto">
                (Calculated from {formData.startDate} to {formData.endDate})
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for Request <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="3"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Provide a reason for this time off request..."
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
          Submit Request
        </button>
      </div>
    </form>
  );
};
