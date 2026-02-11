# Kapit-Bisig Backend Setup Guide

Complete guide for running the Python Face Recognition backend and generating household registration tokens.

---

## Table of Contents

1. [Python Backend Setup](#1-python-backend-setup)
2. [Running the Face Recognition API](#2-running-the-face-recognition-api)
3. [Generating Household Tokens](#3-generating-household-tokens)
4. [Environment Variables](#4-environment-variables)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Python Backend Setup

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- MongoDB Atlas account (or local MongoDB)

### Installation Steps

```powershell
# 1. Navigate to the backend folder
cd d:\kapit-bisig\backend

# 2. Create a virtual environment (recommended)
python -m venv venv

# 3. Activate the virtual environment
.\venv\Scripts\Activate

# 4. Install dependencies
pip install -r requirements.txt
```

### Dependencies Installed

| Package | Purpose |
|---------|---------|
| `fastapi` | REST API framework |
| `uvicorn` | ASGI server |
| `opencv-python` | Face detection (Haar Cascade) |
| `deepface` | Face recognition & embeddings |
| `numpy` | Numerical operations |
| `onnxruntime` | CPU optimization for faster inference |

---

## 2. Running the Face Recognition API

### Option A: Direct Python Run

```powershell
cd d:\kapit-bisig\backend
.\venv\Scripts\Activate
python main.py
```

### Option B: Using Uvicorn (with hot reload for development)

```powershell
cd d:\kapit-bisig\backend
.\venv\Scripts\Activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Expected Output

```
INFO:     Pre-loading Facenet model...
INFO:     Model pre-loaded successfully!
INFO:     Database loaded with X users
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Verify API is Running

Open your browser and navigate to:
- **Health Check:** http://localhost:8000/
- **API Documentation:** http://localhost:8000/docs

---

## 3. Generating Household Tokens

Tokens are required for household registration in the mobile app.

### Navigate to Web App Server

```powershell
cd d:\kapit-bisig\apps\web\apps
```

### Option A: Generate Tokens (Simple JavaScript)

```powershell
# Generate 10 tokens (distributed across all barangays)
node server/scripts/generateTestTokenSimple.js

# Generate specific number of tokens
node server/scripts/generateTestTokenSimple.js 20

# Generate tokens for a specific barangay
node server/scripts/generateTestTokenSimple.js 5 "San Jose"
```

### Option B: Generate Tokens (TypeScript)

```powershell
npx ts-node server/scripts/generateTestToken.ts
```

### Available Barangays

| # | Barangay |
|---|----------|
| 1 | Bolo |
| 2 | Bongalon |
| 3 | Dulig |
| 4 | Laois |
| 5 | Magsaysay |
| 6 | Poblacion |
| 7 | San Gonzalo |
| 8 | San Jose |
| 9 | Tobuan |
| 10 | Uyong |

### Sample Output

```
🎫 Household Token Generator

============================================================
📋 Generated Household Registration Tokens:

   Token #1
   🎫 CODE: A1B2-C3D4-E5F6
   📍 Barangay: Bolo
   📅 Expires: 3/11/2026

   Token #2
   🎫 CODE: G7H8-I9J0-K1L2
   📍 Barangay: Bongalon
   📅 Expires: 3/11/2026
============================================================

✅ Give these codes to households for registration!
💡 Each code is ONE-TIME USE only - first to register wins.
⚠️  Tokens must match the selected barangay during registration.
```

### Token Format

- **Format:** `XXXX-XXXX-XXXX` (12 alphanumeric characters)
- **Validity:** 30 days from generation
- **Usage:** One-time use per household

---

## 4. Environment Variables

### Python Backend (`backend/.env`)

```env
# Face Recognition Settings
FACE_MATCH_THRESHOLD=0.65      # Similarity threshold for verification
DUPLICATE_THRESHOLD=0.70        # Threshold for duplicate detection
MIN_FACE_SIZE=100               # Minimum face size in pixels
MODEL_NAME=Facenet              # DeepFace model (Facenet, VGG-Face, ArcFace)
DETECTOR_BACKEND=opencv         # Face detector (opencv, retinaface, mtcnn)
BLUR_THRESHOLD=30               # Image sharpness threshold
MAX_IMAGE_DIM=800               # Max image dimension (resize for speed)
```

### Web App Server (`apps/web/apps/.env.local`)

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kapit-bisig

# Server Settings
PORT=3001
```

---

## 5. Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'fastapi'`

**Solution:** Activate virtual environment first

```powershell
cd d:\kapit-bisig\backend
.\venv\Scripts\Activate
pip install -r requirements.txt
```

### Issue: Face recognition is slow

**Solution:** Enable CPU optimizations

```powershell
pip install onnxruntime
```

Set environment variables for smaller images:
```env
MAX_IMAGE_DIM=640
DETECTOR_BACKEND=opencv
```

### Issue: MongoDB connection failed

**Solution:** Check your `.env.local` file has correct MongoDB URI

```powershell
cd d:\kapit-bisig\apps\web\apps
cat .env.local | Select-String "MONGODB"
```

### Issue: Token generation fails

**Solution:** Ensure MongoDB is accessible

```powershell
# Test MongoDB connection
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig').then(() => console.log('Connected!')).catch(e => console.error(e))"
```

---

## Quick Start Summary

```powershell
# Terminal 1: Run Python Backend
cd d:\kapit-bisig\backend
.\venv\Scripts\Activate
python main.py

# Terminal 2: Generate Tokens
cd d:\kapit-bisig\apps\web\apps
node server/scripts/generateTestTokenSimple.js 10
```

---

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/health` | GET | Detailed health status |
| `/api/face/detect` | POST | Detect face in image |
| `/api/face/register` | POST | Register new face |
| `/api/face/verify` | POST | Verify face against database |

---

*Last Updated: February 2026*
