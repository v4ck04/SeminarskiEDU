"""Face detection (used for composition statistics and the 'unwanted person' asset safeguard).

OpenCV 5 removed the Haar CascadeClassifier from the main module, so the
YuNet DNN detector (OpenCV Zoo, MIT licence, bundled in assets/models) is
used when available; Haar cascades are the fallback on OpenCV 4.x builds.
`available()` reports which one is active so a missing detector is never
silent.
"""
from __future__ import annotations

import cv2
import numpy as np

from . import paths

try:  # OpenCV prints a harmless backend notice for every DNN model; keep the console clean
    cv2.utils.logging.setLogLevel(cv2.utils.logging.LOG_LEVEL_ERROR)
except Exception:
    try:
        cv2.setLogLevel(2)
    except Exception:
        pass

_DET: dict = {}
_BACKEND: str | None = None


def _model_paths() -> list:
    d = paths.REPO_ROOT / "assets" / "models"
    major = int(cv2.__version__.split(".")[0])
    names = ["face_detection_yunet_2026may.onnx", "face_detection_yunet_2023mar.onnx"]
    if major < 5:
        names.reverse()
    return [d / n for n in names if (d / n).exists()]


def backend() -> str | None:
    global _BACKEND
    if _BACKEND is not None:
        return _BACKEND or None
    if hasattr(cv2, "FaceDetectorYN"):
        for p in _model_paths():
            try:
                det = cv2.FaceDetectorYN.create(str(p), "", (320, 320), 0.7, 0.3, 50)
                det.setInputSize((320, 320))
                det.detect(np.zeros((320, 320, 3), np.uint8))
                _DET["yunet_path"] = str(p)
                _BACKEND = f"yunet ({p.name})"
                return _BACKEND
            except cv2.error:
                continue
    if hasattr(cv2, "CascadeClassifier"):
        _BACKEND = "haar"
        return _BACKEND
    _BACKEND = ""
    return None


def available() -> tuple[bool, str]:
    b = backend()
    return (True, b) if b else (False, "no face detector (OpenCV without FaceDetectorYN/CascadeClassifier or missing model)")


def detect(bgr: np.ndarray) -> list[tuple[float, float, float, float, float]] | None:
    """Faces as (x, y, w, h, score) in fractions of the image size; None if no detector."""
    b = backend()
    if not b:
        return None
    h, w = bgr.shape[:2]
    if b.startswith("yunet"):
        det = _DET.get((w, h))
        if det is None:
            det = cv2.FaceDetectorYN.create(_DET["yunet_path"], "", (w, h), 0.7, 0.3, 50)
            _DET[(w, h)] = det
        det.setInputSize((w, h))
        _, faces = det.detect(bgr)
        if faces is None:
            return []
        return [(float(f[0] / w), float(f[1] / h), float(f[2] / w), float(f[3] / h), float(f[14])) for f in faces]
    g = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    casc = _DET.setdefault("haar", cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml"))
    rects = casc.detectMultiScale(g, scaleFactor=1.1, minNeighbors=5, minSize=(max(12, w // 20),) * 2)
    return [(x / w, y / h, fw / w, fh / h, 1.0) for (x, y, fw, fh) in rects]
