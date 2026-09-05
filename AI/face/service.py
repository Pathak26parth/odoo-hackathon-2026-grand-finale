"""
PeoplePay360: HR & Payroll — Unified Face Biometrics & Attendance Service
CLI and microservice orchestrator connecting Employee Attendance Check-In/Check-Out,
Kiosk 1:N Identification, Face Detection, and Active Liveness Anti-Spoofing.
"""

import argparse
import json
import os
from pathlib import Path
import sys
from typing import Any, Dict, Optional, Union

# Ensure root AI directory is in path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from face.detector import FaceDetector, get_detector
    from face.embedding import FaceEmbedder, get_embedder
    from face.verification import FaceVerifier, get_verifier
    from face.liveness import LivenessDetector, check_liveness, get_liveness_detector
except ImportError:
    from .detector import FaceDetector, get_detector
    from .embedding import FaceEmbedder, get_embedder
    from .verification import FaceVerifier, get_verifier
    from .liveness import LivenessDetector, check_liveness, get_liveness_detector


class FaceBiometricsService:
    """
    Unified Biometrics Service providing attendance verification, employee identification,
    face detection, embedding, and anti-spoof liveness checks.
    """

    def __init__(
        self,
        threshold: Optional[float] = None,
        detector: Optional[FaceDetector] = None,
        embedder: Optional[FaceEmbedder] = None,
        verifier: Optional[FaceVerifier] = None,
        liveness_detector: Optional[LivenessDetector] = None,
    ):
        self.detector = detector or get_detector()
        self.embedder = embedder or get_embedder()
        self.verifier = verifier or get_verifier(threshold=threshold)
        self.liveness_detector = liveness_detector or get_liveness_detector()

    def detect_faces(self, image_input: Union[str, Path]) -> Dict[str, Any]:
        """Detect all faces in an image."""
        faces = self.detector.detect(image_input)
        return {
            "success": True,
            "data": {
                "faces_detected": len(faces),
                "faces": [f.to_dict() for f in faces],
            },
        }

    def verify_attendance(
        self,
        registered_image: Union[str, Path],
        live_image: Union[str, Path],
        employee_id: Optional[str] = None,
        action: str = "CHECK_IN",
        threshold: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Verify an employee's face for attendance Check-In or Check-Out.
        """
        return self.verifier.verify_attendance(
            registered_image=registered_image,
            live_image=live_image,
            employee_id=employee_id,
            action=action,
            threshold=threshold,
        )

    def identify_attendance(
        self,
        live_image: Union[str, Path],
        employee_gallery: Dict[str, Union[Any, str, Path]],
        threshold: Optional[float] = None,
        action: str = "CHECK_IN",
    ) -> Dict[str, Any]:
        """
        1:N Touchless Kiosk Attendance: Identify employee from live camera capture.
        """
        return self.verifier.identify_employee(
            live_image=live_image,
            employee_gallery=employee_gallery,
            threshold=threshold,
            action=action,
        )

    def verify_faces(
        self,
        doc_image: Union[str, Path],
        live_image: Union[str, Path],
        threshold: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Verify registered/document face vs live capture face (safe, non-raising)."""
        return self.verifier.verify_safe(doc_image, live_image, threshold=threshold)

    def verify_liveness(
        self,
        video_input: Union[str, Path, int],
        timeout_seconds: float = 10.0,
    ) -> Dict[str, Any]:
        """Run active liveness challenge verification on video file or camera input."""
        return check_liveness(
            video_input,
            detector=self.liveness_detector,
            timeout_seconds=timeout_seconds,
        )


# Shared service instance
_service_instance: Optional[FaceBiometricsService] = None


def get_service() -> FaceBiometricsService:
    """Return shared FaceBiometricsService instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = FaceBiometricsService()
    return _service_instance


def _print_json_response(data: Dict[str, Any]) -> None:
    """Standardized JSON wrapper output for backend and CLI consumers."""
    print("__PEOPLEPAY360_JSON_START__")
    print(json.dumps(data, indent=2))
    print("__PEOPLEPAY360_JSON_END__")


def main():
    """CLI Entry point for PeoplePay360 Attendance & Biometrics integration."""
    parser = argparse.ArgumentParser(
        description="PeoplePay360: HR & Payroll — Face Biometrics & Attendance Service CLI"
    )
    subparsers = parser.add_subparsers(dest="command", help="Subcommand to execute")

    # Command: attendance (Check-in / Check-out verification)
    att_parser = subparsers.add_parser("attendance", help="Run Employee Attendance Check-In / Check-Out Verification")
    att_parser.add_argument("registered_image", help="Path to employee registered profile photo")
    att_parser.add_argument("live_image", help="Path to live camera capture at punch time")
    att_parser.add_argument("--employee-id", default=None, help="Employee ID (e.g. EMP-001)")
    att_parser.add_argument("--action", choices=["CHECK_IN", "CHECK_OUT"], default="CHECK_IN", help="Punch action (default: CHECK_IN)")
    att_parser.add_argument("--threshold", type=float, default=None, help="Match threshold override (default: 0.45)")

    # Command: verify (1:1 Face Verification)
    verify_parser = subparsers.add_parser("verify", help="Run 1:1 Face Verification")
    verify_parser.add_argument("doc_image", help="Path to registered/document image")
    verify_parser.add_argument("live_image", help="Path to live capture image")
    verify_parser.add_argument("--threshold", type=float, default=None, help="Match threshold (default 0.45)")

    # Command: detect
    detect_parser = subparsers.add_parser("detect", help="Run Face Detection")
    detect_parser.add_argument("image", help="Path to image file")

    # Command: liveness
    liveness_parser = subparsers.add_parser("liveness", help="Run Active Liveness Anti-Spoof Verification")
    liveness_parser.add_argument("video_input", help="Path to video file or camera index (default 0)")
    liveness_parser.add_argument("--timeout", type=float, default=10.0, help="Challenge timeout in seconds (default 10.0)")

    args = parser.parse_args()
    service = get_service()

    if args.command == "attendance":
        result = service.verify_attendance(
            registered_image=args.registered_image,
            live_image=args.live_image,
            employee_id=args.employee_id,
            action=args.action,
            threshold=args.threshold,
        )
        _print_json_response(result)
        sys.exit(0 if result.get("match") else 1)

    elif args.command == "verify":
        result = service.verify_faces(args.doc_image, args.live_image, threshold=args.threshold)
        _print_json_response(result)
        sys.exit(0 if result.get("success") and result.get("data", {}).get("match") else 1)

    elif args.command == "detect":
        result = service.detect_faces(args.image)
        _print_json_response(result)
        sys.exit(0 if result.get("success") else 1)

    elif args.command == "liveness":
        video_src = int(args.video_input) if args.video_input.isdigit() else args.video_input
        result = service.verify_liveness(video_src, timeout_seconds=args.timeout)
        _print_json_response(result)
        status = result.get("liveness", {}).get("status")
        sys.exit(0 if status == "PASS" else 1)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
