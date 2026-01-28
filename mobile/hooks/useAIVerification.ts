/**
 * useAIVerification Hook
 * React hook for AI-powered identity verification
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  aiVerificationService,
  idValidationService,
  faceRecognitionService,
  VerificationSession,
  VerificationResult,
  VerificationStep,
  IDValidationResult,
  FaceValidationResult,
  FaceDetectionResult,
} from '../services/ai';

export interface AIVerificationState {
  isInitialized: boolean;
  isLoading: boolean;
  currentStep: VerificationStep | null;
  progress: number;
  session: VerificationSession | null;
  result: VerificationResult | null;
  error: string | null;
  
  // Individual results
  frontIdResult: IDValidationResult | null;
  backIdResult: IDValidationResult | null;
  faceValidation: FaceValidationResult | null;
  faceInIdResult: FaceDetectionResult | null;
}

export interface AIVerificationActions {
  initialize: () => Promise<void>;
  startSession: () => void;
  validateFrontId: (imageUri: string, idType: string) => Promise<IDValidationResult>;
  validateBackId: (imageUri: string, idType: string) => Promise<IDValidationResult>;
  validateFace: (imageUri: string) => Promise<FaceValidationResult>;
  detectFaceInId: (imageUri: string) => Promise<FaceDetectionResult>;
  performFullVerification: (
    frontIdUri: string,
    backIdUri: string,
    selfieUri: string,
    idType: string,
    userData: { fullName: string; dateOfBirth: string; idNumber: string }
  ) => Promise<VerificationResult>;
  reset: () => void;
  endSession: () => void;
}

export type UseAIVerificationReturn = AIVerificationState & AIVerificationActions;

export function useAIVerification(): UseAIVerificationReturn {
  const [state, setState] = useState<AIVerificationState>({
    isInitialized: false,
    isLoading: false,
    currentStep: null,
    progress: 0,
    session: null,
    result: null,
    error: null,
    frontIdResult: null,
    backIdResult: null,
    faceValidation: null,
    faceInIdResult: null,
  });

  const initializingRef = useRef(false);

  // Initialize services
  const initialize = useCallback(async () => {
    if (state.isInitialized || initializingRef.current) return;
    
    initializingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await aiVerificationService.initialize();
      setState(prev => ({ 
        ...prev, 
        isInitialized: true, 
        isLoading: false 
      }));
    } catch (error) {
      console.error('[useAIVerification] Initialization failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to initialize AI services' 
      }));
    } finally {
      initializingRef.current = false;
    }
  }, [state.isInitialized]);

  // Start a new session
  const startSession = useCallback(() => {
    const session = aiVerificationService.startSession();
    setState(prev => ({ 
      ...prev, 
      session, 
      result: null,
      error: null,
      progress: 0,
      currentStep: null,
      frontIdResult: null,
      backIdResult: null,
      faceValidation: null,
      faceInIdResult: null,
    }));
  }, []);

  // Validate front ID
  const validateFrontId = useCallback(async (
    imageUri: string, 
    idType: string
  ): Promise<IDValidationResult> => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      currentStep: 'id_front_capture' 
    }));

    try {
      const result = await aiVerificationService.quickValidateID(imageUri, idType, 'front');
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        frontIdResult: result,
        progress: 25,
      }));
      return result;
    } catch (error) {
      const errorMsg = 'Failed to validate front ID';
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      throw new Error(errorMsg);
    }
  }, []);

  // Validate back ID
  const validateBackId = useCallback(async (
    imageUri: string, 
    idType: string
  ): Promise<IDValidationResult> => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      currentStep: 'id_back_capture' 
    }));

    try {
      const result = await aiVerificationService.quickValidateID(imageUri, idType, 'back');
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        backIdResult: result,
        progress: 50,
      }));
      return result;
    } catch (error) {
      const errorMsg = 'Failed to validate back ID';
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      throw new Error(errorMsg);
    }
  }, []);

  // Validate face
  const validateFace = useCallback(async (
    imageUri: string
  ): Promise<FaceValidationResult> => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      currentStep: 'face_quality_check' 
    }));

    try {
      const result = await aiVerificationService.quickValidateFace(imageUri);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        faceValidation: result,
        progress: 75,
      }));
      return result;
    } catch (error) {
      const errorMsg = 'Failed to validate face';
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      throw new Error(errorMsg);
    }
  }, []);

  // Detect face in ID
  const detectFaceInId = useCallback(async (
    imageUri: string
  ): Promise<FaceDetectionResult> => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
    }));

    try {
      const result = await aiVerificationService.detectFaceInID(imageUri);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        faceInIdResult: result,
      }));
      return result;
    } catch (error) {
      const errorMsg = 'Failed to detect face in ID';
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      throw new Error(errorMsg);
    }
  }, []);

  // Perform full verification
  const performFullVerification = useCallback(async (
    frontIdUri: string,
    backIdUri: string,
    selfieUri: string,
    idType: string,
    userData: { fullName: string; dateOfBirth: string; idNumber: string }
  ): Promise<VerificationResult> => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      progress: 0,
    }));

    try {
      const result = await aiVerificationService.performFullVerification(
        frontIdUri,
        backIdUri,
        selfieUri,
        idType,
        userData,
        (step, progress) => {
          setState(prev => ({ 
            ...prev, 
            currentStep: step, 
            progress 
          }));
        }
      );

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        result,
        progress: 100,
        session: aiVerificationService.getCurrentSession(),
      }));

      return result;
    } catch (error) {
      const errorMsg = 'Verification failed. Please try again.';
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      throw new Error(errorMsg);
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      currentStep: null,
      progress: 0,
      result: null,
      error: null,
      frontIdResult: null,
      backIdResult: null,
      faceValidation: null,
      faceInIdResult: null,
    }));
  }, []);

  // End session
  const endSession = useCallback(() => {
    aiVerificationService.endSession();
    reset();
    setState(prev => ({ ...prev, session: null }));
  }, [reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't dispose services on unmount as they might be used elsewhere
      // Just end the current session if any
      if (aiVerificationService.getCurrentSession()) {
        aiVerificationService.endSession();
      }
    };
  }, []);

  return {
    ...state,
    initialize,
    startSession,
    validateFrontId,
    validateBackId,
    validateFace,
    detectFaceInId,
    performFullVerification,
    reset,
    endSession,
  };
}

export default useAIVerification;
