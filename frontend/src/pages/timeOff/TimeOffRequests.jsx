import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Check, Search, Filter, CalendarCheck, Calendar } from 'lucide-react';
import {
  getTimeOffRequests,
  approveTimeOffRequest,
  refuseTimeOffRequest,
  fetchTimeOffRequestsAsync
} from '../../data/timeOffRequests';
import { getTimeOffTypes, fetchTimeOffTypesAsync } from '../../data/timeOffTypes';
import { getEmployees, fetchEmployeesAsync } from '../../data/employees';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { TimeOffRequestTable } from '../../components/timeOff/TimeOffRequestTable';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const TimeOffRequests = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeFilterParam = searchParams.get('employee');

  const { currentUser, isHRorAdmin, isEmployeeOnly, canApproveTimeOff } = useAuth();

  const [requests, setRequests] = useState([]);
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

  // Confirmation Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'approve', // 'approve' | 'refuse'
    request: null
  });

  const [toastMessage, setToastMessage] = useState('');

  const loadData = () => {
    setRequests(getTimeOffRequests());
    setTypes(getTimeOffTypes());
    setEmployees(getEmployees());

    fetchTimeOffRequestsAsync().then((list) => {
      if (list && list.length > 0) setRequests(list);
    }).catch(console.error);

    fetchTimeOffTypesAsync().then((list) => {
      if (list && list.length > 0) setTypes(list);
    }).catch(console.error);

    fetchEmployeesAsync().then((list) => {
      if (list && list.length > 0) setEmployees(list);
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (employeeFilterParam) {
      setSelectedEmployeeId(employeeFilterParam);
    }
  }, [employeeFilterParam]);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || r.timeOffTypeName === typeFilter;
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesEmp = selectedEmployeeId === 'All' || r.employeeId === selectedEmployeeId;

    // Strict role restriction for employee
    if (isEmployeeOnly && currentUser?.employeeId) {
      return r.employeeId === currentUser.employeeId && matchesType && matchesStatus && matchesSearch;
    }

    return matchesSearch && matchesType && matchesStatus && matchesEmp;
  });

  const paginated = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleApprovePrompt = (req) => {
    setModalConfig({
      isOpen: true,
      type: 'approve',
      request: req
    });
  };

  const handleRefusePrompt = (req) => {
    setModalConfig({
      isOpen: true,
      type: 'refuse',
      request: req
    });
  };

  const handleConfirmAction = async () => {
    const req = modalConfig.request;
    if (!req) return;

    if (modalConfig.type === 'approve') {
      await approveTimeOffRequest(req.id, currentUser?.name || 'HR Manager');
      setToastMessage(`Request for ${req.employeeName} approved! Leave balance updated.`);
    } else {
      await refuseTimeOffRequest(req.id, currentUser?.name || 'HR Manager');
      setToastMessage(`Request for ${req.employeeName} was refused.`);
    }

    loadData();
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Time Off Requests"
        subtitle={`Employee leave requests, review workflow, and balance deduction (${requests.length} records)`}
      >
        <button
          onClick={() => navigate('/time-off/requests/new')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </PageHeader>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="Search employee or leave reason..."
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

          {/* Time Off Type Filter */}
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
              <option value="Pending">Pending Only</option>
              <option value="Approved">Approved</option>
              <option value="Refused">Refused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <TimeOffRequestTable
        requests={paginated}
        totalItems={filteredRequests.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onApprove={handleApprovePrompt}
        onRefuse={handleRefusePrompt}
        canApprove={canApproveTimeOff}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.type === 'approve' ? 'Approve Time Off Request' : 'Refuse Time Off Request'}
        message={
          modalConfig.type === 'approve'
            ? `Are you sure you want to approve ${modalConfig.request?.duration} ${modalConfig.request?.unit || 'Days'} of ${modalConfig.request?.timeOffTypeName} for ${modalConfig.request?.employeeName}? This will automatically deduct ${modalConfig.request?.duration} days from their remaining leave allocation balance.`
            : `Are you sure you want to refuse this time off request for ${modalConfig.request?.employeeName}?`
        }
        confirmText={modalConfig.type === 'approve' ? 'Yes, Approve Request' : 'Yes, Refuse Request'}
        variant={modalConfig.type === 'approve' ? 'success' : 'danger'}
        onConfirm={handleConfirmAction}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  );
};
