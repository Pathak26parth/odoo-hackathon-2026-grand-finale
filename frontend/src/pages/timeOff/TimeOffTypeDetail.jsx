import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { getTimeOffTypeById, createTimeOffType, updateTimeOffType, fetchTimeOffTypesAsync } from '../../data/timeOffTypes';
import { PageHeader } from '../../components/common/PageHeader';
import { TimeOffTypeForm } from '../../components/timeOff/TimeOffTypeForm';

export const TimeOffTypeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'new';

  const [typeData, setTypeData] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!isCreate) {
      const existing = getTimeOffTypeById(id);
      if (existing) {
        setTypeData(existing);
      }
      fetchTimeOffTypesAsync().then((list) => {
        if (Array.isArray(list)) {
          const match = list.find((t) => String(t.id) === String(id));
          if (match) setTypeData(match);
        }
      }).catch(console.error);
    }
  }, [id, isCreate, navigate]);

  const handleSubmit = async (data) => {
    try {
      if (isCreate) {
        await createTimeOffType(data);
        setToastMessage(`Time off type "${data.name}" created!`);
      } else {
        await updateTimeOffType(id, data);
        setToastMessage(`Time off type "${data.name}" updated!`);
      }

      setTimeout(() => {
        navigate('/time-off/types');
      }, 900);
    } catch (err) {
      alert('Error saving time off type: ' + err.message);
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
        title={isCreate ? 'New Time Off Type' : 'Time Off Type Details'}
        subtitle={
          isCreate
            ? 'Configure leave category, policy rules, and payroll linkage'
            : `${typeData?.name} (${typeData?.unit})`
        }
      >
        <button
          type="button"
          onClick={() => navigate('/time-off/types')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to List
        </button>
      </PageHeader>

      {/* Form */}
      {(isCreate || typeData) && (
        <TimeOffTypeForm
          initialData={typeData || {}}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/time-off/types')}
          isCreate={isCreate}
        />
      )}
    </div>
  );
};
