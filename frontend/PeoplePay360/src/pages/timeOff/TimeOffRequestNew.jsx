import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { createTimeOffRequest } from '../../data/timeOffRequests';
import { getTimeOffTypes } from '../../data/timeOffTypes';
import { getEmployees } from '../../data/employees';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { TimeOffRequestForm } from '../../components/timeOff/TimeOffRequestForm';

export const TimeOffRequestNew = () => {
  const navigate = useNavigate();
  const { currentUser, isHRorAdmin } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setEmployees(getEmployees());
    setTypes(getTimeOffTypes().filter((t) => t.status === 'Active'));
  }, []);

  const handleSubmit = (data) => {
    try {
      createTimeOffRequest(data);
      setToastMessage('Time off request submitted successfully! Status: Pending.');
      setTimeout(() => {
        navigate('/time-off/requests');
      }, 900);
    } catch (err) {
      alert('Error submitting request: ' + err.message);
    }
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
        title="New Time Off Request"
        subtitle="Submit a leave application for supervisor and HR review"
      >
        <button
          type="button"
          onClick={() => navigate('/time-off/requests')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Requests
        </button>
      </PageHeader>

      {/* Form */}
      {employees.length > 0 && types.length > 0 && (
        <TimeOffRequestForm
          employees={employees}
          timeOffTypes={types}
          currentEmployeeId={currentUser?.employeeId}
          canSelectAnyEmployee={isHRorAdmin}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/time-off/requests')}
        />
      )}
    </div>
  );
};
