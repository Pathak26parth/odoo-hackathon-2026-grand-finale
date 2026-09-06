import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, Info, Check, FileText, ShieldCheck } from 'lucide-react';
import {
  getContractById,
  fetchContractByIdAsync,
  createContract,
  updateContract,
  checkContractOverlap
} from '../../data/contracts';
import { getSalaryStructures, fetchSalaryStructuresAsync } from '../../data/salaryStructures';
import { getEmployees, fetchEmployeesAsync } from '../../data/employees';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';

export const ContractForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isCreate = !id || id === 'new';

  const isManagerOrAdmin =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'HR Manager' ||
    currentUser?.role === 'HR Payroll Manager' ||
    currentUser?.role === 'HR Payroll User' ||
    currentUser?.roleRaw === 'ADMIN' ||
    currentUser?.roleRaw === 'HR_MANAGER' ||
    currentUser?.roleRaw === 'HR_PAYROLL_ADMIN' ||
    currentUser?.roleRaw === 'HR_PAYROLL_USER';
  const isEmployeeOnly = !isManagerOrAdmin;

  const isSystemAdminContract =
    formData.employeeName === 'System Administrator' ||
    formData.employeeId === 'EMP-001' ||
    formData.employeeId === 1 ||
    formData.employeeId === '1' ||
    formData.internalEmployeeId === 1 ||
    String(id) === '1' ||
    id === 'CON-EMP-001-2024';

  const isCurrentUserSystemAdmin =
    currentUser?.role === 'Admin' ||
    currentUser?.roleRaw === 'ADMIN';

  // Security Lock: Only System Admin can edit System Admin's contract
  const isContractLocked = !isCreate && isSystemAdminContract && !isCurrentUserSystemAdmin;
  const isReadOnly = isEmployeeOnly || isContractLocked;

  const [employees, setEmployees] = useState([]);
  const [availableStructures, setAvailableStructures] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [overlapWarning, setOverlapWarning] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    department: '',
    position: '',
    wage: '',
    salaryStructure: '',
    status: 'Active',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const populateForm = (existing) => {
    setFormData({
      employeeId: existing.employeeId || '',
      employeeName: existing.employeeName || '',
      startDate: existing.startDate ? String(existing.startDate).split('T')[0] : '',
      endDate: existing.endDate ? String(existing.endDate).split('T')[0] : '',
      department: existing.department || '',
      departmentId: existing.departmentId || null,
      position: existing.position || '',
      wage: existing.wage !== undefined && existing.wage !== null ? existing.wage : '',
      salaryStructure: existing.structure || existing.salaryStructure || existing.salaryStructureName || '',
      salaryStructureId: existing.salaryStructureId || null,
      workingScheduleId: existing.workingScheduleId || 1,
      status: existing.status || 'Active',
      notes: existing.notes || ''
    });
  };

  useEffect(() => {
    const empList = getEmployees();
    setEmployees(empList);
    setAvailableStructures(getSalaryStructures());

    fetchEmployeesAsync().then((list) => {
      if (Array.isArray(list)) {
        setEmployees(list);
        if (isCreate && list.length > 0 && !formData.employeeId) {
          const first = list[0];
          setFormData((prev) => ({
            ...prev,
            employeeId: first.id,
            employeeName: first.name,
            department: first.department || '',
            position: first.position || ''
          }));
        }
      }
    }).catch(console.error);

    fetchSalaryStructuresAsync().then((structs) => {
      if (Array.isArray(structs)) {
        setAvailableStructures(structs);
        if (isCreate && structs.length > 0 && !formData.salaryStructure) {
          setFormData((prev) => ({ ...prev, salaryStructure: structs[0].name }));
        }
      }
    }).catch(console.error);

    if (!isCreate) {
      const existing = getContractById(id);
      if (existing) {
        populateForm(existing);
      }
      fetchContractByIdAsync(id).then((fresh) => {
        if (fresh) populateForm(fresh);
      }).catch(console.error);
    } else {
      if (empList.length > 0) {
        const first = empList[0];
        setFormData((prev) => ({
          ...prev,
          employeeId: first.id,
          employeeName: first.name,
          department: first.department || '',
          position: first.position || ''
        }));
      }
    }
  }, [id, isCreate]);

  // If a regular employee attempts to access the create contract form, redirect them
  useEffect(() => {
    if (isEmployeeOnly && isCreate) {
      navigate('/contracts', { replace: true });
    }
  }, [isEmployeeOnly, isCreate, navigate]);

  // Check client-side overlap warning whenever employeeId, status, or date range changes
  useEffect(() => {
    if (!isReadOnly && formData.employeeId && formData.status === 'Active') {
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
  }, [formData.employeeId, formData.startDate, formData.endDate, formData.status, isCreate, id, isReadOnly]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const matchedStruct = availableStructures.find(
        (s) => s.name === formData.salaryStructure || String(s.id) === String(formData.salaryStructure)
      );
      const matchedEmp = employees.find(
        (emp) => String(emp.id) === String(formData.employeeId) || emp.employeeId === formData.employeeId
      );

      const payload = {
        ...formData,
        internalEmployeeId: matchedEmp ? matchedEmp.id : formData.employeeId,
        salaryStructureId: matchedStruct ? matchedStruct.id : 1,
        departmentId: matchedEmp ? matchedEmp.departmentId : null
      };

      if (isCreate) {
        await createContract(payload);
        setToastMessage('Contract created successfully!');
      } else {
        await updateContract(id, payload);
        setToastMessage('Contract updated successfully!');
      }

      setTimeout(() => {
        navigate('/contracts');
      }, 800);
    } catch (err) {
      alert('Error saving contract: ' + (err.message || 'Server error occurred'));
      setSubmitting(false);
    }
  };

  const salaryStructures = [
    ...new Set([
      ...availableStructures.map((s) => s.name).filter(Boolean),
      formData.salaryStructure
    ].filter(Boolean))
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
        title={isReadOnly ? 'Employment Contract' : (isCreate ? 'New Contract' : 'Contract Details')}
        subtitle={
          isReadOnly
            ? `${formData.employeeName || 'Employee'} • ${formData.position || 'Staff'} (${id})`
            : (isCreate
                ? 'Establish new employment terms and salary structure'
                : `${formData.employeeName} (${id})`)
        }
      >
        <button
          type="button"
          onClick={() => navigate('/contracts')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isReadOnly ? 'Back to Contracts' : 'Cancel'}
        </button>
      </PageHeader>

      {/* Informational / Security Notice */}
      {isContractLocked ? (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">System Administrator Contract Protected (Read-Only)</h4>
            <p className="text-rose-700 text-xs mt-0.5">
              Only the System Administrator has administrative authority to modify the System Administrator's employment contract.
            </p>
          </div>
        </div>
      ) : isEmployeeOnly ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Official Employment Agreement (Read-Only)</h4>
            <p className="text-emerald-700 text-xs mt-0.5">
              This is your verified employment contract on record with Human Resources &amp; Payroll. Contract terms, wage structures, and work schedules can only be modified by authorized HR administrators.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong>Business Rule:</strong> At any time, an employee can only have <strong>one active contract</strong>. Activating this contract will automatically mark any existing active contract for this employee as Expired.
          </span>
        </div>
      )}

      {/* Overlap Validation Warning Banner (HR/Admin only) */}
      {!isReadOnly && overlapWarning && (
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Active Contract Overlap Notice</p>
            <p className="mt-0.5 leading-relaxed text-[11px]">
              This employee currently has an active contract (<strong>{overlapWarning.id}</strong>). Saving this contract as Active will automatically transition the older contract to Expired.
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
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-800 disabled:cursor-not-allowed"
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
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-800 disabled:cursor-not-allowed"
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
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-800 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contract Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold disabled:bg-slate-50 disabled:text-slate-800 disabled:cursor-not-allowed"
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
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-800 disabled:cursor-not-allowed"
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
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-800 disabled:cursor-not-allowed"
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
                    disabled={isReadOnly}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-800 disabled:cursor-not-allowed"
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
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-800 disabled:cursor-not-allowed"
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
            {isReadOnly ? (
              <button
                type="button"
                onClick={() => navigate('/contracts')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Contracts
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
