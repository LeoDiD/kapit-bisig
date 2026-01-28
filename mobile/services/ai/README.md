# AI Verification Services

This module provides AI-powered identity verification using:
- **Tesseract OCR** for ID document text extraction
- **face-api.js** for face detection and recognition

## Features

### ID Validation
- Document quality checks (brightness, blur, contrast)
- Text extraction using OCR
- ID format validation for Philippine IDs:
  - Philippine National ID
  - Driver's License
  - Passport
  - SSS ID
  - PhilHealth ID
  - Voter's ID
- Expiry date detection
- Data comparison with user input

### Face Recognition
- Face detection with confidence scoring
- Face quality assessment
- Liveness detection (anti-spoofing)
- Face matching between selfie and ID photo
- Face descriptor extraction for storage

## Architecture

```
services/
├── ai/
│   ├── IDValidationService.ts    # OCR and ID validation
│   ├── FaceRecognitionService.ts # Face detection and matching
│   ├── AIVerificationService.ts  # Combined verification orchestrator
│   └── index.ts                  # Exports
├── api/
│   └── VerificationAPIService.ts # Backend API communication

components/
├── verification/
│   ├── IDScanner.tsx            # ID capture with AI feedback
│   ├── FaceScanner.tsx          # Face capture with liveness
│   ├── VerificationOverlay.tsx  # Progress overlay
│   └── index.ts                 # Exports

hooks/
├── useAIVerification.ts         # React hook for verification
└── index.ts                     # Exports
```

## Usage

### Basic Usage with Hook

```tsx
import { useAIVerification } from '../hooks';

function RegisterScreen() {
  const {
    isInitialized,
    isLoading,
    progress,
    result,
    error,
    initialize,
    startSession,
    validateFrontId,
    validateBackId,
    validateFace,
    performFullVerification,
  } = useAIVerification();

  useEffect(() => {
    initialize();
  }, []);

  const handleVerify = async () => {
    startSession();
    
    // Individual validations
    const frontResult = await validateFrontId(frontIdUri, 'Philippine National ID');
    const backResult = await validateBackId(backIdUri, 'Philippine National ID');
    const faceResult = await validateFace(selfieUri);

    // Or full verification
    const result = await performFullVerification(
      frontIdUri,
      backIdUri,
      selfieUri,
      'Philippine National ID',
      {
        fullName: 'Juan Dela Cruz',
        dateOfBirth: '01/15/1990',
        idNumber: '1234567890',
      }
    );

    if (result.isVerified) {
      // Success!
    }
  };
}
```

### Using Components

```tsx
import { IDScanner, FaceScanner, VerificationOverlay } from '../components/verification';
import { useAIVerification } from '../hooks';

function VerificationFlow() {
  const { validateFrontId, validateFace, isLoading, progress, currentStep } = useAIVerification();
  const [showIdScanner, setShowIdScanner] = useState(false);
  const [showFaceScanner, setShowFaceScanner] = useState(false);

  return (
    <>
      <IDScanner
        visible={showIdScanner}
        side="front"
        idType="Philippine National ID"
        onCapture={validateFrontId}
        onComplete={(uri, result) => {
          console.log('ID validated:', result);
          setShowIdScanner(false);
        }}
        onCancel={() => setShowIdScanner(false)}
      />

      <FaceScanner
        visible={showFaceScanner}
        onCapture={validateFace}
        onComplete={(uri, result) => {
          console.log('Face validated:', result);
          setShowFaceScanner(false);
        }}
        onCancel={() => setShowFaceScanner(false)}
        enableLivenessCheck={true}
      />

      <VerificationOverlay
        visible={isLoading}
        currentStep={currentStep}
        progress={progress}
        isProcessing={true}
      />
    </>
  );
}
```

## Backend Setup

For production, you need a backend server with OCR and face recognition capabilities.

### Option 1: Node.js Backend with face-api.js and Tesseract

```javascript
// server.js
const express = require('express');
const faceapi = require('face-api.js');
const Tesseract = require('tesseract.js');
const canvas = require('canvas');

// Configure face-api.js for Node.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load face-api.js models
await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');

app.post('/api/ocr', async (req, res) => {
  const { image, language } = req.body;
  const buffer = Buffer.from(image, 'base64');
  
  const result = await Tesseract.recognize(buffer, language);
  res.json({
    success: true,
    text: result.data.text,
    confidence: result.data.confidence / 100,
  });
});

app.post('/api/face/detect', async (req, res) => {
  const { image } = req.body;
  const buffer = Buffer.from(image, 'base64');
  const img = await canvas.loadImage(buffer);
  
  const detections = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors();
  
  res.json({
    success: true,
    hasFace: detections.length > 0,
    faceCount: detections.length,
    faces: detections.map(d => ({
      boundingBox: d.detection.box,
      confidence: d.detection.score,
      landmarks: d.landmarks,
      descriptor: Array.from(d.descriptor),
    })),
  });
});

app.post('/api/face/compare', async (req, res) => {
  const { image1, image2 } = req.body;
  // ... face comparison logic
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  
  res.json({
    success: true,
    isMatch: distance < 0.6,
    distance,
    confidence: 1 - distance,
  });
});
```

### Option 2: Cloud Services

- **Google Cloud Vision API** for OCR
- **AWS Rekognition** for face detection and matching
- **Azure Face API** for face verification

### Option 3: Mobile-only (Limited)

For a simpler setup without backend:
- Use `expo-face-detector` for basic face detection
- Use cloud Vision APIs directly from the app
- Note: This exposes API keys in the client

## Environment Variables

```env
# .env
EXPO_PUBLIC_API_URL=https://your-backend-url.com/api
```

## Models Required for Backend

Download face-api.js models from:
https://github.com/justadudewhohacks/face-api.js-models

Required models:
- `ssd_mobilenetv1_model-weights_manifest.json`
- `face_landmark_68_model-weights_manifest.json`
- `face_recognition_model-weights_manifest.json`

## Security Considerations

1. **Never store face descriptors in plain text** - encrypt them
2. **Use HTTPS** for all API communications
3. **Validate images server-side** to prevent manipulation
4. **Rate limit** verification requests
5. **Log verification attempts** for audit trails
6. **Delete images** after verification (don't store)

## Error Handling

The services include comprehensive error handling:

```typescript
try {
  const result = await aiVerificationService.performFullVerification(...);
  
  if (!result.isVerified) {
    // Check specific issues
    result.riskFactors.forEach(factor => console.log(factor));
    result.recommendations.forEach(rec => console.log(rec));
  }
} catch (error) {
  // Network or processing error
  console.error('Verification failed:', error);
}
```

## Testing

For development/testing, the services include simulation modes:
- Set `YOUR_API_ENDPOINT` to trigger fallback simulations
- Simulated results return successful verification

## License

MIT
