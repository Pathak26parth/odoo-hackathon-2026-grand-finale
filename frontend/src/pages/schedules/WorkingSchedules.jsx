import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Eye, Trash2, Calendar, Users, Clock } from 'lucide-react';
import { getSchedules, deleteSchedule, fetchSchedulesAsync } from '../../data/schedules';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';

export const WorkingSchedules = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = () => {
    setSchedules(getSchedules());
    fetchSchedulesAsync().then((list) => {
      if (Array.isArray(list)) setSchedules(list);
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete working schedule "${name}"?`)) {
      await deleteSchedule(id);
      setToastMessage(`Schedule "${name}" deleted.`);
      setTimeout(() => setToastMessage(''), 3000);
      loadData();
    }
  };

  const columns = [
    {
      header: 'Schedule Name',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">{row.name}</span>
            <span className="text-[11px] font-mono text-slate-400">{row.id}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      key: 'type',
      render: (row) => (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {row.type}
        </span>
      )
    },
    {
      header: 'Weekly Hours',
      key: 'weeklyHours',
      render: (row) => (
        <span className="font-bold text-slate-900 font-mono">
          {row.weeklyHours} <span className="text-slate-400 font-normal text-[11px]">hrs / week</span>
        </span>
      )
    },
    {
      header: 'Assigned Employees',
      key: 'assignedEmployees',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          {row.assignedEmployees ?? 0} Staff
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => navigate(`/working-schedules/${row.id}`)}
            className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/working-schedules/${row.id}`)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.id, row.name)}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Schedule"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shadow-sm">
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Working Schedules"
        subtitle={`Define shift calendars, operating hours, and standard weekly totals (${schedules.length} configurations)`}
      >
        <button
          onClick={() => navigate('/working-schedules/new')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Schedule
        </button>
      </PageHeader>

      {/* Schedules Table */}
      <DataTable
        columns={columns}
        data={schedules}
        totalItems={schedules.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        emptyMessage="No working schedules created yet"
      />
    </div>
  );
};
