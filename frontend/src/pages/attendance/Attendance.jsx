import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Clock,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileEdit,
  Check,
  X
} from 'lucide-react';
import {
  getAttendanceRecords,
  fetchAttendanceRecordsAsync,
  fetchMyAttendanceStatusAsync,
  fetchMyAttendanceHistoryAsync
} from '../../data/attendance';
import { getEmployees, fetchEmployeesAsync } from '../../data/employees';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { AttendanceTable } from '../../components/attendance/AttendanceTable';
import { AttendanceCorrectionModal } from '../../components/attendance/AttendanceCorrectionModal';
import { CorrectionRequestsTable } from '../../components/attendance/CorrectionRequestsTable';

export const Attendance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeFilterParam = searchParams.get('employee');

  const { currentUser, isHRorAdmin, isEmployeeOnly } = useAuth();

  // Tab State: 'records' | 'corrections'
  const [activeTab, setActiveTab] = useState('records');

  // Attendance Records State
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [myStatus, setMyStatus] = useState(null);
  const [mySummary, setMySummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    employeeFilterParam || (isEmployeeOnly && currentUser?.employeeId ? currentUser.employeeId : 'All')
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Correction Requests State
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [correctionsPage, setCorrectionsPage] = useState(1);
  const [correctionStatusFilter, setCorrectionStatusFilter] = useState('All');
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedCorrectionRow, setSelectedCorrectionRow] = useState(null);
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [toastAlert, setToastAlert] = useState(null);

  const loadData = () => {
    if (isEmployeeOnly) {
      fetchMyAttendanceStatusAsync().then((status) => {
        if (status) setMyStatus(status);
      }).catch(console.error);

      fetchMyAttendanceHistoryAsync().then((history) => {
        if (history?.records) {
          setRecords(history.records);
        }
        if (history?.summary) {
          setMySummary(history.summary);
        }
      }).catch(console.error);
    } else {
      setRecords(getAttendanceRecords());
      setEmployees(getEmployees());

      fetchAttendanceRecordsAsync().then((list) => {
        if (Array.isArray(list)) setRecords(list);
      }).catch(console.error);

      fetchEmployeesAsync().then((emps) => {
        if (Array.isArray(emps)) setEmployees(emps);
      }).catch(console.error);
    }
  };

  const loadCorrectionRequests = async () => {
    try {
      const res = await attendanceService.getCorrectionRequests({ limit: 100 });
      const list = res?.requests || res?.data?.requests || (Array.isArray(res) ? res : []);
      setCorrectionRequests(list);
    } catch (err) {
      console.warn('Could not load correction requests:', err.message);
    }
  };

  useEffect(() => {
    loadData();
    loadCorrectionRequests();
  }, [isEmployeeOnly]);

  useEffect(() => {
    loadCorrectionRequests();
  }, [activeTab]);

  useEffect(() => {
    if (employeeFilterParam) {
      setSelectedEmployeeId(employeeFilterParam);
    }
  }, [employeeFilterParam]);

  const showToast = (message, type = 'success') => {
    setToastAlert({ message, type });
    setTimeout(() => {
      setToastAlert(null);
    }, 4000);
  };

  // Correction Request Handlers
  const handleOpenCorrectionModal = (row = null) => {
    setSelectedCorrectionRow(row);
    setIsCorrectionModalOpen(true);
  };

  const handleSubmitCorrection = async (payload) => {
    setIsSubmittingCorrection(true);
    try {
      await attendanceService.createCorrectionRequest(payload);
      showToast('Attendance regularization request submitted successfully to HR!');
      setIsCorrectionModalOpen(false);
      setSelectedCorrectionRow(null);
      await loadCorrectionRequests();
      setActiveTab('corrections');
    } catch (err) {
      alert(err.message || 'Failed to submit correction request.');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const handleApproveCorrection = async (req) => {
    const confirmApprove = window.confirm(
      `Approve attendance correction for ${req.employeeName} on ${req.requestDate} (${req.proposedCheckIn} → ${req.proposedCheckOut})?`
    );
    if (!confirmApprove) return;

    try {
      await attendanceService.approveCorrectionRequest(req.id, 'Verified and approved by HR');
      showToast(`Attendance correction for ${req.employeeName} approved and applied.`);
      await loadCorrectionRequests();
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to approve correction request.');
    }
  };

  const handleRejectCorrection = async (req) => {
    const reason = window.prompt(`Enter rejection reason for ${req.employeeName}:`, 'Shift discrepancy not verified');
    if (reason === null) return;

    try {
      await attendanceService.rejectCorrectionRequest(req.id, reason || 'Rejected by HR');
      showToast('Attendance correction request rejected.', 'error');
      await loadCorrectionRequests();
    } catch (err) {
      alert(err.message || 'Failed to reject correction request.');
    }
  };

  const handleCancelCorrection = async (id) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this correction request?');
    if (!confirmCancel) return;

    try {
      await attendanceService.cancelCorrectionRequest(id);
      showToast('Correction request cancelled.');
      await loadCorrectionRequests();
    } catch (err) {
      alert(err.message || 'Failed to cancel request.');
    }
  };

  // Filtering for Attendance Records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmp = selectedEmployeeId === 'All' || r.employeeId === selectedEmployeeId;
    const matchesDept = departmentFilter === 'All' || r.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesDate = !dateFilter || r.date === dateFilter;

    if (isEmployeeOnly) {
      return matchesDate && matchesStatus && matchesSearch;
    }

    return matchesSearch && matchesEmp && matchesDept && matchesStatus && matchesDate;
  });

  const paginated = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Filtering for Correction Requests
  const filteredCorrections = correctionRequests.filter((c) => {
    if (correctionStatusFilter === 'All') return true;
    return c.status === correctionStatusFilter;
  });

  const paginatedCorrections = filteredCorrections.slice((correctionsPage - 1) * pageSize, correctionsPage * pageSize);

  const pendingCount = correctionRequests.filter((c) => c.status === 'PENDING').length;

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
      {/* Toast Notification */}
      {toastAlert && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in ${
          toastAlert.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {toastAlert.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <Check className="w-4 h-4 text-emerald-600" />}
            <span>{toastAlert.message}</span>
          </div>
          <button type="button" onClick={() => setToastAlert(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title={isEmployeeOnly ? 'My Attendance Records' : 'Attendance'}
        subtitle={
          isEmployeeOnly
            ? `Personal shift check-in logs, worked hours, and regularization requests`
            : `Shift check-in logs, worked hours, and exception regularization monitoring`
        }
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/attendance/face-check-in')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Face Check-In
          </button>

          {isEmployeeOnly && (
            <button
              onClick={() => handleOpenCorrectionModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
              title="Request HR to correct or log missed attendance"
            >
              <FileEdit className="w-3.5 h-3.5" />
              Request Regularization
            </button>
          )}

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

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'records'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Attendance Records</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'records' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {records.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('corrections')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'corrections'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>{isEmployeeOnly ? 'My Regularization Requests' : 'Correction Requests'}</span>
          {pendingCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'corrections' ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingCount} Pending
            </span>
          )}
        </button>
      </div>

      {activeTab === 'records' ? (
        <>
          {/* Employee Live Shift Status Banner */}
          {isEmployeeOnly && myStatus && (
            <div className="p-4 rounded-xl border bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  myStatus.sessionStatus === 'CHECKED_IN'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : myStatus.sessionStatus === 'CHECKED_OUT'
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'bg-slate-50 text-slate-500 border border-slate-200'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      myStatus.sessionStatus === 'CHECKED_IN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : myStatus.sessionStatus === 'CHECKED_OUT'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {myStatus.sessionStatus === 'CHECKED_IN' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      {myStatus.sessionStatus === 'CHECKED_IN' ? 'Active Shift • Working' : myStatus.sessionStatus === 'CHECKED_OUT' ? 'Shift Completed' : 'Not Checked In Today'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Expected: {myStatus.schedule?.scheduledStart || '09:00'} – {myStatus.schedule?.scheduledEnd || '18:00'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {myStatus.sessionStatus === 'CHECKED_IN' ? (
                      <span>
                        Checked in at <strong>{myStatus.todayRecord?.checkIn || 'Earlier Today'}</strong> • Working for: <strong className="text-emerald-700 font-mono font-bold">{myStatus.elapsedFormatted}</strong>
                      </span>
                    ) : myStatus.sessionStatus === 'CHECKED_OUT' ? (
                      <span>
                        Checked out at <strong>{myStatus.todayRecord?.checkOut}</strong> • Total session: <strong>{myStatus.todayRecord?.workedHours}h</strong>
                      </span>
                    ) : (
                      <span>You have not recorded attendance yet for today. Use Face Check-In to punch in.</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/attendance/face-check-in')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 ${
                  myStatus.sessionStatus === 'CHECKED_IN'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {myStatus.sessionStatus === 'CHECKED_IN' ? 'Face Check-Out' : 'Punch Check-In'}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Employee KPI Summary Cards */}
          {isEmployeeOnly && mySummary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 text-[11px] block">Days Present</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-slate-900">{mySummary.totalDaysPresent}</span>
                  <span className="text-[10px] text-slate-500">Days</span>
                </div>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 text-[11px] block">Total Worked</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-blue-600">{mySummary.totalWorkedHours}</span>
                  <span className="text-[10px] text-slate-500">Hours</span>
                </div>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 text-[11px] block">On-Time Rate</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-emerald-600">{mySummary.onTimePercentage}%</span>
                  <span className="text-[10px] text-slate-500">punctuality</span>
                </div>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-400 text-[11px] block">Late Arrivals</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-amber-600">{mySummary.totalLateDays}</span>
                  <span className="text-[10px] text-slate-500">Days</span>
                </div>
              </div>
            </div>
          )}

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
            onRequestCorrection={(row) => handleOpenCorrectionModal(row)}
            canEdit={isHRorAdmin}
          />
        </>
      ) : (
        <>
          {/* Correction Requests Filter Bar */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Filter Status:</span>
              <div className="flex items-center gap-1">
                {['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setCorrectionStatusFilter(st);
                      setCorrectionsPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      correctionStatusFilter === st
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'All' ? 'All Requests' : st}
                  </button>
                ))}
              </div>
            </div>

            {isEmployeeOnly && (
              <button
                type="button"
                onClick={() => handleOpenCorrectionModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Correction Request
              </button>
            )}
          </div>

          {/* Correction Requests Table */}
          <CorrectionRequestsTable
            requests={paginatedCorrections}
            totalItems={filteredCorrections.length}
            currentPage={correctionsPage}
            pageSize={pageSize}
            onPageChange={setCorrectionsPage}
            onApprove={handleApproveCorrection}
            onReject={handleRejectCorrection}
            onCancel={handleCancelCorrection}
            isHR={isHRorAdmin}
            isEmployee={isEmployeeOnly}
          />
        </>
      )}

      {/* Attendance Regularization Request Modal */}
      <AttendanceCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => {
          setIsCorrectionModalOpen(false);
          setSelectedCorrectionRow(null);
        }}
        initialData={selectedCorrectionRow}
        onSubmit={handleSubmitCorrection}
        isSubmitting={isSubmittingCorrection}
      />
    </div>
  );
};
