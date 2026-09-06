import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import authService from '../../services/authService';

export const ResetPassword = ({ isActivation = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Password complexity checks matching backend requirements
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isComplexityValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!tokenParam) {
      setError('Password reset token is missing or invalid. Please request a new password reset link.');
      return;
    }

    if (!email.trim()) {
      setError('Account email address is required.');
      return;
    }

    if (!isComplexityValid) {
      setError('Please ensure your password satisfies all security requirements below.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    try {
      if (isActivation) {
        const res = await authService.activateAccount(tokenParam, email.trim(), newPassword);
        setSuccessMessage(res.message || 'Your account has been activated successfully! You can now log in.');
      } else {
        const res = await authService.resetPassword(tokenParam, email.trim(), newPassword);
        setSuccessMessage(res.message || 'Your password has been reset successfully! You can now log in.');
      }
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to reset password. The reset link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const title = isActivation ? 'Activate Your Account' : 'Reset Your Password';
  const subtitle = isActivation
    ? 'Set a secure personal password to activate your PeoplePay360 account'
    : 'Create a new secure password for your PeoplePay360 account';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10">
      <div className="w-full max-w-md">
        {/* Back to Sign In Link */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Sign In</span>
          </Link>
          <span className="text-[11px] font-mono text-slate-400">PeoplePay360 Security</span>
        </div>

        {/* Top Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-xl shadow-xs mb-3">
            P
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            People<span className="text-blue-600">Pay</span>360
          </h1>
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mt-1">
            HR &amp; Payroll Management
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>

          {/* Missing Token Warning */}
          {!tokenParam && (
            <div className="mb-5 p-3.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Invalid or Expired Link</span>
              </div>
              <p className="text-[11px] text-amber-700">
                This password reset link is missing a valid security token. Please return to the login screen and request a new password reset link.
              </p>
              <div className="mt-3">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline"
                >
                  Return to Sign In &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Success State */}
          {successMessage && (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-1">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Success!</h3>
                <p className="text-xs text-slate-600 mt-1.5">{successMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                Proceed to Sign In
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Password Reset Form */}
          {!successMessage && tokenParam && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Email (Pre-filled / Readonly) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    readOnly={Boolean(emailParam)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                      emailParam ? 'bg-slate-50 cursor-not-allowed text-slate-600' : ''
                    }`}
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Password Requirements:</span>
                </p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    8+ characters
                  </span>
                  <span className={`flex items-center gap-1 ${hasUpperCase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasUpperCase ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    1 uppercase (A-Z)
                  </span>
                  <span className={`flex items-center gap-1 ${hasLowerCase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasLowerCase ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    1 lowercase (a-z)
                  </span>
                  <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    1 number (0-9)
                  </span>
                </div>
                {confirmPassword && (
                  <p className={`text-[11px] font-medium pt-1 ${passwordsMatch ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isComplexityValid || !passwordsMatch}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating Password...' : isActivation ? 'Activate Account' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Bottom Footer Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500">
              Remember your credentials?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
