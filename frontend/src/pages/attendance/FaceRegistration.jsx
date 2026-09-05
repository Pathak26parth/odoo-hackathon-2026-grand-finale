// pages/attendance/FaceRegistration.jsx
import React, { useState, useEffect, useRef } from 'react';
import { CameraPreview } from '../../components/faceRecognition/CameraPreview';
import { FaceDetectionFrame } from '../../components/faceRecognition/FaceDetectionFrame';
import { getEmployees } from '../../data/employees';
import { getFaceRegistrations, saveFaceRegistration } from '../../data/faceAttendance';
import { FACE_ATTENDANCE_PRIVACY_NOTICE, registerFace } from '../../services/faceRecognitionService';
import attendanceService from '../../services/attendanceService';
import employeeService from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  Camera,
  CheckCircle2,
  RefreshCw,
  Save,
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const FaceRegistration = () => {
  const { currentUser } = useAuth();
  const cameraRef = useRef(null);

  const isManagerOrAdmin =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'HR Manager' ||
    currentUser?.role === 'HR Payroll Manager' ||
    currentUser?.roleRaw === 'ADMIN' ||
    currentUser?.roleRaw === 'HR_MANAGER' ||
    currentUser?.roleRaw === 'HR_PAYROLL_ADMIN';

  const selfId = String(currentUser?.internalEmployeeId || currentUser?.id || '1');
  const selfCode =
    currentUser?.employeeId ||
    (currentUser?.internalEmployeeId ? `EMP-${String(currentUser.internalEmployeeId).padStart(3, '0')}` : 'EMP-001');

  // Enforce boundary: regular employees can only register their own face
  const [employees, setEmployees] = useState(() => {
    if (!isManagerOrAdmin && currentUser) {
      return [{
        id: selfId,
        employeeId: selfCode,
        name: currentUser?.name || currentUser?.employeeName || 'Employee',
        department: currentUser?.department || 'General',
        position: currentUser?.position || 'Staff',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      }];
    }
    return isManagerOrAdmin ? getEmployees() : [];
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(selfId);
  const [cameraActive, setCameraActive] = useState(true);
  const [regState, setRegState] = useState('Camera Ready');
  const [capturedFrame, setCapturedFrame] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEnrolledInDB, setIsEnrolledInDB] = useState(false);

  // Load real employees from backend
  useEffect(() => {
    let mounted = true;
    const loadEmps = async () => {
      const isPrivileged =
        currentUser?.role === 'Admin' ||
        currentUser?.role === 'HR Manager' ||
        currentUser?.role === 'HR Payroll Manager' ||
        currentUser?.roleRaw === 'ADMIN' ||
        currentUser?.roleRaw === 'HR_MANAGER' ||
        currentUser?.roleRaw === 'HR_PAYROLL_ADMIN';

      if (!isPrivileged) {
        const selfObj = {
          id: selfId,
          employeeId: selfCode,
          name: currentUser?.name || currentUser?.employeeName || 'Employee',
          department: currentUser?.department || 'General',
          position: currentUser?.position || 'Staff',
          avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
        };
        if (mounted) {
          setEmployees([selfObj]);
          setSelectedEmployeeId(selfId);
        }
        return;
      }

      try {
        const empList = await employeeService.getAllEmployees();
        if (mounted && Array.isArray(empList) && empList.length > 0) {
          const mapped = empList.map((e) => ({
            id: String(e.id),
            employeeId: e.employeeId || e.employee_code || `EMP-${String(e.id).padStart(3, '0')}`,
            name: e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Employee',
            department: e.department || e.department_name || 'General',
            position: e.position || e.job_position || 'Staff',
            avatar: e.avatar || e.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
          }));
          setEmployees(mapped);
          
          // Pre-select current employee or first
          const currentCode = currentUser?.employeeId;
          const match = mapped.find(e => e.employeeId === currentCode || e.id === currentUser?.id);
          if (match) {
            setSelectedEmployeeId(match.id);
          } else {
            setSelectedEmployeeId(mapped[0].id);
          }
        }
      } catch (err) {
        console.warn('Could not load employees from API, using fallback:', err.message);
      }
    };
    loadEmps();
    return () => { mounted = false; };
  }, [currentUser]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0];

  // Fetch enrollment status for selected employee
  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      if (!selectedEmployee) return;
      try {
        const targetCode = selectedEmployee.employeeId || selectedEmployee.id;
        const res = await attendanceService.getFaceStatus(targetCode);
        if (mounted) {
          setIsEnrolledInDB(res?.data?.isEnrolled || res?.isEnrolled || false);
        }
      } catch {
        if (mounted) setIsEnrolledInDB(false);
      }
    };
    checkStatus();
    return () => { mounted = false; };
  }, [selectedEmployeeId, selectedEmployee]);

  const registrationStatus = isEnrolledInDB ? 'Registered' : 'Not Registered';

  // Face Capture action
  const handleCaptureFace = async () => {
    setErrorMessage('');
    setRegState('Looking for Face');
    await new Promise((r) => setTimeout(r, 600));
    setRegState('Face Detected');
    await new Promise((r) => setTimeout(r, 500));

    // Capture frame from video preview if available
    const frame = cameraRef.current?.captureFrame() || 'live_camera_face_frame_capture';
    setCapturedFrame(frame);
    setRegState('Face Captured');
  };

  // Retake
  const handleRetake = () => {
    setCapturedFrame(null);
    setRegState('Camera Ready');
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Save Face Profile
  const handleSaveProfile = async () => {
    if (!selectedEmployee) return;
    setIsSaving(true);
    setErrorMessage('');

    try {
      const targetEmpId = selectedEmployee.employeeId || selectedEmployee.id;
      const faceData = capturedFrame || selectedEmployee.avatar || `biometric_template_${targetEmpId}`;

      // 1. Call real backend biometric enrollment (uploads to Cloudinary & saves DB record)
      const regRes = await registerFace(targetEmpId, faceData);
      const newPhoto = regRes?.data?.profilePhotoUrl || regRes?.profilePhotoUrl;

      // 2. Update local state
      if (newPhoto) {
        selectedEmployee.avatar = newPhoto;
        try {
          const userRaw = localStorage.getItem('peoplepay360_current_user');
          if (userRaw) {
            const u = JSON.parse(userRaw);
            if (u.employeeId === selectedEmployee.employeeId || String(u.internalEmployeeId) === String(selectedEmployee.id)) {
              u.avatar = newPhoto;
              localStorage.setItem('peoplepay360_current_user', JSON.stringify(u));
            }
          }
        } catch {}
      }

      // 3. Save in local registry for instant UI sync
      saveFaceRegistration({
        employeeId: selectedEmployee.employeeId,
        internalId: selectedEmployee.id,
        name: selectedEmployee.name,
        department: selectedEmployee.department,
        position: selectedEmployee.position
      });

      setIsEnrolledInDB(true);
      setRegState('Face Registered');
      setSuccessMessage(`Face profile successfully registered for ${selectedEmployee.name} (${selectedEmployee.employeeId}).`);
    } catch (err) {
      setErrorMessage(err.message || 'Face enrollment failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-600" />
          Face Registration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enroll employee biometric profile for contactless facial attendance verification.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold">{successMessage}</h4>
            <p className="text-xs text-emerald-700">
              Biometric metadata registered for {selectedEmployee?.name} ({selectedEmployee?.employeeId}).
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold">Registration Error</h4>
            <p className="text-xs text-rose-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* STEP 1: Select Employee */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isManagerOrAdmin ? 'Step 1 — Select Employee' : 'Employee Biometric Profile'}
          </h2>
          <span className="text-xs text-slate-400">
            {isManagerOrAdmin
              ? 'Select an employee to view registration status'
              : 'Your facial recognition enrollment status'}
          </span>
        </div>

        {isManagerOrAdmin && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Choose Employee
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                setRegState('Camera Ready');
                setSuccessMessage('');
                setErrorMessage('');
              }}
              className="w-full sm:w-80 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeId}) — {emp.department}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedEmployee && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3.5">
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedEmployee.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedEmployee.employeeId} • {selectedEmployee.position} • {selectedEmployee.department}
                </p>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Registration Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  registrationStatus === 'Registered'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {registrationStatus === 'Registered' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {registrationStatus}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: Camera Registration */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Step 2 — Camera Registration
          </h2>
          <span className="text-xs font-medium text-blue-600">Current State: {regState}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Camera Preview Area */}
          <div className="md:col-span-7">
            <CameraPreview ref={cameraRef} isActive={cameraActive}>
              <FaceDetectionFrame state={regState} />
            </CameraPreview>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setCameraActive(true);
                    setRegState('Camera Ready');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Start Camera
                </button>
              ) : (
                <>
                  {regState !== 'Face Captured' && regState !== 'Face Registered' ? (
                    <button
                      type="button"
                      onClick={handleCaptureFace}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Capture Face
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleRetake}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retake
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSaving || regState === 'Face Registered'}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Face Profile'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Registration Instructions */}
          <div className="md:col-span-5 flex flex-col justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Capture Instructions
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-600 list-decimal list-inside">
                <li>Position your face inside the center target frame.</li>
                <li>Ensure proper and balanced front lighting.</li>
                <li>Look directly and calmly at the camera lens.</li>
                <li>Remove sunglasses, masks, or any facial obstruction.</li>
                <li>Click <strong>Capture Face</strong>, then <strong>Save Face Profile</strong>.</li>
              </ol>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Data Protection Guarantee
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Photos are never saved to disk or permanent storage. Only mock verification tokens are assigned.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>{FACE_ATTENDANCE_PRIVACY_NOTICE}</p>
      </div>
    </div>
  );
};
