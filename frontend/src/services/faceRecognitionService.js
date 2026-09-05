// services/faceRecognitionService.js
// Modular mock face recognition service for PeoplePay360

import {
  getFaceRegistrationByEmployeeId,
  saveFaceRegistration,
  addFaceHistoryRecord
} from '../data/faceAttendance';
import { getEmployees } from '../data/employees';

/**
 * Privacy policy statement required across the face attendance module
 */
export const FACE_ATTENDANCE_PRIVACY_NOTICE =
  'Face verification data is used only for attendance verification and should be handled according to organizational privacy and data protection policies.';

/**
 * Registers an employee's face profile
 * Saves mock metadata only (employeeId, faceRegistered: true, registeredAt).
 * IMPORTANT: No raw image or biometric files stored in localStorage.
 */
export const registerFace = async (employeeId) => {
  // Simulate brief network / processing delay
  await new Promise((r) => setTimeout(r, 800));

  const employees = getEmployees();
  const emp = employees.find(
    (e) => e.employeeId === employeeId || e.id === employeeId
  );

  if (!emp) {
    throw new Error(`Employee with ID ${employeeId} not found.`);
  }

  const saved = saveFaceRegistration({
    employeeId: emp.employeeId,
    internalId: emp.id,
    name: emp.name,
    department: emp.department,
    position: emp.position
  });

  return {
    success: true,
    message: 'Face profile registered successfully.',
    data: {
      employeeId: saved.employeeId,
      faceRegistered: true,
      registeredAt: saved.registeredAt
    }
  };
};

/**
 * Simulates face detection status from camera frames
 */
export const detectFace = async () => {
  await new Promise((r) => setTimeout(r, 600));
  return {
    detected: true,
    faceCount: 1,
    box: { x: 120, y: 80, width: 240, height: 280 }
  };
};

/**
 * Verifies face identity against registered employee database
 * Can target a specific employeeId or pick the active logged-in / primary registered employee (EMP-001 Amelia Johnson)
 */
export const verifyFace = async (targetEmployeeId = 'EMP-001') => {
  await new Promise((r) => setTimeout(r, 900));

  const employees = getEmployees();
  const emp = employees.find(
    (e) => e.employeeId === targetEmployeeId || e.id === targetEmployeeId
  );

  if (!emp) {
    return {
      success: false,
      errorType: 'Verification Failed',
      message: 'Identity could not be verified.'
    };
  }

  const reg = getFaceRegistrationByEmployeeId(emp.employeeId);
  if (!reg || !reg.faceRegistered) {
    return {
      success: false,
      errorType: 'Face Not Registered',
      message: 'Your face profile is not registered. Please contact HR.'
    };
  }

  return {
    success: true,
    employeeId: emp.employeeId,
    internalId: emp.id,
    employeeName: emp.name,
    department: emp.department,
    position: emp.position,
    avatar: emp.avatar,
    verified: true,
    confidence: 98.7
  };
};

/**
 * Logs an attendance event verified by face recognition
 */
export const logFaceAttendanceEvent = (employeeData, type = 'Check In') => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toISOString().split('T')[0];

  return addFaceHistoryRecord({
    employeeId: employeeData.employeeId,
    employeeName: employeeData.employeeName || employeeData.name,
    department: employeeData.department,
    date: dateStr,
    time: timeStr,
    type,
    confidence: 98.7
  });
};
