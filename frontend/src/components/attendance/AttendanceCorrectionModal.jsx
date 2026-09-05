import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, AlertCircle, Send } from 'lucide-react';

export const AttendanceCorrectionModal = ({
  isOpen,
  onClose,
  initialData = null,
  onSubmit,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    attendanceId: null,
    requestDate: new Date().toISOString().split('T')[0],
    proposedCheckIn: '09:00',
    proposedCheckOut: '17:30',
    reason: ''
  });

  const [durationPreview, setDurationPreview] = useState('8h 30m');

  useEffect(() => {
    if (initialData) {
      // Format initial times if provided
      const extractTime = (val, defaultVal) => {
        if (!val) return defaultVal;
        const str = String(val).trim();
        // If format like "09:30" or "09:30:00"
        if (/^\d{1,2}:\d{2}/.test(str)) {
          return str.slice(0, 5);
        }
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
        return defaultVal;
      };

      setFormData({
        attendanceId: initialData.id ? parseInt(initialData.id, 10) : null,
        requestDate: initialData.date ? String(initialData.date).split('T')[0] : new Date().toISOString().split('T')[0],
        proposedCheckIn: extractTime(initialData.checkIn || initialData.check_in, '09:00'),
        proposedCheckOut: extractTime(initialData.checkOut || initialData.check_out, '17:30'),
        reason: initialData.reason || ''
      });
    } else {
      setFormData({
        attendanceId: null,
        requestDate: new Date().toISOString().split('T')[0],
        proposedCheckIn: '09:00',
        proposedCheckOut: '17:30',
        reason: ''
      });
    }
  }, [initialData, isOpen]);

  // Recalculate duration preview
  useEffect(() => {
    if (formData.proposedCheckIn && formData.proposedCheckOut) {
      const [hIn, mIn] = formData.proposedCheckIn.split(':').map(Number);
      const [hOut, mOut] = formData.proposedCheckOut.split(':').map(Number);
      const totalInMins = hIn * 60 + mIn;
      const totalOutMins = hOut * 60 + mOut;
      if (totalOutMins > totalInMins) {
        const diffMins = totalOutMins - totalInMins;
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setDurationPreview(`${hours}h ${String(mins).padStart(2, '0')}m`);
      } else {
        setDurationPreview('Invalid (Check-out must be after check-in)');
      }
    }
  }, [formData.proposedCheckIn, formData.proposedCheckOut]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      alert('Please provide a reason or justification for HR review.');
      return;
    }

    const proposedCheckInDateTime = `${formData.requestDate} ${formData.proposedCheckIn}:00`;
    const proposedCheckOutDateTime = `${formData.requestDate} ${formData.proposedCheckOut}:00`;

    onSubmit({
      attendanceId: formData.attendanceId,
      requestDate: formData.requestDate,
      proposedCheckIn: proposedCheckInDateTime,
      proposedCheckOut: proposedCheckOutDateTime,
      reason: formData.reason.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Request Attendance Regularization</h3>
              <p className="text-[11px] text-slate-500">Submit a correction for missed or forgotten check-in/out</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <span>
              Regular employees cannot manually alter attendance records. Once submitted, your request will be reviewed by HR. Upon approval, your attendance and worked hours will be updated automatically.
            </span>
          </div>

          <div className="space-y-3">
            {/* Target Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attendance Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.requestDate}
                  onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Proposed Check-In and Check-Out Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Check-In <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.proposedCheckIn}
                  onChange={(e) => setFormData({ ...formData, proposedCheckIn: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Check-Out <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.proposedCheckOut}
                  onChange={(e) => setFormData({ ...formData, proposedCheckOut: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Duration Preview Box */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="text-slate-500">Calculated Shift Duration:</span>
              <span className="font-mono font-bold text-blue-700">{durationPreview}</span>
            </div>

            {/* Reason / Justification */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Explanation <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g. Forgot to punch out before departure, worked from client location, technical camera glitch..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Submitting...' : 'Submit Request to HR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
