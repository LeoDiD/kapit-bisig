# API Documentation

This document covers the active API surfaces in this repository:
- Express API (`apps/web/apps/server`) on port `3001`
- FastAPI Face Recognition API (`backend/main.py`) on port `8000`

## 1. Express API (Node/Express)

Base URL: `http://localhost:3001`

Mounted route groups from `apps/web/apps/server/index.ts`:
- `GET /api/health`
- `/api/auth` (unified auth routes)
- `/api/sa` (superadmin auth)
- `/api/admin/users`
- `/api/users`
- `/api/residents`
- `/api/face`
- `/api/household`
- `/api/admin/tokens`
- `/api/distributions` (protected)
- `/api/claims` (protected)
- `/api/households` (protected)
- `/api/beneficiaries`

### Express Face Routes

From `apps/web/apps/server/routes/faceRoutes.ts`:
- `POST /api/face/detect`
- `POST /api/face/compare`
- `POST /api/face/descriptor`
- `POST /api/face/verify`
- `GET /api/face/health`
- `POST /api/face/check-duplicate`

### Express Target Beneficiary Routes

Base path: `http://localhost:3001/api/beneficiaries`

- `GET /events`
- `GET /events/active`
- `POST /events`
- `POST /proof-submissions`
- `GET /admin/proof-submissions`
- `PATCH /admin/proof-submissions/:id/review`
- `POST /scan/validate`
- `POST /scan/claim`
- `GET /events/:id/offline-pack`
- `POST /sync/proof-submissions`
- `POST /sync/claims`

See `docs/TARGET_BENEFICIARY_IMPLEMENTATION.md` for request/response rules and event-scoped beneficiary logic.

## 2. FastAPI Face Recognition API (Python)

Base URL: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

### 2.1 Health and Status

#### `GET /`
Basic status check.

Response:
```json
{
  "status": "ok",
  "message": "Face Recognition API is running",
  "registered_users": 0
}
```

#### `GET /api/health`
Detailed health and configuration snapshot.

Response includes:
- model/detector in use
- duplicate and verification thresholds
- MongoDB connectivity and counts

### 2.2 Face Detection and Validation

#### `POST /api/face/detect`
Validate a face image before registration/verification.

Request body:
```json
{
  "image": "<base64-image>"
}
```

Key response fields:
- `has_face`
- `face_count`
- `is_centered`
- `face_size_ok`
- `is_real_image`
- `image_quality`
- `is_valid`
- `message`
- `bounding_box`
- `validation_details`

### 2.3 Registration and Duplicate Checks

#### `POST /api/face/register`
Register a face in the in-memory/file-backed database.

Request body:
```json
{
  "image": "<base64-image>",
  "user_id": "USER_001",
  "name": "Juan Dela Cruz"
}
```

Response:
```json
{
  "success": true,
  "message": "Face registered successfully for Juan Dela Cruz",
  "user_id": "USER_001"
}
```

#### `POST /api/face/check-duplicate`
Checks whether a captured face already exists (MongoDB + in-memory fallback), then returns `ALLOW`, `BLOCK`, or `ERROR`.

Request body:
```json
{
  "image": "<base64-image>",
  "resident_data": {
    "resident_id": "RES_001",
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    "mobileNumber": "09123456789",
    "barangay": "Sample Barangay",
    "streetAddress": "Sample Street"
  }
}
```

Response fields:
- `success`
- `face_detected`
- `decision` (`ALLOW` | `BLOCK` | `ERROR`)
- `best_match_id`
- `best_match_name`
- `similarity`
- `threshold`
- `processing_time_ms`
- `message`
- `resident_id` (when saved)
- `embedding` (ALLOW path currently returns embedding)

### 2.4 Verification

#### `POST /api/face/verify`
Verifies a submitted face against registered in-memory faces.

Request body:
```json
{
  "image": "<base64-image>"
}
```

Response:
```json
{
  "verified": true,
  "user_id": "USER_001",
  "name": "Juan Dela Cruz",
  "confidence": 89.52,
  "message": "Verified: Juan Dela Cruz"
}
```

### 2.5 Management Endpoints

- `GET /api/face/registration-logs?limit=50`
- `GET /api/face/residents?limit=100`
- `GET /api/face/registered-users`
- `DELETE /api/face/user/{user_id}`
- `DELETE /api/face/clear-all`

## 3. Environment Variables (Face API)

Defined in `backend/.env.example` and consumed in `backend/main.py`:
- `FACE_MATCH_THRESHOLD`
- `DUPLICATE_THRESHOLD`
- `MIN_FACE_SIZE`
- `MODEL_NAME`
- `DETECTOR_BACKEND`
- `DETECTOR_FOR_DETECT`
- `BLUR_THRESHOLD`
- `LIVENESS_MIN_PASSES`
- `LOW_RES_THRESHOLD`
- `MAX_IMAGE_DIM`
- `MONGODB_URI`
- `MONGODB_DB_NAME`

## 4. Notes for Clients

- Images are expected as base64 strings.
- Keep request payload limits in mind for high-resolution images.
- For local network testing on phone devices, update URLs using `docs/WIFI_IP_CHANGE_CHECKLIST.md`.
