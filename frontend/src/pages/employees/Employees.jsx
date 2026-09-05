import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  Plus,
  Building,
  Briefcase,
  Users,
  Info,
  ArrowUpRight,
  Trash2
} from 'lucide-react';
import { getEmployees, fetchEmployeesAsync, deleteEmployee } from '../../data/employees';
import { employeeService } from '../../services/employeeService';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';
import { useAuth } from '../../context/AuthContext';

export const Employees = () => {
  const { currentUser, isEmployeeOnly, isHRorAdmin } = useAuth();
  const navigate = useNavigate();

  // If user is a standard employee, redirect them directly to their own profile
  if (isEmployeeOnly) {
    const ownId = currentUser?.employeeId || currentUser?.internalEmployeeId || currentUser?.id || '1';
    return <Navigate to={`/employees/${ownId}`} replace />;
  }

  const [employees, setEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const pageSize = 8;

  useEffect(() => {
    setEmployees(getEmployees());
    employeeService.getDepartments().then((depts) => {
      if (Array.isArray(depts) && depts.length > 0) {
        setDepartmentsList(depts.map((d) => d.name || d));
      }
    }).catch(console.error);

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

  const handleDeleteClick = (e, emp) => {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    const targetId = emp.id || emp.internalId || emp.employeeId;

    if (String(targetId) === '1' || emp.employeeId === 'EMP-001') {
      alert('Safety lock: Primary System Administrator profile cannot be deleted.');
      return;
    }

    setDeleteError('');
    setEmployeeToDelete(emp);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    const emp = employeeToDelete;
    const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeId || 'Employee';
    const targetId = emp.id || emp.internalId || emp.employeeId;

    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteEmployee(targetId);
      setEmployees((prev) => prev.filter((item) => String(item.id) !== String(targetId) && item.employeeId !== emp.employeeId && String(item.internalId) !== String(targetId)));
      setToastMessage(`Employee "${empName}" deleted successfully. Official termination notice dispatched.`);
      setTimeout(() => setToastMessage(''), 5000);
      setEmployeeToDelete(null);
      fetchEmployeesAsync().then((list) => {
        if (Array.isArray(list)) setEmployees(list);
      }).catch(console.error);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete employee');
    } finally {
      setIsDeleting(false);
    }
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

  const allDeptNames = [
    ...departmentsList,
    ...employees.map((e) => e.department).filter(Boolean),
    'Engineering',
    'Human Resources',
    'Finance',
    'Sales',
    'Design',
    'Operations'
  ];
  const departments = ['All', ...new Set(allDeptNames)];

  // Table columns for List View
  const columns = [
    {
      header: 'Employee',
      key: 'name',
      render: (row) => {
        const name = row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Employee';
        const avatar = row.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80';
        return (
          <div className="flex items-center gap-2.5">
            <img
              src={avatar}
              alt={name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div>
              <span className="font-semibold text-slate-900 block leading-tight">{name}</span>
              <span className="text-[11px] font-mono text-slate-400">{row.employeeId || `EMP-${row.id}`}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Role / Position',
      key: 'position',
      render: (row) => (
        <span className="font-medium text-slate-700 text-xs">
          {row.position || row.jobPosition || 'Employee'}
        </span>
      )
    },
    {
      header: 'System Access',
      key: 'userRole',
      render: (row) => {
        const r = (row.role || row.userRole || row.user_role || 'EMPLOYEE').toUpperCase().replace(/\s+/g, '_');
        switch (r) {
          case 'ADMIN':
            return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">Admin</span>;
          case 'HR_MANAGER':
            return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">HR Manager</span>;
          case 'HR_PAYROLL_ADMIN':
            return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">Payroll Admin</span>;
          case 'HR_PAYROLL_USER':
            return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">Payroll User</span>;
          default:
            return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">Employee</span>;
        }
      }
    },
    {
      header: 'Department',
      key: 'department',
      cellClassName: 'text-slate-600'
    },
    {
      header: 'Manager',
      key: 'manager',
      render: (row) => (
        <span className="text-slate-600 text-xs">{row.manager || row.managerName || 'None'}</span>
      )
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
      render: (row) => {
        const name = row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Employee';
        const isMasterAdmin = String(row.id) === '1' || row.employeeId === 'EMP-001';
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => navigate(`/employees/${row.id}`)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors"
            >
              View
            </button>
            {isHRorAdmin && !isMasterAdmin && (
              <button
                type="button"
                onClick={(e) => handleDeleteClick(e, row)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                title={`Delete ${name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-5">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header with Add Employee & View Toggle */}
      <PageHeader
        title="Employees"
        subtitle={`Directory of team members (${employees.length} total staff)`}
      >
        <div className="flex items-center gap-2">
          {/* Kanban / List Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
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
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          {/* Add CTAs */}
          {isHRorAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/employees/new?role=HR_MANAGER')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Create an HR Manager with full HR Operations Panel access"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                Add HR Manager
              </button>

              <button
                type="button"
                onClick={handleAddEmployeeClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Employee
              </button>
            </div>
          )}
        </div>
      </PageHeader>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
        <div className="w-full sm:w-72">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search by name, role, department..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-slate-500 font-medium">Department:</label>
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
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
            <label className="text-slate-500 font-medium">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View Area */}
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
            const isMasterAdmin = String(emp.id) === '1' || emp.employeeId === 'EMP-001';

            return (
              <div
                key={emp.id}
                onClick={() => handleCardClick(emp)}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between text-xs relative"
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
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-slate-600 font-medium truncate">{position}</span>
                    <span className="text-slate-300">•</span>
                    {(() => {
                      const r = (emp.role || emp.userRole || emp.user_role || 'EMPLOYEE').toUpperCase().replace(/\s+/g, '_');
                      switch (r) {
                        case 'ADMIN':
                          return <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">Admin</span>;
                        case 'HR_MANAGER':
                          return <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">HR Manager</span>;
                        case 'HR_PAYROLL_ADMIN':
                          return <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">Payroll Admin</span>;
                        case 'HR_PAYROLL_USER':
                          return <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">Payroll User</span>;
                        default:
                          return <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200">Employee</span>;
                      }
                    })()}
                  </div>

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

                <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    View Profile
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                  {isHRorAdmin && !isMasterAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, emp)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title={`Delete ${name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
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

      {/* Delete Confirmation Modal */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start gap-3.5 mb-4">
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Employee Deletion
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will permanently remove the record and trigger employee termination.
                </p>
              </div>
            </div>

            {/* Target Employee Preview Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 mb-4">
              <img
                src={employeeToDelete.avatar || employeeToDelete.profilePhotoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
                alt={employeeToDelete.name}
                className="w-11 h-11 rounded-xl object-cover border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 truncate">
                  {employeeToDelete.name || `${employeeToDelete.firstName || ''} ${employeeToDelete.lastName || ''}`}
                </h4>
                <p className="text-xs text-slate-500 truncate">
                  {employeeToDelete.employeeId} • {employeeToDelete.position || employeeToDelete.jobPosition || 'Employee'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {employeeToDelete.department || 'General'}
                </p>
              </div>
            </div>

            {/* Warning details */}
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1 mb-4">
              <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                Automated System Actions:
              </p>
              <ul className="list-disc list-inside text-[11px] text-amber-700 space-y-0.5 pl-1">
                <li>Permanently removes employee record & contracts</li>
                <li>Revokes linked user account & system access</li>
                <li>Dispatches official termination notice to employee email</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
                {deleteError}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setEmployeeToDelete(null);
                  setDeleteError('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Deleting...' : 'Confirm & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
