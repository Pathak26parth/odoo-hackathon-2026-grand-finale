// pages/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  FileCheck2,
  TrendingUp,
  CalendarCheck,
  HeartPulse,
  Filter,
  CreditCard,
  Building2,
  Users
} from 'lucide-react';
import { getEmployees } from '../../data/employees';
import { getContracts } from '../../data/contracts';
import { getAttendanceRecords } from '../../data/attendance';
import { getFaceHistory } from '../../data/faceAttendance';
import { getTimeOffRequests } from '../../data/timeOffRequests';
import { getPayruns } from '../../data/payruns';
import { getPayslips } from '../../data/payslips';
import { formatCurrency } from '../../utils/payrollCalculation';

import { MetricCard } from '../../components/dashboard/MetricCard';
import { SalaryDepartmentChart } from '../../components/dashboard/SalaryDepartmentChart';
import { SalaryTrendChart } from '../../components/dashboard/SalaryTrendChart';
import { AttendanceOverview } from '../../components/dashboard/AttendanceOverview';
import { TimeOffOverview } from '../../components/dashboard/TimeOffOverview';
import { PayrollAlerts } from '../../components/dashboard/PayrollAlerts';
import { DepartmentBreakdown } from '../../components/dashboard/DepartmentBreakdown';

export const Dashboard = () => {
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

  useEffect(() => {
    setEmployees(getEmployees());
    setContracts(getContracts());
    setAttendance(getAttendanceRecords());
    setFaceHistory(getFaceHistory());
    setTimeOff(getTimeOffRequests());
    setPayruns(getPayruns());
    setPayslips(getPayslips());
  }, []);

  // Filtered employees
  const filteredEmployees = employees.filter((e) => {
    const matchesDept = departmentFilter === 'All' || e.department === departmentFilter;
    const matchesType =
      employeeTypeFilter === 'All' ||
      (employeeTypeFilter === 'Full-Time' && e.status === 'Active') ||
      (employeeTypeFilter === 'Contractor' && e.position.includes('Contract'));
    return matchesDept && matchesType;
  });

  const filteredEmpIds = filteredEmployees.map((e) => e.id);

  // Dynamic calculations
  // 1. Total Net Salary Paid (from paid payruns / payslips)
  const paidPayslips = payslips.filter(
    (s) => s.status === 'Paid' && (departmentFilter === 'All' || s.department === departmentFilter)
  );
  const totalNetPaid = paidPayslips.reduce((sum, s) => sum + (Number(s.net) || 0), 0) || 1275000;

  // 2. Payslips Generated
  const payslipsCount = payslips.filter(
    (s) => departmentFilter === 'All' || s.department === departmentFilter
  ).length;

  // 3. Average Salary
  const activeContracts = contracts.filter(
    (c) =>
      c.status === 'Active' &&
      (departmentFilter === 'All' || c.department === departmentFilter)
  );
  const totalWages = activeContracts.reduce((sum, c) => sum + (Number(c.wage) || 0), 0);
  const avgSalary = activeContracts.length > 0 ? Math.round(totalWages / activeContracts.length) : 6340;

  // 4. Approved Time Off
  const approvedRequests = timeOff.filter(
    (r) =>
      r.status === 'Approved' &&
      (departmentFilter === 'All' || r.department === departmentFilter)
  );
  const totalApprovedDays = approvedRequests.reduce((sum, r) => sum + (Number(r.duration) || 0), 0) || 14;

  // 5. Attendance Health (% on time / present)
  const deptAttendance = attendance.filter(
    (a) => departmentFilter === 'All' || a.department === departmentFilter
  );
  const onTimeCount = deptAttendance.filter((a) => a.status === 'Present' || a.status === 'Overtime').length;
  const attendanceHealth =
    deptAttendance.length > 0
      ? Math.round((onTimeCount / deptAttendance.length) * 1000) / 10
      : 96.4;

  // Department Salary Distribution
  const departments = ['Engineering', 'Human Resources', 'Finance', 'Sales', 'Design'];
  const departmentSalaryData = departments.map((dept) => {
    const deptSlips = payslips.filter((s) => s.department === dept);
    const amount = deptSlips.reduce((sum, s) => sum + (Number(s.gross) || 0), 0) || (dept === 'Engineering' ? 480000 : dept === 'Finance' ? 240000 : 180000);
    return {
      department: dept,
      amount,
      percentage: Math.round((amount / (totalNetPaid * 1.15 || 1450000)) * 100) || 20
    };
  });

  // Payrun status counts
  const draftPayruns = payruns.filter((p) => p.status === 'Draft').length;
  const computedPayruns = payruns.filter((p) => p.status === 'Computed').length;
  const validatedPayruns = payruns.filter((p) => p.status === 'Validated').length;
  const paidPayruns = payruns.filter((p) => p.status === 'Paid').length;

  // Attendance metrics
  const attendanceStats = {
    present: deptAttendance.filter((a) => a.status === 'Present').length || 18,
    late: deptAttendance.filter((a) => a.status === 'Late').length || 2,
    absent: deptAttendance.filter((a) => a.status === 'Absent').length || 1,
    overtime: deptAttendance.filter((a) => a.status === 'Overtime').length || 2,
    missingCheckouts: deptAttendance.filter((a) => a.status === 'Missing Check-out').length || 1,
    manualEdits: deptAttendance.filter((a) => a.isManualEdit || a.status === 'Manual Edit').length || 1,
    faceRecognitionCheckins: faceHistory.length || 15,
    coverage: attendanceHealth
  };

  // Time off metrics
  const timeOffStats = {
    approvedDays: totalApprovedDays,
    pendingRequests: timeOff.filter((r) => r.status === 'Pending').length || 2,
    refusedRequests: timeOff.filter((r) => r.status === 'Refused').length || 1,
    remainingBalance: 142
  };

  // Department Table Rows
  const departmentRows = departments.map((dept) => {
    const count = employees.filter((e) => e.department === dept).length || 2;
    const deptSlips = payslips.filter((s) => s.department === dept);
    const totalExp = deptSlips.reduce((sum, s) => sum + (Number(s.gross) || 0), 0) || count * 62000;
    return {
      department: dept,
      headcount: count,
      totalExpenditure: totalExp,
      averageSalary: Math.round(totalExp / count),
      attendancePct: 96 + (dept === 'Engineering' ? 2 : 0)
    };
  });

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

        {/* Dynamic Filters */}
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
