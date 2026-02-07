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

FACE_MATCH_THRESHOLD = 0.65  # Similarity threshold for verification
DUPLICATE_THRESHOLD = 0.70   # Threshold for duplicate detection during registration
MIN_FACE_SIZE = 100          # Minimum face size in pixels
MODEL_NAME = "Facenet"       # DeepFace model: Facenet, VGG-Face, OpenFace, etc.
DETECTOR_BACKEND = "opencv"  # opencv, ssd, mtcnn, retinaface

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

def save_database():
    """Save face database to file"""
    try:
        with open(EMBEDDINGS_FILE, 'w') as f:
            json.dump(face_database, f, indent=2)
        logger.info(f"Database saved with {len(face_database)} users")
    except Exception as e:
        logger.error(f"Failed to save database: {e}")

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
    
    return image

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
    
    return is_centered_x and is_centered_y

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
    return min_ratio <= ratio <= max_ratio

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
    
    # Higher value = sharper image. Threshold around 100
    BLUR_THRESHOLD = 50
    is_sharp = laplacian_var > BLUR_THRESHOLD
    
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
    if color_variance > 12:  # Lowered from 20
        score += 1
    
    # Check 2: Texture analysis (real skin has texture)
    # Lowered threshold for compressed images
    gray_face = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
    laplacian = cv2.Laplacian(gray_face, cv2.CV_64F)
    texture_score = np.std(laplacian)
    details["texture_score"] = float(texture_score)
    if texture_score > 5:  # Lowered from 10
        score += 1
    
    # Check 3: Edge density (screens often have sharp edges/moiré)
    # Widened range for natural variation
    edges = cv2.Canny(gray_face, 50, 150)
    edge_density = np.sum(edges > 0) / edges.size
    details["edge_density"] = float(edge_density)
    if 0.02 < edge_density < 0.5:  # Widened from 0.05-0.4
        score += 1
    
    # Check 4: Reflection detection (screens have uniform reflections)
    # Increased tolerance for phone flash/lighting
    bright_spots = np.sum(gray_face > 240) / gray_face.size
    details["bright_spots_ratio"] = float(bright_spots)
    if bright_spots < 0.10:  # Increased from 0.05
        score += 1
    
    # Check 5: Color channel correlation (real images have natural correlation)
    # Widened range for different skin tones and lighting
    b, g, r = cv2.split(face_region)
    rg_corr = np.corrcoef(r.flatten(), g.flatten())[0,1]
    details["color_correlation"] = float(rg_corr) if not np.isnan(rg_corr) else 0
    if 0.5 < abs(rg_corr) < 1.0:  # Widened from 0.7-0.99
        score += 1
    
    details["liveness_score"] = score
    details["max_score"] = max_score
    details["confidence"] = float(score / max_score * 100)
    
    # Require at least 2/5 checks to pass (lenient for registration)
    is_real = score >= 2
    
    return is_real, details

def get_face_embedding(image: np.ndarray) -> list:
    """
    Generate face embedding using DeepFace
    
    Args:
        image: OpenCV image (BGR format)
        
    Returns:
        128-dimensional face embedding vector (for Facenet)
    """
    try:
        # DeepFace.represent expects BGR image (OpenCV format)
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
    return {
        "status": "healthy",
        "model": MODEL_NAME,
        "detector": DETECTOR_BACKEND,
        "registered_users": len(face_database),
        "threshold": FACE_MATCH_THRESHOLD
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
    try:
        logger.info("Face detection request received")
        
        # Decode image
        image = decode_base64_image(request.image)
        logger.info(f"Image decoded: {image.shape}")
        
        validation_details = {}
        
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
                validation_details=validation_details
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
                validation_details=validation_details
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
                validation_details=validation_details
            )
        
        # Check 3: Detect faces using OpenCV
        detection = detect_faces_opencv(image)
        
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
                validation_details=validation_details
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
                validation_details=validation_details
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
            return FaceDetectionResult(
                has_face=True,
                face_count=1,
                is_centered=is_centered,
                face_size_ok=face_size_ok,
                is_real_image=False,
                image_quality="good",
                is_valid=False,
                message="Please use a real face, not a photo or screen.",
                bounding_box={
                    "x": face[0],
                    "y": face[1],
                    "width": face[2],
                    "height": face[3]
                },
                validation_details=validation_details
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
            validation_details=validation_details
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
            message=str(e)
        )
    except Exception as e:
        logger.error(f"Face detection failed: {e}")
        raise HTTPException(status_code=400, detail=f"Face detection failed: {str(e)}")

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
                    message=f"This face is already registered under '{data['name']}'. Duplicate registration not allowed."
                )
        
        # Save to database
        face_database[request.user_id] = {
            "name": request.name,
            "embedding": embedding,
            "registered_at": datetime.now().isoformat()
        }
        
        # Persist to file
        save_database()
        
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
            message=str(e)
        )
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

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
            message=str(e)
        )
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

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
    print(f"  Registered Users: {len(face_database)}")
    print("="*60)
    print("  API Docs: http://localhost:8000/docs")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
