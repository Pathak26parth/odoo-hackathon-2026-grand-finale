// pages/payroll/Payslips.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Eye, Printer, Search, Filter } from 'lucide-react';
import { getPayslips, fetchPayslipsAsync } from '../../data/payslips';
import { getPayruns, fetchPayrunsAsync } from '../../data/payruns';
import { getEmployees, fetchEmployeesAsync } from '../../data/employees';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { formatCurrency } from '../../utils/payrollCalculation';
import { PayslipPrint } from '../../components/payroll/PayslipPrint';

export const Payslips = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const payrunParam = searchParams.get('payrun');

  const { currentUser, isEmployeeOnly } = useAuth();

  const [payslips, setPayslips] = useState([]);
  const [payruns, setPayruns] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [payrunFilter, setPayrunFilter] = useState(payrunParam || 'All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState(
    isEmployeeOnly && currentUser?.employeeId ? currentUser.employeeId : 'All'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Print modal state
  const [printSlip, setPrintSlip] = useState(null);

  useEffect(() => {
    setPayslips(getPayslips());
    setPayruns(getPayruns());
    setEmployees(getEmployees());

    fetchPayslipsAsync().then((slips) => {
      if (Array.isArray(slips)) setPayslips(slips);
    }).catch(console.error);

    fetchPayrunsAsync().then((runs) => {
      if (Array.isArray(runs)) setPayruns(runs);
    }).catch(console.error);

    fetchEmployeesAsync().then((emps) => {
      if (Array.isArray(emps)) setEmployees(emps);
    }).catch(console.error);
  }, []);

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

  const filtered = payslips.filter((slip) => {
    const matchesSearch =
      slip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.slipNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayrun = payrunFilter === 'All' || slip.payrunId === payrunFilter;
    const matchesStatus = statusFilter === 'All' || slip.status === statusFilter;
    const matchesEmployee = employeeFilter === 'All' || slip.employeeId === employeeFilter;

    if (isEmployeeOnly && currentUser?.employeeId) {
      return slip.employeeId === currentUser.employeeId && matchesSearch && matchesStatus;
    }

    return matchesSearch && matchesPayrun && matchesStatus && matchesEmployee;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Payslips"
        subtitle={`Itemized compensation statements, tax withholdings, and salary disbursements (${payslips.length} total)`}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search employee, slip #, department..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {!isEmployeeOnly && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Employee:</span>
              <select
                value={employeeFilter}
                onChange={(e) => {
                  setEmployeeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="All">All Employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Payrun:</span>
            <select
              value={payrunFilter}
              onChange={(e) => {
                setPayrunFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Payruns</option>
              {payruns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Computed">Computed</option>
              <option value="Validated">Validated</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold">Payslip #</th>
              <th className="py-3 px-4 font-semibold">Employee</th>
              <th className="py-3 px-4 font-semibold">Payrun</th>
              <th className="py-3 px-4 font-semibold">Period</th>
              <th className="py-3 px-4 font-semibold text-center">Days</th>
              <th className="py-3 px-4 font-semibold text-right">Basic</th>
              <th className="py-3 px-4 font-semibold text-right">Gross</th>
              <th className="py-3 px-4 font-semibold text-right">Deductions</th>
              <th className="py-3 px-4 font-semibold text-right">Net</th>
              <th className="py-3 px-4 font-semibold text-center">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((slip) => (
              <tr key={slip.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                  <button
                    type="button"
                    onClick={() => navigate(`/payroll/payslips/${slip.id}`)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {slip.slipNumber}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{slip.employeeName}</div>
                  <div className="text-[11px] text-slate-400">{slip.department}</div>
                </td>
                <td className="py-3 px-4 text-slate-700 truncate max-w-xs">{slip.payrunName}</td>
                <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                  {slip.period}
                </td>
                <td className="py-3 px-4 text-center font-semibold text-slate-800">
                  {slip.workedDays !== undefined && slip.workedDays !== null ? slip.workedDays : '-'}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-700">
                  {formatCurrency(slip.basic)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                  {formatCurrency(slip.gross)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-rose-600">
                  {formatCurrency(slip.deductions)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                  {formatCurrency(slip.net)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                      slip.status
                    )}`}
                  >
                    {slip.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/payroll/payslips/${slip.id}`)}
                      className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintSlip(slip)}
                      className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Print Payslip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Printable Preview Modal */}
      {printSlip && (
        <PayslipPrint payslip={printSlip} onClose={() => setPrintSlip(null)} />
      )}
    </div>
  );
};
