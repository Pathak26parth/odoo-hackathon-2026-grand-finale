import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Edit3, Check, AlertCircle, User, Briefcase, Camera } from 'lucide-react';
import { getEmployeeById, createEmployee, updateEmployee, getEmployees } from '../../data/employees';
import { PageHeader } from '../../components/common/PageHeader';
import { EmployeeSmartActions } from '../../components/employees/EmployeeSmartActions';
import { StatusBadge } from '../../components/common/StatusBadge';

export const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id || id === 'new';

  const [isEditing, setIsEditing] = useState(isCreate);
  const [employee, setEmployee] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeId: '',
    email: '',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Engineering',
    manager: 'Ethan Williams',
    position: '',
    schedule: 'Standard 40 Hours',
    status: 'Active'
  });

  useEffect(() => {
    const list = getEmployees();
    setAllEmployees(list);

    if (!isCreate) {
      const existing = getEmployeeById(id);
      if (existing) {
        setEmployee(existing);
        setFormData({
          firstName: existing.firstName || existing.name?.split(' ')[0] || '',
          lastName: existing.lastName || existing.name?.split(' ').slice(1).join(' ') || '',
          employeeId: existing.employeeId || existing.id || '',
          email: existing.email || '',
          phone: existing.phone || '+1 (555) 000-0000',
          avatar: existing.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          department: existing.department || 'Engineering',
          manager: existing.manager || 'Ethan Williams',
          position: existing.position || '',
          schedule: existing.schedule || 'Standard 40 Hours',
          status: existing.status || 'Active'
        });
      } else {
        alert('Employee not found');
        navigate('/employees');
      }
    } else {
      // Auto-generate employee ID for create mode
      setFormData((prev) => ({
        ...prev,
        employeeId: `EMP-${String(list.length + 1).padStart(3, '0')}`
      }));
    }
  }, [id, isCreate, navigate]);

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = 'First Name is required';
    if (!formData.lastName.trim()) errs.lastName = 'Last Name is required';
    if (!formData.employeeId.trim()) errs.employeeId = 'Employee ID is required';
    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Valid email is required';
    }
    if (!formData.department) errs.department = 'Department is required';
    if (!formData.position.trim()) errs.position = 'Job Position is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isCreate) {
        createEmployee(formData);
        setToastMessage('Employee created successfully!');
      } else {
        updateEmployee(id, formData);
        setToastMessage('Employee details updated successfully!');
      }

      setTimeout(() => {
        navigate('/employees');
      }, 900);
    } catch (err) {
      alert('Error saving employee: ' + err.message);
      setSubmitting(false);
    }
  };

  const departments = ['Engineering', 'Human Resources', 'Finance', 'Sales', 'Design', 'Operations'];
  const schedules = ['Standard 40 Hours', 'Flexible Schedule', 'Part Time', 'Night Shift'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title={isCreate ? 'New Employee' : 'Employee Details'}
        subtitle={
          isCreate
            ? 'Add a new employee to the personnel registry'
            : `${formData.firstName} ${formData.lastName} (${formData.employeeId})`
        }
      >
        <div className="flex items-center gap-2">
          {!isCreate && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}

          {isEditing && (
            <button
              type="submit"
              form="employee-form"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isCreate ? 'Save Employee' : 'Update Employee'}
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
      </PageHeader>

      {/* Smart Action Buttons (Shown on View/Edit mode for existing employee) */}
      {!isCreate && employee && (
        <EmployeeSmartActions employee={employee} />
      )}

      {/* Main Employee Form Card */}
      <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Information */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
            <User className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar block */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <img
                src={formData.avatar}
                alt={formData.firstName || 'Employee'}
                className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-2xs"
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt('Enter image avatar URL:', formData.avatar);
                    if (url) setFormData({ ...formData, avatar: url });
                  }}
                  className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <Camera className="w-3 h-3" /> Change Photo
                </button>
              )}
            </div>

            {/* Fields grid */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Amelia"
                  className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600 ${
                    errors.firstName ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Johnson"
                  className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600 ${
                    errors.lastName ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="e.g. EMP-001"
                  className={`w-full px-3 py-2 border rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600 ${
                    errors.employeeId ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.employeeId && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.employeeId}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. amelia.j@peoplepay360.com"
                  className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600 ${
                    errors.email ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.email}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Work Information */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Work Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={!isEditing}
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Job Position <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g. Software Engineer"
                className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600 ${
                  errors.position ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.position && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.position}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reporting Manager</label>
              <select
                disabled={!isEditing}
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600"
              >
                <option value="Admin User">Admin User</option>
                {allEmployees
                  .filter((e) => e.employeeId !== formData.employeeId)
                  .map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name} ({e.department})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Working Schedule</label>
              <select
                disabled={!isEditing}
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600"
              >
                {schedules.map((sch) => (
                  <option key={sch} value={sch}>
                    {sch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employment Status</label>
              <select
                disabled={!isEditing}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
