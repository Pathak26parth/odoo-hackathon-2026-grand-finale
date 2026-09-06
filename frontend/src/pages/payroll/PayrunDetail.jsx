// pages/payroll/PayrunDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Mail,
  ArrowLeft,
  RefreshCw,
  Clock,
  Printer,
  FileCheck,
  Loader2,
  Trash2
} from 'lucide-react';
import payrollService from '../../services/payrollService';
import { useAuth } from '../../context/AuthContext';
import { canApprove, canMarkPaidAndSend, canDelete, MODULES } from '../../utils/permissionUtils';

import { PayrunSummary } from '../../components/payroll/PayrunSummary';
import { PayrunWarnings } from '../../components/payroll/PayrunWarnings';
import { PayslipTable } from '../../components/payroll/PayslipTable';
import { SendPayslipsModal } from '../../components/payroll/SendPayslipsModal';

export const PayrunDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'Admin';

  const [payrun, setPayrun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [blockingIssues, setBlockingIssues] = useState([]);
  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentRun = await payrollService.getPayrunById(id);
      if (currentRun) {
        setPayrun(currentRun);
        setPayslips(currentRun.payslips || []);
      }
    } catch (err) {
      console.error('Failed to load payrun details:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Loading payroll batch details...</p>
      </div>
    );
  }

  if (!payrun) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800">Payrun Not Found</h3>
        <button
          onClick={() => navigate('/payroll/payruns')}
          className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg"
        >
          Back to Payruns
        </button>
      </div>
    );
  }

  const statusUpper = (payrun.status || 'DRAFT').toUpperCase();
  const isDraft = statusUpper === 'DRAFT';
  const isComputed = statusUpper === 'COMPUTED';
  const isValidated = statusUpper === 'VALIDATED';
  const isPaid = statusUpper === 'PAID';

  // Role permissions
  const canMarkPaid = canMarkPaidAndSend(role);
  const canDeleteRun = canDelete(role, MODULES.PAYRUNS) && !isPaid;

  // COMPUTE PAYROLL
  const handleCompute = async () => {
    try {
      setIsComputing(true);
      await payrollService.computePayrun(payrun.id);
      await loadData();
      showToast('Payroll computed successfully based on configured salary rules and attendance.');
    } catch (err) {
      alert('Computation failed: ' + (err.message || 'Server error occurred'));
    } finally {
      setIsComputing(false);
    }
  };

  // VALIDATE PAYRUN
  const handleValidate = async () => {
    try {
      setIsValidating(true);
      await payrollService.validatePayrun(payrun.id);
      await loadData();
      showToast('Payrun validated successfully.');
    } catch (err) {
      alert('Validation failed: ' + (err.message || 'Server error occurred'));
    } finally {
      setIsValidating(false);
    }
  };

  // MARK AS PAID
  const handleConfirmMarkPaid = async () => {
    try {
      setIsMarkingPaid(true);
      await payrollService.payPayrun(payrun.id);
      await loadData();
      setIsMarkPaidModalOpen(false);
      showToast('Payrun marked as Paid. Records are now historical and read-only.');
    } catch (err) {
      alert('Mark Paid failed: ' + (err.message || 'Server error occurred'));
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this payrun batch and its payslips?')) {
      try {
        await payrollService.deletePayrun(payrun.id);
        navigate('/payroll/payruns');
      } catch (err) {
        alert('Delete failed: ' + (err.message || 'Server error occurred'));
      }
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VALIDATED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPUTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DRAFT':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Primary Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/payroll/payruns')}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
              title="Back to Payruns"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">{payrun.name}</h1>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                    payrun.status
                  )}`}
                >
                  {statusUpper}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {payrun.structure || payrun.structure_name || 'Standard Structure'} • Period:{' '}
                <span className="font-mono text-slate-700">
                  {payrun.periodStart} &rarr; {payrun.periodEnd}
                </span>
                {payrun.runCode && <span className="ml-2 font-mono text-slate-400">[{payrun.runCode}]</span>}
              </p>
            </div>
          </div>

          {/* Action Buttons with status enable/disable rules */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Compute Button */}
            <button
              type="button"
              onClick={handleCompute}
              disabled={isComputing || isValidated || isPaid}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              <Calculator className={`w-3.5 h-3.5 ${isComputing ? 'animate-spin' : ''}`} />
              {isComputing ? 'Computing...' : isComputed ? 'Recompute' : 'Compute'}
            </button>

            {/* Validate Button */}
            <button
              type="button"
              onClick={handleValidate}
              disabled={!isComputed || isValidated || isPaid || isValidating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5" />
              {isValidating ? 'Validating...' : 'Validate'}
            </button>

            {/* Mark Paid Button */}
            <button
              type="button"
              onClick={() => setIsMarkPaidModalOpen(true)}
              disabled={!isValidated || isPaid || !canMarkPaid || isMarkingPaid}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Mark Paid
            </button>

            {/* Send Payslips Button */}
            {(() => {
              const allPayslipsSent = payslips.length > 0 && payslips.every(s => Boolean(s.email_sent_at || s.emailSentAt || s.emailStatus === 'Sent'));
              return (
                <button
                  type="button"
                  onClick={() => setIsSendModalOpen(true)}
                  disabled={!isPaid || !canMarkPaid}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${
                    allPayslipsSent
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                >
                  {allPayslipsSent ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      Payslips Sent
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      Send Payslips
                    </>
                  )}
                </button>
              );
            })()}

            {canDeleteRun && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                title="Delete Payrun"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Payrun Summary Cards */}
        <PayrunSummary
          employeeCount={payrun.payslipsCount || payslips.length}
          basic={payrun.totalGross ? payrun.totalGross * 0.5 : 0}
          allowances={payrun.totalGross ? payrun.totalGross * 0.5 : 0}
          gross={payrun.totalGross}
          deductions={payrun.totalDeductions}
          net={payrun.totalNet}
        />
      </div>

      {/* Warnings Panel */}
      {payrun.warnings && payrun.warnings.length > 0 && (
        <PayrunWarnings warnings={payrun.warnings} />
      )}

      {/* Payslip Records Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Payslip Records</h2>
            <p className="text-xs text-slate-500">
              {payslips.length} individual employee payslip calculations computed in this batch.
            </p>
          </div>
        </div>

        <PayslipTable
          payslips={payslips}
          onView={(slipId) => navigate(`/payroll/payslips/${slipId}`)}
          onRecompute={() => handleCompute()}
          onPrint={(slipId) => navigate(`/payroll/payslips/${slipId}?print=true`)}
          isPayrunPaid={isPaid}
        />
      </div>

      {/* BLOCKING VALIDATION MODAL */}
      {isValidationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Validation Blocked</h3>
            </div>
            <p className="text-xs text-slate-600">
              Payroll cannot be validated until blocking issues are resolved:
            </p>
            <ul className="space-y-1.5 p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-900">
              {blockingIssues.map((b, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsValidationModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MARK AS PAID CONFIRMATION MODAL */}
      {isMarkPaidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Payment Finalization</h3>
                <p className="text-xs text-slate-500">Payrun: {payrun.name}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to mark this Payrun as paid? Once marked as paid, calculations will be locked as historical read-only records and payslips can be dispatched.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMarkPaidModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkPaid}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND PAYSLIPS MODAL */}
      <SendPayslipsModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        payrun={payrun}
        payslips={payslips}
        onFinished={() => loadData()}
      />
    </div>
  );
};
