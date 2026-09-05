import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import {
  getScheduleById,
  createSchedule,
  updateSchedule,
  calculateDailyHours,
  DEFAULT_WEEK_DAYS
} from '../../data/schedules';
import { PageHeader } from '../../components/common/PageHeader';

export const ScheduleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'new';

  const [toastMessage, setToastMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    type: 'Full-time',
    status: 'Active',
    days: DEFAULT_WEEK_DAYS
  });

  useEffect(() => {
    if (!isCreate) {
      const existing = getScheduleById(id);
      if (existing) {
        setFormData({
          name: existing.name || '',
          type: existing.type || 'Full-time',
          status: existing.status || 'Active',
          days: existing.days || DEFAULT_WEEK_DAYS
        });
      } else {
        alert('Schedule not found');
        navigate('/working-schedules');
      }
    }
  }, [id, isCreate, navigate]);

  // Handle updates to individual days in the weekly schedule grid
  const handleDayFieldChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedDays = [...prev.days];
      const currentDay = { ...updatedDays[index], [field]: value };

      // Recalculate daily hours automatically
      currentDay.dailyHours = calculateDailyHours(
        currentDay.startTime,
        currentDay.endTime,
        currentDay.breakDuration,
        currentDay.working
      );

      updatedDays[index] = currentDay;
      return { ...prev, days: updatedDays };
    });
  };

  // Dynamic calculation of total weekly hours
  const totalWeeklyHours = formData.days.reduce(
    (acc, d) => acc + (d.working ? Number(d.dailyHours || 0) : 0),
    0
  );

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Schedule Name is required';
    if (!formData.type) errs.type = 'Schedule Type is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isCreate) {
        createSchedule(formData);
        setToastMessage('Schedule created successfully!');
      } else {
        updateSchedule(id, formData);
        setToastMessage('Schedule updated successfully!');
      }

      setTimeout(() => {
        navigate('/working-schedules');
      }, 900);
    } catch (err) {
      alert('Error saving schedule: ' + err.message);
      setSubmitting(false);
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
        title={isCreate ? 'New Working Schedule' : 'Edit Working Schedule'}
        subtitle={
          isCreate
            ? 'Configure standard shift intervals, daily hours, and weekly totals'
            : `${formData.name} (${id})`
        }
      >
        <button
          type="button"
          onClick={() => navigate('/working-schedules')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Cancel
        </button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-4">
            Basic Schedule Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Schedule Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Standard 40 Hours"
                className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.name ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.name && <p className="mt-1 text-[11px] text-rose-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Schedule Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Flexible">Flexible</option>
                <option value="Shift">Shift</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Active Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Weekly Schedule Configuration Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Weekly Schedule Configuration
              </h3>
              <p className="text-[11px] text-slate-500">
                Formula: Daily Hours = End Time - Start Time - Break Duration
              </p>
            </div>

            {/* Total Weekly Hours Pill */}
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-800">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Total Weekly Hours: {Math.round(totalWeeklyHours * 10) / 10} hrs</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] text-slate-500 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3 text-center">Working</th>
                  <th className="py-2.5 px-3">Start Time</th>
                  <th className="py-2.5 px-3">End Time</th>
                  <th className="py-2.5 px-3">Break Duration (Hrs)</th>
                  <th className="py-2.5 px-3 text-right">Daily Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {formData.days.map((dayRow, index) => (
                  <tr
                    key={dayRow.day}
                    className={dayRow.working ? 'bg-white' : 'bg-slate-50/70 opacity-60'}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-900">{dayRow.day}</td>

                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={dayRow.working}
                        onChange={(e) => handleDayFieldChange(index, 'working', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="time"
                        disabled={!dayRow.working}
                        value={dayRow.startTime}
                        onChange={(e) => handleDayFieldChange(index, 'startTime', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="time"
                        disabled={!dayRow.working}
                        value={dayRow.endTime}
                        onChange={(e) => handleDayFieldChange(index, 'endTime', e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="5"
                        disabled={!dayRow.working}
                        value={dayRow.breakDuration}
                        onChange={(e) => handleDayFieldChange(index, 'breakDuration', Number(e.target.value))}
                        className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {dayRow.working ? `${dayRow.dailyHours} hrs` : <span className="text-slate-400 font-normal">Off</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Visual Schedule Summary Preview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            Weekly Schedule Summary Preview
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1 text-xs">
            {formData.days.map((d) => (
              <div
                key={d.day}
                className={`p-3 rounded-lg border flex flex-col justify-between ${
                  d.working
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-100/60 border-slate-200/60 text-slate-400'
                }`}
              >
                <div>
                  <span className="font-bold block text-[11px] uppercase tracking-wider">
                    {d.day.slice(0, 3)}
                  </span>
                  <p className="font-mono text-xs font-semibold mt-1">
                    {d.working ? `${d.startTime} - ${d.endTime}` : 'Off'}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 font-medium mt-2">
                  {d.working ? `${d.dailyHours}h (break: ${d.breakDuration}h)` : 'Non-working'}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-right">
            <span className="text-xs font-bold text-slate-800">
              Calculated Total: <span className="text-blue-600 text-sm font-extrabold">{Math.round(totalWeeklyHours * 10) / 10} Hours / Week</span>
            </span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/working-schedules')}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isCreate ? 'Save Schedule' : 'Update Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
};
