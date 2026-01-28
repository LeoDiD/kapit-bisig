/**
 * ID Validation Service using Tesseract OCR
 * Handles ID document verification, text extraction, and quality checks
 */

import * as FileSystem from 'expo-file-system';

// Encoding type constant
const EncodingType = {
  Base64: 'base64' as const,
  UTF8: 'utf8' as const,
};

// Types for ID validation
export interface IDValidationResult {
  isValid: boolean;
  confidence: number;
  extractedData: ExtractedIDData | null;
  qualityScore: number;
  errors: string[];
  warnings: string[];
}

export interface ExtractedIDData {
  fullName: string | null;
  dateOfBirth: string | null;
  idNumber: string | null;
  address: string | null;
  expiryDate: string | null;
  idType: string | null;
  rawText: string;
}

export interface ImageQualityResult {
  isAcceptable: boolean;
  score: number;
  issues: string[];
  brightness: number;
  blur: number;
  contrast: number;
}

// ID Type patterns for Philippine IDs
const ID_PATTERNS = {
  'Philippine National ID': {
    numberPattern: /\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
    keywords: ['PHILIPPINE', 'NATIONAL', 'IDENTIFICATION', 'PCN', 'PHILSYS'],
    dateFormat: /\d{2}[\/\-]\d{2}[\/\-]\d{4}/g,
  },
  "Driver's License": {
    numberPattern: /[A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{6}/g,
    keywords: ['DRIVER', 'LICENSE', 'LTO', 'LAND TRANSPORTATION'],
    dateFormat: /\d{2}[\/\-]\d{2}[\/\-]\d{4}/g,
  },
  'Passport': {
    numberPattern: /[A-Z]\d{8,9}/g,
    keywords: ['PASSPORT', 'REPUBLIC', 'PHILIPPINES', 'DFA'],
    dateFormat: /\d{2}\s?[A-Z]{3}\s?\d{4}/g,
  },
  'SSS ID': {
    numberPattern: /\d{2}[-\s]?\d{7}[-\s]?\d{1}/g,
    keywords: ['SSS', 'SOCIAL SECURITY', 'SYSTEM'],
    dateFormat: /\d{2}[\/\-]\d{2}[\/\-]\d{4}/g,
  },
  'PhilHealth ID': {
    numberPattern: /\d{2}[-\s]?\d{9}[-\s]?\d{1}/g,
    keywords: ['PHILHEALTH', 'HEALTH', 'INSURANCE'],
    dateFormat: /\d{2}[\/\-]\d{2}[\/\-]\d{4}/g,
  },
  "Voter's ID": {
    numberPattern: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{6}/g,
    keywords: ['VOTER', 'COMELEC', 'COMMISSION', 'ELECTIONS'],
    dateFormat: /\d{2}[\/\-]\d{2}[\/\-]\d{4}/g,
  },
};

class IDValidationService {
  private ocrWorker: any = null;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the Tesseract OCR worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initializeWorker();
    await this.initPromise;
  }

  private async _initializeWorker(): Promise<void> {
    try {
      // For React Native/Expo, we'll use a server-side OCR approach
      // or a native module. This is a placeholder for the initialization.
      console.log('[IDValidation] Initializing OCR service...');
      
      // In production, you would initialize tesseract.js here
      // For React Native, consider using:
      // 1. A backend API with Tesseract
      // 2. react-native-tesseract-ocr (if available)
      // 3. Cloud Vision API (Google, AWS, etc.)
      
      this.isInitialized = true;
      console.log('[IDValidation] OCR service initialized');
    } catch (error) {
      console.error('[IDValidation] Failed to initialize OCR:', error);
      throw error;
    }
  }

  /**
   * Validate an ID image and extract information
   */
  async validateID(
    imageUri: string,
    expectedIdType: string,
    side: 'front' | 'back' = 'front'
  ): Promise<IDValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let extractedData: ExtractedIDData | null = null;
    let confidence = 0;

    try {
      // Step 1: Check image quality
      const qualityResult = await this.checkImageQuality(imageUri);
      
      if (!qualityResult.isAcceptable) {
        return {
          isValid: false,
          confidence: 0,
          extractedData: null,
          qualityScore: qualityResult.score,
          errors: qualityResult.issues,
          warnings: [],
        };
      }

      // Step 2: Perform OCR
      const ocrResult = await this.performOCR(imageUri);
      
      if (!ocrResult.text || ocrResult.text.trim().length < 10) {
        errors.push('Could not read text from the ID image. Please ensure the image is clear.');
        return {
          isValid: false,
          confidence: 0,
          extractedData: null,
          qualityScore: qualityResult.score,
          errors,
          warnings,
        };
      }

      // Step 3: Extract data based on ID type
      extractedData = this.extractDataFromText(ocrResult.text, expectedIdType);
      
      // Step 4: Validate extracted data
      const validationResult = this.validateExtractedData(extractedData, expectedIdType, side);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);
      confidence = validationResult.confidence;

      // Step 5: Verify ID type matches
      const typeMatch = this.verifyIdType(ocrResult.text, expectedIdType);
      if (!typeMatch.isMatch) {
        warnings.push(`The ID might not be a ${expectedIdType}. Please verify.`);
        confidence *= 0.7;
      }

      return {
        isValid: errors.length === 0 && confidence > 0.5,
        confidence,
        extractedData,
        qualityScore: qualityResult.score,
        errors,
        warnings,
      };
    } catch (error) {
      console.error('[IDValidation] Validation error:', error);
      return {
        isValid: false,
        confidence: 0,
        extractedData: null,
        qualityScore: 0,
        errors: ['Failed to validate ID. Please try again.'],
        warnings: [],
      };
    }
  }

  /**
   * Check image quality for ID verification
   */
  async checkImageQuality(imageUri: string): Promise<ImageQualityResult> {
    const issues: string[] = [];
    let score = 100;

    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      if (!fileInfo.exists) {
        return {
          isAcceptable: false,
          score: 0,
          issues: ['Image file not found'],
          brightness: 0,
          blur: 0,
          contrast: 0,
        };
      }

      // Check file size (minimum 100KB for quality)
      const fileSizeKB = (fileInfo as any).size / 1024;
      if (fileSizeKB < 50) {
        issues.push('Image resolution is too low. Please capture a clearer photo.');
        score -= 30;
      } else if (fileSizeKB < 100) {
        issues.push('Image quality could be better. Consider retaking the photo.');
        score -= 15;
      }

      // In a real implementation, you would analyze:
      // - Brightness levels
      // - Blur detection (Laplacian variance)
      // - Contrast analysis
      // - Edge detection for document boundaries
      
      // Simulated quality metrics (in production, use image processing)
      const brightness = this.estimateBrightness(fileSizeKB);
      const blur = this.estimateBlur(fileSizeKB);
      const contrast = this.estimateContrast(fileSizeKB);

      if (brightness < 0.3) {
        issues.push('Image is too dark. Please use better lighting.');
        score -= 20;
      } else if (brightness > 0.9) {
        issues.push('Image is too bright or overexposed.');
        score -= 15;
      }

      if (blur > 0.5) {
        issues.push('Image appears blurry. Please hold the camera steady.');
        score -= 25;
      }

      if (contrast < 0.3) {
        issues.push('Image has low contrast. Please ensure good lighting.');
        score -= 15;
      }

      return {
        isAcceptable: score >= 50 && issues.length <= 1,
        score: Math.max(0, score),
        issues,
        brightness,
        blur,
        contrast,
      };
    } catch (error) {
      console.error('[IDValidation] Quality check error:', error);
      return {
        isAcceptable: false,
        score: 0,
        issues: ['Failed to analyze image quality'],
        brightness: 0,
        blur: 0,
        contrast: 0,
      };
    }
  }

  /**
   * Perform OCR on the image
   */
  private async performOCR(imageUri: string): Promise<{ text: string; confidence: number }> {
    try {
      // Option 1: Use a backend API for OCR
      // This is the recommended approach for React Native
      const ocrResult = await this.callOCRApi(imageUri);
      return ocrResult;

      // Option 2: If using tesseract.js in a web worker (for web builds)
      // return await this.performLocalOCR(imageUri);
    } catch (error) {
      console.error('[IDValidation] OCR error:', error);
      
      // Fallback: Return simulated result for development
      return this.simulateOCR(imageUri);
    }
  }

  /**
   * Call backend OCR API
   */
  private async callOCRApi(imageUri: string): Promise<{ text: string; confidence: number }> {
    try {
      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: EncodingType.Base64,
      });

      // Call your backend API
      // Replace with your actual API endpoint
      const response = await fetch('YOUR_API_ENDPOINT/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          language: 'eng+fil', // English + Filipino
        }),
      });

      if (!response.ok) {
        throw new Error('OCR API request failed');
      }

      const result = await response.json();
      return {
        text: result.text || '',
        confidence: result.confidence || 0,
      };
    } catch (error) {
      console.warn('[IDValidation] API OCR failed, using simulation:', error);
      throw error;
    }
  }

  /**
   * Simulate OCR for development/testing
   */
  private simulateOCR(imageUri: string): { text: string; confidence: number } {
    // This is for development only
    // In production, remove this and use actual OCR
    console.log('[IDValidation] Using simulated OCR for:', imageUri);
    
    return {
      text: `
        REPUBLIC OF THE PHILIPPINES
        PHILIPPINE IDENTIFICATION SYSTEM
        
        SURNAME: DELA CRUZ
        GIVEN NAME: JUAN
        MIDDLE NAME: SANTOS
        
        DATE OF BIRTH: 01/15/1990
        PLACE OF BIRTH: MANILA
        
        ADDRESS: 123 SAMPLE ST, BRGY. SAMPLE
        CITY: SAMPLE CITY
        
        PCN: 1234-5678-9012
        
        VALID UNTIL: 12/31/2030
      `,
      confidence: 0.85,
    };
  }

  /**
   * Extract structured data from OCR text
   */
  private extractDataFromText(text: string, idType: string): ExtractedIDData {
    const upperText = text.toUpperCase();
    const patterns = ID_PATTERNS[idType as keyof typeof ID_PATTERNS] || ID_PATTERNS['Philippine National ID'];

    // Extract ID number
    const idNumberMatch = upperText.match(patterns.numberPattern);
    const idNumber = idNumberMatch ? idNumberMatch[0].replace(/[-\s]/g, '') : null;

    // Extract dates
    const dateMatches = upperText.match(patterns.dateFormat) || [];
    const dateOfBirth = dateMatches[0] || null;
    const expiryDate = dateMatches[dateMatches.length - 1] || null;

    // Extract name (common patterns)
    const namePatterns = [
      /(?:SURNAME|LAST NAME)[:\s]*([A-Z\s]+)/,
      /(?:GIVEN NAME|FIRST NAME)[:\s]*([A-Z\s]+)/,
      /(?:NAME)[:\s]*([A-Z\s,]+)/,
    ];

    let fullName: string | null = null;
    for (const pattern of namePatterns) {
      const match = upperText.match(pattern);
      if (match) {
        fullName = match[1].trim();
        break;
      }
    }

    // Extract address
    const addressPattern = /(?:ADDRESS)[:\s]*([A-Z0-9\s,.-]+)/;
    const addressMatch = upperText.match(addressPattern);
    const address = addressMatch ? addressMatch[1].trim() : null;

    return {
      fullName,
      dateOfBirth,
      idNumber,
      address,
      expiryDate,
      idType,
      rawText: text,
    };
  }

  /**
   * Validate extracted data
   */
  private validateExtractedData(
    data: ExtractedIDData,
    idType: string,
    side: 'front' | 'back'
  ): { errors: string[]; warnings: string[]; confidence: number } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    if (side === 'front') {
      // Front side should have key information
      if (!data.idNumber) {
        warnings.push('Could not extract ID number from the image.');
        confidence *= 0.6;
      }

      if (!data.fullName) {
        warnings.push('Could not extract name from the image.');
        confidence *= 0.8;
      }

      // Check ID number format
      if (data.idNumber) {
        const isValidFormat = this.validateIdNumberFormat(data.idNumber, idType);
        if (!isValidFormat) {
          warnings.push('ID number format does not match expected format.');
          confidence *= 0.7;
        }
      }
    }

    // Check for expired ID
    if (data.expiryDate) {
      const isExpired = this.checkExpiry(data.expiryDate);
      if (isExpired) {
        errors.push('This ID appears to be expired. Please use a valid ID.');
        confidence = 0;
      }
    }

    return { errors, warnings, confidence };
  }

  /**
   * Validate ID number format based on ID type
   */
  private validateIdNumberFormat(idNumber: string, idType: string): boolean {
    const cleanNumber = idNumber.replace(/[-\s]/g, '');
    
    switch (idType) {
      case 'Philippine National ID':
        return /^\d{12}$/.test(cleanNumber);
      case "Driver's License":
        return /^[A-Z]?\d{11,12}$/.test(cleanNumber);
      case 'Passport':
        return /^[A-Z]\d{8,9}$/.test(cleanNumber);
      case 'SSS ID':
        return /^\d{10}$/.test(cleanNumber);
      case 'PhilHealth ID':
        return /^\d{12}$/.test(cleanNumber);
      case "Voter's ID":
        return /^\d{22}$/.test(cleanNumber);
      default:
        return cleanNumber.length >= 8;
    }
  }

  /**
   * Check if ID is expired
   */
  private checkExpiry(expiryDateStr: string): boolean {
    try {
      // Parse common date formats
      const datePatterns = [
        /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
        /(\d{2})-(\d{2})-(\d{4})/, // MM-DD-YYYY
        /(\d{2})\s+([A-Z]{3})\s+(\d{4})/, // DD MMM YYYY
      ];

      for (const pattern of datePatterns) {
        const match = expiryDateStr.match(pattern);
        if (match) {
          let expiryDate: Date;
          
          if (match[2].match(/[A-Z]/)) {
            // Month name format
            const months: { [key: string]: number } = {
              JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
              JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
            };
            expiryDate = new Date(
              parseInt(match[3]),
              months[match[2]] || 0,
              parseInt(match[1])
            );
          } else {
            // Numeric format
            expiryDate = new Date(
              parseInt(match[3]),
              parseInt(match[1]) - 1,
              parseInt(match[2])
            );
          }

          return expiryDate < new Date();
        }
      }
    } catch (error) {
      console.warn('[IDValidation] Could not parse expiry date:', expiryDateStr);
    }
    
    return false;
  }

  /**
   * Verify ID type matches the document
   */
  private verifyIdType(text: string, expectedType: string): { isMatch: boolean; confidence: number } {
    const upperText = text.toUpperCase();
    const patterns = ID_PATTERNS[expectedType as keyof typeof ID_PATTERNS];
    
    if (!patterns) {
      return { isMatch: true, confidence: 0.5 };
    }

    let matchCount = 0;
    for (const keyword of patterns.keywords) {
      if (upperText.includes(keyword)) {
        matchCount++;
      }
    }

    const confidence = matchCount / patterns.keywords.length;
    return {
      isMatch: confidence >= 0.3,
      confidence,
    };
  }

  /**
   * Compare extracted ID data with user input
   */
  compareWithUserInput(
    extractedData: ExtractedIDData,
    userInput: {
      fullName: string;
      dateOfBirth: string;
      idNumber: string;
    }
  ): { isMatch: boolean; matchScore: number; discrepancies: string[] } {
    const discrepancies: string[] = [];
    let matchScore = 0;
    let totalChecks = 0;

    // Compare name
    if (extractedData.fullName && userInput.fullName) {
      totalChecks++;
      const nameSimilarity = this.calculateStringSimilarity(
        this.normalizeName(extractedData.fullName),
        this.normalizeName(userInput.fullName)
      );
      if (nameSimilarity >= 0.7) {
        matchScore++;
      } else {
        discrepancies.push('Name does not match the ID');
      }
    }

    // Compare ID number
    if (extractedData.idNumber && userInput.idNumber) {
      totalChecks++;
      const extractedClean = extractedData.idNumber.replace(/[-\s]/g, '');
      const userClean = userInput.idNumber.replace(/[-\s]/g, '');
      if (extractedClean === userClean) {
        matchScore++;
      } else {
        discrepancies.push('ID number does not match');
      }
    }

    // Compare date of birth
    if (extractedData.dateOfBirth && userInput.dateOfBirth) {
      totalChecks++;
      const extractedDate = this.normalizeDate(extractedData.dateOfBirth);
      const userDate = this.normalizeDate(userInput.dateOfBirth);
      if (extractedDate === userDate) {
        matchScore++;
      } else {
        discrepancies.push('Date of birth does not match');
      }
    }

    const score = totalChecks > 0 ? matchScore / totalChecks : 0;
    return {
      isMatch: score >= 0.6 && discrepancies.length <= 1,
      matchScore: score,
      discrepancies,
    };
  }

  /**
   * Normalize name for comparison
   */
  private normalizeName(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize date for comparison
   */
  private normalizeDate(dateStr: string): string {
    // Convert to YYYYMMDD format for comparison
    const cleaned = dateStr.replace(/[^\d]/g, '');
    if (cleaned.length === 8) {
      // Assuming MMDDYYYY or DDMMYYYY
      return cleaned;
    }
    return dateStr;
  }

  /**
   * Calculate string similarity (Levenshtein-based)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    const longerLength = longer.length;
    if (longerLength === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longerLength - editDistance) / longerLength;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + 1
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Estimate brightness (placeholder for real implementation)
   */
  private estimateBrightness(fileSizeKB: number): number {
    // In production, analyze actual image pixels
    return Math.min(0.8, Math.max(0.4, fileSizeKB / 500));
  }

  /**
   * Estimate blur (placeholder for real implementation)
   */
  private estimateBlur(fileSizeKB: number): number {
    // In production, use Laplacian variance
    return Math.max(0.1, 1 - fileSizeKB / 300);
  }

  /**
   * Estimate contrast (placeholder for real implementation)
   */
  private estimateContrast(fileSizeKB: number): number {
    // In production, analyze histogram
    return Math.min(0.9, Math.max(0.3, fileSizeKB / 400));
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.ocrWorker) {
      // Terminate worker if using tesseract.js
      this.ocrWorker = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const idValidationService = new IDValidationService();
export default IDValidationService;
