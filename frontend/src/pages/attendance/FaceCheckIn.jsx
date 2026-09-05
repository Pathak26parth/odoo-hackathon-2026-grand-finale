// pages/attendance/FaceCheckIn.jsx
import React, { useState, useEffect } from 'react';
import { CameraPreview } from '../../components/faceRecognition/CameraPreview';
import { FaceDetectionFrame } from '../../components/faceRecognition/FaceDetectionFrame';
import { FaceVerificationStatus } from '../../components/faceRecognition/FaceVerificationStatus';
import {
  verifyFace,
  logFaceAttendanceEvent,
  FACE_ATTENDANCE_PRIVACY_NOTICE
} from '../../services/faceRecognitionService';
import {
  getAttendanceRecords,
  createAttendance,
  updateAttendance,
  calculateWorkedHours
} from '../../data/attendance';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Sparkles, Clock, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

export const FaceCheckIn = () => {
  const { currentUser } = useAuth();

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Kiosk face detection state machine:
  // 'Camera Ready' | 'Looking for Face' | 'Face Detected' | 'Verifying Identity' | 'Identity Verified' | 'Verification Failed'
  const [detectionState, setDetectionState] = useState('Camera Ready');
  const [verifiedData, setVerifiedData] = useState(null);
  const [failureType, setFailureType] = useState(null);
  const [failureMessage, setFailureMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  // Determine current active employee to check in
  // Default to Amelia Johnson (EMP-001) or current user if employee
  const targetEmployeeId = currentUser?.employeeId === 'emp-2' ? 'EMP-002' : 'EMP-001';

  // Check today's attendance record
  const todayStr = currentTime.toISOString().split('T')[0];
  const allRecords = getAttendanceRecords();
  const todayRecord = allRecords.find(
    (r) =>
      (r.employeeId === 'emp-1' || r.employeeId === targetEmployeeId) &&
      r.date === todayStr
  );
  const hasCheckedInToday = Boolean(todayRecord && todayRecord.checkIn && !todayRecord.checkOut);

  // Trigger automated face detection and verification simulation
  const handleStartScan = async () => {
    setFailureType(null);
    setFailureMessage('');
    setVerifiedData(null);
    setSuccessToast(null);

    setDetectionState('Looking for Face');
    await new Promise((r) => setTimeout(r, 700));

    setDetectionState('Face Detected');
    await new Promise((r) => setTimeout(r, 600));

    setDetectionState('Verifying Identity');
    try {
      const result = await verifyFace(targetEmployeeId);
      if (result.success) {
        setVerifiedData(result);
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
    const initTimer = setTimeout(() => {
      handleStartScan();
    }, 1000);
    return () => clearTimeout(initTimer);
  }, []);

  // Handle Check In
  const handleCheckIn = async () => {
    if (!verifiedData) return;
    setIsProcessing(true);

    const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const formattedDisplayTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    // Create record in main attendance store
    createAttendance({
      employeeId: verifiedData.internalId || 'emp-1',
      employeeName: verifiedData.employeeName,
      department: verifiedData.department,
      date: todayStr,
      checkIn: timeStr,
      checkOut: '',
      status: 'Present',
      attendanceMethod: 'Face Recognition',
      faceVerified: true,
      verificationConfidence: 98.7,
      notes: 'Verified via Face Recognition kiosk.'
    });

    // Add to face history
    logFaceAttendanceEvent(verifiedData, 'Check In');

    setIsProcessing(false);
    setSuccessToast({
      title: '✓ Check-in Successful',
      time: formattedDisplayTime,
      type: 'Check In'
    });
  };

  // Handle Check Out
  const handleCheckOut = async () => {
    if (!verifiedData || !todayRecord) return;
    setIsProcessing(true);

    const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const formattedDisplayTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const worked = calculateWorkedHours(todayRecord.checkIn, timeStr);

    updateAttendance(todayRecord.id, {
      checkOut: timeStr,
      workedHours: worked.formatted,
      status: 'Present',
      notes: `${todayRecord.notes || ''} | Face check-out verified.`
    });

    // Add to face history
    logFaceAttendanceEvent(verifiedData, 'Check Out');

    setIsProcessing(false);
    setSuccessToast({
      title: '✓ Check-out Successful',
      time: formattedDisplayTime,
      workedHours: worked.formatted,
      type: 'Check Out'
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Title and Live Clock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Face Attendance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant contactless identity verification and kiosk attendance logging.
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
          <button
            type="button"
            onClick={() => handleStartScan()}
            className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors"
          >
            Next Employee
          </button>
        </div>
      )}

      {/* Main Kiosk Area */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <CameraPreview isActive={true}>
          <FaceDetectionFrame state={detectionState} />
        </CameraPreview>

        {/* Verification Result Card or Failure Card */}
        <FaceVerificationStatus
          verifiedData={verifiedData}
          failureType={failureType}
          failureMessage={failureMessage}
          hasCheckedInToday={hasCheckedInToday}
          todayRecord={todayRecord}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onRetry={handleStartScan}
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
