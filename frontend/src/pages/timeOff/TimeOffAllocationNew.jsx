import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { createAllocation } from '../../data/allocations';
import { getTimeOffTypes, fetchTimeOffTypesAsync } from '../../data/timeOffTypes';
import { getEmployees, fetchEmployeesAsync } from '../../data/employees';
import { PageHeader } from '../../components/common/PageHeader';
import { AllocationForm } from '../../components/timeOff/AllocationForm';

export const TimeOffAllocationNew = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setEmployees(getEmployees());
    setTypes(getTimeOffTypes().filter((t) => t.status === 'Active'));

    fetchEmployeesAsync().then((list) => {
      if (Array.isArray(list)) setEmployees(list);
    }).catch(console.error);

    fetchTimeOffTypesAsync().then((list) => {
      if (Array.isArray(list)) setTypes(list.filter((t) => t.status === 'Active'));
    }).catch(console.error);
  }, []);

  const handleSubmit = async (data) => {
    try {
      await createAllocation(data);
      setToastMessage(`Allocation granted for ${data.employeeName}!`);
      setTimeout(() => {
        navigate('/time-off/allocations');
      }, 900);
    } catch (err) {
      alert('Error saving allocation: ' + err.message);
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
        title="New Time Off Allocation"
        subtitle="Grant vacation, personal leave, or sick quotas to personnel"
      >
        <button
          type="button"
          onClick={() => navigate('/time-off/allocations')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Allocations
        </button>
      </PageHeader>

      {/* Allocation Form */}
      {employees.length > 0 && types.length > 0 && (
        <AllocationForm
          employees={employees}
          timeOffTypes={types}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/time-off/allocations')}
        />
      )}
    </div>
  );
};
