/**
 * AI Verification Service
 * Combines ID Validation and Face Recognition for complete identity verification
 */

import { idValidationService, IDValidationResult, ExtractedIDData } from './IDValidationService';
import { faceRecognitionService, FaceDetectionResult, FaceMatchResult, FaceValidationResult } from './FaceRecognitionService';

// Types
export interface VerificationSession {
  sessionId: string;
  startTime: Date;
  status: VerificationStatus;
  steps: VerificationStepResult[];
  finalResult: VerificationResult | null;
}

export type VerificationStatus = 
  | 'idle'
  | 'id_front_pending'
  | 'id_back_pending'
  | 'id_validation_in_progress'
  | 'face_scan_pending'
  | 'face_matching_in_progress'
  | 'completed'
  | 'failed';

export interface VerificationStepResult {
  step: VerificationStep;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result: any;
  errors: string[];
  timestamp: Date;
}

export type VerificationStep = 
  | 'id_front_capture'
  | 'id_back_capture'
  | 'id_quality_check'
  | 'id_ocr'
  | 'id_data_validation'
  | 'face_capture'
  | 'face_quality_check'
  | 'face_liveness'
  | 'face_matching'
  | 'final_verification';

export interface VerificationResult {
  isVerified: boolean;
  overallConfidence: number;
  idVerification: {
    isValid: boolean;
    confidence: number;
    extractedData: ExtractedIDData | null;
    warnings: string[];
  };
  faceVerification: {
    isValid: boolean;
    matchConfidence: number;
    livenessConfidence: number;
    warnings: string[];
  };
  dataMatchVerification: {
    isMatch: boolean;
    matchScore: number;
    discrepancies: string[];
  };
  riskScore: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface VerificationConfig {
  minIdConfidence: number;
  minFaceMatchConfidence: number;
  minLivenessConfidence: number;
  requireLivenessCheck: boolean;
  maxRiskScore: number;
  strictMode: boolean;
}

// Default configuration
const DEFAULT_CONFIG: VerificationConfig = {
  minIdConfidence: 0.6,
  minFaceMatchConfidence: 0.65,
  minLivenessConfidence: 0.7,
  requireLivenessCheck: true,
  maxRiskScore: 0.4,
  strictMode: false,
};

class AIVerificationService {
  private config: VerificationConfig;
  private currentSession: VerificationSession | null = null;
  private isInitialized: boolean = false;

  constructor(config: Partial<VerificationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize all AI services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[AIVerification] Initializing services...');
      
      await Promise.all([
        idValidationService.initialize(),
        faceRecognitionService.initialize(),
      ]);

      this.isInitialized = true;
      console.log('[AIVerification] All services initialized');
    } catch (error) {
      console.error('[AIVerification] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start a new verification session
   */
  startSession(): VerificationSession {
    const session: VerificationSession = {
      sessionId: this.generateSessionId(),
      startTime: new Date(),
      status: 'idle',
      steps: [],
      finalResult: null,
    };

    this.currentSession = session;
    console.log('[AIVerification] Session started:', session.sessionId);
    
    return session;
  }

  /**
   * Get current session
   */
  getCurrentSession(): VerificationSession | null {
    return this.currentSession;
  }

  /**
   * Perform complete identity verification
   */
  async performFullVerification(
    frontIdImageUri: string,
    backIdImageUri: string,
    selfieImageUri: string,
    expectedIdType: string,
    userInputData: {
      fullName: string;
      dateOfBirth: string;
      idNumber: string;
    },
    onProgress?: (step: VerificationStep, progress: number) => void
  ): Promise<VerificationResult> {
    if (!this.currentSession) {
      this.startSession();
    }

    const warnings: string[] = [];
    const riskFactors: string[] = [];

    try {
      // Step 1: Validate front ID
      onProgress?.('id_front_capture', 0);
      this.updateSessionStatus('id_validation_in_progress');
      
      const frontIdResult = await this.validateIDImage(
        frontIdImageUri,
        expectedIdType,
        'front'
      );
      this.addStepResult('id_front_capture', frontIdResult);
      onProgress?.('id_quality_check', 20);

      // Step 2: Validate back ID
      onProgress?.('id_back_capture', 25);
      const backIdResult = await this.validateIDImage(
        backIdImageUri,
        expectedIdType,
        'back'
      );
      this.addStepResult('id_back_capture', backIdResult);
      onProgress?.('id_ocr', 40);

      // Combine ID validation results
      const idVerification = this.combineIdResults(frontIdResult, backIdResult);
      warnings.push(...frontIdResult.warnings, ...backIdResult.warnings);

      // Step 3: Compare extracted data with user input
      onProgress?.('id_data_validation', 50);
      const dataMatch = frontIdResult.extractedData
        ? idValidationService.compareWithUserInput(frontIdResult.extractedData, userInputData)
        : { isMatch: false, matchScore: 0, discrepancies: ['No data extracted from ID'] };
      
      this.addStepResult('id_data_validation', dataMatch);
      
      if (!dataMatch.isMatch) {
        riskFactors.push('User input does not fully match ID data');
      }

      // Step 4: Validate selfie
      onProgress?.('face_capture', 60);
      this.updateSessionStatus('face_matching_in_progress');
      
      const selfieValidation = await faceRecognitionService.validateFaceForRegistration(selfieImageUri);
      this.addStepResult('face_quality_check', selfieValidation);
      onProgress?.('face_quality_check', 70);

      // Step 5: Perform liveness check (if required)
      let livenessConfidence = 1.0;
      if (this.config.requireLivenessCheck) {
        onProgress?.('face_liveness', 75);
        const livenessResult = await faceRecognitionService.performLivenessCheck([selfieImageUri]);
        livenessConfidence = livenessResult.confidence;
        
        if (!livenessResult.isLive) {
          riskFactors.push('Liveness check failed - possible spoofing attempt');
        }
        
        this.addStepResult('face_liveness', livenessResult);
      }

      // Step 6: Compare selfie with ID photo
      onProgress?.('face_matching', 85);
      const faceMatchResult = await faceRecognitionService.verifySelfieWithID(
        selfieImageUri,
        frontIdImageUri
      );
      this.addStepResult('face_matching', faceMatchResult);

      if (!faceMatchResult.isMatch) {
        riskFactors.push('Face does not match ID photo');
      }

      // Step 7: Calculate final verification result
      onProgress?.('final_verification', 95);
      
      const result = this.calculateFinalResult(
        idVerification,
        dataMatch,
        selfieValidation,
        faceMatchResult,
        livenessConfidence,
        riskFactors,
        warnings
      );

      this.currentSession!.finalResult = result;
      this.currentSession!.status = result.isVerified ? 'completed' : 'failed';
      this.addStepResult('final_verification', result);

      onProgress?.('final_verification', 100);

      return result;
    } catch (error) {
      console.error('[AIVerification] Verification failed:', error);
      this.updateSessionStatus('failed');
      
      throw error;
    }
  }

  /**
   * Validate ID image
   */
  private async validateIDImage(
    imageUri: string,
    idType: string,
    side: 'front' | 'back'
  ): Promise<IDValidationResult> {
    const result = await idValidationService.validateID(imageUri, idType, side);
    return result;
  }

  /**
   * Combine front and back ID validation results
   */
  private combineIdResults(
    frontResult: IDValidationResult,
    backResult: IDValidationResult
  ): {
    isValid: boolean;
    confidence: number;
    extractedData: ExtractedIDData | null;
    warnings: string[];
  } {
    const isValid = frontResult.isValid && backResult.qualityScore > 0.5;
    const confidence = (frontResult.confidence + backResult.confidence * 0.5) / 1.5;
    
    return {
      isValid,
      confidence,
      extractedData: frontResult.extractedData,
      warnings: [...frontResult.warnings, ...backResult.warnings],
    };
  }

  /**
   * Calculate final verification result
   */
  private calculateFinalResult(
    idVerification: {
      isValid: boolean;
      confidence: number;
      extractedData: ExtractedIDData | null;
      warnings: string[];
    },
    dataMatch: {
      isMatch: boolean;
      matchScore: number;
      discrepancies: string[];
    },
    selfieValidation: FaceValidationResult,
    faceMatch: {
      isMatch: boolean;
      matchResult: FaceMatchResult;
      overallConfidence: number;
      issues: string[];
    },
    livenessConfidence: number,
    riskFactors: string[],
    warnings: string[]
  ): VerificationResult {
    // Calculate risk score
    let riskScore = 0;
    
    if (!idVerification.isValid) riskScore += 0.3;
    if (!dataMatch.isMatch) riskScore += 0.2;
    if (!selfieValidation.isValid) riskScore += 0.15;
    if (!faceMatch.isMatch) riskScore += 0.25;
    if (livenessConfidence < 0.7) riskScore += 0.1;
    
    riskScore = Math.min(1, riskScore);

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      idVerification.confidence,
      dataMatch.matchScore,
      faceMatch.matchResult.confidence,
      livenessConfidence
    );

    // Determine if verified
    const isVerified = this.config.strictMode
      ? riskScore === 0 && overallConfidence >= 0.8
      : riskScore <= this.config.maxRiskScore && overallConfidence >= 0.6;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      idVerification,
      dataMatch,
      selfieValidation,
      faceMatch,
      riskFactors
    );

    return {
      isVerified,
      overallConfidence,
      idVerification: {
        isValid: idVerification.isValid,
        confidence: idVerification.confidence,
        extractedData: idVerification.extractedData,
        warnings: idVerification.warnings,
      },
      faceVerification: {
        isValid: faceMatch.isMatch,
        matchConfidence: faceMatch.matchResult.confidence,
        livenessConfidence,
        warnings: faceMatch.issues,
      },
      dataMatchVerification: {
        isMatch: dataMatch.isMatch,
        matchScore: dataMatch.matchScore,
        discrepancies: dataMatch.discrepancies,
      },
      riskScore,
      riskFactors,
      recommendations,
    };
  }

  /**
   * Calculate weighted overall confidence
   */
  private calculateOverallConfidence(
    idConfidence: number,
    dataMatchScore: number,
    faceMatchConfidence: number,
    livenessConfidence: number
  ): number {
    // Weighted average
    const weights = {
      id: 0.25,
      dataMatch: 0.2,
      faceMatch: 0.35,
      liveness: 0.2,
    };

    return (
      idConfidence * weights.id +
      dataMatchScore * weights.dataMatch +
      faceMatchConfidence * weights.faceMatch +
      livenessConfidence * weights.liveness
    );
  }

  /**
   * Generate recommendations based on verification results
   */
  private generateRecommendations(
    idVerification: { isValid: boolean; warnings: string[] },
    dataMatch: { isMatch: boolean; discrepancies: string[] },
    selfieValidation: FaceValidationResult,
    faceMatch: { isMatch: boolean; issues: string[] },
    riskFactors: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (!idVerification.isValid) {
      recommendations.push('Re-upload a clearer photo of your ID');
    }

    if (!dataMatch.isMatch && dataMatch.discrepancies.length > 0) {
      recommendations.push('Verify that the information entered matches your ID exactly');
    }

    if (!selfieValidation.isValid) {
      recommendations.push(...selfieValidation.suggestions);
    }

    if (!faceMatch.isMatch) {
      recommendations.push('Retake your selfie with better lighting');
      recommendations.push('Ensure your face is clearly visible without obstructions');
    }

    if (riskFactors.length > 0) {
      recommendations.push('If issues persist, contact support for manual verification');
    }

    return recommendations;
  }

  /**
   * Quick ID validation (without full verification)
   */
  async quickValidateID(
    imageUri: string,
    idType: string,
    side: 'front' | 'back' = 'front'
  ): Promise<IDValidationResult> {
    await this.initialize();
    return idValidationService.validateID(imageUri, idType, side);
  }

  /**
   * Quick face validation (without full verification)
   */
  async quickValidateFace(imageUri: string): Promise<FaceValidationResult> {
    await this.initialize();
    return faceRecognitionService.validateFaceForRegistration(imageUri);
  }

  /**
   * Detect face in ID image
   */
  async detectFaceInID(imageUri: string): Promise<FaceDetectionResult> {
    await this.initialize();
    return faceRecognitionService.detectFaceInID(imageUri);
  }

  /**
   * Compare two faces
   */
  async compareFaces(
    image1Uri: string,
    image2Uri: string
  ): Promise<FaceMatchResult> {
    await this.initialize();
    return faceRecognitionService.compareFaces(image1Uri, image2Uri);
  }

  /**
   * Update session status
   */
  private updateSessionStatus(status: VerificationStatus): void {
    if (this.currentSession) {
      this.currentSession.status = status;
    }
  }

  /**
   * Add step result to session
   */
  private addStepResult(step: VerificationStep, result: any): void {
    if (this.currentSession) {
      this.currentSession.steps.push({
        step,
        status: 'completed',
        result,
        errors: result.errors || [],
        timestamp: new Date(),
      });
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `vs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * End current session
   */
  endSession(): VerificationSession | null {
    const session = this.currentSession;
    this.currentSession = null;
    return session;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VerificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): VerificationConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    await Promise.all([
      idValidationService.dispose(),
      faceRecognitionService.dispose(),
    ]);
    this.isInitialized = false;
    this.currentSession = null;
  }
}

// Export singleton instance
export const aiVerificationService = new AIVerificationService();
export default AIVerificationService;

// Re-export types from sub-services
export type { IDValidationResult, ExtractedIDData } from './IDValidationService';
export type { FaceDetectionResult, FaceMatchResult, FaceValidationResult } from './FaceRecognitionService';
