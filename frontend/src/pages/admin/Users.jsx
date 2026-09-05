import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Filter, Users as UsersIcon, Shield } from 'lucide-react';
import { getUsers } from '../../data/users';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';

export const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  // Filtered users list
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    {
      header: 'Name',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
            {row.name.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">{row.name}</span>
            {row.employeeName && (
              <span className="text-[11px] text-slate-400">Linked: {row.employeeName}</span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Email',
      key: 'email',
      cellClassName: 'font-mono text-slate-600'
    },
    {
      header: 'Role',
      key: 'role',
      render: (row) => {
        const isAdm = row.role === 'Admin';
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
              isAdm
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {row.role}
          </span>
        );
      }
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <button
          onClick={() => navigate(`/admin/users/${row.id}`)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Edit
        </button>
      )
    }
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Users"
        subtitle={`System users management (${users.length} registered accounts)`}
      >
        <button
          onClick={() => navigate('/admin/users/new')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add User
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
            placeholder="Search by name or email..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="HR Manager">HR Manager</option>
              <option value="HR Payroll User">HR Payroll User</option>
              <option value="HR Payroll Manager">HR Payroll Manager</option>
              <option value="Employee">Employee</option>
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

      {/* Main Users Table */}
      <DataTable
        columns={columns}
        data={paginatedUsers}
        totalItems={filteredUsers.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        emptyMessage="No users match your criteria"
      />
    </div>
  );
};
