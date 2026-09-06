import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Edit3,
  Check,
  AlertCircle,
  User,
  Briefcase,
  Camera,
  Upload,
  Trash2,
  Shield,
  Sparkles,
  CheckCircle2,
  Landmark,
  CreditCard,
  Eye,
  EyeOff,
  CheckCircle,
  Copy,
  Building2
} from 'lucide-react';
import { getEmployeeById, createEmployee, updateEmployee, deleteEmployee, getEmployees, fetchEmployeesAsync, fetchEmployeeByIdAsync } from '../../data/employees';
import { employeeService } from '../../services/employeeService';
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
    desc: 'Full HR Operations: Employee master directory, attendance oversight, time off approvals, and contracts.'
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
    label: 'HR Payroll User (Payrun Processing & HR Panel)',
    panel: 'HR & Payroll Processing Panel',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'All HR Manager permissions plus create, read, and update access to Payruns & Payslips; read-only access to Salary Structures and Salary Rules.'
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
  const [searchParams] = useSearchParams();
  const initialRoleParam = searchParams.get('role');
  const isHrParam = initialRoleParam === 'HR_MANAGER' || initialRoleParam === 'hr_manager' || initialRoleParam === 'hr';

  const { currentUser, isEmployeeOnly, isHRorAdmin, role, updateCurrentUser, refreshCurrentUser } = useAuth();
  const isCreate = !id || id === 'new';
  const isAdmin = role === 'Admin' || currentUser?.role === 'ADMIN' || currentUser?.role === 'Admin';

  const [isEditing, setIsEditing] = useState(isCreate);
  const [employee, setEmployee] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [copiedBankField, setCopiedBankField] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeId: '',
    email: '',
    phone: '',
    avatar: DEFAULT_PHOTO,
    role: isHrParam ? 'HR_MANAGER' : 'EMPLOYEE',
    department: isHrParam ? 'Human Resources' : 'Engineering & Technology',
    manager: 'None',
    position: isHrParam ? 'Head of Human Resources' : '',
    schedule: 'Standard Full-Time (40h/week)',
    status: 'Active',
    // Banking Details
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    branchName: '',
    accountType: 'SALARY'
  });

  const isSelf =
    Boolean(currentUser) &&
    (
      String(currentUser.internalEmployeeId) === String(id) ||
      String(currentUser.internalEmployeeId) === String(employee?.id) ||
      String(currentUser.internalEmployeeId) === String(employee?.internalId) ||
      currentUser.employeeId === id ||
      currentUser.employeeId === employee?.employeeId ||
      (employee?.email && currentUser.email?.toLowerCase() === employee.email?.toLowerCase()) ||
      (formData.email && currentUser.email?.toLowerCase() === formData.email?.toLowerCase())
    );

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
    reader.onload = async (event) => {
      const base64Data = event.target?.result;
      if (base64Data) {
        setFormData((prev) => ({
          ...prev,
          avatar: base64Data,
          profilePhotoUrl: base64Data
        }));

        // Immediately update preview in Header and Sidebar if this is the user's own profile
        if (isSelf && updateCurrentUser) {
          updateCurrentUser({ avatar: base64Data, profilePhotoUrl: base64Data });
        }

        // If editing existing employee, upload directly to backend
        const targetId = employee?.id || id;
        if (!isCreate && targetId && targetId !== 'new') {
          try {
            const uploadRes = await employeeService.uploadEmployeePhoto(targetId, file);
            const uploadedUrl = uploadRes?.data?.profilePhotoUrl || uploadRes?.profilePhotoUrl || uploadRes?.avatar;
            if (uploadedUrl) {
              setFormData((prev) => ({
                ...prev,
                avatar: uploadedUrl,
                profilePhotoUrl: uploadedUrl
              }));
              if (isSelf && updateCurrentUser) {
                updateCurrentUser({ avatar: uploadedUrl, profilePhotoUrl: uploadedUrl });
              }
            }
          } catch (uploadErr) {
            console.warn('[EmployeeDetail] Direct photo upload fallback to form submit:', uploadErr.message);
          }
        }
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
    if (isSelf && updateCurrentUser) {
      updateCurrentUser({ avatar: DEFAULT_PHOTO, profilePhotoUrl: DEFAULT_PHOTO });
    }
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedBankField(fieldName);
    setTimeout(() => setCopiedBankField(''), 2000);
  };

  const populateForm = (existing) => {
    if (!existing) return;
    setEmployee(existing);
    const resolvedPhoto = existing.profilePhotoUrl || existing.profile_photo_url || existing.avatar || DEFAULT_PHOTO;
    const b = existing.bankDetails || existing.bank_details || {};
    const empFullName = existing.name || `${existing.firstName || existing.first_name || ''} ${existing.lastName || existing.last_name || ''}`.trim();

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
      status: (existing.status || 'Active').toUpperCase() === 'ACTIVE' ? 'Active' : (existing.status || 'Inactive'),
      // Banking Details
      bankName: b.bankName || b.bank_name || '',
      accountHolderName: b.accountHolderName || b.account_holder_name || empFullName || '',
      accountNumber: b.accountNumber || b.account_number || b.accountNumberMasked || '',
      confirmAccountNumber: b.accountNumber || b.account_number || b.accountNumberMasked || '',
      ifscCode: b.ifscCode || b.ifsc_code || '',
      branchName: b.branchName || b.branch_name || '',
      accountType: b.accountType || b.account_type || 'SALARY'
    });

    // If viewing own profile and DB photo is set, ensure currentUser avatar is synchronized
    const isTargetUser =
      Boolean(currentUser) &&
      (
        String(currentUser.internalEmployeeId) === String(existing.id) ||
        String(currentUser.internalEmployeeId) === String(existing.internalId) ||
        currentUser.employeeId === existing.employeeId ||
        currentUser.employeeId === existing.employee_code ||
        (existing.email && currentUser.email?.toLowerCase() === existing.email?.toLowerCase())
      );

    if (isTargetUser && resolvedPhoto && resolvedPhoto !== DEFAULT_PHOTO && updateCurrentUser) {
      if (currentUser.avatar !== resolvedPhoto) {
        updateCurrentUser({ avatar: resolvedPhoto, profilePhotoUrl: resolvedPhoto });
      }
    }
  };

  useEffect(() => {
    const list = getEmployees();
    setAllEmployees(list);

    employeeService.getDepartments().then((depts) => {
      if (Array.isArray(depts) && depts.length > 0) {
        setDepartmentsList(depts.map((d) => d.name || d));
      }
    }).catch(console.error);

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

    // Banking Details Validation
    const hasAnyBankField = Boolean(
      formData.bankName?.trim() ||
      formData.accountNumber?.trim() ||
      formData.ifscCode?.trim() ||
      formData.branchName?.trim()
    );

    if (hasAnyBankField) {
      if (!formData.bankName?.trim()) {
        errs.bankName = 'Bank name is required';
      }
      if (!formData.accountNumber?.trim()) {
        errs.accountNumber = 'Account number is required';
      } else if (
        isCreate &&
        formData.confirmAccountNumber &&
        formData.accountNumber.trim() !== formData.confirmAccountNumber.trim()
      ) {
        errs.confirmAccountNumber = 'Account numbers do not match';
      }
      if (!formData.ifscCode?.trim()) {
        errs.ifscCode = 'IFSC code is required for direct salary credits';
      } else if (formData.ifscCode.trim().length < 5) {
        errs.ifscCode = 'Please enter a valid IFSC code (e.g. HDFC0001234)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const bankPayload = (formData.bankName?.trim() || formData.accountNumber?.trim() || formData.ifscCode?.trim()) ? {
        bankName: formData.bankName.trim(),
        accountHolderName: formData.accountHolderName?.trim() || `${formData.firstName} ${formData.lastName}`.trim(),
        accountNumber: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim().toUpperCase(),
        branchName: formData.branchName ? formData.branchName.trim() : '',
        accountType: formData.accountType || 'SALARY'
      } : null;

      const submitPayload = {
        ...formData,
        bankDetails: bankPayload
      };

      if (isCreate) {
        const created = await createEmployee(submitPayload);
        const newUrl = created?.data?.profilePhotoUrl || created?.profilePhotoUrl || created?.avatar;
        if (newUrl) {
          setFormData((prev) => ({ ...prev, avatar: newUrl, profilePhotoUrl: newUrl }));
        }
        setToastMessage('Employee onboarded with banking details successfully!');
      } else {
        const updated = await updateEmployee(id, submitPayload);
        if (updated) {
          populateForm(updated);
          if (isSelf) {
            const finalAvatar = updated.profilePhotoUrl || updated.avatar || formData.profilePhotoUrl || formData.avatar;
            if (updateCurrentUser) {
              updateCurrentUser({
                avatar: finalAvatar,
                profilePhotoUrl: finalAvatar,
                name: updated.name || `${formData.firstName} ${formData.lastName}`.trim(),
                email: updated.email || formData.email
              });
            }
            if (refreshCurrentUser) {
              refreshCurrentUser();
            }
          }
        }
        setToastMessage('Employee profile & bank details updated successfully!');
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

  const departments = departmentsList.length > 0 ? departmentsList : [
    'Engineering & Technology',
    'Human Resources',
    'Finance & Payroll Operations',
    'Marketing & Growth'
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
                className={`relative group rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm ${isEditing ? 'cursor-pointer hover:border-blue-500 transition-all' : ''
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
                  className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600 ${errors.firstName ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
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
                  className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600 ${errors.lastName ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
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
                  className={`w-full px-3 py-2 border rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600 ${errors.employeeId ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
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
                  className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600 ${errors.email ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
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
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => {
                    const isHr = val === 'Human Resources';
                    return {
                      ...prev,
                      department: val,
                      role: isHr && prev.role === 'EMPLOYEE' ? 'HR_MANAGER' : prev.role,
                      position: isHr && (!prev.position || prev.position === 'Employee') ? 'HR Operations Specialist' : prev.position
                    };
                  });
                }}
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
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => {
                    const isHrTitle = /hr|human resources|people|talent|recruiter/i.test(val);
                    return {
                      ...prev,
                      position: val,
                      role: isHrTitle && prev.role === 'EMPLOYEE' ? 'HR_MANAGER' : prev.role
                    };
                  });
                }}
                placeholder="e.g. Head of Human Resources"
                className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-600 ${errors.position ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
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

        {/* Section 3: Banking & Salary Disbursal Information */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Banking &amp; Salary Disbursal Information</h3>
            </div>
            <div>
              {formData.accountNumber && formData.bankName ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Disbursal Ready: Active Account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Disbursal Pending: Bank Details Missing
                </span>
              )}
            </div>
          </div>

          {/* Edit Mode: Clean Form Inputs with Auto-Uppercase, Mask Toggle & Datalist */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-xs text-emerald-800 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-semibold text-emerald-900">Direct Deposit &amp; Payroll Compliance</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Please provide accurate employee banking credentials. Direct salary credits during monthly payruns will be transferred to this primary designated account via NEFT / RTGS / IMPS electronic clearing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Bank Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bank Name {isCreate ? <span className="text-slate-400 font-normal">(e.g. HDFC, SBI)</span> : null}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="popular-banks-list"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="e.g. HDFC Bank"
                      className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        errors.bankName ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    <datalist id="popular-banks-list">
                      <option value="HDFC Bank" />
                      <option value="State Bank of India" />
                      <option value="ICICI Bank" />
                      <option value="Axis Bank" />
                      <option value="Kotak Mahindra Bank" />
                      <option value="Punjab National Bank" />
                      <option value="Bank of Baroda" />
                      <option value="Canara Bank" />
                      <option value="Union Bank of India" />
                      <option value="IndusInd Bank" />
                      <option value="Federal Bank" />
                      <option value="Yes Bank" />
                      <option value="Citibank" />
                      <option value="Standard Chartered" />
                      <option value="HSBC Bank" />
                    </datalist>
                  </div>
                  {errors.bankName && (
                    <p className="mt-1 text-[11px] text-rose-600">{errors.bankName}</p>
                  )}
                </div>

                {/* Account Holder Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Account Holder Name</label>
                    {(!formData.accountHolderName || formData.accountHolderName !== `${formData.firstName} ${formData.lastName}`.trim()) && (formData.firstName || formData.lastName) && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, accountHolderName: `${formData.firstName} ${formData.lastName}`.trim() })}
                        className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                      >
                        Use Employee Name
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.accountHolderName}
                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                    placeholder={formData.firstName ? `${formData.firstName} ${formData.lastName}`.trim() : 'e.g. Marcus Vance'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Bank Account Number {errors.accountNumber && <span className="text-rose-500">*</span>}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAccountNumber(!showAccountNumber)}
                      className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                    >
                      {showAccountNumber ? (
                        <>
                          <EyeOff className="w-3 h-3" /> Hide Digits
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> Show Digits
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showAccountNumber ? 'text' : 'password'}
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="e.g. 50100456789012"
                      className={`w-full px-3 py-2 border rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        errors.accountNumber ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {errors.accountNumber && (
                    <p className="mt-1 text-[11px] text-rose-600">{errors.accountNumber}</p>
                  )}
                </div>

                {/* Confirm Account Number (shown during create or when updating number) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Confirm Account Number
                  </label>
                  <input
                    type={showAccountNumber ? 'text' : 'password'}
                    value={formData.confirmAccountNumber}
                    onChange={(e) => setFormData({ ...formData, confirmAccountNumber: e.target.value })}
                    placeholder="Re-enter bank account number"
                    className={`w-full px-3 py-2 border rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.confirmAccountNumber || (formData.confirmAccountNumber && formData.accountNumber && formData.confirmAccountNumber !== formData.accountNumber)
                        ? 'border-rose-400'
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {formData.confirmAccountNumber && formData.accountNumber && formData.confirmAccountNumber !== formData.accountNumber && (
                    <p className="mt-1 text-[11px] text-rose-600">Account numbers do not match</p>
                  )}
                  {errors.confirmAccountNumber && !formData.confirmAccountNumber && (
                    <p className="mt-1 text-[11px] text-rose-600">{errors.confirmAccountNumber}</p>
                  )}
                </div>

                {/* IFSC Code */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    IFSC Code <span className="text-slate-400 font-normal">(11 Alphanumeric Characters)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                    placeholder="e.g. HDFC0001234"
                    className={`w-full px-3 py-2 border rounded-lg font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.ifscCode ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {errors.ifscCode && (
                    <p className="mt-1 text-[11px] text-rose-600">{errors.ifscCode}</p>
                  )}
                </div>

                {/* Branch Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    placeholder="e.g. Gandhinagar Main Branch"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Account Type */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Account Type</label>
                  <select
                    value={formData.accountType || 'SALARY'}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="SALARY">Salary Account (Primary Corporate Direct Deposit)</option>
                    <option value="SAVINGS">Savings Account</option>
                    <option value="CURRENT">Current Account</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* View Mode: Interactive Disbursal Preview */
            <div>
              {formData.accountNumber || formData.bankName ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  {/* Virtual Bank Card Preview */}
                  <div className="lg:col-span-5">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 p-5 text-white shadow-md border border-slate-700/60">
                      {/* Ambient background blur accent */}
                      <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />

                      <div className="relative z-10 flex flex-col justify-between h-44">
                        {/* Top card row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                              <Landmark className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="font-bold text-sm tracking-wide text-white">
                              {formData.bankName || 'Direct Deposit Account'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                            {formData.accountType || 'SALARY'}
                          </span>
                        </div>

                        {/* Middle: Card / Account number */}
                        <div className="my-auto">
                          <div className="flex items-center justify-between">
                            <div className="font-mono text-base tracking-widest text-slate-100 font-semibold select-all">
                              {showAccountNumber && formData.accountNumber
                                ? formData.accountNumber.replace(/(.{4})/g, '$1 ').trim()
                                : (formData.accountNumber ? `•••• •••• •••• ${formData.accountNumber.slice(-4)}` : '•••• •••• •••• ••••')}
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAccountNumber(!showAccountNumber)}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
                              title={showAccountNumber ? 'Mask Account Number' : 'Reveal Account Number'}
                            >
                              {showAccountNumber ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-2">
                            <span>IFSC: <strong className="text-slate-200">{formData.ifscCode || 'NOT_SET'}</strong></span>
                            {formData.branchName && (
                              <span>• {formData.branchName}</span>
                            )}
                          </div>
                        </div>

                        {/* Bottom card row */}
                        <div className="flex items-end justify-between border-t border-white/10 pt-2.5">
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400">Account Holder</span>
                            <span className="font-semibold text-xs text-white tracking-wide truncate max-w-[190px] block">
                              {formData.accountHolderName || `${formData.firstName} ${formData.lastName}`.trim() || 'Employee'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[9px] uppercase tracking-wider text-emerald-400 font-semibold">Primary Disbursal</span>
                            <span className="text-[10px] text-slate-300">Automated Payruns</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details Data Grid */}
                  <div className="lg:col-span-7 grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-slate-400 text-[11px] block mb-0.5">Bank Institution</span>
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        {formData.bankName || '—'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-slate-400 text-[11px] block mb-0.5">Account Number</span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-slate-900">
                          {showAccountNumber && formData.accountNumber
                            ? formData.accountNumber
                            : (formData.accountNumber ? `••••${formData.accountNumber.slice(-4)}` : '—')}
                        </span>
                        {formData.accountNumber && (
                          <button
                            type="button"
                            onClick={() => handleCopy(formData.accountNumber, 'account')}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors cursor-pointer"
                            title="Copy Account Number"
                          >
                            {copiedBankField === 'account' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-slate-400 text-[11px] block mb-0.5">IFSC / Electronic Code</span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">
                          {formData.ifscCode || '—'}
                        </span>
                        {formData.ifscCode && (
                          <button
                            type="button"
                            onClick={() => handleCopy(formData.ifscCode, 'ifsc')}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors cursor-pointer"
                            title="Copy IFSC Code"
                          >
                            {copiedBankField === 'ifsc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-slate-400 text-[11px] block mb-0.5">Bank Branch</span>
                      <span className="font-semibold text-slate-900 truncate block">
                        {formData.branchName || 'Primary Corporate Branch'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-slate-400 text-[11px] block mb-0.5">Disbursal Type</span>
                      <span className="font-semibold text-emerald-700 capitalize">
                        {(formData.accountType || 'SALARY').toLowerCase()} Account
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-emerald-800 font-semibold text-[11px] block">Payrun Status</span>
                        <span className="text-[10px] text-emerald-600">Active Direct Deposit</span>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-amber-950">No Banking Details Registered</h4>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Add the employee's bank account number and IFSC code to activate automated salary disbursement during payruns.
                      </p>
                    </div>
                  </div>
                  {!isEmployeeOnly && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-200/80 hover:bg-amber-300/80 border border-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Add Bank Details
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 4: System Access & Role Assignment */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-2xs p-6 bg-linear-to-b from-white to-blue-50/20">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-5 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">System Access &amp; Role Panel (Portal Level)</h3>
            </div>
            {isAdmin && isEditing && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'HR_MANAGER', department: 'Human Resources' })}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                    formData.role === 'HR_MANAGER'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Sparkles className="w-3 h-3" /> Set HR Manager Panel
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'EMPLOYEE' })}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                    formData.role === 'EMPLOYEE'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Employee Portal
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Select which portal panel and functional authority this person accesses upon logging in:
            </p>

            {/* Interactive Role Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allowedRoles.map((r) => {
                const isSelected = (formData.role || 'EMPLOYEE') === r.value;
                return (
                  <div
                    key={r.value}
                    onClick={() => {
                      if (isEditing && !isEmployeeOnly) {
                        setFormData({ ...formData, role: r.value });
                      }
                    }}
                    className={`p-3.5 rounded-xl border-2 transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? r.value === 'HR_MANAGER'
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20'
                          : r.value === 'ADMIN'
                          ? 'border-purple-500 bg-purple-50/50 shadow-xs ring-2 ring-purple-500/20'
                          : 'border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                        : isEditing && !isEmployeeOnly
                        ? 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60 cursor-pointer'
                        : 'border-slate-200 bg-slate-50/50 opacity-70 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          {r.value === 'HR_MANAGER' ? <Shield className="w-3.5 h-3.5 text-emerald-600" /> : null}
                          {r.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${
                            r.value === 'HR_MANAGER' ? 'text-emerald-600' : r.value === 'ADMIN' ? 'text-purple-600' : 'text-blue-600'
                          }`} />
                        )}
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border mb-2 ${r.badge}`}>
                        Panel: {r.panel}
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {r.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Status Display */}
            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              formData.role === 'HR_MANAGER'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : formData.role === 'ADMIN'
                ? 'bg-purple-50 border-purple-200 text-purple-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Shield className="w-4 h-4 shrink-0" />
              <span>
                <strong>Assigned Role:</strong>{' '}
                {allowedRoles.find((r) => r.value === (formData.role || 'EMPLOYEE'))?.label} — grants access to{' '}
                <strong>{allowedRoles.find((r) => r.value === (formData.role || 'EMPLOYEE'))?.panel}</strong>.
              </span>
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
