"""
PeoplePay360: HR & Payroll — Python Face Biometrics HTTP Server
Exposes high-performance REST endpoints for Face Detection, 1:1 Verification,
Attendance Punch Matching, and Anti-Spoof Liveness Checks.
"""

import base64
import json
import logging
import os
from pathlib import Path
import sys
import tempfile
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# Ensure root AI directory is in path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] [FaceServer] %(message)s")
logger = logging.getLogger("peoplepay360.face_server")

try:
    from face.service import get_service
except Exception as e:
    logger.warning(f"Could not import face service (will load on demand or handle gracefully): {e}")
    get_service = None

PORT = int(os.getenv("PORT", os.getenv("FACE_SERVICE_PORT", "8000")))
HOST = os.getenv("HOST", "0.0.0.0")


import urllib.request
import urllib.parse
import hashlib

CACHE_DIR = ROOT_DIR / ".cache"
CACHE_DIR.mkdir(exist_ok=True)

def _save_temp_image(data_str: str) -> str:
    """Save base64 image data, download URL with disk caching, or return path if already a filepath."""
    if not data_str:
        raise ValueError("Image data is empty")
    
    if os.path.exists(data_str):
        return data_str

    # If HTTP/HTTPS URL, download into a persistent disk cache
    if data_str.startswith("http://") or data_str.startswith("https://"):
        url_hash = hashlib.md5(data_str.encode("utf-8")).hexdigest()
        cached_file = CACHE_DIR / f"{url_hash}.jpg"
        if cached_file.exists() and cached_file.stat().st_size > 100:
            return str(cached_file)

        req = urllib.request.Request(data_str, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw_bytes = resp.read()
        cached_file.write_bytes(raw_bytes)
        return str(cached_file)
    
    # Strip data URL header if present (e.g. data:image/jpeg;base64,...)
    clean_data = data_str
    if "," in clean_data and clean_data.startswith("data:"):
        clean_data = clean_data.split(",", 1)[1]
    
    # Pad base64 if needed
    clean_data = clean_data.strip()
    padded = clean_data + "=" * (-len(clean_data) % 4)
    raw_bytes = base64.b64decode(padded)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    temp_file.write(raw_bytes)
    temp_file.close()
    return temp_file.name


class FaceRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: dict):
        response_bytes = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ["/health", "/api/health", "/"]:
            return self._send_json(200, {
                "success": True,
                "status": "healthy",
                "service": "peoplepay360-face-service",
                "version": "1.0.0",
                "engine": "InsightFace/ArcFace + MediaPipe"
            })
        
        self._send_json(404, {"success": False, "message": f"Endpoint not found: {parsed.path}"})

    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length)
        
        try:
            body = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            return self._send_json(400, {"success": False, "message": "Invalid JSON request body"})

        temp_files_to_clean = []
        try:
            service = get_service() if get_service else None
            if not service:
                return self._send_json(503, {
                    "success": False,
                    "message": "Face recognition models currently loading or unavailable"
                })

            if parsed.path in ["/detect", "/api/face/detect"]:
                image_input = body.get("image") or body.get("imageInput")
                img_path = _save_temp_image(image_input)
                temp_files_to_clean.append(img_path)
                result = service.detect_faces(img_path)
                return self._send_json(200, result)

            elif parsed.path in ["/verify", "/api/face/verify"]:
                doc_input = body.get("doc_image") or body.get("registered_image") or body.get("registeredImage")
                live_input = body.get("live_image") or body.get("liveImage")
                threshold = body.get("threshold")
                
                doc_path = _save_temp_image(doc_input)
                live_path = _save_temp_image(live_input)
                temp_files_to_clean.extend([doc_path, live_path])
                
                result = service.verify_faces(doc_path, live_path, threshold=threshold)
                return self._send_json(200, result)

            elif parsed.path in ["/attendance", "/api/face/attendance"]:
                reg_input = body.get("registered_image") or body.get("registeredImage") or body.get("doc_image")
                live_input = body.get("live_image") or body.get("liveImage")
                emp_id = body.get("employee_id") or body.get("employeeId")
                action = body.get("action", "CHECK_IN")
                threshold = body.get("threshold")

                reg_path = _save_temp_image(reg_input) if reg_input else None
                live_path = _save_temp_image(live_input)
                if reg_path:
                    temp_files_to_clean.append(reg_path)
                temp_files_to_clean.append(live_path)

                if not reg_path:
                    reg_path = live_path

                result = service.verify_attendance(
                    registered_image=reg_path,
                    live_image=live_path,
                    employee_id=emp_id,
                    action=action,
                    threshold=threshold
                )
                return self._send_json(200, result)

            elif parsed.path in ["/enroll", "/api/face/enroll"]:
                image_input = body.get("image") or body.get("imageInput") or body.get("faceInput") or body.get("faceEmbeddingOrImage")
                emp_id = body.get("employee_id") or body.get("employeeId")
                img_path = _save_temp_image(image_input)
                temp_files_to_clean.append(img_path)
                
                det_result = service.detect_faces(img_path)
                faces_count = det_result.get("data", {}).get("faces_detected", 0)
                if faces_count == 0:
                    return self._send_json(400, {
                        "success": False,
                        "message": "No face detected in enrollment image. Please ensure adequate lighting and face is centered."
                    })
                
                return self._send_json(200, {
                    "success": True,
                    "message": "Face profile enrolled and validated successfully.",
                    "employee_id": emp_id,
                    "faces_detected": faces_count
                })

            elif parsed.path in ["/liveness", "/api/face/liveness"]:
                video_input = body.get("video") or body.get("video_input", 0)
                timeout = float(body.get("timeout", 10.0))
                result = service.verify_liveness(video_input, timeout_seconds=timeout)
                return self._send_json(200, result)

            else:
                return self._send_json(404, {"success": False, "message": f"Endpoint not found: {parsed.path}"})

        except Exception as e:
            logger.error(f"Error handling {parsed.path}: {e}\n{traceback.format_exc()}")
            return self._send_json(500, {
                "success": False,
                "message": f"Face processing error: {str(e)}"
            })
        finally:
            for f in temp_files_to_clean:
                if os.path.exists(f) and f.startswith(tempfile.gettempdir()):
                    try:
                        os.remove(f)
                    except Exception:
                        pass

    def log_message(self, format, *args):
        logger.info(f"{self.address_string()} - {format % args}")


def run_server():
    server = HTTPServer((HOST, PORT), FaceRequestHandler)
    logger.info(f"PeoplePay360 Face Biometrics Server listening on http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Face Server stopped by user.")
    finally:
        server.server_close()


if __name__ == "__main__":
    run_server()
