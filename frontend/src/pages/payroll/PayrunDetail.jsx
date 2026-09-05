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
  FileCheck
} from 'lucide-react';
import { getPayrunById, updatePayrun, fetchPayrunByIdAsync } from '../../data/payruns';
import { getPayslips, updatePayslip, updatePayslipsStatusByPayrun, fetchPayslipsAsync } from '../../data/payslips';
import { getEmployees, fetchEmployeesAsync } from '../../data/employees';
import { getContracts, fetchContractsAsync } from '../../data/contracts';
import { getSalaryStructures, fetchSalaryStructuresAsync } from '../../data/salaryStructures';
import { getSalaryRules, fetchSalaryRulesAsync } from '../../data/salaryRules';
import { calculatePayslip } from '../../utils/payrollCalculation';
import { useAuth } from '../../context/AuthContext';
import { canApprove, canMarkPaidAndSend, MODULES } from '../../utils/permissionUtils';

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
  const [employees, setEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [salaryRules, setSalaryRules] = useState([]);
  const [salaryStructure, setSalaryStructure] = useState(null);

  const [isComputing, setIsComputing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [blockingIssues, setBlockingIssues] = useState([]);
  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = () => {
    const currentRun = getPayrunById(id);
    if (currentRun) {
      setPayrun(currentRun);
      setPayslips(getPayslips(id));
    }

    fetchPayrunByIdAsync(id).then((fresh) => {
      if (fresh) {
        setPayrun(fresh);
        if (Array.isArray(fresh.payslips) && fresh.payslips.length > 0) {
          setPayslips(fresh.payslips);
        }
      }
    }).catch(console.error);

    fetchPayslipsAsync(id).then((slips) => {
      if (Array.isArray(slips) && slips.length > 0) setPayslips(slips);
    }).catch(console.error);

    fetchEmployeesAsync().then((list) => {
      if (Array.isArray(list)) setEmployees(list);
    }).catch(console.error);

    fetchContractsAsync().then((list) => {
      if (Array.isArray(list)) setContracts(list);
    }).catch(console.error);

    fetchSalaryRulesAsync().then((list) => {
      if (Array.isArray(list)) setSalaryRules(list);
    }).catch(console.error);

    fetchSalaryStructuresAsync().then((list) => {
      if (Array.isArray(list)) {
        const match = list.find((s) => s.id === (payrun?.salaryStructureId || payrun?.structureId));
        if (match) setSalaryStructure(match);
      }
    }).catch(console.error);
  };

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

  const isDraft = payrun.status === 'Draft';
  const isComputed = payrun.status === 'Computed';
  const isValidated = payrun.status === 'Validated';
  const isPaid = payrun.status === 'Paid';

  // Role permissions
  const canMarkPaid = canMarkPaidAndSend(role);

  // COMPUTE PAYROLL
  const handleCompute = async () => {
    setIsComputing(true);
    await new Promise((r) => setTimeout(r, 600));

    let runTotalBasic = 0;
    let runTotalAllowances = 0;
    let runTotalGross = 0;
    let runTotalDeductions = 0;
    let runTotalNet = 0;
    const accumulatedWarnings = [];

    const computedSlips = payslips.map((slip) => {
      const emp = employees.find((e) => e.id === slip.employeeId);
      const contract = contracts.find(
        (c) => c.employeeId === slip.employeeId && c.status === 'Active'
      );

      const calculated = calculatePayslip(
        emp,
        contract,
        salaryStructure,
        salaryRules
      );

      runTotalBasic += calculated.basic;
      runTotalAllowances += calculated.allowances;
      runTotalGross += calculated.gross;
      runTotalDeductions += calculated.deductions;
      runTotalNet += calculated.net;

      if (calculated.warnings && calculated.warnings.length > 0) {
        calculated.warnings.forEach((w) => accumulatedWarnings.push(w.message || w));
      }

      const updatedSlip = {
        ...slip,
        basic: calculated.basic,
        allowances: calculated.allowances,
        gross: calculated.gross,
        deductions: calculated.deductions,
        net: calculated.net,
        lines: calculated.lines,
        warnings: calculated.warnings.map((w) => w.message || w.type),
        status: 'Computed'
      };

      updatePayslip(slip.id, updatedSlip);
      return updatedSlip;
    });

    const updatedPayrun = updatePayrun(payrun.id, {
      status: 'Computed',
      totalBasic: runTotalBasic,
      totalAllowances: runTotalAllowances,
      totalGross: runTotalGross,
      totalDeductions: runTotalDeductions,
      totalNet: runTotalNet,
      warnings: Array.from(new Set(accumulatedWarnings))
    });

    setPayrun(updatedPayrun);
    setPayslips(computedSlips);
    setIsComputing(false);
    showToast('Payroll computed successfully based on configured salary rules.');
  };

  // RECOMPUTE SINGLE PAYSLIP
  const handleRecomputeSlip = (slipId) => {
    const slip = payslips.find((s) => s.id === slipId);
    if (!slip) return;

    const emp = employees.find((e) => e.id === slip.employeeId);
    const contract = contracts.find(
      (c) => c.employeeId === slip.employeeId && c.status === 'Active'
    );

    const calculated = calculatePayslip(emp, contract, salaryStructure, salaryRules);
    const updated = updatePayslip(slipId, {
      basic: calculated.basic,
      allowances: calculated.allowances,
      gross: calculated.gross,
      deductions: calculated.deductions,
      net: calculated.net,
      lines: calculated.lines,
      status: 'Computed'
    });

    setPayslips(payslips.map((s) => (s.id === slipId ? updated : s)));
    showToast(`Recomputed payslip for ${slip.employeeName}.`);
  };

  // VALIDATE PAYRUN
  const handleValidate = () => {
    // Check blocking warnings (e.g. missing contracts)
    const blockers = [];
    payslips.forEach((s) => {
      const activeCtr = contracts.find(
        (c) => c.employeeId === s.employeeId && c.status === 'Active'
      );
      if (!activeCtr) {
        blockers.push(`Employee ${s.employeeName} has no applicable active contract.`);
      }
    });

    if (blockers.length > 0) {
      setBlockingIssues(blockers);
      setIsValidationModalOpen(true);
      return;
    }

    // Mark Validated
    const updated = updatePayrun(payrun.id, { status: 'Validated' });
    updatePayslipsStatusByPayrun(payrun.id, 'Validated');
    setPayrun(updated);
    setPayslips(getPayslips(payrun.id));
    showToast('Payrun validated successfully.');
  };

  // MARK AS PAID
  const handleConfirmMarkPaid = () => {
    const updated = updatePayrun(payrun.id, {
      status: 'Paid',
      paidAt: new Date().toISOString().split('T')[0]
    });
    updatePayslipsStatusByPayrun(payrun.id, 'Paid');
    setPayrun(updated);
    setPayslips(getPayslips(payrun.id));
    setIsMarkPaidModalOpen(false);
    showToast('Payrun marked as Paid. Records are now historical and read-only.');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Validated':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Computed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Draft':
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
                  {payrun.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {payrun.salaryStructureName} • Period:{' '}
                <span className="font-mono text-slate-700">
                  {payrun.periodStart} &rarr; {payrun.periodEnd}
                </span>
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
              {isComputing ? 'Computing...' : 'Compute'}
            </button>

            {/* Validate Button */}
            <button
              type="button"
              onClick={handleValidate}
              disabled={!isComputed || isValidated || isPaid}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Validate
            </button>

            {/* Mark Paid Button */}
            <button
              type="button"
              onClick={() => setIsMarkPaidModalOpen(true)}
              disabled={!isValidated || isPaid || !canMarkPaid}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Mark Paid
            </button>

            {/* Send Payslips Button */}
            <button
              type="button"
              onClick={() => setIsSendModalOpen(true)}
              disabled={!isPaid || !canMarkPaid}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-900 text-white shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              Send Payslips
            </button>
          </div>
        </div>

        {/* Payrun Summary Cards */}
        <PayrunSummary
          employeeCount={payrun.employeeCount || payslips.length}
          basic={payrun.totalBasic}
          allowances={payrun.totalAllowances}
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
              {payslips.length} individual employee payslip calculations in this payrun.
            </p>
          </div>
        </div>

        <PayslipTable
          payslips={payslips}
          onView={(slipId) => navigate(`/payroll/payslips/${slipId}`)}
          onRecompute={handleRecomputeSlip}
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
        onFinished={() => setPayslips(getPayslips(payrun.id))}
      />
    </div>
  );
};
