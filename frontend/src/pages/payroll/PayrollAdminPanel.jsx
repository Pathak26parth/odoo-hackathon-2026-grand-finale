import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Calculator,
  Play,
  CheckSquare,
  RefreshCw,
  Sliders,
  ArrowRight,
  Clock,
  CreditCard,
  BarChart3,
  Layers,
  ExternalLink,
  Check,
  AlertCircle,
  XCircle,
  HelpCircle,
  Building2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import payrollAdminService from '../../services/payrollAdminService';
import { formatCurrency } from '../../utils/payrollCalculation';

export const PayrollAdminPanel = () => {
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();

  // Selected period filter
  const [period, setPeriod] = useState('2026-09');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'compliance' | 'simulator' | 'audit'

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // Simulator states
  const [simWage, setSimWage] = useState('95000');
  const [simStructureId, setSimStructureId] = useState(1);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Bulk action states
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadAllData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [overviewData, complianceData, analyticsData, logsData] = await Promise.all([
        payrollAdminService.getOverview({ period }),
        payrollAdminService.getComplianceCheck({ period }),
        payrollAdminService.getAnalytics(),
        payrollAdminService.getAuditLogs(20)
      ]);

      setOverview(overviewData);
      setCompliance(complianceData);
      setAnalytics(analyticsData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('[PayrollAdminPanel] Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [period]);

  // Run simulation
  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    if (!simWage || isNaN(Number(simWage)) || Number(simWage) <= 0) return;

    setSimLoading(true);
    try {
      const result = await payrollAdminService.simulateSalary(Number(simWage), simStructureId);
      setSimResult(result);
    } catch (err) {
      console.error('[Simulator] Error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  // Run initial simulation once on load
  useEffect(() => {
    handleSimulate();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Bulk Action Handler
  const handleBulkAction = async (action) => {
    if (!overview?.recentPayruns?.length) {
      showToast('No payrun batches available for bulk execution.');
      return;
    }

    const targetPayruns = overview.recentPayruns.map((p) => p.id);
    setBulkActionLoading(true);
    try {
      const res = await payrollAdminService.executeBulkAction(action, targetPayruns);
      showToast(res.message || `Action ${action} executed.`);
      await loadAllData(true);
    } catch (err) {
      showToast('Action failed: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'bg-amber-50 border-amber-200';
    return 'bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* COMMAND CENTER HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-blue-900/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                Payroll Administration Command Center
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Payroll Operations &amp; Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Centralized administrative hub for pre-payroll compliance audits, payrun batch lifecycle enforcement, dynamic salary rule computations, and disbursement liabilities.
            </p>
          </div>

          {/* Quick Action Buttons & Period Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-white">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              <span className="font-semibold text-slate-300 text-[11px] uppercase">Period:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
              >
                {overview?.availablePeriods && overview.availablePeriods.length > 0 ? (
                  overview.availablePeriods.map((p) => (
                    <option key={p.period} value={p.period} className="text-slate-900 font-semibold">
                      {p.displayLabel || p.label}
                    </option>
                  ))
                ) : (
                  <option value="2026-09" className="text-slate-900 font-semibold">September 2026</option>
                )}
              </select>
            </div>

            <button
              onClick={() => loadAllData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Dynamic Contextual Action Button based on currentPeriodPayrun */}
            {(() => {
              const currentRun = overview?.currentPeriodPayrun;
              if (currentRun?.status === 'PAID') {
                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/payroll/payruns/${currentRun.id}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
                      title="View Finalized Payrun Details"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Cycle Completed (Payrun #{currentRun.id})
                    </button>
                    <button
                      onClick={() => navigate('/payroll/payruns/new')}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-colors"
                      title="Launch Supplemental Off-Cycle Batch"
                    >
                      + New Payrun
                    </button>
                  </div>
                );
              }

              if (currentRun?.status === 'VALIDATED') {
                return (
                  <button
                    onClick={() => navigate(`/payroll/payruns/${currentRun.id}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Disburse &amp; Mark Paid (Payrun #{currentRun.id})
                  </button>
                );
              }

              if (currentRun?.status === 'COMPUTED') {
                return (
                  <button
                    onClick={() => navigate(`/payroll/payruns/${currentRun.id}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Audit &amp; Validate (Payrun #{currentRun.id})
                  </button>
                );
              }

              if (currentRun?.status === 'DRAFT') {
                return (
                  <button
                    onClick={() => navigate(`/payroll/payruns/${currentRun.id}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-white shadow-md shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Resume Payrun #{currentRun.id} (Draft)
                  </button>
                );
              }

              return (
                <button
                  onClick={() => navigate(`/payroll/payruns/new`)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-500 hover:bg-blue-400 text-white shadow-md shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Launch Payrun Wizard
                </button>
              );
            })()}
          </div>
        </div>

        {/* Subtle Decorative Background Glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* FINALIZED CYCLE COMPLETION BANNER */}
      {overview?.currentPeriodPayrun?.status === 'PAID' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">
                Payroll Cycle Finalized &amp; Disbursed for {period}
              </h4>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Batch #{overview.currentPeriodPayrun.id} ({overview.currentPeriodPayrun.name}) has been validated and disbursed to {overview.currentPeriodPayrun.employee_count} employees. Net disbursement: {formatCurrency(overview.currentPeriodPayrun.total_net)}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate(`/payroll/payruns/${overview.currentPeriodPayrun.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Batch #{overview.currentPeriodPayrun.id}
            </button>
          </div>
        </div>
      )}

      {/* PRE-PAYROLL COMPLIANCE AUDIT ENGINE CARD */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${getScoreBg(compliance?.readinessScore ?? 100)} shadow-xs`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-2xs border border-slate-200 shrink-0">
              <span className={`text-xl font-black ${getScoreColor(compliance?.readinessScore ?? 100)}`}>
                {compliance?.readinessScore ?? 100}%
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Pre-Payroll Compliance &amp; Readiness Health
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  compliance?.status === 'FINALIZED' || compliance?.readinessScore >= 90
                    ? 'bg-emerald-100 text-emerald-800'
                    : compliance?.readinessScore >= 70
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {compliance?.status || 'OPTIMAL'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {compliance?.summary?.message
                  ? compliance.summary.message
                  : compliance?.summary?.isPayrunReady
                  ? 'All active workforce profiles, bank accounts, and employment contracts are verified. Zero execution blockers.'
                  : `Attention: ${compliance?.summary?.blockerCount || 0} critical blocker(s) and ${compliance?.summary?.warningCount || 0} warning(s) detected that may impact salary calculations.`}
              </p>
            </div>
          </div>

          {/* Quick Blocker Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {compliance?.auditChecks?.map((check) => (
              <button
                key={check.id}
                onClick={() => setActiveTab('compliance')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                  check.passed
                    ? 'bg-white/80 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    : check.severity === 'BLOCKER'
                    ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200 animate-pulse'
                    : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                }`}
              >
                {check.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>{check.title}</span>
                {!check.passed && (
                  <span className="ml-1 px-1.5 py-0.2 bg-white rounded-full text-[10px] font-bold">
                    {check.failedCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 CORE EXECUTIVE FINANCIAL CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Salary Disbursements */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Net Disbursements
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(overview?.financials?.periodNet || 0)}
            </p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <span className="text-emerald-600 font-bold">Processed</span> for period {period}
            </p>
          </div>
        </div>

        {/* Gross Wage Liability */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Gross Wage Liability
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(overview?.financials?.periodGross || overview?.financials?.monthlyWageLiability || 0)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Total pre-deduction earnings commitment
            </p>
          </div>
        </div>

        {/* Statutory & Total Deductions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Statutory Deductions
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(overview?.financials?.periodDeductions || 0)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              PF (12%) + Professional Tax + TDS
            </p>
          </div>
        </div>

        {/* Payroll Headcount & Avg Wage */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Payroll Headcount
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {overview?.financials?.totalActiveEmployees || 0} Staff
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Avg Contract Base: {formatCurrency(overview?.financials?.averageWage || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* PAYRUN BATCH LIFECYCLE PIPELINE */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Payrun Processing Pipeline &amp; Batch Lifecycle
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live progression of payroll batches from initial setup wizard to disbursement.
            </p>
          </div>

          {/* Bulk Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('validate-all')}
              disabled={bulkActionLoading || (overview?.pipeline?.COMPUTED?.count || 0) === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Validate Computed ({overview?.pipeline?.COMPUTED?.count || 0})
            </button>
            <button
              onClick={() => handleBulkAction('pay-all')}
              disabled={bulkActionLoading || (overview?.pipeline?.VALIDATED?.count || 0) === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Mark Paid ({overview?.pipeline?.VALIDATED?.count || 0})
            </button>
          </div>
        </div>

        {/* 4 Pipeline Stages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Stage 1: DRAFT */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                1. Draft Stage
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-700">
                {overview?.pipeline?.DRAFT?.count || 0} Batches
              </span>
            </div>
            <p className="text-lg font-extrabold text-slate-900">
              {formatCurrency(overview?.pipeline?.DRAFT?.net || 0)}
            </p>
            <p className="text-[11px] text-slate-500">
              {overview?.pipeline?.DRAFT?.slips || 0} itemized slips pending computation
            </p>
          </div>

          {/* Stage 2: COMPUTED */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                2. Computed Stage
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                {overview?.pipeline?.COMPUTED?.count || 0} Batches
              </span>
            </div>
            <p className="text-lg font-extrabold text-amber-900">
              {formatCurrency(overview?.pipeline?.COMPUTED?.net || 0)}
            </p>
            <p className="text-[11px] text-amber-700">
              Calculations executed, awaiting managerial audit
            </p>
          </div>

          {/* Stage 3: VALIDATED */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                3. Validated Stage
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">
                {overview?.pipeline?.VALIDATED?.count || 0} Batches
              </span>
            </div>
            <p className="text-lg font-extrabold text-blue-900">
              {formatCurrency(overview?.pipeline?.VALIDATED?.net || 0)}
            </p>
            <p className="text-[11px] text-blue-700">
              Locked and approved, ready for payment release
            </p>
          </div>

          {/* Stage 4: PAID */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                4. Paid Stage
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                {overview?.pipeline?.PAID?.count || 0} Batches
              </span>
            </div>
            <p className="text-lg font-extrabold text-emerald-900">
              {formatCurrency(overview?.pipeline?.PAID?.net || 0)}
            </p>
            <p className="text-[11px] text-emerald-700">
              Disbursed and archived with employee PDF delivery
            </p>
          </div>
        </div>
      </div>

      {/* INTERACTIVE NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics &amp; Allocation
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'compliance'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Pre-Payroll Audit
          {compliance?.summary?.blockerCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
              {compliance.summary.blockerCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'simulator'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Salary Rule Simulator
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Payroll Audit Trail
        </button>
      </div>

      {/* TAB 1: ANALYTICS & ALLOCATION */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Cost Allocation */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Department Salary Expenditure Distribution
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Net compensation budget allocation across operational units.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 pt-2">
                {analytics?.departmentBreakdown?.map((dept) => {
                  const totalExp = analytics.departmentBreakdown.reduce((s, d) => s + Number(d.total_net_cost), 0);
                  const pct = totalExp > 0 ? Math.round((Number(dept.total_net_cost) / totalExp) * 100) : 0;
                  return (
                    <div key={dept.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{dept.department_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 text-[11px]">{dept.headcount} staff</span>
                          <span className="font-bold text-slate-900">{formatCurrency(dept.total_net_cost)}</span>
                          <span className="font-mono text-blue-600 text-[11px] font-bold w-9 text-right">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Salary Components Breakdown */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Salary Rule Components Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Itemized distribution of basic earnings, allowances, and statutory withholdings.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 max-h-72 overflow-y-auto pr-1">
                {analytics?.componentDistribution?.map((comp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        comp.category === 'BASIC'
                          ? 'bg-emerald-100 text-emerald-800'
                          : comp.category === 'ALLOWANCE'
                          ? 'bg-blue-100 text-blue-800'
                          : comp.category === 'DEDUCTION'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {comp.code}
                      </span>
                      <span className="font-semibold text-slate-800">{comp.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">
                      {formatCurrency(comp.total_amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRE-PAYROLL AUDIT & COMPLIANCE CHECKLIST */}
      {activeTab === 'compliance' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Pre-Payroll Audit automatically verifies active employees against contractual, attendance, and banking requirements before payrun creation.
              </span>
            </div>
            <button
              onClick={() => loadAllData(true)}
              className="font-bold underline text-blue-700 hover:text-blue-900 shrink-0"
            >
              Re-scan Database
            </button>
          </div>

          <div className="space-y-3">
            {compliance?.auditChecks?.map((check) => (
              <div
                key={check.id}
                className={`p-5 rounded-2xl border transition-all ${
                  check.passed
                    ? 'bg-white border-slate-200'
                    : check.severity === 'BLOCKER'
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {check.passed ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          check.severity === 'BLOCKER' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{check.title}</h4>
                        <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                          check.passed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : check.severity === 'BLOCKER'
                            ? 'bg-rose-100 text-rose-800 font-black'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {check.passed ? 'PASSED' : check.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{check.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">
                      {check.passed ? (
                        <span className="text-emerald-700 font-semibold">0 Issues</span>
                      ) : (
                        <span className="text-rose-700 font-bold">{check.failedCount} Impacted Staff</span>
                      )}
                    </span>
                    {!check.passed && (
                      <button
                        onClick={() => navigate(check.actionUrl)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-colors"
                      >
                        <span>{check.actionLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Drill-down for issues */}
                {!check.passed && check.items?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200/70">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Impacted Profiles:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {check.items.map((emp, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 shadow-2xs text-slate-800"
                        >
                          <span className="font-mono text-[10px] text-blue-600 font-bold">{emp.employee_code}</span>
                          <span className="font-semibold">{emp.full_name}</span>
                          <span className="text-[10px] text-slate-400">({emp.department_name || 'General'})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SALARY RULE SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                Dynamic Salary Rule Simulator &amp; Math Engine
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Test and verify salary calculation sequences, percentages, and formula dependencies against any base wage.
              </p>
            </div>

            <form onSubmit={handleSimulate} className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Monthly Contract Base Wage (₹)
                </label>
                <input
                  type="number"
                  value={simWage}
                  onChange={(e) => setSimWage(e.target.value)}
                  placeholder="e.g. 95000"
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Salary Structure
                </label>
                <select
                  value={simStructureId}
                  onChange={(e) => setSimStructureId(Number(e.target.value))}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value={1}>Regular Full-Time Structure (REG_SAL_2026)</option>
                  <option value={2}>Contractor Compensation Structure (CONTRACT_SAL_2026)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={simLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
              >
                {simLoading ? 'Evaluating...' : 'Run Simulation'}
              </button>
            </form>

            {/* Simulation Result Breakdown */}
            {simResult && (
              <div className="space-y-4 pt-2">
                {/* Result KPI Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                    <span className="text-[11px] font-semibold text-blue-700 block uppercase">Calculated Gross</span>
                    <span className="text-xl font-black text-blue-900">{formatCurrency(simResult.summary.gross)}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
                    <span className="text-[11px] font-semibold text-rose-700 block uppercase">Total Deductions</span>
                    <span className="text-xl font-black text-rose-900">{formatCurrency(simResult.summary.totalDeductions)}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-[11px] font-semibold text-emerald-700 block uppercase">Final Net Salary</span>
                    <span className="text-xl font-black text-emerald-900">{formatCurrency(simResult.summary.net)}</span>
                  </div>
                </div>

                {/* Sequenced Rules Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-4">Seq</th>
                        <th className="py-2.5 px-4">Rule Name</th>
                        <th className="py-2.5 px-4">Code</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Computation</th>
                        <th className="py-2.5 px-4 text-right">Computed Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {simResult.lines?.map((line, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-4 font-mono font-bold text-slate-400">{line.sequence}</td>
                          <td className="py-2 px-4 font-bold text-slate-800">{line.name}</td>
                          <td className="py-2 px-4 font-mono font-bold text-blue-600">{line.code}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              line.category === 'BASIC'
                                ? 'bg-emerald-100 text-emerald-800'
                                : line.category === 'ALLOWANCE'
                                ? 'bg-blue-100 text-blue-800'
                                : line.category === 'DEDUCTION'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {line.category}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-slate-500 font-mono text-[11px]">{line.formula}</td>
                          <td className="py-2 px-4 text-right font-extrabold text-slate-900 font-mono">
                            {formatCurrency(line.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PAYROLL AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Payroll Administration Audit History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable historical event log of all batch computations, validation approvals, and payment actions.
            </p>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {auditLogs?.map((log) => (
              <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700">
                      {log.module}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{log.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-slate-900 font-semibold block text-[11px]">{log.user_name || log.user_email || 'System'}</span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollAdminPanel;
