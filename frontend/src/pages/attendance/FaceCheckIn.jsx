// pages/attendance/FaceCheckIn.jsx
import React, { useState, useEffect, useRef } from 'react';
import { CameraPreview } from '../../components/faceRecognition/CameraPreview';
import { FaceDetectionFrame } from '../../components/faceRecognition/FaceDetectionFrame';
import { FaceVerificationStatus } from '../../components/faceRecognition/FaceVerificationStatus';
import {
  verifyFace,
  logFaceAttendanceEvent,
  FACE_ATTENDANCE_PRIVACY_NOTICE
} from '../../services/faceRecognitionService';
import attendanceService from '../../services/attendanceService';
import employeeService from '../../services/employeeService';
import { getEmployees } from '../../data/employees';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Sparkles, Clock, Calendar as CalendarIcon, CheckCircle2, User, RefreshCw } from 'lucide-react';

export const FaceCheckIn = () => {
  const { currentUser } = useAuth();
  const cameraRef = useRef(null);

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isManagerOrAdmin =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'HR Manager' ||
    currentUser?.role === 'HR Payroll Manager' ||
    currentUser?.roleRaw === 'ADMIN' ||
    currentUser?.roleRaw === 'HR_MANAGER' ||
    currentUser?.roleRaw === 'HR_PAYROLL_ADMIN';

  const selfEmployeeCode =
    currentUser?.employeeId ||
    (currentUser?.internalEmployeeId ? `EMP-${String(currentUser.internalEmployeeId).padStart(3, '0')}` : '');

  // Employees list for Kiosk selection: locked to currentUser for regular employees
  const [employees, setEmployees] = useState(() => {
    if (!isManagerOrAdmin && currentUser) {
      return [{
        id: String(currentUser?.internalEmployeeId || currentUser?.id || '1'),
        employeeId: selfEmployeeCode,
        name: currentUser?.name || currentUser?.employeeName || 'Employee',
        department: currentUser?.department || 'General',
        position: currentUser?.position || 'Staff',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      }];
    }
    return isManagerOrAdmin ? getEmployees() : [];
  });
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState(selfEmployeeCode);

  // Kiosk face detection state machine:
  // 'Camera Ready' | 'Looking for Face' | 'Face Detected' | 'Verifying Identity' | 'Identity Verified' | 'Verification Failed'
  const [detectionState, setDetectionState] = useState('Camera Ready');
  const [verifiedData, setVerifiedData] = useState(null);
  const [failureType, setFailureType] = useState(null);
  const [failureMessage, setFailureMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [todayRecordState, setTodayRecordState] = useState(null);
  const [hasCheckedInTodayState, setHasCheckedInTodayState] = useState(false);
  const [verifiedFrame, setVerifiedFrame] = useState(null);

  // Load employees from backend
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
        // Strict Boundary: Regular employee can only see and punch for themselves
        const selfCode = currentUser?.employeeId || `EMP-${String(currentUser?.internalEmployeeId || '001').padStart(3, '0')}`;
        const selfEmp = {
          id: String(currentUser?.internalEmployeeId || currentUser?.id),
          employeeId: selfCode,
          name: currentUser?.name || currentUser?.employeeName || 'Employee',
          department: currentUser?.department || 'General',
          position: currentUser?.position || 'Staff',
          avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
        };
        if (mounted) {
          setEmployees([selfEmp]);
          setSelectedEmployeeCode(selfCode);
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

          // Default to current user's employee code or first employee
          const currentCode = currentUser?.employeeId;
          const match = mapped.find(e => e.employeeId === currentCode || e.id === currentUser?.id);
          if (match) {
            setSelectedEmployeeCode(match.employeeId);
          } else {
            setSelectedEmployeeCode(mapped[0].employeeId);
          }
        }
      } catch (err) {
        console.warn('Could not load employees from API, using fallback:', err.message);
      }
    };
    loadEmps();
    return () => { mounted = false; };
  }, [currentUser]);

  // Fallback initial selection if employees already populated
  useEffect(() => {
    if (!selectedEmployeeCode && employees.length > 0) {
      const currentCode = currentUser?.employeeId;
      const match = employees.find(e => e.employeeId === currentCode || e.id === currentUser?.id);
      setSelectedEmployeeCode(match ? match.employeeId : employees[0].employeeId);
    }
  }, [employees, currentUser, selectedEmployeeCode]);

  // Trigger automated face detection and 1:1 verification
  const handleStartScan = async (empCodeToScan) => {
    const isPrivileged =
      currentUser?.role === 'Admin' ||
      currentUser?.role === 'HR Manager' ||
      currentUser?.role === 'HR Payroll Manager' ||
      currentUser?.roleRaw === 'ADMIN' ||
      currentUser?.roleRaw === 'HR_MANAGER' ||
      currentUser?.roleRaw === 'HR_PAYROLL_ADMIN';

    const selfCode = currentUser?.employeeId || employees[0]?.employeeId || 'EMP-001';
    const targetCode = isPrivileged
      ? (empCodeToScan || selectedEmployeeCode || selfCode)
      : selfCode;
    
    setFailureType(null);
    setFailureMessage('');
    setVerifiedData(null);
    setSuccessToast(null);

    setDetectionState('Looking for Face');
    await new Promise((r) => setTimeout(r, 600));

    setDetectionState('Face Detected');
    await new Promise((r) => setTimeout(r, 500));

    setDetectionState('Verifying Identity');
    try {
      // Capture live frame from camera preview
      const captureResult = cameraRef.current?.captureFrame();
      const frame = typeof captureResult === 'object' && captureResult?.dataUrl ? captureResult.dataUrl : (typeof captureResult === 'string' ? captureResult : null);

      if (captureResult?.isBlack) {
        setFailureType('No Face Detected');
        setFailureMessage('Camera frame is completely black or obscured. Please ensure your camera is uncovered and face is clearly visible.');
        setDetectionState('Verification Failed');
        return;
      }

      if (!frame || typeof frame !== 'string' || !frame.startsWith('data:image')) {
        setFailureType('Camera Frame Unavailable');
        setFailureMessage('Cannot read frame from camera. Please allow camera permissions and ensure video feed is active.');
        setDetectionState('Verification Failed');
        return;
      }

      const result = await verifyFace(targetCode, frame);
      if (result.success) {
        setVerifiedFrame(frame);
        setVerifiedData(result);
        setTodayRecordState(result.todayRecord);
        setHasCheckedInTodayState(result.hasCheckedInToday);
        setDetectionState('Identity Verified');
      } else {
        setFailureType(result.errorType || 'Verification Failed');
        setFailureMessage(result.message || 'Identity could not be verified.');
        setDetectionState('Verification Failed');
      }
    } catch (err) {
      setFailureType('Verification Failed');
      setFailureMessage(err.message || 'Identity verification error.');
      setDetectionState('Verification Failed');
    }
  };

  // Start initial scan on mount
  useEffect(() => {
    if (selectedEmployeeCode) {
      const initTimer = setTimeout(() => {
        handleStartScan(selectedEmployeeCode);
      }, 800);
      return () => clearTimeout(initTimer);
    }
  }, [selectedEmployeeCode]);

  // Handle Check In
  const handleCheckIn = async () => {
    if (!verifiedData) return;
    setIsProcessing(true);

    const formattedDisplayTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    try {
      const captureResult = cameraRef.current?.captureFrame();
      const frame = (typeof captureResult === 'object' && captureResult?.dataUrl)
        ? captureResult.dataUrl
        : (typeof captureResult === 'string' && captureResult.startsWith('data:image')
          ? captureResult
          : (verifiedFrame || 'live_camera_punch_frame'));

      const targetEmp = verifiedData.employeeId || selectedEmployeeCode;

      // 1. Call real backend check-in endpoint
      await attendanceService.faceCheckIn(frame, targetEmp);

      // 2. Add to face history log
      await logFaceAttendanceEvent(verifiedData, 'Check In');

      setHasCheckedInTodayState(true);
      setSuccessToast({
        title: `✓ Check-in Successful for ${verifiedData.employeeName}`,
        time: formattedDisplayTime,
        type: 'Check In'
      });
      setDetectionState('Camera Ready');
    } catch (err) {
      setFailureType('Check-in Error');
      setFailureMessage(err.message || 'Error recording check in. Please try again.');
      setDetectionState('Verification Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Check Out
  const handleCheckOut = async () => {
    if (!verifiedData) return;
    setIsProcessing(true);

    const formattedDisplayTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    try {
      const captureResult = cameraRef.current?.captureFrame();
      const frame = (typeof captureResult === 'object' && captureResult?.dataUrl)
        ? captureResult.dataUrl
        : (typeof captureResult === 'string' && captureResult.startsWith('data:image')
          ? captureResult
          : (verifiedFrame || 'live_camera_punch_frame'));

      const targetEmp = verifiedData.employeeId || selectedEmployeeCode;

      // 1. Call real backend check-out endpoint
      const punchRes = await attendanceService.faceCheckOut(frame, targetEmp);
      const workedStr = punchRes?.data?.workedHours || punchRes?.workedHours || 'Calculated';

      // 2. Add to face history log
      await logFaceAttendanceEvent(verifiedData, 'Check Out');

      setHasCheckedInTodayState(false);
      setSuccessToast({
        title: `✓ Check-out Successful for ${verifiedData.employeeName}`,
        time: formattedDisplayTime,
        workedHours: workedStr,
        type: 'Check Out'
      });
      setDetectionState('Camera Ready');
    } catch (err) {
      setFailureType('Check-out Error');
      setFailureMessage(err.message || 'Error recording check out. Please try again.');
      setDetectionState('Verification Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedEmployeeObj = employees.find(e => e.employeeId === selectedEmployeeCode) || employees[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Title and Live Clock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            {isManagerOrAdmin ? 'Face Attendance Kiosk' : 'Face Attendance Verification'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isManagerOrAdmin
              ? 'Instant biometric face verification and kiosk attendance check-in / check-out.'
              : 'Instant biometric face verification and contactless attendance punch for your account.'}
          </p>
        </div>

        {/* Live Date and Time Display */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>
              {currentTime.toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Employee Selector Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={
              selectedEmployeeObj?.avatar ||
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
            }
            alt={selectedEmployeeObj?.name || 'Employee'}
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <label htmlFor="kiosk-employee-select" className="text-xs font-bold text-slate-900 block">
                {selectedEmployeeObj?.name || 'Punching Employee'}
              </label>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                {selectedEmployeeObj?.employeeId || selectedEmployeeCode}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Matching live face against registered employee profile photo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isManagerOrAdmin ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 shadow-2xs">
              <User className="w-4 h-4 text-blue-600" />
              <span>Personal Attendance</span>
            </div>
          ) : (
            <select
              id="kiosk-employee-select"
              value={selectedEmployeeCode}
              onChange={(e) => {
                const newCode = e.target.value;
                setSelectedEmployeeCode(newCode);
                handleStartScan(newCode);
              }}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-56"
            >
              {employees.map((emp) => (
                <option key={emp.employeeId || emp.id} value={emp.employeeId}>
                  {emp.name} ({emp.employeeId}) — {emp.department}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => handleStartScan(selectedEmployeeCode)}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors shrink-0"
            title="Re-scan face"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold">{successToast.title}</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                {successToast.type} Time: <strong>{successToast.time}</strong>
                {successToast.workedHours && (
                  <span> • Total Worked Hours: <strong>{successToast.workedHours}</strong></span>
                )}
              </p>
            </div>
          </div>
          {isManagerOrAdmin ? (
            <button
              type="button"
              onClick={() => handleStartScan(selectedEmployeeCode)}
              className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors"
            >
              Next Employee
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Main Kiosk Area */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <CameraPreview ref={cameraRef} isActive={true}>
          <FaceDetectionFrame state={detectionState} />
        </CameraPreview>

        {/* Verification Result Card or Failure Card */}
        <FaceVerificationStatus
          verifiedData={verifiedData}
          failureType={failureType}
          failureMessage={failureMessage}
          hasCheckedInToday={hasCheckedInTodayState}
          todayRecord={todayRecordState}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onRetry={() => handleStartScan(selectedEmployeeCode)}
          onCancel={() => setDetectionState('Camera Ready')}
          isProcessing={isProcessing}
        />
      </div>

      {/* Privacy Notice Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>{FACE_ATTENDANCE_PRIVACY_NOTICE}</p>
      </div>
    </div>
  );
};

