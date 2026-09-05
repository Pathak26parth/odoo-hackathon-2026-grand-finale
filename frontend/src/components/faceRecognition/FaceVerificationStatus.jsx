// components/faceRecognition/FaceVerificationStatus.jsx
import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, LogIn, LogOut, RefreshCw, UserX } from 'lucide-react';

export const FaceVerificationStatus = ({
  verifiedData,
  failureType,
  failureMessage,
  hasCheckedInToday,
  todayRecord,
  onCheckIn,
  onCheckOut,
  onRetry,
  onCancel,
  isProcessing = false
}) => {
  if (!verifiedData && !failureType) {
    return null;
  }

  if (failureType) {
    return (
      <div className="w-full max-w-lg mx-auto mt-4 p-5 rounded-2xl bg-white border border-rose-200 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            {failureType === 'Face Not Registered' ? (
              <UserX className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900">{failureType}</h4>
            <p className="text-xs text-slate-600 mt-1">{failureMessage}</p>
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (timeVal) => {
    if (!timeVal) return null;
    if (typeof timeVal === 'string' && (timeVal.includes('am') || timeVal.includes('pm') || timeVal.includes('AM') || timeVal.includes('PM'))) {
      return timeVal;
    }
    const d = new Date(timeVal);
    return isNaN(d.getTime()) ? String(timeVal) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const displayCheckInTime = formatTime(todayRecord?.checkIn || todayRecord?.check_in || todayRecord?.rawCheckIn);
  const displayCheckOutTime = formatTime(todayRecord?.checkOut || todayRecord?.check_out || todayRecord?.rawCheckOut);
  const isAlreadyCheckedOut = Boolean(todayRecord && (todayRecord.check_out || todayRecord.checkOut));

  return (
    <div className="w-full max-w-lg mx-auto mt-4 p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm">
      {/* Verified Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Identity Verified</h4>
            <span className="text-[11px] font-medium text-emerald-600">
              Confidence Score: {verifiedData.confidence}%
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
          Verified ✓
        </span>
      </div>

      {/* Employee Details */}
      <div className="grid grid-cols-2 gap-3 py-3 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Employee</span>
          <span className="font-semibold text-slate-900">{verifiedData.employeeName}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Employee ID</span>
          <span className="font-semibold text-slate-900">{verifiedData.employeeId}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Department</span>
          <span className="font-medium text-slate-700">{verifiedData.department}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Position</span>
          <span className="font-medium text-slate-700">{verifiedData.position}</span>
        </div>
      </div>

      {/* Dynamic Today's Status Callout */}
      {hasCheckedInToday ? (
        <div className="mb-4 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Checked In at: <strong>{displayCheckInTime || 'Earlier Today'}</strong></span>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">Ready for Check-Out</span>
        </div>
      ) : isAlreadyCheckedOut ? (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between shadow-2xs">
          <div>
            <span>Shift Completed: Checked out at <strong>{displayCheckOutTime}</strong></span>
            {todayRecord?.workedHours > 0 && (
              <span className="text-emerald-700 block text-[11px] mt-0.5">Total Worked: <strong>{todayRecord.workedHours}h</strong></span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-300 px-2 py-0.5 rounded-full">Checked Out ✓</span>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between shadow-2xs">
          <span>Shift Status: <strong>Not Checked In Yet</strong></span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">Ready for Check-In</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-3">
        {!hasCheckedInToday ? (
          <button
            type="button"
            onClick={onCheckIn}
            disabled={isProcessing}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {isProcessing ? 'Processing Check-In...' : (isAlreadyCheckedOut ? 'CHECK IN AGAIN' : 'CHECK IN')}
          </button>
        ) : (
          <button
            type="button"
            onClick={onCheckOut}
            disabled={isProcessing}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {isProcessing ? 'Processing Check-Out...' : 'CHECK OUT'}
          </button>
        )}

        <button
          type="button"
          onClick={onRetry}
          disabled={isProcessing}
          className="px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
        >
          Scan Again
        </button>
      </div>
    </div>
  );
};
