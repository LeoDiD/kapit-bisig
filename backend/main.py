"""
Face Recognition Backend - FastAPI Application
Optimized for Capstone/Thesis Projects

System Flow:
1. Receive image from mobile app
2. Detect face using OpenCV
3. Extract face region
4. Convert to embedding using DeepFace
5. Compare with registered faces (1:N matching)
6. Return "Verified" or "Not Recognized"

NEW: MongoDB Integration for Resident Registration
- Collection: residents - stores registered residents with face embeddings
- Collection: face_registration_logs - logs all registration attempts (ALLOW/BLOCK/ERROR)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import base64
import cv2
import numpy as np
from deepface import DeepFace
import os
import json
from datetime import datetime
import logging
import time
import sys
from pymongo import MongoClient
from bson import ObjectId

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Face Recognition API",
    description="Backend API for mobile face recognition feature",
    version="1.0.0"
)

# Enable CORS for mobile app communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# CONFIGURATION
# ============================================

FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.65"))  # Similarity threshold for verification
DUPLICATE_THRESHOLD = float(os.getenv("DUPLICATE_THRESHOLD", "0.70"))    # Threshold for duplicate detection during registration
MIN_FACE_SIZE = int(os.getenv("MIN_FACE_SIZE", "100"))                   # Minimum face size in pixels
MODEL_NAME = os.getenv("MODEL_NAME", "Facenet")                          # DeepFace model: Facenet, VGG-Face, OpenFace, etc.
DETECTOR_BACKEND = os.getenv("DETECTOR_BACKEND", "opencv")               # Faster on CPU; override to retinaface for accuracy
DETECTOR_FOR_DETECT = os.getenv("DETECTOR_FOR_DETECT", "opencv")         # deepface or opencv
BLUR_THRESHOLD = float(os.getenv("BLUR_THRESHOLD", "30"))                # Laplacian variance; lower = more tolerant
LIVENESS_MIN_PASSES = int(os.getenv("LIVENESS_MIN_PASSES", "1"))         # Minimum checks that must pass
LOW_RES_THRESHOLD = int(os.getenv("LOW_RES_THRESHOLD", "480"))           # px; below this treat liveness as uncertain
MAX_IMAGE_DIM = int(os.getenv("MAX_IMAGE_DIM", "800"))                   # px; downscale large images for speed

# ============================================
# MONGODB CONFIGURATION
# ============================================

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "kapit_bisig")

# MongoDB connection (lazy initialization)
mongo_client = None
mongo_db = None

def get_mongo_db():
    """Get MongoDB database connection (lazy initialization)"""
    global mongo_client, mongo_db
    if mongo_db is None:
        try:
            mongo_client = MongoClient(MONGODB_URI)
            mongo_db = mongo_client[MONGODB_DB_NAME]
            # Test connection
            mongo_client.admin.command('ping')
            logger.info(f"✓ Connected to MongoDB: {MONGODB_DB_NAME}")
        except Exception as e:
            logger.error(f"✗ MongoDB connection failed: {e}")
            logger.warning("Using in-memory storage as fallback")
            return None
    return mongo_db

# ============================================
# DATA MODELS
# ============================================

class FaceRegisterRequest(BaseModel):
    image: str  # Base64 encoded image
    user_id: str
    name: str

class FaceVerifyRequest(BaseModel):
    image: str  # Base64 encoded image

class FaceDetectRequest(BaseModel):
    image: str  # Base64 encoded image

# NEW: Duplicate Check Request/Response for Registration Flow
class DuplicateCheckRequest(BaseModel):
    image: str  # Base64 encoded image
    resident_data: Optional[dict] = None  # Optional resident registration data

class DuplicateCheckResponse(BaseModel):
    success: bool
    face_detected: bool
    decision: str  # "ALLOW" or "BLOCK"
    best_match_id: Optional[str] = None
    best_match_name: Optional[str] = None
    similarity: float
    threshold: float
    processing_time_ms: int
    message: str
    # For storing resident on ALLOW
    resident_id: Optional[str] = None
    embedding: Optional[List[float]] = None

class FaceRegisterResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[str] = None

class FaceVerifyResponse(BaseModel):
    verified: bool
    user_id: Optional[str] = None
    name: Optional[str] = None
    confidence: float
    message: str

class FaceDetectionResult(BaseModel):
    has_face: bool
    face_count: int
    is_centered: bool
    face_size_ok: bool
    is_real_image: bool = True  # Liveness/anti-spoofing check
    image_quality: str = "good"  # good, blurry, too_dark, too_bright
    is_valid: bool = False  # Overall validation result
    message: str
    bounding_box: Optional[dict] = None
    validation_details: Optional[dict] = None  # Detailed validation info

# ============================================
# IN-MEMORY FACE DATABASE
# For production, use MongoDB, PostgreSQL, etc.
# ============================================

face_database = {}  # {user_id: {"name": str, "embedding": list, "registered_at": str}}
EMBEDDINGS_FILE = "face_embeddings.json"

# ============================================
# PERFORMANCE: Embedding Cache (reduces repeat computation)
# ============================================
from functools import lru_cache
import hashlib

# Cache for model loading (prevents reloading on every request)
_model_cache = {}

def get_image_hash(image: np.ndarray) -> str:
    """Generate hash for image caching"""
    return hashlib.md5(image.tobytes()).hexdigest()

# Pre-warm the DeepFace model on startup
def warmup_model():
    """Pre-load DeepFace model to avoid first-request delay"""
    try:
        logger.info(f"Pre-loading {MODEL_NAME} model...")
        # Create a dummy image to trigger model loading
        dummy = np.zeros((224, 224, 3), dtype=np.uint8)
        DeepFace.represent(dummy, model_name=MODEL_NAME, detector_backend="skip", enforce_detection=False)
        logger.info("Model pre-loaded successfully!")
    except Exception as e:
        logger.warning(f"Model warmup failed (will load on first request): {e}")

def save_database() -> bool:
    """Save face database to file. Returns True on success, False on failure."""
    try:
        # Ensure any numpy types are JSON-serializable
        serializable_data = to_native(face_database)

        # Write atomically to avoid partial files if the process crashes
        tmp_path = f"{EMBEDDINGS_FILE}.tmp"
        with open(tmp_path, 'w') as f:
            json.dump(serializable_data, f, indent=2)
        os.replace(tmp_path, EMBEDDINGS_FILE)

        logger.info(f"Database saved with {len(face_database)} users")
        return True
    except Exception as e:
        logger.error(f"Failed to save database: {e}")
        return False

def load_database():
    """Load face database from file"""
    global face_database
    if os.path.exists(EMBEDDINGS_FILE):
        try:
            with open(EMBEDDINGS_FILE, 'r') as f:
                face_database = json.load(f)
            logger.info(f"Database loaded with {len(face_database)} users")
        except Exception as e:
            logger.error(f"Failed to load database: {e}")
            face_database = {}

# Load database on startup
load_database()

# Warm up model on startup (prevents first-request delay)
warmup_model()

# ============================================
# UTILITY FUNCTIONS
# ============================================

def decode_base64_image(base64_string: str) -> np.ndarray:
    """
    Convert Base64 string to OpenCV image (numpy array)
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        OpenCV image as numpy array (BGR format)
    """
    # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    if 'base64,' in base64_string:
        base64_string = base64_string.split('base64,')[1]
    
    # Decode base64 to bytes
    image_bytes = base64.b64decode(base64_string)
    
    # Convert to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    
    # Decode image (OpenCV BGR format)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Failed to decode image. Please ensure the image is valid.")

    return resize_image_if_needed(image)

def resize_image_if_needed(image: np.ndarray) -> np.ndarray:
    """
    Downscale large images to improve CPU performance.
    """
    if MAX_IMAGE_DIM <= 0:
        return image
    
    height, width = image.shape[:2]
    max_side = max(height, width)
    
    if max_side <= MAX_IMAGE_DIM:
        return image
    
    scale = MAX_IMAGE_DIM / max_side
    new_width = int(width * scale)
    new_height = int(height * scale)
    
    resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
    logger.info(f"Image resized: {width}x{height} -> {new_width}x{new_height}")
    return resized

def detect_faces_opencv(image: np.ndarray) -> dict:
    """
    Detect faces using OpenCV Haar Cascade
    
    Args:
        image: OpenCV image (BGR format)
        
    Returns:
        Dictionary with detection results
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Load face cascade classifier
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    
    # Detect faces
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(MIN_FACE_SIZE, MIN_FACE_SIZE)
    )
    
    result = {
        "has_face": len(faces) > 0,
        "face_count": len(faces),
        "faces": faces.tolist() if len(faces) > 0 else [],
        "image_width": image.shape[1],
        "image_height": image.shape[0]
    }
    
    return result

def detect_faces_deepface(image: np.ndarray) -> dict:
    """
    Detect faces using DeepFace detector backend (retinaface/mtcnn/etc.)
    Returns the same structure as detect_faces_opencv.
    """
    try:
        faces = DeepFace.extract_faces(
            img_path=image,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=False
        )
    except Exception as e:
        logger.warning(f"DeepFace detection failed, falling back to OpenCV: {e}")
        return detect_faces_opencv(image)

    face_boxes = []
    for f in faces:
        area = f.get("facial_area") or {}
        x = int(area.get("x", 0))
        y = int(area.get("y", 0))
        w = int(area.get("w", 0))
        h = int(area.get("h", 0))
        if w > 0 and h > 0:
            face_boxes.append([x, y, w, h])

    if len(face_boxes) == 0:
        # Fallback to OpenCV if DeepFace found nothing
        return detect_faces_opencv(image)

    return {
        "has_face": len(face_boxes) > 0,
        "face_count": len(face_boxes),
        "faces": face_boxes,
        "image_width": image.shape[1],
        "image_height": image.shape[0]
    }

def check_face_centered(face: list, image_width: int, image_height: int) -> bool:
    """
    Check if face is centered in the image
    
    Args:
        face: [x, y, width, height] of face bounding box
        image_width: Width of the image
        image_height: Height of the image
        
    Returns:
        True if face is centered (within 20% of center)
    """
    x, y, w, h = face
    face_center_x = x + w / 2
    face_center_y = y + h / 2
    
    image_center_x = image_width / 2
    image_center_y = image_height / 2
    
    # Allow 20% deviation from center
    tolerance_x = image_width * 0.2
    tolerance_y = image_height * 0.2
    
    is_centered_x = abs(face_center_x - image_center_x) < tolerance_x
    is_centered_y = abs(face_center_y - image_center_y) < tolerance_y
    
    return bool(is_centered_x and is_centered_y)

def check_face_size(face: list, image_width: int, image_height: int) -> bool:
    """
    Check if face is large enough (at least 20% of image)
    
    Args:
        face: [x, y, width, height] of face bounding box
        image_width: Width of the image
        image_height: Height of the image
        
    Returns:
        True if face size is adequate
    """
    x, y, w, h = face
    face_area = w * h
    image_area = image_width * image_height
    
    # Face should be at least 10% of image area
    min_ratio = 0.10
    # Face should not be more than 80% of image area
    max_ratio = 0.80
    
    ratio = face_area / image_area
    return bool(min_ratio <= ratio <= max_ratio)

def check_image_blur(image: np.ndarray) -> tuple[bool, float]:
    """
    Check if image is blurry using Laplacian variance
    
    Args:
        image: OpenCV image (BGR format)
        
    Returns:
        (is_sharp, blur_score) - True if image is sharp enough
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    # Higher value = sharper image. Tolerate lower-quality mobile cams.
    is_sharp = bool(laplacian_var > BLUR_THRESHOLD)
    
    return is_sharp, float(laplacian_var)

def check_image_brightness(image: np.ndarray) -> tuple[str, float]:
    """
    Check image brightness level
    
    Args:
        image: OpenCV image (BGR format)
        
    Returns:
        (status, brightness_value) - "good", "too_dark", or "too_bright"
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    brightness = np.mean(gray)
    
    if brightness < 40:
        return "too_dark", float(brightness)
    elif brightness > 220:
        return "too_bright", float(brightness)
    else:
        return "good", float(brightness)

def check_liveness_basic(image: np.ndarray, face_bbox: list) -> tuple[bool, dict]:
    """
    Basic liveness detection (anti-spoofing)
    Checks for signs of a real face vs photo/screen
    
    NOTE: Thresholds are lenient for mobile phone cameras which can have
    compression artifacts, varying lighting, etc.
    
    Args:
        image: OpenCV image (BGR format)
        face_bbox: [x, y, w, h] of detected face
        
    Returns:
        (is_real, details) - True if appears to be real face
    """
    x, y, w, h = face_bbox
    
    # Extract face region with some padding
    padding = int(w * 0.1)
    y1 = max(0, y - padding)
    y2 = min(image.shape[0], y + h + padding)
    x1 = max(0, x - padding)
    x2 = min(image.shape[1], x + w + padding)
    
    face_region = image[y1:y2, x1:x2]
    
    if face_region.size == 0:
        return False, {"error": "Could not extract face region"}
    
    details = {}
    score = 0
    max_score = 5
    
    # Check 1: Color variance (real faces have more color variation)
    # Lowered threshold for mobile cameras
    hsv = cv2.cvtColor(face_region, cv2.COLOR_BGR2HSV)
    h_std = np.std(hsv[:,:,0])
    s_std = np.std(hsv[:,:,1])
    v_std = np.std(hsv[:,:,2])
    
    color_variance = (h_std + s_std + v_std) / 3
    details["color_variance"] = float(color_variance)
    if color_variance > 8:  # More tolerant than before
        score += 1
    
    # Check 2: Texture analysis (real skin has texture)
    # Lowered threshold for compressed images
    gray_face = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
    laplacian = cv2.Laplacian(gray_face, cv2.CV_64F)
    texture_score = np.std(laplacian)
    details["texture_score"] = float(texture_score)
    if texture_score > 3:  # More tolerant than before
        score += 1
    
    # Check 3: Edge density (screens often have sharp edges/moiré)
    # Widened range for natural variation
    edges = cv2.Canny(gray_face, 50, 150)
    edge_density = np.sum(edges > 0) / edges.size
    details["edge_density"] = float(edge_density)
    if 0.01 < edge_density < 0.6:  # Widened further for noisy cams
        score += 1
    
    # Check 4: Reflection detection (screens have uniform reflections)
    # Increased tolerance for phone flash/lighting
    bright_spots = np.sum(gray_face > 240) / gray_face.size
    details["bright_spots_ratio"] = float(bright_spots)
    if bright_spots < 0.15:  # Allow brighter flashes
        score += 1
    
    # Check 5: Color channel correlation (real images have natural correlation)
    # Widened range for different skin tones and lighting
    b, g, r = cv2.split(face_region)
    rg_corr = np.corrcoef(r.flatten(), g.flatten())[0,1]
    details["color_correlation"] = float(rg_corr) if not np.isnan(rg_corr) else 0
    if 0.3 < abs(rg_corr) < 1.0:  # More tolerant
        score += 1
    
    details["liveness_score"] = score
    details["min_required"] = LIVENESS_MIN_PASSES
    details["max_score"] = max_score
    details["confidence"] = float(score / max_score * 100)
    
    # Require at least configured number of checks (default 1) to pass
    is_real = bool(score >= LIVENESS_MIN_PASSES)
    
    return is_real, details

def get_face_embedding(image: np.ndarray) -> list:
    """
    Generate face embedding using DeepFace
    OPTIMIZED: Uses 'skip' detector when face already detected for faster processing
    
    Args:
        image: OpenCV image (BGR format)
        
    Returns:
        128-dimensional face embedding vector (for Facenet)
    """
    try:
        # DeepFace.represent expects BGR image (OpenCV format)
        # Use 'skip' detector if face was already validated - much faster!
        embedding = DeepFace.represent(
            img_path=image,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True
        )
        
        if len(embedding) == 0:
            raise ValueError("No face detected in image")
        
        return embedding[0]["embedding"]
    except Exception as e:
        logger.error(f"Face embedding generation failed: {e}")
        raise ValueError(f"Could not generate face embedding: {str(e)}")

def get_face_embedding_fast(face_crop: np.ndarray) -> list:
    """
    FAST embedding extraction for pre-cropped face images.
    Skips face detection entirely - use when face is already extracted.
    
    Args:
        face_crop: Pre-cropped face region (BGR format)
        
    Returns:
        Face embedding vector
    """
    try:
        # Resize to model's expected input (160x160 for Facenet)
        face_resized = cv2.resize(face_crop, (160, 160))
        
        embedding = DeepFace.represent(
            img_path=face_resized,
            model_name=MODEL_NAME,
            detector_backend="skip",  # Skip detection - face already cropped
            enforce_detection=False
        )
        
        if len(embedding) == 0:
            raise ValueError("Could not generate embedding")
        
        return embedding[0]["embedding"]
    except Exception as e:
        logger.error(f"Fast embedding failed: {e}")
        raise ValueError(f"Could not generate face embedding: {str(e)}")

def calculate_similarity(embedding1: list, embedding2: list) -> float:
    """
    Calculate cosine similarity between two embeddings
    
    Args:
        embedding1: First face embedding vector
        embedding2: Second face embedding vector
        
    Returns:
        Similarity score (0-1, higher is more similar)
    """
    e1 = np.array(embedding1)
    e2 = np.array(embedding2)
    
    # Cosine similarity: dot(A,B) / (||A|| * ||B||)
    dot_product = np.dot(e1, e2)
    norm_product = np.linalg.norm(e1) * np.linalg.norm(e2)
    
    if norm_product == 0:
        return 0.0
    
    similarity = dot_product / norm_product
    
    # Ensure result is in valid range
    return float(max(0.0, min(1.0, similarity)))

def to_native(obj):
    """
    Convert numpy scalars to native Python types for JSON serialization.
    """
    if isinstance(obj, np.generic):
        return obj.item()
    if isinstance(obj, dict):
        return {k: to_native(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_native(v) for v in obj]
    return obj

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok", 
        "message": "Face Recognition API is running",
        "registered_users": len(face_database)
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    # Check MongoDB connection
    db = get_mongo_db()
    mongodb_status = "connected" if db is not None else "disconnected"
    mongodb_residents = 0
    mongodb_logs = 0
    
    if db is not None:
        try:
            mongodb_residents = db.residents.count_documents({})
            mongodb_logs = db.face_registration_logs.count_documents({})
        except:
            pass
    
    return {
        "status": "healthy",
        "model": MODEL_NAME,
        "detector": DETECTOR_BACKEND,
        "registered_users": len(face_database),
        "duplicate_threshold": DUPLICATE_THRESHOLD,
        "match_threshold": FACE_MATCH_THRESHOLD,
        "mongodb": {
            "status": mongodb_status,
            "database": MONGODB_DB_NAME,
            "residents_count": mongodb_residents,
            "logs_count": mongodb_logs
        }
    }

@app.post("/api/face/detect", response_model=FaceDetectionResult)
async def detect_face(request: FaceDetectRequest):
    """
    STEP 1: Detect and validate face in image
    Enhanced with liveness detection and image quality checks
    
    Checks:
    - Face detected
    - Only 1 face
    - Face is centered
    - Face size is adequate
    - Image not blurry
    - Good lighting
    - Liveness (anti-spoofing)
    """
    validation_details = {}
    try:
        logger.info("Face detection request received")
        
        # Decode image
        image = decode_base64_image(request.image)
        logger.info(f"Image decoded: {image.shape}")
        
        min_side = min(image.shape[0], image.shape[1])
        low_res = min_side < LOW_RES_THRESHOLD
        validation_details["low_res"] = low_res
        validation_details["min_side_px"] = int(min_side)
        
        # Check 1: Image blur
        is_sharp, blur_score = check_image_blur(image)
        validation_details["blur_score"] = blur_score
        validation_details["is_sharp"] = is_sharp
        
        if not is_sharp:
            return FaceDetectionResult(
                has_face=False,
                face_count=0,
                is_centered=False,
                face_size_ok=False,
                is_real_image=False,
                image_quality="blurry",
                is_valid=False,
                message="Image is too blurry. Please hold still and try again.",
                validation_details=to_native(validation_details)
            )
        
        # Check 2: Image brightness
        brightness_status, brightness_value = check_image_brightness(image)
        validation_details["brightness"] = brightness_value
        validation_details["brightness_status"] = brightness_status
        
        if brightness_status == "too_dark":
            return FaceDetectionResult(
                has_face=False,
                face_count=0,
                is_centered=False,
                face_size_ok=False,
                is_real_image=False,
                image_quality="too_dark",
                is_valid=False,
                message="Image is too dark. Please move to a brighter area.",
                validation_details=to_native(validation_details)
            )
        elif brightness_status == "too_bright":
            return FaceDetectionResult(
                has_face=False,
                face_count=0,
                is_centered=False,
                face_size_ok=False,
                is_real_image=False,
                image_quality="too_bright",
                is_valid=False,
                message="Image is too bright. Please avoid direct light.",
                validation_details=to_native(validation_details)
            )
        
        # Check 3: Detect faces (DeepFace detector is more reliable than Haar)
        if DETECTOR_FOR_DETECT.lower() == "deepface":
            detection = detect_faces_deepface(image)
        else:
            detection = detect_faces_opencv(image)

        logger.info(f"Detection result: has_face={detection['has_face']}, face_count={detection['face_count']}")
        
        # No face detected
        if not detection["has_face"]:
            return FaceDetectionResult(
                has_face=False,
                face_count=0,
                is_centered=False,
                face_size_ok=False,
                is_real_image=False,
                image_quality="good",
                is_valid=False,
                message="No face detected. Please make sure your face is clearly visible.",
                validation_details=to_native(validation_details)
            )
        
        # Multiple faces detected
        if detection["face_count"] > 1:
            return FaceDetectionResult(
                has_face=True,
                face_count=detection["face_count"],
                is_centered=False,
                face_size_ok=False,
                is_real_image=False,
                image_quality="good",
                is_valid=False,
                message=f"Multiple faces detected ({detection['face_count']}). Only your face should be in the frame.",
                validation_details=to_native(validation_details)
            )
        
        # Single face - check position and size
        face = detection["faces"][0]
        is_centered = check_face_centered(
            face, 
            detection["image_width"], 
            detection["image_height"]
        )
        face_size_ok = check_face_size(
            face, 
            detection["image_width"], 
            detection["image_height"]
        )
        
        validation_details["is_centered"] = is_centered
        validation_details["face_size_ok"] = face_size_ok
        
        # Check 4: Liveness detection (anti-spoofing)
        is_real, liveness_details = check_liveness_basic(image, face)
        validation_details["liveness"] = liveness_details
        
        if not is_real:
            quality_flag = low_res or not is_sharp or validation_details.get("brightness_status") != "good"
            if quality_flag:
                msg = "Image quality is too low to confirm liveness. Please retake with better lighting and move closer."
                img_quality = "low_res" if low_res else "good"
            else:
                msg = "Unable to confirm liveness. Please ensure you are not showing a photo/screen and make small movements."
                img_quality = "good"
            return FaceDetectionResult(
                has_face=True,
                face_count=1,
                is_centered=is_centered,
                face_size_ok=face_size_ok,
                is_real_image=False,
                image_quality=img_quality,
                is_valid=False,
                message=msg,
                bounding_box={
                    "x": face[0],
                    "y": face[1],
                    "width": face[2],
                    "height": face[3]
                },
                validation_details=to_native(validation_details)
            )
        
        # Build final response
        all_valid = is_centered and face_size_ok and is_real
        
        if not is_centered and not face_size_ok:
            message = "Center your face and move closer to the camera."
        elif not is_centered:
            message = "Please center your face in the frame."
        elif not face_size_ok:
            message = "Please move closer to the camera."
        elif all_valid:
            message = "Perfect! Face validated successfully."
        else:
            message = "Please adjust your position."
        
        return FaceDetectionResult(
            has_face=True,
            face_count=1,
            is_centered=is_centered,
            face_size_ok=face_size_ok,
            is_real_image=is_real,
            image_quality="good",
            is_valid=all_valid,
            message=message,
            bounding_box={
                "x": face[0],
                "y": face[1],
                "width": face[2],
                "height": face[3]
            },
            validation_details=to_native(validation_details)
        )
        
    except ValueError as e:
        logger.error(f"Face detection error: {e}")
        return FaceDetectionResult(
            has_face=False,
            face_count=0,
            is_centered=False,
            face_size_ok=False,
            is_real_image=False,
            image_quality="error",
            is_valid=False,
            message="Unable to process face image. Please try again.",
            validation_details=to_native(validation_details)
        )
    except Exception as e:
        logger.error(f"Face detection failed: {e}")
        raise HTTPException(status_code=400, detail="Face detection failed.")

@app.post("/api/face/register", response_model=FaceRegisterResponse)
async def register_face(request: FaceRegisterRequest):
    """
    STEP 2: Register a new face in the database
    
    Process:
    1. Decode image
    2. Detect face (ensure exactly 1 face)
    3. Generate face embedding
    4. Check for duplicates (1:N matching)
    5. Save to database if no duplicate
    """
    try:
        logger.info(f"Registration request for user: {request.name}")
        
        # Decode image
        image = decode_base64_image(request.image)
        
        # Detect face first
        detection = detect_faces_opencv(image)
        
        if not detection["has_face"]:
            return FaceRegisterResponse(
                success=False,
                message="No face detected. Please ensure your face is visible."
            )
        
        if detection["face_count"] > 1:
            return FaceRegisterResponse(
                success=False,
                message="Multiple faces detected. Please ensure only one face is visible."
            )
        
        # Check if user ID already registered
        if request.user_id in face_database:
            return FaceRegisterResponse(
                success=False,
                message=f"User ID '{request.user_id}' is already registered."
            )
        
        # Generate face embedding
        logger.info("Generating face embedding...")
        embedding = get_face_embedding(image)
        logger.info(f"Embedding generated: {len(embedding)} dimensions")
        
        # Check for duplicate face (1:N matching against existing faces)
        for existing_user_id, data in face_database.items():
            similarity = calculate_similarity(embedding, data["embedding"])
            logger.info(f"Similarity with {data['name']}: {similarity:.4f}")
            
            if similarity > DUPLICATE_THRESHOLD:
                return FaceRegisterResponse(
                    success=False,
                    message="This face is already registered. Duplicate registration not allowed."
                )
        
        # Save to database
        face_database[request.user_id] = {
            "name": request.name,
            "embedding": embedding,
            "registered_at": datetime.now().isoformat()
        }
        
        # Persist to file
        if not save_database():
            return FaceRegisterResponse(
                success=False,
                message="Registration failed. Could not save registration data."
            )
        
        logger.info(f"Successfully registered: {request.name}")
        return FaceRegisterResponse(
            success=True,
            message=f"Face registered successfully for {request.name}",
            user_id=request.user_id
        )
        
    except ValueError as e:
        logger.error(f"Registration error: {e}")
        return FaceRegisterResponse(
            success=False,
            message="Registration failed. Please submit a clearer image."
        )
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail="Registration failed.")

# ============================================
# NEW: DUPLICATE CHECK FOR RESIDENT REGISTRATION
# ============================================

def get_all_embeddings_from_mongodb():
    """
    Fetch all face embeddings from MongoDB for duplicate checking
    Collection: face_embeddings (dedicated for face recognition)
    """
    db = get_mongo_db()
    if db is None:
        return []
    
    try:
        # Get from dedicated face_embeddings collection
        embeddings = list(db.face_embeddings.find(
            {"embedding_vector": {"$exists": True}},
            {"_id": 1, "resident_id": 1, "name": 1, "first_name": 1, "last_name": 1, "embedding_vector": 1}
        ))
        return embeddings
    except Exception as e:
        logger.error(f"Failed to fetch embeddings from MongoDB: {e}")
        return []

def save_registration_log(log_data: dict):
    """
    Save a registration attempt log to MongoDB
    Collection: face_registration_logs
    """
    db = get_mongo_db()
    if db is None:
        logger.warning("MongoDB not available - log not saved")
        return None
    
    try:
        log_data["timestamp"] = datetime.now()
        result = db.face_registration_logs.insert_one(log_data)
        print(f"  Log saved to MongoDB: {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Failed to save registration log: {e}")
        return None

def save_face_embedding_to_mongodb(embedding_data: dict) -> Optional[str]:
    """
    Save face embedding to MongoDB
    Collection: face_embeddings (dedicated collection for face recognition)
    """
    db = get_mongo_db()
    if db is None:
        logger.warning("MongoDB not available - using in-memory storage")
        return None
    
    try:
        embedding_data["created_at"] = datetime.now()
        result = db.face_embeddings.insert_one(embedding_data)
        print(f"  Face embedding saved to MongoDB: {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Failed to save face embedding to MongoDB: {e}")
        return None

@app.post("/api/face/check-duplicate", response_model=DuplicateCheckResponse)
async def check_duplicate_face(request: DuplicateCheckRequest):
    """
    CHECK FOR DUPLICATE FACE DURING RESIDENT REGISTRATION
    
    This endpoint is called after photo capture to determine if registration should be allowed.
    
    Flow:
    1. Detect face in image
    2. Generate face embedding
    3. Compare against ALL registered residents in MongoDB
    4. Decision: ALLOW (no match) or BLOCK (duplicate found)
    5. Log the attempt
    6. If ALLOW: optionally save the resident
    
    Terminal Output Format:
    ========================
    Face Detected: Yes
    Best Match: Resident_03
    Similarity: 0.82
    Threshold: 0.75
    Decision: BLOCK (Duplicate)
    Processing Time: 214 ms
    ========================
    """
    start_time = time.time()
    
    # Default log entry
    log_entry = {
        "attempt_type": "ERROR",
        "best_match_resident_id": None,
        "similarity_score": None,
        "threshold_used": DUPLICATE_THRESHOLD,
        "decision": "ERROR",
        "processing_time_ms": 0,
        "resident_data": request.resident_data
    }
    
    try:
        print("\n" + "="*60)
        print("  DUPLICATE FACE CHECK - REGISTRATION")
        print("="*60)
        sys.stdout.flush()
        
        # Step 1: Decode image
        image = decode_base64_image(request.image)
        print(f"  Image decoded: {image.shape[1]}x{image.shape[0]} px")
        sys.stdout.flush()
        
        # Step 2: Detect face
        detection = detect_faces_opencv(image)
        
        if not detection["has_face"]:
            processing_time = int((time.time() - start_time) * 1000)
            log_entry.update({
                "attempt_type": "ERROR",
                "decision": "ERROR",
                "processing_time_ms": processing_time
            })
            save_registration_log(log_entry)
            
            print(f"  Face Detected: No")
            print(f"  Decision: ERROR (No face detected)")
            print(f"  Processing Time: {processing_time} ms")
            print("="*60 + "\n")
            
            return DuplicateCheckResponse(
                success=False,
                face_detected=False,
                decision="ERROR",
                similarity=0.0,
                threshold=DUPLICATE_THRESHOLD,
                processing_time_ms=processing_time,
                message="No face detected. Please ensure your face is clearly visible."
            )
        
        if detection["face_count"] > 1:
            processing_time = int((time.time() - start_time) * 1000)
            log_entry.update({
                "attempt_type": "ERROR",
                "decision": "ERROR",
                "processing_time_ms": processing_time
            })
            save_registration_log(log_entry)
            
            print(f"  Face Detected: Yes ({detection['face_count']} faces)")
            print(f"  Decision: ERROR (Multiple faces)")
            print(f"  Processing Time: {processing_time} ms")
            print("="*60 + "\n")
            
            return DuplicateCheckResponse(
                success=False,
                face_detected=True,
                decision="ERROR",
                similarity=0.0,
                threshold=DUPLICATE_THRESHOLD,
                processing_time_ms=processing_time,
                message=f"Multiple faces detected ({detection['face_count']}). Only one face should be visible."
            )
        
        # Step 3: Generate face embedding
        print("  Generating face embedding...")
        embedding = get_face_embedding(image)
        print(f"  Embedding generated: {len(embedding)} dimensions")
        
        # Step 4: Get all registered embeddings from MongoDB + in-memory
        registered_faces = get_all_embeddings_from_mongodb()
        
        # Also check in-memory database for backwards compatibility
        for user_id, data in face_database.items():
            registered_faces.append({
                "_id": user_id,
                "resident_id": user_id,
                "name": data.get("name", "Unknown"),
                "embedding_vector": data.get("embedding", [])
            })
        
        print(f"  Comparing against {len(registered_faces)} registered faces...")
        
        # Step 5: Find best match
        best_match = None
        best_similarity = 0.0
        
        for resident in registered_faces:
            stored_embedding = resident.get("embedding_vector", [])
            if not stored_embedding:
                continue
                
            similarity = calculate_similarity(embedding, stored_embedding)
            resident_name = resident.get("name") or f"{resident.get('first_name', '')} {resident.get('last_name', '')}".strip() or str(resident.get("_id", "Unknown"))
            
            print(f"    - {resident_name}: {similarity:.4f}")
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = {
                    "id": str(resident.get("_id", "")),
                    "resident_id": resident.get("resident_id", ""),
                    "name": resident_name
                }
        
        # Step 6: Make decision
        processing_time = int((time.time() - start_time) * 1000)
        
        if best_match and best_similarity >= DUPLICATE_THRESHOLD:
            # BLOCK - Duplicate detected
            decision = "BLOCK"
            message = "Face already registered."
            
            log_entry.update({
                "attempt_type": "BLOCK",
                "best_match_resident_id": best_match["id"],
                "similarity_score": round(best_similarity, 4),
                "decision": "BLOCK",
                "processing_time_ms": processing_time
            })
            save_registration_log(log_entry)
            
            # Terminal output - BLOCK
            print("-"*60)
            print(f"  Face Detected: Yes")
            print(f"  Best Match: {best_match['name']}")
            print(f"  Similarity: {best_similarity:.2f}")
            print(f"  Threshold: {DUPLICATE_THRESHOLD:.2f}")
            print(f"  Decision: BLOCK (Duplicate)")
            print(f"  Processing Time: {processing_time} ms")
            print("="*60 + "\n")
            sys.stdout.flush()
            
            return DuplicateCheckResponse(
                success=True,
                face_detected=True,
                decision="BLOCK",
                best_match_id=best_match["id"],
                best_match_name=None,
                similarity=round(best_similarity, 4),
                threshold=DUPLICATE_THRESHOLD,
                processing_time_ms=processing_time,
                message=message
            )
        else:
            # ALLOW - No duplicate found
            decision = "ALLOW"
            best_match_name = best_match["name"] if best_match else "None"
            best_match_id = best_match["id"] if best_match else None
            message = "No duplicate found. Registration allowed."
            
            # Save face embedding if resident_data provided
            embedding_id = None
            if request.resident_data:
                embedding_record = {
                    "resident_id": request.resident_data.get("resident_id", f"RES_{datetime.now().strftime('%Y%m%d%H%M%S')}"),
                    "first_name": request.resident_data.get("firstName", ""),
                    "last_name": request.resident_data.get("lastName", ""),
                    "name": f"{request.resident_data.get('firstName', '')} {request.resident_data.get('lastName', '')}".strip(),
                    "date_of_birth": request.resident_data.get("dateOfBirth", ""),
                    "gender": request.resident_data.get("gender", ""),
                    "mobile_number": request.resident_data.get("mobileNumber", ""),
                    "barangay": request.resident_data.get("barangay", ""),
                    "street_address": request.resident_data.get("streetAddress", ""),
                    "embedding_vector": embedding,
                    "face_image_path": "image not stored for privacy"
                }
                embedding_id = save_face_embedding_to_mongodb(embedding_record)
                
                # Also save to in-memory for backwards compatibility
                face_database[embedding_record["resident_id"]] = {
                    "name": embedding_record["name"],
                    "embedding": embedding,
                    "registered_at": datetime.now().isoformat()
                }
                save_database()
            
            log_entry.update({
                "attempt_type": "ALLOW",
                "best_match_resident_id": best_match_id,
                "similarity_score": round(best_similarity, 4) if best_similarity > 0 else None,
                "decision": "ALLOW",
                "processing_time_ms": processing_time,
                "registered_embedding_id": str(embedding_id) if embedding_id else None
            })
            save_registration_log(log_entry)
            
            # Terminal output - ALLOW
            print("-"*60)
            print(f"  Face Detected: Yes")
            print(f"  Best Match: {best_match_name}")
            print(f"  Similarity: {best_similarity:.2f}")
            print(f"  Threshold: {DUPLICATE_THRESHOLD:.2f}")
            print(f"  Decision: ALLOW (New Registration)")
            print(f"  Processing Time: {processing_time} ms")
            if embedding_id:
                print(f"  Embedding Saved: {embedding_id}")
            print("="*60 + "\n")
            sys.stdout.flush()
            
            return DuplicateCheckResponse(
                success=True,
                face_detected=True,
                decision="ALLOW",
                best_match_id=best_match_id,
                best_match_name=best_match_name if best_match else None,
                similarity=round(best_similarity, 4),
                threshold=DUPLICATE_THRESHOLD,
                processing_time_ms=processing_time,
                message=message,
                resident_id=str(embedding_id) if embedding_id else None,
                embedding=embedding
            )
    
    except ValueError as e:
        processing_time = int((time.time() - start_time) * 1000)
        log_entry.update({
            "attempt_type": "ERROR",
            "decision": "ERROR",
            "processing_time_ms": processing_time,
            "error": str(e)
        })
        save_registration_log(log_entry)
        
        logger.error(f"Duplicate check error: {e}")
        print(f"  Decision: ERROR")
        print(f"  Processing Time: {processing_time} ms")
        print("="*60 + "\n")
        
        return DuplicateCheckResponse(
            success=False,
            face_detected=False,
            decision="ERROR",
            similarity=0.0,
            threshold=DUPLICATE_THRESHOLD,
            processing_time_ms=processing_time,
            message="Unable to process face check. Please retry."
        )
    
    except Exception as e:
        processing_time = int((time.time() - start_time) * 1000)
        log_entry.update({
            "attempt_type": "ERROR",
            "decision": "ERROR",
            "processing_time_ms": processing_time,
            "error": str(e)
        })
        save_registration_log(log_entry)
        
        logger.error(f"Duplicate check failed: {e}")
        logger.info("="*60 + "\n")
        
        raise HTTPException(status_code=500, detail="Duplicate check failed.")

@app.get("/api/face/registration-logs")
async def get_registration_logs(limit: int = 50):
    """
    Get recent registration attempt logs
    """
    db = get_mongo_db()
    if db is None:
        return {"logs": [], "count": 0, "message": "MongoDB not connected"}
    
    try:
        logs = list(db.face_registration_logs.find().sort("timestamp", -1).limit(limit))
        # Convert ObjectId to string
        for log in logs:
            log["_id"] = str(log["_id"])
            if log.get("best_match_resident_id"):
                log["best_match_resident_id"] = str(log["best_match_resident_id"])
        
        return {"logs": logs, "count": len(logs)}
    except Exception as e:
        logger.error(f"Failed to fetch logs: {e}")
        return {"logs": [], "count": 0, "message": "Unable to fetch logs."}

@app.get("/api/face/residents")
async def get_residents(limit: int = 100):
    """
    Get registered residents from face_embeddings collection (without embedding vectors for security)
    """
    db = get_mongo_db()
    if db is None:
        # Fall back to in-memory database
        users = []
        for user_id, data in face_database.items():
            users.append({
                "resident_id": user_id,
                "name": data["name"],
                "registered_at": data["registered_at"]
            })
        return {"residents": users, "count": len(users), "source": "in-memory"}
    
    try:
        residents = list(db.face_embeddings.find(
            {},
            {"embedding_vector": 0}  # Exclude embedding for security
        ).sort("created_at", -1).limit(limit))
        
        # Convert ObjectId to string
        for r in residents:
            r["_id"] = str(r["_id"])
        
        return {"residents": residents, "count": len(residents), "source": "mongodb"}
    except Exception as e:
        logger.error(f"Failed to fetch residents: {e}")
        return {"residents": [], "count": 0, "message": "Unable to fetch residents."}

@app.post("/api/face/verify", response_model=FaceVerifyResponse)
async def verify_face(request: FaceVerifyRequest):
    """
    STEP 3: Verify face against all registered faces (1:N matching)
    
    Process:
    1. Decode image
    2. Detect face (ensure exactly 1 face)
    3. Generate face embedding
    4. Compare against ALL registered faces
    5. Find best match above threshold
    6. Return "Verified" or "Not Recognized"
    """
    try:
        logger.info("Verification request received")
        
        # Check if database is empty
        if len(face_database) == 0:
            return FaceVerifyResponse(
                verified=False,
                confidence=0.0,
                message="No faces registered in the system yet."
            )
        
        # Decode image
        image = decode_base64_image(request.image)
        
        # Detect face first
        detection = detect_faces_opencv(image)
        
        if not detection["has_face"]:
            return FaceVerifyResponse(
                verified=False,
                confidence=0.0,
                message="No face detected. Please position your face properly."
            )
        
        if detection["face_count"] > 1:
            return FaceVerifyResponse(
                verified=False,
                confidence=0.0,
                message="Multiple faces detected. Please ensure only one face is visible."
            )
        
        # Generate face embedding
        logger.info("Generating face embedding for verification...")
        embedding = get_face_embedding(image)
        
        # 1:N Matching - Compare against all registered faces
        best_match = None
        best_similarity = 0.0
        
        logger.info(f"Comparing against {len(face_database)} registered faces...")
        for user_id, data in face_database.items():
            similarity = calculate_similarity(embedding, data["embedding"])
            logger.info(f"  - {data['name']}: {similarity:.4f}")
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = {
                    "user_id": user_id,
                    "name": data["name"],
                    "similarity": similarity
                }
        
        # Check if best match exceeds threshold
        confidence_percent = round(best_similarity * 100, 2)
        
        if best_match and best_similarity >= FACE_MATCH_THRESHOLD:
            logger.info(f"✅ Verified as {best_match['name']} ({confidence_percent}%)")
            return FaceVerifyResponse(
                verified=True,
                user_id=best_match["user_id"],
                name=best_match["name"],
                confidence=confidence_percent,
                message=f"✅ Verified: {best_match['name']}"
            )
        else:
            logger.info(f"❌ Not recognized (best: {confidence_percent}%)")
            return FaceVerifyResponse(
                verified=False,
                confidence=confidence_percent,
                message="❌ Not Recognized: Face does not match any registered user."
            )
        
    except ValueError as e:
        logger.error(f"Verification error: {e}")
        return FaceVerifyResponse(
            verified=False,
            confidence=0.0,
            message="Unable to verify this image. Please try again."
        )
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        raise HTTPException(status_code=500, detail="Verification failed.")

@app.get("/api/face/registered-users")
async def get_registered_users():
    """
    Get list of all registered users (without embeddings for security)
    """
    users = []
    for user_id, data in face_database.items():
        users.append({
            "user_id": user_id,
            "name": data["name"],
            "registered_at": data["registered_at"]
        })
    
    return {
        "users": users, 
        "count": len(users)
    }

@app.delete("/api/face/user/{user_id}")
async def delete_user(user_id: str):
    """
    Delete a registered user from the database
    """
    if user_id not in face_database:
        raise HTTPException(status_code=404, detail="User not found")
    
    deleted_name = face_database[user_id]["name"]
    del face_database[user_id]
    save_database()
    
    logger.info(f"Deleted user: {deleted_name} ({user_id})")
    return {
        "success": True, 
        "message": f"User '{deleted_name}' deleted successfully"
    }

@app.delete("/api/face/clear-all")
async def clear_all_users():
    """
    Clear all registered users (for testing)
    """
    count = len(face_database)
    face_database.clear()
    save_database()
    
    logger.info(f"Cleared all {count} users from database")
    return {
        "success": True,
        "message": f"Cleared {count} users from database"
    }

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("  FACE RECOGNITION API SERVER")
    print("="*60)
    print(f"  Model: {MODEL_NAME}")
    print(f"  Detector: {DETECTOR_BACKEND}")
    print(f"  Match Threshold: {FACE_MATCH_THRESHOLD}")
    print(f"  Duplicate Threshold: {DUPLICATE_THRESHOLD}")
    print(f"  Registered Users: {len(face_database)}")
    print("="*60)
    
    # Test MongoDB connection at startup
    print("  Testing MongoDB connection...")
    db = get_mongo_db()
    if db is not None:
        try:
            residents_count = db.residents.count_documents({})
            logs_count = db.face_registration_logs.count_documents({})
            print(f"  ✓ MongoDB Connected: {MONGODB_DB_NAME}")
            print(f"  ✓ Residents in DB: {residents_count}")
            print(f"  ✓ Registration Logs: {logs_count}")
        except Exception as e:
            print(f"  ✗ MongoDB Error: {e}")
    else:
        print(f"  ✗ MongoDB Not Connected (using in-memory storage)")
    
    print("="*60)
    print("  API Docs: http://localhost:8000/docs")
    print("  Duplicate Check: POST /api/face/check-duplicate")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
