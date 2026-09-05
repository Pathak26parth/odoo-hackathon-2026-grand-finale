import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Save, Edit3, Check, AlertCircle, User, Briefcase, Camera, Upload, Trash2, Shield } from 'lucide-react';
import { getEmployeeById, createEmployee, updateEmployee, deleteEmployee, getEmployees, fetchEmployeesAsync, fetchEmployeeByIdAsync } from '../../data/employees';
import { PageHeader } from '../../components/common/PageHeader';
import { EmployeeSmartActions } from '../../components/employees/EmployeeSmartActions';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

const SYSTEM_ROLES = [
  {
    value: 'EMPLOYEE',
    label: 'Employee (Self-Service Portal)',
    panel: 'Employee Portal',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'Standard employee portal access: Profile, attendance check-in/out, leave requests, and payslips.'
  },
  {
    value: 'HR_MANAGER',
    label: 'HR Manager (Personnel & HR Operations Panel)',
    panel: 'HR Operations Panel',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Full HR Operations: Employee master, attendance oversight, time off approvals, and contracts.'
  },
  {
    value: 'HR_PAYROLL_ADMIN',
    label: 'HR & Payroll Administrator (Full HR & Payroll Panel)',
    panel: 'HR & Payroll Panel',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Complete HR & Payroll control: Payruns, payslip computation, salary structures, rules, and personnel.'
  },
  {
    value: 'HR_PAYROLL_USER',
    label: 'HR Payroll User (Payrun Processing Panel)',
    panel: 'Payroll Processing Panel',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Payroll processing: Create/compute payruns, generate payslips, and manage attendance.'
  },
  {
    value: 'ADMIN',
    label: 'System Administrator (Full Platform Access)',
    panel: 'All Panels (Full Access)',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Unrestricted master access: All functional areas, user management, audit logs, and settings.'
  }
];

export const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isEmployeeOnly, isHRorAdmin, role } = useAuth();
  const isCreate = !id || id === 'new';
  const isAdmin = role === 'Admin' || currentUser?.role === 'ADMIN' || currentUser?.role === 'Admin';

  // If a non-admin / non-HR employee tries to create a new employee, bounce them to their own profile
  if (isCreate && isEmployeeOnly) {
    const ownId = currentUser?.employeeId || currentUser?.internalEmployeeId || currentUser?.id || '1';
    return <Navigate to={`/employees/${ownId}`} replace />;
  }

  // HR Managers cannot assign or create System Administrator accounts
  const allowedRoles = SYSTEM_ROLES.filter((r) => {
    if (r.value === 'ADMIN') {
      return isAdmin;
    }
    return true;
  });

  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(isCreate);
  const [employee, setEmployee] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeId: '',
    email: '',
    phone: '',
    avatar: DEFAULT_PHOTO,
    role: 'EMPLOYEE',
    department: 'Engineering & Technology',
    manager: 'None',
    position: '',
    schedule: 'Standard 40 Hours',
    status: 'Active'
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      if (base64Data) {
        setFormData((prev) => ({
          ...prev,
          avatar: base64Data,
          profilePhotoUrl: base64Data
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      avatar: DEFAULT_PHOTO,
      profilePhotoUrl: DEFAULT_PHOTO
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const populateForm = (existing) => {
    if (!existing) return;
    setEmployee(existing);
    const resolvedPhoto = existing.profilePhotoUrl || existing.profile_photo_url || existing.avatar || DEFAULT_PHOTO;
    setFormData({
      firstName: existing.firstName || existing.first_name || existing.name?.split(' ')[0] || '',
      lastName: existing.lastName || existing.last_name || existing.name?.split(' ').slice(1).join(' ') || '',
      employeeId: existing.employeeId || existing.employee_code || existing.id || '',
      email: existing.email || '',
      phone: existing.phone || '',
      avatar: resolvedPhoto,
      profilePhotoUrl: resolvedPhoto,
      role: existing.role || existing.user_role || existing.roleName || existing.userRole || 'EMPLOYEE',
      department: existing.department || existing.department_name || 'Engineering & Technology',
      manager: existing.manager || existing.manager_name || 'None',
      position: existing.position || existing.job_position || '',
      schedule: existing.schedule || existing.schedule_name || 'Standard Full-Time (40h/week)',
      status: (existing.status || 'Active').toUpperCase() === 'ACTIVE' ? 'Active' : (existing.status || 'Inactive')
    });
  };

  useEffect(() => {
    const list = getEmployees();
    setAllEmployees(list);

    fetchEmployeesAsync().then((fetchedList) => {
      if (Array.isArray(fetchedList)) setAllEmployees(fetchedList);
    }).catch(console.error);

    if (!isCreate) {
      const existing = getEmployeeById(id);
      if (existing) {
        populateForm(existing);
      }
      fetchEmployeeByIdAsync(id).then((fresh) => {
        if (fresh) populateForm(fresh);
      }).catch(console.error);
    } else {
      // Auto-generate employee ID for create mode
      setFormData((prev) => ({
        ...prev,
        employeeId: `EMP-${String(list.length + 1).padStart(3, '0')}`
      }));
    }
  }, [id, isCreate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isCreate) {
        const created = await createEmployee(formData);
        const newUrl = created?.data?.profilePhotoUrl || created?.profilePhotoUrl || created?.avatar;
        if (newUrl) {
          setFormData((prev) => ({ ...prev, avatar: newUrl, profilePhotoUrl: newUrl }));
        }
        setToastMessage('Employee created and saved successfully!');
      } else {
        const updated = await updateEmployee(id, formData);
        if (updated) {
          populateForm(updated);
        }
        setToastMessage('Employee details updated successfully!');
      }

      setTimeout(() => {
        setIsEditing(false);
        setSubmitting(false);
        if (!isEmployeeOnly) {
          navigate('/employees');
        }
      }, 900);
    } catch (err) {
      alert('Error saving employee: ' + err.message);
      setSubmitting(false);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteEmployee = () => {
    const targetId = employee?.id || id;
    if (String(targetId) === '1' || formData.employeeId === 'EMP-001') {
      alert('Safety lock: Primary System Administrator profile cannot be deleted.');
      return;
    }
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const empName = `${formData.firstName} ${formData.lastName}`.trim() || formData.employeeId || 'this employee';
    const targetId = employee?.id || id;

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteEmployee(targetId);
      setToastMessage(`Employee "${empName}" deleted successfully. Official termination notice dispatched.`);
      setShowDeleteModal(false);
      setTimeout(() => {
        navigate('/employees');
      }, 700);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete employee');
      setDeleting(false);
    }
  };

  const departments = [
    'Engineering & Technology',
    'Engineering',
    'Human Resources',
    'Finance & Payroll Operations',
    'Finance',
    'Marketing & Growth',
    'Sales',
    'Design & UX',
    'Design',
    'Operations'
  ];
  const schedules = [
    'Standard Full-Time (40h/week)',
    'Standard 40 Hours',
    'Operations Shift (48h/week)',
    'Flexible Schedule',
    'Part Time',
    'Night Shift (40h/week)',
    'Night Shift'
  ];

  const isMasterAdmin = String(id) === '1' || formData.employeeId === 'EMP-001' || String(employee?.id) === '1';

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
              disabled={submitting || deleting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${submitting ? 'animate-spin' : ''}`} />
              {submitting ? 'Uploading & Saving...' : isCreate ? 'Save Employee' : 'Update Employee'}
            </button>
          )}

          {!isCreate && isHRorAdmin && !isMasterAdmin && (
            <button
              type="button"
              onClick={handleDeleteEmployee}
              disabled={deleting || submitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
              title="Delete Employee"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? 'Deleting...' : 'Delete Employee'}
            </button>
          )}

          {isEditing && !isCreate ? (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Cancel
            </button>
          ) : !isEmployeeOnly ? (
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : null}
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
            {/* Avatar block with file upload */}
            <div className="flex flex-col items-center gap-2.5 shrink-0">
              <div
                className={`relative group rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm ${
                  isEditing ? 'cursor-pointer hover:border-blue-500 transition-all' : ''
                }`}
                onClick={() => {
                  if (isEditing && fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                title={isEditing ? 'Click to upload photo' : ''}
              >
                <img
                  src={formData.avatar}
                  alt={formData.firstName || 'Employee'}
                  className="w-24 h-24 rounded-2xl object-cover bg-slate-100"
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1 backdrop-blur-2xs">
                    <Upload className="w-5 h-5" />
                    <span>Upload</span>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {isEditing && (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-2xs transition-colors"
                    >
                      <Upload className="w-3 h-3 text-blue-600" /> Upload File
                    </button>
                    {formData.avatar !== DEFAULT_PHOTO && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove custom photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
                </div>
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

            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <Shield className="w-4 h-4 text-blue-600" />
                  System Access & Role Panel <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] text-blue-600 font-medium">Controls which dashboard panel this person can access</span>
              </label>
              <select
                disabled={!isEditing || isEmployeeOnly}
                value={formData.role || 'EMPLOYEE'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2.5 border border-blue-200 bg-blue-50/30 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600"
              >
                {allowedRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  allowedRoles.find((r) => r.value === (formData.role || 'EMPLOYEE'))?.badge || 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  Panel: {allowedRoles.find((r) => r.value === (formData.role || 'EMPLOYEE'))?.panel || 'Standard Portal'}
                </span>
                <p className="text-[11px] text-slate-500">
                  {allowedRoles.find((r) => r.value === (formData.role || 'EMPLOYEE'))?.desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start gap-3.5 mb-4">
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Employee Deletion
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will permanently remove the record and trigger employee termination.
                </p>
              </div>
            </div>

            {/* Target Employee Preview Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 mb-4">
              <img
                src={formData.avatar || DEFAULT_PHOTO}
                alt={formData.firstName}
                className="w-11 h-11 rounded-xl object-cover border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 truncate">
                  {formData.firstName} {formData.lastName}
                </h4>
                <p className="text-xs text-slate-500 truncate">
                  {formData.employeeId || `EMP-${id}`} • {formData.position || 'Employee'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {formData.department || 'General'}
                </p>
              </div>
            </div>

            {/* Warning details */}
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1 mb-4">
              <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                Automated System Actions:
              </p>
              <ul className="list-disc list-inside text-[11px] text-amber-700 space-y-0.5 pl-1">
                <li>Permanently removes employee record & contracts</li>
                <li>Revokes linked user account & system access</li>
                <li>Dispatches official termination notice to employee email</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
                {deleteError}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError('');
                }}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Deleting...' : 'Confirm & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
