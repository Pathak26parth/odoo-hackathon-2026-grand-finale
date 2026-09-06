import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  FileCheck2,
  TrendingUp,
  CalendarCheck,
  HeartPulse,
  RotateCw,
  AlertTriangle,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import dashboardService from '../../services/dashboardService';
import { formatCurrency } from '../../utils/payrollCalculation';

import { MetricCard } from '../../components/dashboard/MetricCard';
import { SalaryDepartmentChart } from '../../components/dashboard/SalaryDepartmentChart';
import { SalaryTrendChart } from '../../components/dashboard/SalaryTrendChart';
import { AttendanceOverview } from '../../components/dashboard/AttendanceOverview';
import { TimeOffOverview } from '../../components/dashboard/TimeOffOverview';
import { PayrollAlerts } from '../../components/dashboard/PayrollAlerts';
import { DepartmentBreakdown } from '../../components/dashboard/DepartmentBreakdown';

export const Dashboard = () => {
  const { role, currentUser } = useAuth();
  const isPayrollAdminOrAdmin =
    role === 'Admin' ||
    role === 'HR Payroll Manager' ||
    role === 'HR Payroll Admin' ||
    currentUser?.roleRaw === 'HR_PAYROLL_ADMIN';

  // Global Filters
  const [periodFilter, setPeriodFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('All');

  // Dynamic Options (Populated from live DB records via /api/dashboard response)
  const [availablePeriods, setAvailablePeriods] = useState([
    { key: 'All', label: 'All Periods' }
  ]);
  const [availableDepartments, setAvailableDepartments] = useState([
    { id: 'All', name: 'All Departments' }
  ]);
  const [availableTypes, setAvailableTypes] = useState([
    { id: 'All', name: 'All Types' }
  ]);

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch live dashboard metrics from backend based on selected filters
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getDashboardData({
        period: periodFilter,
        departmentId: departmentFilter,
        type: employeeTypeFilter
      });

      if (data) {
        setDashboardData(data);

        // Populate dynamic filter lists from backend if provided
        if (data.filters) {
          if (Array.isArray(data.filters.periods) && data.filters.periods.length > 0) {
            setAvailablePeriods(data.filters.periods);
          }
          if (Array.isArray(data.filters.departments) && data.filters.departments.length > 0) {
            setAvailableDepartments(data.filters.departments);
          }
          if (Array.isArray(data.filters.types) && data.filters.types.length > 0) {
            setAvailableTypes(data.filters.types);
          }
        }
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching dynamic analytics:', err);
      setError(err.message || 'Unable to fetch dashboard metrics. Please check connection.');
    } finally {
      setLoading(false);
    }
  }, [periodFilter, departmentFilter, employeeTypeFilter]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 1. KPI Metrics — all from backend response, zero hardcoded values
  const totalNetPaid = dashboardData?.kpi?.totalNetSalaryPaid || 0;
  const salaryGrowthTrend = dashboardData?.kpi?.salaryGrowth || '+0.0%';
  const payslipsCount = dashboardData?.kpi?.payslipsGenerated ?? 0;
  const avgSalary = dashboardData?.kpi?.averageSalary || 0;
  const approvedLeaveDays = dashboardData?.kpi?.approvedLeaveDays ?? 0;
  const attendanceHealthScore = dashboardData?.kpi?.attendanceHealthScore ?? 0;
  const attendanceHealthStatus = dashboardData?.kpi?.attendanceHealthStatus || 'Healthy';

  // 2. Payrun Status Counts
  const draftPayruns = dashboardData?.payruns?.draft ?? 0;
  const computedPayruns = dashboardData?.payruns?.computed ?? 0;
  const validatedPayruns = dashboardData?.payruns?.validated ?? 0;
  const paidPayruns = dashboardData?.payruns?.paid ?? 0;

  // 3. Salary Cost by Department
  const departmentSalaryData = dashboardData?.salaryByDepartment || [];

  // 4. Monthly Net Salary Trends (Historical series for chart)
  const monthlyTrendsData = dashboardData?.monthlyTrends || [];

  // 5. Department Breakdown Table
  const departmentRows = (dashboardData?.departmentBreakdown || []).map((d) => ({
    department: d.department_name,
    headcount: d.employee_count,
    totalExpenditure: d.total_salary_cost,
    averageSalary: Math.round(d.average_salary),
    attendancePct: d.attendance_pct
  }));

  // 6. Real-Time Compliance & Operational Alerts
  const realAlerts = [];
  if (dashboardData?.alerts?.missingBankDetails > 0) {
    realAlerts.push({
      type: 'Missing Bank Details',
      message: `${dashboardData.alerts.missingBankDetails} active employee(s) require bank account or IFSC details for payroll disbursement.`,
      level: 'warning'
    });
  }
  if (dashboardData?.alerts?.missingActiveContracts > 0) {
    realAlerts.push({
      type: 'Missing Active Contracts',
      message: `${dashboardData.alerts.missingActiveContracts} active employee(s) have no active employment contract assigned.`,
      level: 'warning'
    });
  }
  if (dashboardData?.alerts?.pendingTimeOffRequests > 0) {
    realAlerts.push({
      type: 'Pending Leave Approvals',
      message: `${dashboardData.alerts.pendingTimeOffRequests} time off request(s) awaiting managerial review.`,
      level: 'info'
    });
  }

  // 7. Attendance Metrics
  const attendanceStats = dashboardData?.attendanceOverview || {
    present: 0,
    late: 0,
    absent: 0,
    overtime: 0,
    missingCheckouts: 0,
    manualEdits: 0,
    faceRecognitionCheckins: 0,
    coverage: 0
  };

  // 8. Time Off Metrics
  const timeOffStats = dashboardData?.timeOffOverview || {
    approvedDays: approvedLeaveDays,
    pendingRequests: dashboardData?.alerts?.pendingTimeOffRequests || 0,
    refusedRequests: 0,
    remainingBalance: 0
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header & Global Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Payroll &amp; HR Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic analytics integrating workforce contracts, biometric attendance, and compensation disbursements.
          </p>
        </div>

        {/* Dynamic Filters & Action Links */}
        <div className="flex flex-wrap items-center gap-3">
          {isPayrollAdminOrAdmin && (
            <Link
              to="/payroll/admin-panel"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs transition-all transform hover:-translate-y-0.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Payroll Admin Panel</span>
            </Link>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
            {/* Period Filter */}
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-slate-400 font-semibold text-[11px] uppercase">Period:</span>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {availablePeriods.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* Department Filter */}
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-slate-400 font-semibold text-[11px] uppercase">Dept:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {availableDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-slate-400 font-semibold text-[11px] uppercase">Type:</span>
              <select
                value={employeeTypeFilter}
                onChange={(e) => setEmployeeTypeFilter(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {availableTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Action */}
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={loading}
              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title="Refresh metrics from database"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5 KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <MetricCard
          label="Total Net Salary Paid"
          value={formatCurrency(totalNetPaid)}
          subtext="Processed disbursements"
          icon={DollarSign}
          color="text-emerald-700"
          bgColor="bg-emerald-50"
          trend={salaryGrowthTrend}
        />
        <MetricCard
          label="Payslips Generated"
          value={payslipsCount}
          subtext="Itemized statements"
          icon={FileCheck2}
          color="text-blue-700"
          bgColor="bg-blue-50"
        />
        <MetricCard
          label="Average Salary"
          value={formatCurrency(avgSalary)}
          subtext={payslipsCount > 0 ? "Average net per payslip" : "Contract base wage"}
          icon={TrendingUp}
          color="text-indigo-700"
          bgColor="bg-indigo-50"
        />
        <MetricCard
          label="Approved Time Off"
          value={`${approvedLeaveDays} Days`}
          subtext="Processed leave requests"
          icon={CalendarCheck}
          color="text-amber-700"
          bgColor="bg-amber-50"
        />
        <MetricCard
          label="Attendance Health"
          value={`${attendanceHealthScore}%`}
          subtext="On-time shift rate"
          icon={HeartPulse}
          color="text-rose-700"
          bgColor="bg-rose-50"
          trend={attendanceHealthStatus}
        />
      </div>

      {/* Payroll Status Overview Strip (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Draft Payruns</span>
            <span className="text-xl font-bold text-slate-700">{draftPayruns}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
            D
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-600 block uppercase">Computed Payruns</span>
            <span className="text-xl font-bold text-amber-700">{computedPayruns}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs">
            C
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-blue-600 block uppercase">Validated Payruns</span>
            <span className="text-xl font-bold text-blue-700">{validatedPayruns}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
            V
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 block uppercase">Paid Payruns</span>
            <span className="text-xl font-bold text-emerald-700">{paidPayruns}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
            P
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalaryDepartmentChart data={departmentSalaryData} />
        <SalaryTrendChart monthlyData={monthlyTrendsData} />
      </div>

      {/* Alerts, Attendance & Time Off */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PayrollAlerts alerts={realAlerts} />
        </div>
        <div className="lg:col-span-1">
          <AttendanceOverview attendanceStats={attendanceStats} />
        </div>
        <div className="lg:col-span-1">
          <TimeOffOverview timeOffStats={timeOffStats} />
        </div>
      </div>

      {/* Department Breakdown Table */}
      <DepartmentBreakdown departmentRows={departmentRows} />
    </div>
  );
};
