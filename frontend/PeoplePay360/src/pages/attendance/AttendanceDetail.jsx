import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { getAttendanceById, createAttendance, updateAttendance, deleteAttendance } from '../../data/attendance';
import { getEmployees } from '../../data/employees';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { AttendanceForm } from '../../components/attendance/AttendanceForm';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export const AttendanceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'new';
  const { currentUser, isHRorAdmin } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [record, setRecord] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const emps = getEmployees();
    setEmployees(emps);

    if (!isCreate) {
      const existing = getAttendanceById(id);
      if (existing) {
        setRecord(existing);
      } else {
        alert('Attendance record not found');
        navigate('/attendance');
      }
    }
  }, [id, isCreate, navigate]);

  const handleSubmit = (data) => {
    try {
      if (isCreate) {
        createAttendance(data);
        setToastMessage('Attendance logged successfully!');
      } else {
        updateAttendance(id, data);
        setToastMessage('Attendance updated successfully!');
      }

      setTimeout(() => {
        navigate('/attendance');
      }, 900);
    } catch (err) {
      alert('Error saving attendance: ' + err.message);
    }
  };

  const handleDelete = () => {
    deleteAttendance(id);
    setToastMessage('Attendance record deleted.');
    setTimeout(() => {
      navigate('/attendance');
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title={isCreate ? 'Add Attendance' : 'Attendance Details'}
        subtitle={
          isCreate
            ? 'Record new employee badge log or manual shift entry'
            : `${record?.employeeName} (${record?.date})`
        }
      >
        <div className="flex items-center gap-2">
          {!isCreate && isHRorAdmin && (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/attendance')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to List
          </button>
        </div>
      </PageHeader>

      {/* Form */}
      {(isCreate || record) && (
        <AttendanceForm
          initialData={record || {}}
          employees={employees}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/attendance')}
          isCreate={isCreate}
          canManualCorrect={isHRorAdmin}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Attendance Record"
        message="Are you sure you want to permanently delete this attendance record? This will affect historical attendance tallies."
        confirmText="Yes, Delete"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
