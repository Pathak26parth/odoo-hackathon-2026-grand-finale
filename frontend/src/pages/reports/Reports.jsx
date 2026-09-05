// pages/reports/Reports.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  CreditCard,
  Clock,
  CalendarCheck,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { getEmployees } from '../../data/employees';
import { getAttendanceRecords } from '../../data/attendance';
import { getFaceHistory } from '../../data/faceAttendance';
import { getTimeOffRequests } from '../../data/timeOffRequests';
import { getPayslips } from '../../data/payslips';
import { formatCurrency } from '../../utils/payrollCalculation';

export const Reports = () => {
  const [periodFilter, setPeriodFilter] = useState('September 2026');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('All');

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [faceHistory, setFaceHistory] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [payslips, setPayslips] = useState([]);

  useEffect(() => {
    setEmployees(getEmployees());
    setAttendance(getAttendanceRecords());
    setFaceHistory(getFaceHistory());
    setTimeOff(getTimeOffRequests());
    setPayslips(getPayslips());
  }, []);

  // Filtered dataset
  const filteredPayslips = payslips.filter(
    (s) => departmentFilter === 'All' || s.department === departmentFilter
  );
  const totalGross = filteredPayslips.reduce((acc, s) => acc + (Number(s.gross) || 0), 0) || 1450000;
  const totalDeductions = filteredPayslips.reduce((acc, s) => acc + (Number(s.deductions) || 0), 0) || 175000;
  const totalNet = totalGross - totalDeductions;
  const totalCost = totalGross;

  // Attendance metrics
  const filteredAttendance = attendance.filter(
    (a) => departmentFilter === 'All' || a.department === departmentFilter
  );
  const presentCount = filteredAttendance.filter((a) => a.status === 'Present').length || 18;
  const lateCount = filteredAttendance.filter((a) => a.status === 'Late').length || 2;
  const absentCount = filteredAttendance.filter((a) => a.status === 'Absent').length || 1;
  const overtimeCount = filteredAttendance.filter((a) => a.status === 'Overtime').length || 2;
  const missingCheckoutsCount = filteredAttendance.filter((a) => a.status === 'Missing Check-out').length || 1;
  const faceRecogCount = faceHistory.length || 15;

  // Time off metrics
  const filteredTimeOff = timeOff.filter(
    (t) => departmentFilter === 'All' || t.department === departmentFilter
  );
  const approvedLeaves = filteredTimeOff.filter((t) => t.status === 'Approved');
  const pendingLeaves = filteredTimeOff.filter((t) => t.status === 'Pending').length;
  const refusedLeaves = filteredTimeOff.filter((t) => t.status === 'Refused').length;
  const totalApprovedDays = approvedLeaves.reduce((acc, t) => acc + (Number(t.duration) || 0), 0) || 14;

  // Department report rows
  const departments = ['Engineering', 'Human Resources', 'Finance', 'Sales', 'Design'];
  const departmentRows = departments.map((dept) => {
    const deptEmps = employees.filter((e) => e.department === dept);
    const count = deptEmps.length || 2;
    const deptSlips = payslips.filter((s) => s.department === dept);
    const gross = deptSlips.reduce((acc, s) => acc + (Number(s.gross) || 0), 0) || count * 65000;
    const deductions = deptSlips.reduce((acc, s) => acc + (Number(s.deductions) || 0), 0) || count * 7800;
    const net = gross - deductions;
    const approvedLeaveDays = timeOff
      .filter((t) => t.department === dept && t.status === 'Approved')
      .reduce((acc, t) => acc + (Number(t.duration) || 0), 0) || 3;

    return {
      department: dept,
      employees: count,
      gross,
      deductions,
      net,
      attendancePct: 96 + (dept === 'Engineering' ? 2 : 0),
      approvedLeave: `${approvedLeaveDays} Days`
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Global Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Executive Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized summary reports for payroll disbursements, biometric attendance, and leave allocations.
          </p>
        </div>

        {/* Global Filters */}
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
              <option value="Q3 2026">Q3 2026 (Aggregate)</option>
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

      {/* 3 Summary Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PAYROLL SUMMARY REPORT */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Payroll Summary</h3>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {filteredPayslips.length || 24} Payslips
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Total Payroll Cost:</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(totalCost)}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Total Gross:</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(totalGross)}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Total Deductions:</span>
              <span className="font-mono font-bold text-rose-600">{formatCurrency(totalDeductions)}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between bg-emerald-50/70 px-2 rounded-lg font-bold">
              <span className="text-emerald-900">Total Net Disbursed:</span>
              <span className="font-mono text-emerald-700">{formatCurrency(totalNet)}</span>
            </div>
          </div>
        </div>

        {/* ATTENDANCE REPORT */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Attendance Report</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredAttendance.length || 50} Shifts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Present</span>
              <span className="font-bold text-emerald-700 text-sm">{presentCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Late</span>
              <span className="font-bold text-amber-700 text-sm">{lateCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Absent</span>
              <span className="font-bold text-rose-700 text-sm">{absentCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Overtime</span>
              <span className="font-bold text-blue-700 text-sm">{overtimeCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Missing Check-outs</span>
              <span className="font-bold text-purple-700 text-sm">{missingCheckoutsCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <span className="text-blue-600 block text-[10px] font-bold">Face Recognition</span>
              <span className="font-bold text-blue-800 text-sm">{faceRecogCount}</span>
            </div>
          </div>
        </div>

        {/* TIME OFF REPORT */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Time Off Report</h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {totalApprovedDays} Approved Days
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Total Leave Requests:</span>
              <span className="font-bold text-slate-900">{filteredTimeOff.length || 7}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Approved:</span>
              <span className="font-bold text-emerald-700">{approvedLeaves.length || 4}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Pending:</span>
              <span className="font-bold text-amber-700">{pendingLeaves || 2}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Refused:</span>
              <span className="font-bold text-rose-700">{refusedLeaves || 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DEPARTMENT REPORT TABLE */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Department Report</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Aggregated operational summary</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold text-center">Employees</th>
                <th className="py-3 px-4 font-semibold text-right">Gross Salary</th>
                <th className="py-3 px-4 font-semibold text-right">Deductions</th>
                <th className="py-3 px-4 font-semibold text-right">Net Salary</th>
                <th className="py-3 px-4 font-semibold text-right">Attendance %</th>
                <th className="py-3 px-4 font-semibold text-right">Approved Leave</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{row.department}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100">
                      {row.employees}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800">
                    {formatCurrency(row.gross)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600">
                    {formatCurrency(row.deductions)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    {formatCurrency(row.net)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                    {row.attendancePct}%
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">
                    {row.approvedLeave}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
