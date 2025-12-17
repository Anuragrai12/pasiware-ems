"""
Face Recognition Utilities using DeepFace
More accurate and easier to install than dlib-based solutions
"""

from deepface import DeepFace
import numpy as np
import cv2
import base64
import os
import json
from io import BytesIO
from PIL import Image

# Configuration
FACE_ENCODING_DIR = os.path.join(os.path.dirname(__file__), 'faces')
MATCH_THRESHOLD = 0.6  # For cosine distance (lower = more similar)

# Ensure faces directory exists
os.makedirs(FACE_ENCODING_DIR, exist_ok=True)


def base64_to_image(base64_string: str) -> np.ndarray:
    """Convert base64 string to numpy image array"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return np.array(image)
    except Exception as e:
        print(f"Error converting base64 to image: {e}")
        return None


def save_face_image(emp_id: str, image: np.ndarray) -> str:
    """Save face image to disk for comparison"""
    try:
        filepath = os.path.join(FACE_ENCODING_DIR, f"{emp_id}.jpg")
        
        # Convert RGB to BGR for OpenCV
        image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        cv2.imwrite(filepath, image_bgr)
        
        print(f"✅ Face image saved for {emp_id}")
        return filepath
    except Exception as e:
        print(f"Error saving face image: {e}")
        return None


def get_face_image_path(emp_id: str) -> str:
    """Get path to stored face image"""
    filepath = os.path.join(FACE_ENCODING_DIR, f"{emp_id}.jpg")
    return filepath if os.path.exists(filepath) else None


def check_face_registered(emp_id: str) -> bool:
    """Check if face image exists for employee"""
    return get_face_image_path(emp_id) is not None


def verify_faces(stored_image_path: str, live_image: np.ndarray) -> dict:
    """
    Compare stored face with live face using DeepFace
    Returns match result with distance and confidence
    """
    try:
        # Save live image temporarily
        temp_path = os.path.join(FACE_ENCODING_DIR, "_temp_live.jpg")
        live_bgr = cv2.cvtColor(live_image, cv2.COLOR_RGB2BGR)
        cv2.imwrite(temp_path, live_bgr)
        
        # Use DeepFace to verify
        result = DeepFace.verify(
            img1_path=stored_image_path,
            img2_path=temp_path,
            model_name="VGG-Face",  # Good accuracy, reasonable speed
            detector_backend="opencv",  # Fast detection
            enforce_detection=False,  # Don't fail if face not detected
        )
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        # Calculate confidence from distance
        distance = result.get("distance", 1.0)
        threshold = result.get("threshold", 0.6)
        verified = result.get("verified", False)
        
        # Convert distance to confidence (0-100%)
        # Lower distance = higher confidence
        confidence = max(0, (1 - distance / threshold) * 100)
        
        return {
            "match": verified,
            "distance": float(distance),
            "threshold": float(threshold),
            "confidence": float(confidence),
            "model": "VGG-Face"
        }
    except Exception as e:
        print(f"Face verification error: {e}")
        return {
            "match": False,
            "distance": 1.0,
            "confidence": 0,
            "error": str(e)
        }


def detect_face(image: np.ndarray) -> bool:
    """Check if a face is detected in the image"""
    try:
        # Save temp image
        temp_path = os.path.join(FACE_ENCODING_DIR, "_temp_detect.jpg")
        image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        cv2.imwrite(temp_path, image_bgr)
        
        # Try to extract face
        faces = DeepFace.extract_faces(
            img_path=temp_path,
            detector_backend="opencv",
            enforce_detection=False
        )
        
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return len(faces) > 0 and faces[0].get("confidence", 0) > 0.5
    except Exception as e:
        print(f"Face detection error: {e}")
        return False


def register_face(emp_id: str, image: np.ndarray) -> dict:
    """Register a face for an employee"""
    try:
        # Check if face is detected
        if not detect_face(image):
            return {
                "success": False,
                "message": "No face detected in image"
            }
        
        # Save face image
        filepath = save_face_image(emp_id, image)
        if not filepath:
            return {
                "success": False,
                "message": "Failed to save face image"
            }
        
        return {
            "success": True,
            "message": "Face registered successfully",
            "filepath": filepath
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


def verify_face(emp_id: str, live_image: np.ndarray) -> dict:
    """Verify a live face against stored face"""
    try:
        # Get stored face path
        stored_path = get_face_image_path(emp_id)
        if not stored_path:
            return {
                "success": False,
                "match": False,
                "message": "Face not registered for this employee"
            }
        
        # Verify faces
        result = verify_faces(stored_path, live_image)
        
        return {
            "success": True,
            "match": result["match"],
            "distance": result.get("distance"),
            "confidence": result.get("confidence"),
            "message": "Face matched!" if result["match"] else "Face does not match"
        }
    except Exception as e:
        return {
            "success": False,
            "match": False,
            "message": str(e)
        }
