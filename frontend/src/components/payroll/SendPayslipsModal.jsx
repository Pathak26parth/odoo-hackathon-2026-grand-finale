// components/payroll/SendPayslipsModal.jsx
import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2, X, Send, RotateCw } from 'lucide-react';
import payrollService from '../../services/payrollService';

export const SendPayslipsModal = ({ isOpen, onClose, payrun, payslips = [], onFinished }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [deliveryStatuses, setDeliveryStatuses] = useState({});
  const [summaryReport, setSummaryReport] = useState(null);

  // Sync state whenever modal opens or payslips prop updates
  useEffect(() => {
    if (!isOpen) return;

    const statusMap = {};
    const pendingIds = [];

    payslips.forEach((s) => {
      const isSent = Boolean(s.email_sent_at || s.emailSentAt || s.emailStatus === 'Sent');
      statusMap[s.id] = isSent ? 'Sent' : (s.emailStatus || 'Not Sent');
      // Only pre-select unsent/pending slips
      if (!isSent) {
        pendingIds.push(s.id);
      }
    });

    setDeliveryStatuses(statusMap);
    setSelectedIds(pendingIds);
    setSummaryReport(null);
  }, [isOpen, payslips]);

  if (!isOpen) return null;

  const totalCount = payslips.length;
  const sentCount = payslips.filter(
    (s) => deliveryStatuses[s.id] === 'Sent' || Boolean(s.email_sent_at || s.emailSentAt)
  ).length;
  const pendingCount = totalCount - sentCount;
  const allAlreadySent = totalCount > 0 && sentCount === totalCount;

  const toggleSelectAll = () => {
    if (selectedIds.length === payslips.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(payslips.map((s) => s.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;
    setIsSending(true);
    setSummaryReport(null);

    // Set sending state
    const workingStatuses = { ...deliveryStatuses };
    selectedIds.forEach((id) => {
      workingStatuses[id] = 'Sending';
    });
    setDeliveryStatuses({ ...workingStatuses });

    let successCount = 0;
    let failedCount = 0;

    for (const id of selectedIds) {
      try {
        await payrollService.sendPayslipEmail(id);
        workingStatuses[id] = 'Sent';
        successCount++;
      } catch (err) {
        console.warn(`Failed to send payslip ${id}:`, err);
        workingStatuses[id] = 'Failed';
        failedCount++;
      }
      setDeliveryStatuses({ ...workingStatuses });
    }

    setIsSending(false);
    setSelectedIds([]); // Clear selection after sending
    setSummaryReport({
      sentCount: successCount,
      failedCount,
      message: `${successCount} payslip email(s) dispatched successfully.${
        failedCount > 0 ? ` ${failedCount} email(s) failed.` : ''
      }`
    });

    if (onFinished) onFinished();
  };

  // Determine button label and icon
  const hasSelectedAny = selectedIds.length > 0;
  const anySelectedAlreadySent = selectedIds.some(
    (id) => deliveryStatuses[id] === 'Sent'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Send Payslips</h3>
              <p className="text-xs text-slate-500">{payrun?.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Total Staff</span>
            <span className="text-base font-bold text-slate-900">{totalCount}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Delivered via Email</span>
            <span className="text-base font-bold text-emerald-600">{sentCount}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Pending Delivery</span>
            <span className={`text-base font-bold ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {pendingCount}
            </span>
          </div>
        </div>

        {/* Informational Banner if all already delivered */}
        {allAlreadySent && !summaryReport && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-semibold">
              All {totalCount} payslips in this cycle have already been successfully dispatched. Select individual employees below if you wish to resend.
            </p>
          </div>
        )}

        {summaryReport && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{summaryReport.message}</p>
            </div>
          </div>
        )}

        {/* Employee Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === payslips.length && payslips.length > 0}
                      onChange={toggleSelectAll}
                      disabled={isSending}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 font-semibold">Employee</th>
                  <th className="py-3 px-3 font-semibold">Email</th>
                  <th className="py-3 px-3 font-semibold">Payslip</th>
                  <th className="py-3 px-3 font-semibold text-right">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payslips.map((s) => {
                  const status = deliveryStatuses[s.id] || 'Not Sent';
                  const isChecked = selectedIds.includes(s.id);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(s.id)}
                          disabled={isSending}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-900">{s.employeeName}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {s.employeeEmail || s.email || (s.employeeName ? `${s.employeeName.toLowerCase().replace(/\s+/g, '.')}@peoplepay360.com` : 'No email')}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono">{s.slipNumber}</td>
                      <td className="py-3 px-3 text-right">
                        {status === 'Sending' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600">
                            <Loader2 className="w-3 h-3 animate-spin" /> Sending...
                          </span>
                        ) : status === 'Sent' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Sent
                          </span>
                        ) : status === 'Failed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertCircle className="w-3 h-3" /> Failed
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Not Sent</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Selected: <strong>{selectedIds.length}</strong> of {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            >
              Close
            </button>

            {/* Dynamic Action Button */}
            {allAlreadySent && !hasSelectedAny ? (
              <button
                type="button"
                disabled={true}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-300 rounded-xl cursor-not-allowed opacity-90"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                All Payslips Delivered
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !hasSelectedAny}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Dispatching Emails...
                  </>
                ) : anySelectedAlreadySent ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5" />
                    Resend Selected ({selectedIds.length})
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Payslips ({selectedIds.length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
