import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Clock, Search, Filter, Calendar } from 'lucide-react';
import { getAttendanceRecords, fetchAttendanceRecordsAsync } from '../../data/attendance';
import { getEmployees, fetchEmployeesAsync } from '../../data/employees';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { AttendanceTable } from '../../components/attendance/AttendanceTable';

export const Attendance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeFilterParam = searchParams.get('employee');

  const { currentUser, isHRorAdmin, isEmployeeOnly } = useAuth();

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    employeeFilterParam || (isEmployeeOnly && currentUser?.employeeId ? currentUser.employeeId : 'All')
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setRecords(getAttendanceRecords());
    setEmployees(getEmployees());

    fetchAttendanceRecordsAsync().then((list) => {
      if (Array.isArray(list)) setRecords(list);
    }).catch(console.error);

    fetchEmployeesAsync().then((emps) => {
      if (Array.isArray(emps)) setEmployees(emps);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (employeeFilterParam) {
      setSelectedEmployeeId(employeeFilterParam);
    }
  }, [employeeFilterParam]);

  // Filtering
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmp = selectedEmployeeId === 'All' || r.employeeId === selectedEmployeeId;
    const matchesDept = departmentFilter === 'All' || r.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesDate = !dateFilter || r.date === dateFilter;

    // Strict role restriction for employee
    if (isEmployeeOnly && currentUser?.employeeId) {
      return r.employeeId === currentUser.employeeId && matchesDate && matchesStatus && matchesSearch;
    }

    return matchesSearch && matchesEmp && matchesDept && matchesStatus && matchesDate;
  });

  const paginated = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const departments = ['All', 'Engineering', 'Human Resources', 'Finance', 'Sales', 'Design'];
  const statuses = [
    'All',
    'Present',
    'Late',
    'Absent',
    'Overtime',
    'Missing Check-out',
    'Manual Edit'
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Attendance"
        subtitle={`Shift check-in logs, worked hours, and exception monitoring (${records.length} records)`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/attendance/face-check-in')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-xs transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Face Check-In
          </button>
          {isHRorAdmin && (
            <button
              onClick={() => navigate('/attendance/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Attendance
            </button>
          )}
        </div>
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
            placeholder="Search employee or department..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Employee Filter (Shown for HR/Admin) */}
          {isHRorAdmin && (
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
                <option value="All">All Staff</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Filter */}
          {isHRorAdmin && (
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
                    {d === 'All' ? 'All Depts' : d}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <AttendanceTable
        records={paginated}
        totalItems={filteredRecords.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onView={(id) => navigate(`/attendance/${id}`)}
        onEdit={(id) => navigate(`/attendance/${id}`)}
        canEdit={isHRorAdmin}
      />
    </div>
  );
};
