import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, X } from 'lucide-react';

export const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary' | 'danger' | 'success'
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  let icon = <AlertCircle className="w-6 h-6 text-blue-600" />;
  let iconBg = 'bg-blue-50 border-blue-200';
  let confirmBtnClass = 'bg-blue-600 hover:bg-blue-700 text-white';

  if (variant === 'danger') {
    icon = <AlertTriangle className="w-6 h-6 text-rose-600" />;
    iconBg = 'bg-rose-50 border-rose-200';
    confirmBtnClass = 'bg-rose-600 hover:bg-rose-700 text-white';
  } else if (variant === 'success') {
    icon = <CheckCircle className="w-6 h-6 text-emerald-600" />;
    iconBg = 'bg-emerald-50 border-emerald-200';
    confirmBtnClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${iconBg}`}>
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Please confirm your decision below</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 text-xs text-slate-600 leading-relaxed">
          {message}
        </div>

        <div className="flex items-center justify-end gap-2.5 p-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-colors ${confirmBtnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
