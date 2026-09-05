import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  Plus,
  Building,
  Briefcase,
  Users,
  Info,
  ArrowUpRight
} from 'lucide-react';
import { getEmployees, fetchEmployeesAsync } from '../../data/employees';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';

export const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    setEmployees(getEmployees());
    fetchEmployeesAsync().then((list) => {
      if (Array.isArray(list)) setEmployees(list);
    }).catch(console.error);
  }, []);

  const handleAddEmployeeClick = () => {
    navigate('/employees/new');
  };

  const handleCardClick = (emp) => {
    navigate(`/employees/${emp.id}`);
  };

  // Filtered dataset
  const filteredEmployees = employees.filter((emp) => {
    if (!emp) return false;
    const empName = (emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee').toLowerCase();
    const empPosition = (emp.position || emp.jobPosition || '').toLowerCase();
    const empDept = (emp.department || emp.departmentName || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase().trim();

    const matchesSearch =
      !search ||
      empName.includes(search) ||
      empPosition.includes(search) ||
      empDept.includes(search);
    const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const departments = ['All', ...new Set(employees.map((e) => e.department).filter(Boolean))];

  // Table columns for List View
  const columns = [
    {
      header: 'Employee',
      key: 'name',
      render: (row) => {
        const name = row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Employee';
        const avatar = row.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80';
        return (
          <div className="flex items-center gap-3">
            <img
              src={avatar}
              alt={name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div>
              <span className="font-bold text-slate-900 block leading-tight">{name}</span>
              <span className="text-[11px] text-slate-400">{row.email || '—'}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Job Position',
      key: 'position',
      render: (row) => row.position || row.jobPosition || 'Employee',
      cellClassName: 'text-slate-800 font-semibold'
    },
    {
      header: 'Department',
      key: 'department',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          {row.department || row.departmentName || 'General'}
        </span>
      )
    },
    {
      header: 'Manager',
      key: 'manager',
      render: (row) => row.manager || row.managerName || 'None',
      cellClassName: 'text-slate-600'
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status || 'Active'} />
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <button
          onClick={() => navigate(`/employees/${row.id}`)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors"
        >
          View
        </button>
      )
    }
  ];

  return (
    <div className="space-y-5">

      {/* Page Header with Add Employee & View Toggle */}
      <PageHeader
        title="Employees"
        subtitle={`Directory of team members (${employees.length} total staff)`}
      >
        {/* Kanban / List Toggle */}
        <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'kanban'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
        </div>

        {/* Add Employee Button */}
        <button
          type="button"
          onClick={handleAddEmployeeClick}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
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
            placeholder="Search by name, role, department..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Department:</span>
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW RENDERING: KANBAN vs LIST */}
      {filteredEmployees.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8 shadow-2xs">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No employees match your search criteria</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing filters or changing keywords</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => {
            const name = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
            const position = emp.position || emp.jobPosition || 'Employee';
            const department = emp.department || emp.departmentName || 'General';
            const manager = emp.manager || emp.managerName || 'None';
            const avatar = emp.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80';
            const status = emp.status || 'Active';

            return (
              <div
                key={emp.id}
                onClick={() => handleCardClick(emp)}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between text-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <img
                      src={avatar}
                      alt={name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                    />
                    <StatusBadge status={status} />
                  </div>

                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate">
                    {name}
                  </h3>
                  <p className="text-slate-600 font-medium truncate mt-0.5">{position}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-slate-500 text-[11px]">
                    <p className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{department}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Manager: {manager}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>View Profile</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <DataTable
          columns={columns}
          data={paginatedEmployees}
          totalItems={filteredEmployees.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          emptyMessage="No employees found"
        />
      )}
    </div>
  );
};
