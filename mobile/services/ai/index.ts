/**
 * AI Services Index
 * Export all AI-related services and types
 */

// Services
export { idValidationService, default as IDValidationService } from './IDValidationService';
export { faceRecognitionService, default as FaceRecognitionService } from './FaceRecognitionService';
export { aiVerificationService, default as AIVerificationService } from './AIVerificationService';

// Types from ID Validation
export type {
  IDValidationResult,
  ExtractedIDData,
  ImageQualityResult,
} from './IDValidationService';

// Types from Face Recognition
export type {
  FaceDetectionResult,
  BoundingBox,
  FaceLandmarks,
  Point,
  FaceMatchResult,
  LivenessResult,
  FaceDescriptor,
  FaceValidationResult,
} from './FaceRecognitionService';

// Types from AI Verification
export type {
  VerificationSession,
  VerificationStatus,
  VerificationStepResult,
  VerificationStep,
  VerificationResult,
  VerificationConfig,
} from './AIVerificationService';
