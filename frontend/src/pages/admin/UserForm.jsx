import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle, Save } from 'lucide-react';
import { getUserById, createUser, updateUser, fetchUserByIdAsync } from '../../data/users';
import { getEmployees, fetchEmployeesAsync } from '../../data/employees';
import { PageHeader } from '../../components/common/PageHeader';

export const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    role: 'Employee',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const empList = getEmployees();
    setEmployees(empList);

    fetchEmployeesAsync().then((list) => {
      if (Array.isArray(list)) setEmployees(list);
    }).catch(console.error);

    if (isEdit) {
      const existing = getUserById(id);
      if (existing) {
        setFormData({
          name: existing.name || '',
          email: existing.email || '',
          employeeId: existing.employeeId || '',
          role: existing.role || 'Employee',
          status: existing.status || 'Active'
        });
      }
      fetchUserByIdAsync(id).then((fresh) => {
        if (fresh) {
          setFormData({
            name: fresh.name || '',
            email: fresh.email || '',
            employeeId: fresh.employeeId || '',
            role: fresh.role || 'Employee',
            status: fresh.status || 'Active'
          });
        }
      }).catch(console.error);
    }
  }, [id, isEdit]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Full Name is required';
    }
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address';
    }
    if (!formData.role) {
      errs.role = 'Role is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const matchedEmployee = employees.find((emp) => String(emp.id) === String(formData.employeeId));
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        employeeId: formData.employeeId,
        employeeName: matchedEmployee ? matchedEmployee.name : '',
        role: formData.role,
        status: formData.status
      };

      if (isEdit) {
        await updateUser(id, payload);
      } else {
        await createUser(payload);
      }

      setToastMessage(isEdit ? 'User updated successfully!' : 'User created successfully!');
      setTimeout(() => {
        navigate('/admin/users');
      }, 1000);
    } catch (err) {
      alert('Error saving user: ' + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title={isEdit ? 'Edit User' : 'Create New User'}
        subtitle={
          isEdit
            ? `Modify account credentials and system role assignment for ID ${id}`
            : 'Register a new user account with role-based system permissions'
        }
      >
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Cancel
        </button>
      </PageHeader>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Two-Column Form Layout on Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Eleanor Vance"
                className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. eleanor@peoplepay360.com"
                className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Employee Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Associated Employee Profile
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- None / Standalone Account --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department} • {emp.position})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">
                Associates this login credential with an employee directory record.
              </p>
            </div>

            {/* Role Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                System Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
              >
                <option value="Employee">Employee</option>
                <option value="HR Manager">HR Manager</option>
                <option value="HR Payroll User">HR Payroll User</option>
                <option value="HR Payroll Manager">HR Payroll Manager</option>
                <option value="Admin">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.role}
                </p>
              )}
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Account Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
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
              {isEdit ? 'Update User' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
