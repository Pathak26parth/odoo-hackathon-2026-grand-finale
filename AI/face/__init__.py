"""
PeoplePay360: HR & Payroll — Biometric Face Verification & Attendance Package
Provides face detection, feature embedding, 1:1 employee attendance verification,
1:N kiosk employee identification, and anti-spoof liveness detection for HR attendance.
"""

try:
    from face.detector import DetectedFace, FaceDetector, get_detector
    from face.embedding import FaceEmbedder, get_embedder, get_embedding, cosine_similarity
    from face.verification import (
        FaceVerifier,
        get_verifier,
        verify_face,
        verify_attendance,
        identify_employee,
        FaceVerificationError,
        NoFaceDetectedError,
        MultipleFacesDetectedError,
        LowQualityImageError,
        EmbeddingExtractionError,
        check_image_quality,
    )
    from face.liveness import (
        HeadPose,
        LivenessStatus,
        LivenessStage,
        LivenessResult,
        FrameLivenessState,
        LivenessDetector,
        LivenessChallenge,
        get_liveness_detector,
        check_liveness,
        LivenessError,
        NoFaceInFrameError,
        MultipleFacesInFrameError,
        LivenessChallengeTimeoutError,
    )
    from face.service import FaceBiometricsService, get_service
except ImportError:
    from .detector import DetectedFace, FaceDetector, get_detector
    from .embedding import FaceEmbedder, get_embedder, get_embedding, cosine_similarity
    from .verification import (
        FaceVerifier,
        get_verifier,
        verify_face,
        verify_attendance,
        identify_employee,
        FaceVerificationError,
        NoFaceDetectedError,
        MultipleFacesDetectedError,
        LowQualityImageError,
        EmbeddingExtractionError,
        check_image_quality,
    )
    from .liveness import (
        HeadPose,
        LivenessStatus,
        LivenessStage,
        LivenessResult,
        FrameLivenessState,
        LivenessDetector,
        LivenessChallenge,
        get_liveness_detector,
        check_liveness,
        LivenessError,
        NoFaceInFrameError,
        MultipleFacesInFrameError,
        LivenessChallengeTimeoutError,
    )
    from .service import FaceBiometricsService, get_service

__all__ = [
    "DetectedFace",
    "FaceDetector",
    "get_detector",
    "FaceEmbedder",
    "get_embedder",
    "get_embedding",
    "cosine_similarity",
    "FaceVerifier",
    "get_verifier",
    "verify_face",
    "verify_attendance",
    "identify_employee",
    "FaceVerificationError",
    "NoFaceDetectedError",
    "MultipleFacesDetectedError",
    "LowQualityImageError",
    "EmbeddingExtractionError",
    "check_image_quality",
    "HeadPose",
    "LivenessStatus",
    "LivenessStage",
    "LivenessResult",
    "FrameLivenessState",
    "LivenessDetector",
    "LivenessChallenge",
    "get_liveness_detector",
    "check_liveness",
    "LivenessError",
    "NoFaceInFrameError",
    "MultipleFacesInFrameError",
    "LivenessChallengeTimeoutError",
    "FaceBiometricsService",
    "get_service",
]
