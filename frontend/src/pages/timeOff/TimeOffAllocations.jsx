import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, PieChart } from 'lucide-react';
import { getAllocations, fetchAllocationsAsync } from '../../data/allocations';
import { getTimeOffTypes, fetchTimeOffTypesAsync } from '../../data/timeOffTypes';
import { getEmployees, fetchEmployeesAsync } from '../../data/employees';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { AllocationTable } from '../../components/timeOff/AllocationTable';
import { LeaveBalanceCard } from '../../components/timeOff/LeaveBalanceCard';

export const TimeOffAllocations = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeFilterParam = searchParams.get('employee');

  const { currentUser, isHRorAdmin, isEmployeeOnly, canManageAllocations } = useAuth();

  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    employeeFilterParam || (isEmployeeOnly && currentUser?.employeeId ? currentUser.employeeId : 'All')
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setAllocations(getAllocations());
    setTypes(getTimeOffTypes());
    setEmployees(getEmployees());

    fetchAllocationsAsync().then((list) => {
      if (Array.isArray(list)) setAllocations(list);
    }).catch(console.error);

    fetchTimeOffTypesAsync().then((list) => {
      if (Array.isArray(list)) setTypes(list);
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

  // Filtering
  const filteredAllocations = allocations.filter((a) => {
    const matchesSearch =
      a.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.timeOffTypeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || a.timeOffTypeName === typeFilter || a.leaveType === typeFilter;
    const matchesStatus = statusFilter === 'All' || a.status?.toUpperCase() === statusFilter.toUpperCase();

    if (isEmployeeOnly) {
      const myId = currentUser?.employeeId;
      const myIntId = currentUser?.internalEmployeeId;
      const matchesMine =
        (myId && a.employeeId === myId) ||
        (myIntId && String(a.internalEmployeeId) === String(myIntId)) ||
        (currentUser?.id && String(a.employeeId) === String(currentUser?.id));
      return matchesMine && matchesType && matchesStatus && matchesSearch;
    }

    const matchesEmp =
      selectedEmployeeId === 'All' ||
      a.employeeId === selectedEmployeeId ||
      String(a.internalEmployeeId) === String(selectedEmployeeId);

    return matchesSearch && matchesType && matchesStatus && matchesEmp;
  });

  const paginated = filteredAllocations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Focus employee allocations for top balance cards preview
  const employeeTopCards = allocations.filter((a) => {
    if (isEmployeeOnly) {
      return (
        (currentUser?.employeeId && a.employeeId === currentUser.employeeId) ||
        (currentUser?.internalEmployeeId && String(a.internalEmployeeId) === String(currentUser.internalEmployeeId))
      );
    }
    if (selectedEmployeeId !== 'All') {
      return (
        a.employeeId === selectedEmployeeId ||
        String(a.internalEmployeeId) === String(selectedEmployeeId)
      );
    }
    // Default to first employee's allocation group
    return a.employeeId === allocations[0]?.employeeId;
  });

  const focusedEmployeeName = isEmployeeOnly
    ? (currentUser?.name || currentUser?.employeeName || 'My Leave Balances')
    : (employees.find((e) => e.id === selectedEmployeeId || e.employeeId === selectedEmployeeId)?.name || employeeTopCards[0]?.employeeName || 'Staff Member');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Time Off Allocations"
        subtitle={`Employee leave quotas, historical grants, and remaining balances (${filteredAllocations.length} records)`}
      >
        {canManageAllocations && (
          <button
            onClick={() => navigate('/time-off/allocations/new')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Allocation
          </button>
        )}
      </PageHeader>

      {/* Top Leave Balances Preview Cards */}
      {employeeTopCards.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <PieChart className="w-3.5 h-3.5 text-blue-600" />
              <span>Leave Balances Summary — {focusedEmployeeName}</span>
            </h3>
            {isHRorAdmin && selectedEmployeeId !== 'All' && (
              <span className="text-[11px] text-slate-400">
                (Filtered by selected employee)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {employeeTopCards.map((item) => (
              <LeaveBalanceCard
                key={item.id}
                title={item.timeOffTypeName || item.leaveType}
                allocated={item.allocated !== undefined ? item.allocated : item.allocatedDays}
                taken={item.taken !== undefined ? item.taken : item.takenDays}
                remaining={item.remaining !== undefined ? item.remaining : item.remainingDays}
                unit={item.unit || 'Days'}
                subtitle={`Valid: ${item.validFrom || item.validityStart || '2026-01-01'} to ${item.validUntil || item.validityEnd || '2026-12-31'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search employee or type..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Employee Filter */}
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

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Types</option>
              {types.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
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
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Allocation Table */}
      <AllocationTable
        allocations={paginated}
        totalItems={filteredAllocations.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        canManage={canManageAllocations}
      />
    </div>
  );
};
