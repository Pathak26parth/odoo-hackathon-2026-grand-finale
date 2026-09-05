import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Edit2, FileText, Search, Filter, Eye, DollarSign } from 'lucide-react';
import { getContracts, fetchContractsAsync } from '../../data/contracts';
import { getEmployees, fetchEmployeesAsync } from '../../data/employees';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';

export const Contracts = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const employeeFilterParam = searchParams.get('employee');

  const isManagerOrAdmin =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'HR Manager' ||
    currentUser?.role === 'HR Payroll Manager' ||
    currentUser?.roleRaw === 'ADMIN' ||
    currentUser?.roleRaw === 'HR_MANAGER' ||
    currentUser?.roleRaw === 'HR_PAYROLL_ADMIN';
  const isEmployeeOnly = !isManagerOrAdmin;

  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeFilterParam || 'All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setContracts(getContracts());
    setEmployees(getEmployees());

    fetchContractsAsync().then((list) => {
      if (Array.isArray(list)) setContracts(list);
    }).catch(console.error);

    fetchEmployeesAsync().then((list) => {
      if (Array.isArray(list)) setEmployees(list);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (employeeFilterParam) {
      setSelectedEmployeeId(employeeFilterParam);
    }
  }, [employeeFilterParam]);

  // Filter logic
  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'All' || c.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesEmp = selectedEmployeeId === 'All' || c.employeeId === selectedEmployeeId;
    return matchesSearch && matchesDept && matchesStatus && matchesEmp;
  });

  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const departments = ['All', 'Engineering', 'Human Resources', 'Finance', 'Sales', 'Design'];

  const columns = [
    {
      header: 'Employee',
      key: 'employeeName',
      render: (row) => {
        const isActive = row.status === 'Active';
        return (
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {row.employeeName?.charAt(0) || 'E'}
            </div>
            <div>
              <span className="font-bold text-slate-900 block leading-tight">{row.employeeName}</span>
              <span className="text-[11px] font-mono text-slate-400">{row.id}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Start Date',
      key: 'startDate',
      cellClassName: 'text-slate-600 font-mono text-[11px]'
    },
    {
      header: 'End Date',
      key: 'endDate',
      render: (row) => (
        <span className="font-mono text-slate-600 text-[11px]">
          {row.endDate || 'Indefinite'}
        </span>
      )
    },
    {
      header: 'Department',
      key: 'department',
      cellClassName: 'text-slate-700'
    },
    {
      header: 'Position',
      key: 'position',
      cellClassName: 'text-slate-800 font-semibold'
    },
    {
      header: 'Wage',
      key: 'wage',
      render: (row) => (
        <span className="font-bold text-slate-900 font-mono">
          ${Number(row.wage || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/mo</span>
        </span>
      )
    },
    {
      header: 'Salary Structure',
      key: 'salaryStructure',
      render: (row) => (
        <span className="inline-block text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.salaryStructure || 'Standard Corporate Structure'}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (row) => {
        const isActive = row.status === 'Active';
        return (
          <div className="flex items-center justify-center gap-1">
            <StatusBadge status={row.status} />
            {isActive && (
              <span className="text-[10px] uppercase font-extrabold text-blue-600 bg-blue-50 px-1 rounded border border-blue-100">
                Current
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => navigate(`/contracts/${row.id}`)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
          {!isEmployeeOnly && (
            <button
              type="button"
              onClick={() => navigate(`/contracts/${row.id}`)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 transition-colors"
              title="Edit Contract"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title={isEmployeeOnly ? "My Contract" : "Contracts"}
        subtitle={
          isEmployeeOnly
            ? "Your official employment agreement, working schedule, and wage structure"
            : `Employment agreements and wage structures (${contracts.length} records)`
        }
      >
        {!isEmployeeOnly && (
          <button
            onClick={() => navigate('/contracts/new')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Contract
          </button>
        )}
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder={isEmployeeOnly ? "Search contract details..." : "Search by employee, position, contract ID..."}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Employee Filter (Managers & Admin only) */}
          {!isEmployeeOnly && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Employee:</span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => {
                  setSelectedEmployeeId(e.target.value);
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

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'All' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
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
              <option value="Active">Active Only</option>
              <option value="Draft">Draft</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <DataTable
        columns={columns}
        data={paginatedContracts}
        totalItems={filteredContracts.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        emptyMessage="No contracts found matching your filters"
      />
    </div>
  );
};
