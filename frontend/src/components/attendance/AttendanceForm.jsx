import React, { useState, useEffect } from 'react';
import { Clock, Calendar, User, Save, ArrowLeft, Edit3 } from 'lucide-react';
import { calculateWorkedHours, evaluateAttendanceStatus, getAttendanceExceptions } from '../../data/attendance';
import { AttendanceException } from './AttendanceException';

export const AttendanceForm = ({
  initialData = {},
  employees = [],
  onSubmit,
  onCancel,
  isCreate = false,
  canManualCorrect = true
}) => {
  const [formData, setFormData] = useState({
    employeeId: initialData.employeeId || (employees[0]?.id || 'emp-1'),
    employeeName: initialData.employeeName || (employees[0]?.name || 'Amelia Johnson'),
    department: initialData.department || (employees[0]?.department || 'Engineering'),
    date: initialData.date || new Date().toISOString().split('T')[0],
    checkIn: initialData.checkIn || '09:00',
    checkOut: initialData.checkOut || '17:30',
    status: initialData.status || 'Present',
    isManualEdit: initialData.isManualEdit || false,
    notes: initialData.notes || ''
  });

  const [workedHours, setWorkedHours] = useState('0h 00m');
  const [exceptions, setExceptions] = useState([]);

  // Recalculate worked hours & evaluate status dynamically on time changes
  useEffect(() => {
    const calc = calculateWorkedHours(formData.checkIn, formData.checkOut);
    setWorkedHours(calc.formatted);

    // If user hasn't explicitly overridden status manually, suggest the standard evaluated status
    if (!formData.isManualEdit) {
      const computedStatus = evaluateAttendanceStatus(formData.checkIn, formData.checkOut, false);
      setFormData((prev) => ({ ...prev, status: computedStatus }));
    }

    const exList = getAttendanceExceptions({
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      status: formData.status,
      isManualEdit: formData.isManualEdit
    });
    setExceptions(exList);
  }, [formData.checkIn, formData.checkOut, formData.isManualEdit, formData.status]);

  const handleEmployeeChange = (empId) => {
    const emp = employees.find((e) => e.id === empId);
    setFormData((prev) => ({
      ...prev,
      employeeId: empId,
      employeeName: emp ? emp.name : prev.employeeName,
      department: emp ? emp.department : prev.department
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      workedHours,
      exceptions
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informational Exceptions Box */}
      {exceptions.length > 0 && (
        <AttendanceException exceptions={exceptions} status={formData.status} />
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5 text-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
          Attendance Entry Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Employee */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Employee <span className="text-rose-500">*</span>
            </label>
            <select
              disabled={!isCreate && !canManualCorrect}
              value={formData.employeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Check In */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Check In Time
            </label>
            <input
              type="time"
              value={formData.checkIn}
              onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Standard start time: 09:00 AM (Check-in after 09:00 flags as Late)
            </span>
          </div>

          {/* Check Out */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Check Out Time
            </label>
            <input
              type="time"
              value={formData.checkOut}
              onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Leave blank if badge-out is missing
            </span>
          </div>

          {/* Worked Hours Display */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Calculated Worked Hours
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{workedHours}</span>
              <span className="text-[11px] font-normal text-slate-400 ml-auto">
                (Includes 1hr lunch deduction if &gt;5h)
              </span>
            </div>
          </div>

          {/* Attendance Status */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Attendance Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Overtime">Overtime</option>
              <option value="Missing Check-out">Missing Check-out</option>
              <option value="Manual Edit">Manual Edit</option>
            </select>
          </div>
        </div>

        {/* Manual Correction Checkbox */}
        {canManualCorrect && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <input
              type="checkbox"
              id="manual-edit-toggle"
              checked={formData.isManualEdit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isManualEdit: e.target.checked,
                  status: e.target.checked ? 'Manual Edit' : formData.status
                })
              }
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="manual-edit-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Mark as Manual Supervisor Correction
            </label>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Notes / Justification</label>
          <textarea
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Reason for late arrival, missing badge-out, or manual supervisor correction..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
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
          {isCreate ? 'Save Attendance' : 'Update Attendance'}
        </button>
      </div>
    </form>
  );
};
