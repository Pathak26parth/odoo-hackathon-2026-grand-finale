// pages/payroll/PayslipDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Printer,
  ArrowLeft,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  Download,
  Mail,
  Loader2
} from 'lucide-react';
import payrollService from '../../services/payrollService';
import { formatCurrency } from '../../utils/payrollCalculation';
import { SalaryBreakdown } from '../../components/payroll/SalaryBreakdown';
import { PayslipPrint } from '../../components/payroll/PayslipPrint';

export const PayslipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('print') === 'true';

  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(autoPrint);

  useEffect(() => {
    async function loadSlip() {
      try {
        setLoading(true);
        const slip = await payrollService.getPayslipById(id);
        if (slip) {
          setPayslip(slip);
        }
      } catch (err) {
        console.error('Failed to load payslip:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSlip();
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await payrollService.downloadPayslipPdf(payslip.id);
      showToast('Payslip PDF downloaded successfully.');
    } catch (err) {
      alert('Failed to download PDF: ' + (err.message || 'Server error'));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      await payrollService.sendPayslipEmail(payslip.id);
      showToast('Payslip email dispatched to employee successfully.');
    } catch (err) {
      alert('Failed to send email: ' + (err.message || 'Server error'));
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Loading payslip details...</p>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800">Payslip Not Found</h3>
        <button
          onClick={() => navigate('/payroll/payslips')}
          className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg"
        >
          Back to Payslips
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VALIDATED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPUTED':
      case 'UNPAID':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DRAFT':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/payroll/payslips')}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
            title="Back to Payslips"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 font-mono">{payslip.slipNumber}</h1>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                  payslip.status
                )}`}
              >
                {payslip.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Payrun: <strong className="text-slate-800">{payslip.payrunName}</strong> • Period:{' '}
              <span className="font-mono text-slate-700">{payslip.period}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {downloadingPdf ? 'Downloading...' : 'PDF'}
          </button>

          <button
            type="button"
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            {sendingEmail ? 'Sending...' : 'Email'}
          </button>

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Employee Information Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Employee Information
          </h3>
          <span className="text-xs font-semibold text-slate-700">
            Worked Days: <strong className="text-blue-600">{payslip.workedDays !== undefined && payslip.workedDays !== null ? payslip.workedDays : '30'} Days</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Employee Name</span>
            <span className="font-bold text-slate-900 text-sm">{payslip.employeeName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Employee ID</span>
            <span className="font-mono font-semibold text-slate-800">
              {payslip.employeeCode || payslip.employeeId}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Department</span>
            <span className="font-medium text-slate-800">{payslip.department}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Position</span>
            <span className="font-medium text-slate-800">{payslip.position}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Contract</span>
            <span className="font-mono font-medium text-slate-800">{payslip.contractId ? `CON-${payslip.contractId}` : 'Active Contract'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Salary Structure</span>
            <span className="font-medium text-slate-800">{payslip.structure_name || payslip.salaryStructureName || 'Standard Structure'}</span>
          </div>
        </div>
      </div>

      {/* Salary Breakdown (Earnings, Deductions, Net Salary) */}
      <SalaryBreakdown
        basic={payslip.basic}
        allowances={payslip.allowances || (payslip.gross - payslip.basic)}
        gross={payslip.gross}
        deductions={payslip.deductions}
        net={payslip.net}
        lines={payslip.lines}
      />

      {/* Salary Rule Breakdown Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Salary Rule Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Sequence-based rule computation engine audit record.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-center w-12">Seq</th>
                <th className="py-2.5 px-3 font-semibold">Salary Rule</th>
                <th className="py-2.5 px-3 font-semibold">Code</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(payslip.lines || []).map((rule, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-400">
                    {rule.sequence || idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{rule.name}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{rule.code}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                      {rule.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(rule.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Modal */}
      {showPrintModal && (
        <PayslipPrint payslip={payslip} onClose={() => setShowPrintModal(false)} />
      )}
    </div>
  );
};
