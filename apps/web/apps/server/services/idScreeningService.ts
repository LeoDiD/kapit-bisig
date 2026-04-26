import {
  SUPPORTED_ID_TYPES,
  SupportedIdType,
  normalizeIdNumber,
  validateIdNumberFormat,
  validateIdType,
} from '../utils/idVerification';
import { validateBase64Image } from '../validation/imageValidation';
import { OCRServiceResult, performOCRFromBase64Image } from './ocrService';

export type IdScreeningDecision = 'PASS' | 'REVIEW' | 'BLOCK';

export interface IdScreeningResult {
  decision: IdScreeningDecision;
  screeningConfidence: number;
  requiresManualReview: boolean;
  enteredIdType: string;
  enteredIdNumber: string;
  detectedIdType: string | null;
  typeMatch: boolean | null;
  typeConfidence: number;
  extractedIdNumber: string | null;
  extractedIdNumberMasked: string | null;
  idNumberMatch: boolean | null;
  ocrConfidence: number;
  qualityScore: number;
  reasons: string[];
  warnings: string[];
  reviewFlags: string[];
  limitations: string[];
  rawTextPreview: string;
}

export interface AnalyzeIdScreeningInput {
  enteredIdType: string;
  enteredIdNumber: string;
  frontText: string;
  backText: string;
  frontOcrConfidence: number;
  backOcrConfidence: number;
  frontWidth?: number;
  frontHeight?: number;
  backWidth?: number;
  backHeight?: number;
}

interface TypeRule {
  keywords: string[];
  numberPattern: RegExp;
}

interface NumberCandidate {
  raw: string;
  normalized: string;
  isFormatValid: boolean;
}

const DEFAULT_LIMITATIONS = [
  'Automated screening does not prove official issuer authenticity.',
  'OCR can fail on glare, blur, crop, compression, or damaged IDs.',
  'Final acceptance still requires admin review.',
];

const TYPE_RULES: Record<SupportedIdType, TypeRule> = {
  'PhilSys ID': {
    keywords: ['PHILIPPINE', 'NATIONAL', 'IDENTIFICATION', 'PHILSYS', 'PCN'],
    numberPattern: /\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
  },
  'Philippine National ID': {
    keywords: ['PHILIPPINE', 'NATIONAL', 'IDENTIFICATION', 'PHILSYS', 'PCN'],
    numberPattern: /\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
  },
  "Driver's License": {
    keywords: ['DRIVER', 'LICENSE', 'LTO', 'LAND', 'TRANSPORTATION'],
    numberPattern: /[A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{6}/g,
  },
  Passport: {
    keywords: ['PASSPORT', 'PHILIPPINES', 'REPUBLIC', 'DFA'],
    numberPattern: /[A-Z]\d{7}/g,
  },
  'SSS ID': {
    keywords: ['SSS', 'SOCIAL', 'SECURITY', 'SYSTEM'],
    numberPattern: /\d{2}[-\s]?\d{7}[-\s]?\d{1}/g,
  },
  'PhilHealth ID': {
    keywords: ['PHILHEALTH', 'HEALTH', 'INSURANCE'],
    numberPattern: /\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
  },
  "Voter's ID": {
    keywords: ['VOTER', 'COMELEC', 'COMMISSION', 'ELECTIONS'],
    numberPattern: /[A-Z0-9]{6,25}/g,
  },
};

function canonicalizeIdType(idType: string): SupportedIdType | null {
  if (idType === 'Philippine National ID') {
    return 'PhilSys ID';
  }
  return SUPPORTED_ID_TYPES.includes(idType as SupportedIdType)
    ? (idType as SupportedIdType)
    : null;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function roundScore(value: number): number {
  return Math.round(clamp(value) * 100) / 100;
}

function collapseWhitespace(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function maskIdNumber(value: string | null): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.length <= 4) {
    return `****${trimmed}`;
  }
  return `${'*'.repeat(Math.max(4, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

function computeAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeImageDimensionScore(width?: number, height?: number): number {
  if (!width || !height) return 0.5;
  const normalizedWidth = clamp(width / 1200);
  const normalizedHeight = clamp(height / 800);
  return roundScore((normalizedWidth + normalizedHeight) / 2);
}

function computeQualityScore(input: AnalyzeIdScreeningInput): number {
  const dimensionScore = computeAverage([
    computeImageDimensionScore(input.frontWidth, input.frontHeight),
    computeImageDimensionScore(input.backWidth, input.backHeight),
  ]);
  const ocrScore = clamp(
    computeAverage([
      clamp(input.frontOcrConfidence),
      clamp(input.backOcrConfidence),
    ]),
  );

  return roundScore(dimensionScore * 0.45 + ocrScore * 0.55);
}

function scoreIdType(text: string, idType: SupportedIdType): number {
  const canonicalType = canonicalizeIdType(idType) || idType;
  const rule = TYPE_RULES[canonicalType];
  if (!rule) return 0;

  const upperText = String(text || '').toUpperCase();
  if (!upperText) return 0;

  const keywordHits = rule.keywords.filter((keyword) => upperText.includes(keyword)).length;
  const keywordScore = keywordHits / rule.keywords.length;

  const patternMatches = Array.from(upperText.matchAll(rule.numberPattern))
    .map((match) => normalizeIdNumber(canonicalType, match[0]))
    .filter((candidate) => validateIdNumberFormat(canonicalType, candidate));
  const patternScore = patternMatches.length > 0 ? 1 : 0;

  return roundScore(keywordScore * 0.65 + patternScore * 0.35);
}

function detectLikelyIdType(text: string): { detectedIdType: string | null; confidence: number } {
  let bestType: string | null = null;
  let bestScore = 0;

  for (const idType of SUPPORTED_ID_TYPES) {
    const score = scoreIdType(text, idType);
    if (score > bestScore) {
      bestType = canonicalizeIdType(idType) || idType;
      bestScore = score;
    }
  }

  if (!bestType || bestScore < 0.35) {
    return { detectedIdType: null, confidence: roundScore(bestScore) };
  }

  return {
    detectedIdType: bestType,
    confidence: roundScore(bestScore),
  };
}

function extractNumberCandidates(text: string, idType: SupportedIdType): NumberCandidate[] {
  const canonicalType = canonicalizeIdType(idType) || idType;
  const rule = TYPE_RULES[canonicalType];
  if (!rule) return [];

  const seen = new Set<string>();
  const upperText = String(text || '').toUpperCase();
  const matches = Array.from(upperText.matchAll(rule.numberPattern));
  const candidates: NumberCandidate[] = [];

  for (const match of matches) {
    const raw = String(match[0] || '').trim();
    if (!raw) continue;

    const normalized = normalizeIdNumber(canonicalType, raw);
    if (!normalized) continue;
    if (canonicalType === "Voter's ID" && !/\d/.test(normalized)) {
      continue;
    }
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    candidates.push({
      raw,
      normalized,
      isFormatValid: validateIdNumberFormat(canonicalType, normalized),
    });
  }

  return candidates;
}

function pickBestCandidate(
  candidates: NumberCandidate[],
  enteredNormalizedIdNumber: string,
): NumberCandidate | null {
  if (candidates.length === 0) return null;

  const ranked = [...candidates].sort((left, right) => {
    const leftScore =
      (left.normalized === enteredNormalizedIdNumber ? 100 : 0) +
      (left.isFormatValid ? 25 : 0) +
      left.normalized.length;
    const rightScore =
      (right.normalized === enteredNormalizedIdNumber ? 100 : 0) +
      (right.isFormatValid ? 25 : 0) +
      right.normalized.length;
    return rightScore - leftScore;
  });

  return ranked[0] || null;
}

function buildReasonsAndWarnings(params: {
  enteredIdType: SupportedIdType;
  detectedIdType: string | null;
  typeConfidence: number;
  extractedCandidate: NumberCandidate | null;
  idNumberMatch: boolean | null;
  ocrConfidence: number;
  qualityScore: number;
}): Pick<IdScreeningResult, 'decision' | 'reasons' | 'warnings' | 'reviewFlags'> {
  const {
    enteredIdType,
    detectedIdType,
    typeConfidence,
    extractedCandidate,
    idNumberMatch,
    ocrConfidence,
    qualityScore,
  } = params;

  const reasons: string[] = [];
  const warnings: string[] = [];
  const reviewFlags: string[] = [];

  const strongTypeMismatch =
    !!detectedIdType &&
    detectedIdType !== enteredIdType &&
    typeConfidence >= 0.78;

  const strongIdMismatch =
    extractedCandidate?.isFormatValid === true &&
    idNumberMatch === false &&
    ocrConfidence >= 0.45;

  if (strongTypeMismatch) {
    reviewFlags.push('TYPE_MISMATCH');
    reasons.push(`The uploaded ID appears to be ${detectedIdType}, not ${enteredIdType}.`);
  }

  if (strongIdMismatch) {
    reviewFlags.push('ID_NUMBER_MISMATCH');
    reasons.push('The ID number read from the uploaded ID does not match the ID number entered.');
  }

  if (ocrConfidence < 0.3) {
    reviewFlags.push('LOW_OCR_CONFIDENCE');
    warnings.push('OCR confidence is low. Please avoid glare, blur, or cropped images.');
  }

  if (!detectedIdType || typeConfidence < 0.45) {
    reviewFlags.push('DOCUMENT_TYPE_LOW_CONFIDENCE');
    warnings.push('The document type could not be confirmed with high confidence.');
  }

  if (!extractedCandidate) {
    reviewFlags.push('OCR_ID_NUMBER_UNREADABLE');
    warnings.push('The system could not confidently read the ID number from the upload.');
  }

  if (qualityScore < 0.45) {
    reviewFlags.push('LOW_IMAGE_QUALITY');
    warnings.push('The uploaded ID images may be too small or unclear for reliable screening.');
  }

  if (strongTypeMismatch || strongIdMismatch) {
    return {
      decision: 'BLOCK',
      reasons,
      warnings,
      reviewFlags,
    };
  }

  if (idNumberMatch === true && qualityScore >= 0.45 && ocrConfidence >= 0.25) {
    reasons.push('The uploaded ID passed automated screening.');
    return {
      decision: 'PASS',
      reasons,
      warnings,
      reviewFlags,
    };
  }

  reasons.push('The upload needs manual review before the ID details can be trusted.');
  return {
    decision: 'REVIEW',
    reasons,
    warnings,
    reviewFlags,
  };
}

function computeScreeningConfidence(params: {
  typeMatch: boolean | null;
  typeConfidence: number;
  idNumberMatch: boolean | null;
  extractedCandidate: NumberCandidate | null;
  ocrConfidence: number;
  qualityScore: number;
}): number {
  const {
    typeMatch,
    typeConfidence,
    idNumberMatch,
    extractedCandidate,
    ocrConfidence,
    qualityScore,
  } = params;

  const typeScore =
    typeMatch === true
      ? Math.max(0.5, typeConfidence)
      : typeMatch === false
        ? 0
        : 0.35;
  const idNumberScore =
    idNumberMatch === true
      ? 1
      : idNumberMatch === false
        ? extractedCandidate?.isFormatValid
          ? 0
          : 0.2
        : 0.25;

  return roundScore(
    typeScore * 0.25 +
    idNumberScore * 0.45 +
    clamp(ocrConfidence) * 0.15 +
    clamp(qualityScore) * 0.15,
  );
}

function buildRawTextPreview(frontText: string, backText: string): string {
  return collapseWhitespace(`${frontText}\n${backText}`).slice(0, 180);
}

export function analyzeIdScreeningFromOcr(
  input: AnalyzeIdScreeningInput,
): IdScreeningResult {
  const canonicalEnteredIdType = canonicalizeIdType(input.enteredIdType);
  if (!canonicalEnteredIdType) {
    throw new Error('Unsupported ID type selected.');
  }

  const enteredNormalizedIdNumber = normalizeIdNumber(
    canonicalEnteredIdType,
    input.enteredIdNumber,
  );

  if (!validateIdNumberFormat(canonicalEnteredIdType, enteredNormalizedIdNumber)) {
    throw new Error('Entered ID number format is invalid for the selected ID type.');
  }

  const combinedText = collapseWhitespace(`${input.frontText}\n${input.backText}`);
  const { detectedIdType, confidence: typeConfidence } = detectLikelyIdType(combinedText);
  const typeMatch = detectedIdType ? detectedIdType === canonicalEnteredIdType : null;

  const extractedCandidate = pickBestCandidate(
    extractNumberCandidates(combinedText, canonicalEnteredIdType),
    enteredNormalizedIdNumber,
  );

  const idNumberMatch = extractedCandidate
    ? extractedCandidate.normalized === enteredNormalizedIdNumber
    : null;
  const ocrConfidence = roundScore(
    computeAverage([
      clamp(input.frontOcrConfidence),
      clamp(input.backOcrConfidence),
    ]),
  );
  const qualityScore = computeQualityScore(input);

  const { decision, reasons, warnings, reviewFlags } = buildReasonsAndWarnings({
    enteredIdType: canonicalEnteredIdType,
    detectedIdType,
    typeConfidence,
    extractedCandidate,
    idNumberMatch,
    ocrConfidence,
    qualityScore,
  });

  return {
    decision,
    screeningConfidence: computeScreeningConfidence({
      typeMatch,
      typeConfidence,
      idNumberMatch,
      extractedCandidate,
      ocrConfidence,
      qualityScore,
    }),
    requiresManualReview: decision !== 'PASS',
    enteredIdType: canonicalEnteredIdType,
    enteredIdNumber: enteredNormalizedIdNumber,
    detectedIdType,
    typeMatch,
    typeConfidence,
    extractedIdNumber: extractedCandidate?.normalized || null,
    extractedIdNumberMasked: maskIdNumber(extractedCandidate?.normalized || null),
    idNumberMatch,
    ocrConfidence,
    qualityScore,
    reasons,
    warnings,
    reviewFlags,
    limitations: DEFAULT_LIMITATIONS,
    rawTextPreview: buildRawTextPreview(input.frontText, input.backText),
  };
}

function buildScreeningInputFromOcr(params: {
  idType: string;
  idNumber: string;
  frontValidation: { width: number; height: number };
  backValidation: { width: number; height: number };
  frontOcr: OCRServiceResult;
  backOcr: OCRServiceResult;
}): AnalyzeIdScreeningInput {
  return {
    enteredIdType: params.idType,
    enteredIdNumber: params.idNumber,
    frontText: params.frontOcr.text,
    backText: params.backOcr.text,
    frontOcrConfidence: params.frontOcr.confidence,
    backOcrConfidence: params.backOcr.confidence,
    frontWidth: params.frontValidation.width,
    frontHeight: params.frontValidation.height,
    backWidth: params.backValidation.width,
    backHeight: params.backValidation.height,
  };
}

export async function screenSubmittedId(input: {
  idType: string;
  idNumber: string;
  frontIdImage: string;
  backIdImage: string;
}): Promise<IdScreeningResult> {
  if (!validateIdType(input.idType)) {
    throw new Error('Unsupported ID type selected.');
  }

  const normalizedEnteredIdNumber = normalizeIdNumber(input.idType, input.idNumber || '');
  if (!validateIdNumberFormat(input.idType, normalizedEnteredIdNumber)) {
    throw new Error('Entered ID number format is invalid for the selected ID type.');
  }

  const [frontValidation, backValidation] = await Promise.all([
    validateBase64Image(input.frontIdImage, {
      fieldName: 'Front ID image',
      maxBytes: 2 * 1024 * 1024,
      minWidth: 200,
      minHeight: 200,
      maxWidth: 4096,
      maxHeight: 4096,
    }),
    validateBase64Image(input.backIdImage, {
      fieldName: 'Back ID image',
      maxBytes: 2 * 1024 * 1024,
      minWidth: 200,
      minHeight: 200,
      maxWidth: 4096,
      maxHeight: 4096,
    }),
  ]);

  if (!frontValidation.ok) {
    throw new Error(frontValidation.message);
  }
  if (!backValidation.ok) {
    throw new Error(backValidation.message);
  }

  const [frontOcr, backOcr] = await Promise.all([
    performOCRFromBase64Image(input.frontIdImage, 'eng+fil'),
    performOCRFromBase64Image(input.backIdImage, 'eng+fil'),
  ]);

  return analyzeIdScreeningFromOcr(
    buildScreeningInputFromOcr({
      idType: input.idType,
      idNumber: normalizedEnteredIdNumber,
      frontValidation,
      backValidation,
      frontOcr,
      backOcr,
    }),
  );
}
