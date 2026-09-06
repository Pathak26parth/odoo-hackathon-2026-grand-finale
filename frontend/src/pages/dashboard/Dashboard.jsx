import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  FileCheck2,
  TrendingUp,
  CalendarCheck,
  HeartPulse,
  Filter,
  CreditCard,
  Building2,
  Users,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getEmployees, fetchEmployeesAsync } from '../../data/employees';
import { getContracts, fetchContractsAsync } from '../../data/contracts';
import { getAttendanceRecords, fetchAttendanceRecordsAsync } from '../../data/attendance';
import { getFaceHistory, fetchFaceHistoryAsync } from '../../data/faceAttendance';
import { getTimeOffRequests, fetchTimeOffRequestsAsync } from '../../data/timeOffRequests';
import { getPayruns, fetchPayrunsAsync } from '../../data/payruns';
import { getPayslips, fetchPayslipsAsync } from '../../data/payslips';
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

  // Filters
  const [periodFilter, setPeriodFilter] = useState('September 2026');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('All');

  // Loaded data
  const [employees, setEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [faceHistory, setFaceHistory] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [payruns, setPayruns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    setEmployees(getEmployees());
    setContracts(getContracts());
    setAttendance(getAttendanceRecords());
    setFaceHistory(getFaceHistory());
    setTimeOff(getTimeOffRequests());
    setPayruns(getPayruns());
    setPayslips(getPayslips());

    // Async hydration from backend
    dashboardService.getDashboardData().then((res) => { if (res) setDashboardData(res); }).catch(console.error);
    fetchEmployeesAsync().then((res) => { if (Array.isArray(res)) setEmployees(res); }).catch(console.error);
    fetchContractsAsync().then((res) => { if (Array.isArray(res)) setContracts(res); }).catch(console.error);
    fetchAttendanceRecordsAsync().then((res) => { if (Array.isArray(res)) setAttendance(res); }).catch(console.error);
    fetchFaceHistoryAsync().then((res) => { if (Array.isArray(res)) setFaceHistory(res); }).catch(console.error);
    fetchTimeOffRequestsAsync().then((res) => { if (Array.isArray(res)) setTimeOff(res); }).catch(console.error);
    fetchPayrunsAsync().then((res) => { if (Array.isArray(res)) setPayruns(res); }).catch(console.error);
    fetchPayslipsAsync().then((res) => { if (Array.isArray(res)) setPayslips(res); }).catch(console.error);
  }, []);

  // Filtered employees
  const filteredEmployees = employees.filter((e) => {
    const matchesDept = departmentFilter === 'All' || e.department === departmentFilter;
    const matchesType =
      employeeTypeFilter === 'All' ||
      (employeeTypeFilter === 'Full-Time' && e.status === 'Active') ||
      (employeeTypeFilter === 'Contractor' && (e.position || '').includes('Contract'));
    return matchesDept && matchesType;
  });

  // Dynamic calculations
  const paidPayslips = payslips.filter(
    (s) => s.status === 'Paid' && (departmentFilter === 'All' || s.department === departmentFilter)
  );

  const activeContracts = contracts.filter(
    (c) =>
      c.status === 'Active' &&
      (departmentFilter === 'All' || c.department === departmentFilter)
  );
  const totalWages = activeContracts.reduce((sum, c) => sum + (Number(c.wage) || 0), 0);

  const approvedRequests = timeOff.filter(
    (r) =>
      r.status === 'Approved' &&
      (departmentFilter === 'All' || r.department === departmentFilter)
  );

  const deptAttendance = attendance.filter(
    (a) => departmentFilter === 'All' || a.department === departmentFilter
  );
  const onTimeCount = deptAttendance.filter((a) => a.status === 'Present' || a.status === 'Overtime').length;

  // Real KPI metrics from backend with dynamic record fallbacks (no static numbers)
  const totalNetPaid = dashboardData?.kpi?.totalNetSalaryPaid ?? paidPayslips.reduce((sum, s) => sum + (Number(s.net) || 0), 0);
  const payslipsCount = dashboardData?.kpi?.payslipsGenerated ?? payslips.filter((s) => departmentFilter === 'All' || s.department === departmentFilter).length;
  const avgSalary = dashboardData?.kpi?.averageSalary ?? (activeContracts.length > 0 ? Math.round(totalWages / activeContracts.length) : 0);
  const totalApprovedDays = dashboardData?.kpi?.approvedLeaveDays ?? approvedRequests.reduce((sum, r) => sum + (Number(r.duration) || 0), 0);
  const attendanceHealth = dashboardData?.kpi?.attendanceHealthScore ?? (deptAttendance.length > 0 ? Math.round((onTimeCount / deptAttendance.length) * 1000) / 10 : 0);

  // Real Alerts computed from live records and backend checks
  const realAlerts = [];
  if (dashboardData?.alerts?.missingBankDetails > 0) {
    realAlerts.push({
      type: 'Missing Bank Details',
      message: `${dashboardData.alerts.missingBankDetails} active employee(s) require bank account or IFSC update.`,
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

  // Attendance metrics
  const attendanceStats = {
    present: dashboardData?.attendanceOverview?.presentOnTime ?? deptAttendance.filter((a) => a.status === 'Present').length,
    late: dashboardData?.attendanceOverview?.lateArrivals ?? deptAttendance.filter((a) => a.status === 'Late').length,
    absent: deptAttendance.filter((a) => a.status === 'Absent').length,
    overtime: dashboardData?.attendanceOverview ? Math.round(dashboardData.attendanceOverview.totalOvertimeHours) : deptAttendance.filter((a) => a.status === 'Overtime').length,
    missingCheckouts: dashboardData?.attendanceOverview?.missingCheckouts ?? deptAttendance.filter((a) => a.status === 'Missing Check-out').length,
    manualEdits: dashboardData?.attendanceOverview?.manualCorrections ?? deptAttendance.filter((a) => a.isManualEdit || a.status === 'Manual Edit').length,
    faceRecognitionCheckins: faceHistory.length,
    coverage: attendanceHealth
  };

  // Time off metrics
  const timeOffStats = {
    approvedDays: totalApprovedDays,
    pendingRequests: dashboardData?.alerts?.pendingTimeOffRequests ?? timeOff.filter((r) => r.status === 'Pending').length,
    refusedRequests: timeOff.filter((r) => r.status === 'Refused').length,
    remainingBalance: timeOff.reduce((acc, r) => acc + (r.remainingDays || 0), 0)
  };

  // Department Breakdown Table Rows
  const departmentRows = dashboardData?.departmentBreakdown && dashboardData.departmentBreakdown.length > 0
    ? dashboardData.departmentBreakdown.map((d) => ({
        department: d.department_name,
        headcount: parseInt(d.employee_count, 10) || 0,
        totalExpenditure: parseFloat(d.total_salary_cost) || 0,
        averageSalary: Math.round(parseFloat(d.average_salary) || 0),
        attendancePct: attendanceHealth || 0
      }))
    : ['Engineering & Technology', 'Human Resources', 'Finance & Payroll Operations', 'Marketing & Growth'].map((dept) => {
        const count = employees.filter((e) => e.department === dept).length;
        const deptSlips = payslips.filter((s) => s.department === dept);
        const totalExp = deptSlips.reduce((sum, s) => sum + (Number(s.gross) || 0), 0);
        return {
          department: dept,
          headcount: count,
          totalExpenditure: totalExp,
          averageSalary: count > 0 ? Math.round(totalExp / count) : 0,
          attendancePct: attendanceHealth || 0
        };
      });

  // Department Salary Distribution
  const departmentSalaryData = departmentRows.map((d) => ({
    department: d.department,
    amount: d.totalExpenditure,
    percentage: totalNetPaid > 0 ? Math.round((d.totalExpenditure / totalNetPaid) * 100) : 0
  }));

  // Monthly trends for chart
  const monthlyTrendsData = dashboardData?.monthlyTrends?.map((m) => ({
    month: m.month_label || m.month,
    net: parseFloat(m.total_net_paid) || 0
  })) || [];

  // Payrun status counts
  const draftPayruns = payruns.filter((p) => p.status === 'Draft').length;
  const computedPayruns = payruns.filter((p) => p.status === 'Computed').length;
  const validatedPayruns = payruns.filter((p) => p.status === 'Validated').length;
  const paidPayruns = payruns.filter((p) => p.status === 'Paid').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-slate-400 font-semibold text-[11px] uppercase">Period:</span>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="September 2026">September 2026</option>
              <option value="August 2026">August 2026</option>
              <option value="October 2026">October 2026 (Draft)</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-1.5 px-1">
            <span className="text-slate-400 font-semibold text-[11px] uppercase">Dept:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Sales">Sales</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-1.5 px-1">
            <span className="text-slate-400 font-semibold text-[11px] uppercase">Type:</span>
            <select
              value={employeeTypeFilter}
              onChange={(e) => setEmployeeTypeFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Contractor">Contractor</option>
            </select>
          </div>
        </div>
      </div>
    </div>

      {/* 5 KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <MetricCard
          label="Total Net Salary Paid"
          value={formatCurrency(totalNetPaid)}
          subtext="Processed disbursements"
          icon={DollarSign}
          color="text-emerald-700"
          bgColor="bg-emerald-50"
          trend="+5.2%"
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
          subtext="Contract base wage"
          icon={TrendingUp}
          color="text-indigo-700"
          bgColor="bg-indigo-50"
        />
        <MetricCard
          label="Approved Time Off"
          value={`${totalApprovedDays} Days`}
          subtext="Processed leave requests"
          icon={CalendarCheck}
          color="text-amber-700"
          bgColor="bg-amber-50"
        />
        <MetricCard
          label="Attendance Health"
          value={`${attendanceHealth}%`}
          subtext="On-time shift rate"
          icon={HeartPulse}
          color="text-rose-700"
          bgColor="bg-rose-50"
          trend="Healthy"
        />
      </div>

      {/* Payroll Status Overview strip */}
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
        <SalaryTrendChart />
      </div>

      {/* Alerts, Attendance & Time Off */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PayrollAlerts />
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
