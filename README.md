# PeoplePay360: HR & Payroll
> An Integrated Human Resource and Payroll Operations Platform (Odoo Hackathon 2026 Grand Finale)

## Overview
**PeoplePay360** is a comprehensive, enterprise-grade HR and Payroll platform designed to unify employee lifecycle management, flexible working schedules, attendance tracking, leave requests, configurable salary structures, and automated payroll runs into a seamless operational flow.

---

## AI Face Biometrics & Attendance Module (`AI/face`)
The platform includes an AI-powered face verification and anti-spoofing engine tailored specifically for the **Attendance Management** module (Check-In, Check-Out, and Kiosk Attendance).

### Key Features
1. **1:1 Employee Check-In / Check-Out Verification**:
   - Matches a live camera capture against an employee's registered profile photo.
   - Computes cosine similarity with 512-dimensional ArcFace deep embeddings.
   - Verifies photo quality (sharpness Laplacian variance, illumination/brightness, face dimensions).
2. **1:N Touchless Kiosk Attendance**:
   - Identifies an employee from a live camera frame against a gallery of registered employees.
3. **Active Liveness & Anti-Spoof Protection**:
   - Uses MediaPipe Face Mesh (478 3D landmarks) and head-pose trajectory (Center → Turn Left → Turn Right).
   - Defeats photo presentation attacks, printed cutouts, and video replays (eliminating buddy punching).

---

## Setup & Installation

```bash
# Install all required dependencies
pip install -r requirements.txt
```

### Dependencies
- **Numerical & Computer Vision**: `numpy`, `opencv-python`, `pillow`, `scikit-image`, `scipy`
- **Deep Learning Biometrics**: `insightface`, `onnxruntime`, `onnx`
- **Liveness & Mesh Tracking**: `mediapipe`
- **Document & PDF Parsing**: `pypdfium2`

---

## Attendance Module CLI Usage

```bash
# 1. Verify Employee Attendance (1:1 Check-In / Check-Out)
python -m AI.face.service attendance path/to/registered_photo.jpg path/to/live_capture.jpg --employee-id EMP-001 --action CHECK_IN

# 2. 1:1 Face Verification
python -m AI.face.service verify path/to/registered_photo.jpg path/to/live_capture.jpg

# 3. Detect Faces in an Image
python -m AI.face.service detect path/to/image.jpg

# 4. Run Active Liveness Anti-Spoof Check on Video/Webcam
python -m AI.face.service liveness 0 --timeout 10.0
```

---

## Python API Integration

```python
from AI.face import verify_attendance, get_service

# Run attendance check-in verification
result = verify_attendance(
    registered_image="path/to/employee_profile.jpg",
    live_image="path/to/webcam_punch.jpg",
    employee_id="EMP-001",
    action="CHECK_IN"
)

if result["attendance_status"] == "VERIFIED":
    print(f"Attendance verified for {result['employee_id']} (similarity: {result['similarity']})")
else:
    print("Attendance verification failed!")
```