import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, Info, Check, FileText } from 'lucide-react';
import {
  getContractById,
  createContract,
  updateContract,
  checkContractOverlap
} from '../../data/contracts';
import { getEmployees } from '../../data/employees';
import { PageHeader } from '../../components/common/PageHeader';

export const ContractForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'new';

  const [employees, setEmployees] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [overlapWarning, setOverlapWarning] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2027-12-31',
    department: 'Engineering',
    position: 'Software Engineer',
    wage: 6500,
    salaryStructure: 'Standard Corporate Structure',
    status: 'Active',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const empList = getEmployees();
    setEmployees(empList);

    if (!isCreate) {
      const existing = getContractById(id);
      if (existing) {
        setFormData({
          employeeId: existing.employeeId || '',
          employeeName: existing.employeeName || '',
          startDate: existing.startDate || '',
          endDate: existing.endDate || '',
          department: existing.department || 'Engineering',
          position: existing.position || '',
          wage: existing.wage || 6500,
          salaryStructure: existing.salaryStructure || 'Standard Corporate Structure',
          status: existing.status || 'Active',
          notes: existing.notes || ''
        });
      } else {
        alert('Contract record not found');
        navigate('/contracts');
      }
    } else {
      if (empList.length > 0) {
        const first = empList[0];
        setFormData((prev) => ({
          ...prev,
          employeeId: first.id,
          employeeName: first.name,
          department: first.department,
          position: first.position
        }));
      }
    }
  }, [id, isCreate, navigate]);

  // Check client-side overlap warning whenever employeeId, status, or date range changes
  useEffect(() => {
    if (formData.employeeId && formData.status === 'Active') {
      const overlapping = checkContractOverlap(
        formData.employeeId,
        formData.startDate,
        formData.endDate,
        isCreate ? null : id
      );
      setOverlapWarning(overlapping);
    } else {
      setOverlapWarning(null);
    }
  }, [formData.employeeId, formData.startDate, formData.endDate, formData.status, isCreate, id]);

  const handleEmployeeChange = (empId) => {
    const matched = employees.find((e) => e.id === empId);
    setFormData((prev) => ({
      ...prev,
      employeeId: empId,
      employeeName: matched ? matched.name : '',
      department: matched ? matched.department : prev.department,
      position: matched ? matched.position : prev.position
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.employeeId) errs.employeeId = 'Employee selection is required';
    if (!formData.startDate) errs.startDate = 'Start date is required';
    if (!formData.department) errs.department = 'Department is required';
    if (!formData.position.trim()) errs.position = 'Position is required';
    if (!formData.wage || Number(formData.wage) <= 0) errs.wage = 'Valid wage amount is required';
    if (!formData.salaryStructure) errs.salaryStructure = 'Salary Structure is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isCreate) {
        createContract(formData);
        setToastMessage('Contract created successfully!');
      } else {
        updateContract(id, formData);
        setToastMessage('Contract updated successfully!');
      }

      setTimeout(() => {
        navigate('/contracts');
      }, 900);
    } catch (err) {
      alert('Error saving contract: ' + err.message);
      setSubmitting(false);
    }
  };

  const salaryStructures = [
    'Standard Corporate Structure',
    'Executive Leadership Structure',
    'Part-Time Hourly Structure',
    'Commission & Bonus Structure'
  ];

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
        title={isCreate ? 'New Contract' : 'Contract Details'}
        subtitle={
          isCreate
            ? 'Establish new employment terms and salary structure'
            : `${formData.employeeName} (${id})`
        }
      >
        <button
          type="button"
          onClick={() => navigate('/contracts')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Cancel
        </button>
      </PageHeader>

      {/* Informational Business Rule Notice */}
      <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Business Rule:</strong> Payroll uses the contract applicable to the selected payroll period.
        </span>
      </div>

      {/* Overlap Validation Warning Banner */}
      {overlapWarning && (
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Active Contract Overlap Warning</p>
            <p className="mt-0.5 leading-relaxed text-[11px]">
              This employee already has an active contract (<strong>{overlapWarning.id}</strong>: {overlapWarning.startDate} to {overlapWarning.endDate || 'Present'}) for an overlapping period.
            </p>
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Section 1: Employee Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Employee Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department} • {emp.position})
                    </option>
                  ))}
                </select>
                {errors.employeeId && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.employeeId}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Job Position <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contract Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contract Duration & Terms */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Contract Terms &amp; Duration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.startDate && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  End Date (Leave blank if indefinite)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Compensation & Salary Structure */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Compensation &amp; Payroll Mapping
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Monthly Base Wage ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    value={formData.wage}
                    onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                {errors.wage && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.wage}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Salary Structure <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.salaryStructure}
                  onChange={(e) => setFormData({ ...formData, salaryStructure: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {salaryStructures.map((struct) => (
                    <option key={struct} value={struct}>
                      {struct}
                    </option>
                  ))}
                </select>
                {errors.salaryStructure && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.salaryStructure}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              Save Contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
