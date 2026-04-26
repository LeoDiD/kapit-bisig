import assert from 'assert';
import { analyzeIdScreeningFromOcr } from '../services/idScreeningService';

function run(): void {
  const passResult = analyzeIdScreeningFromOcr({
    enteredIdType: 'PhilSys ID',
    enteredIdNumber: '1234-5678-9012',
    frontText: 'PHILIPPINE IDENTIFICATION CARD PHILSYS PCN 1234 5678 9012 JUAN DELA CRUZ',
    backText: 'REPUBLIC OF THE PHILIPPINES',
    frontOcrConfidence: 0.88,
    backOcrConfidence: 0.52,
    frontWidth: 1280,
    frontHeight: 820,
    backWidth: 1280,
    backHeight: 820,
  });
  assert.strictEqual(passResult.decision, 'PASS');
  assert.strictEqual(passResult.idNumberMatch, true);
  assert.strictEqual(passResult.typeMatch, true);

  const typeMismatchResult = analyzeIdScreeningFromOcr({
    enteredIdType: 'PhilSys ID',
    enteredIdNumber: '1234-5678-9012',
    frontText: 'PASSPORT REPUBLIC OF THE PHILIPPINES P1234567 MANILA',
    backText: 'DEPARTMENT OF FOREIGN AFFAIRS',
    frontOcrConfidence: 0.83,
    backOcrConfidence: 0.71,
    frontWidth: 1280,
    frontHeight: 820,
    backWidth: 1280,
    backHeight: 820,
  });
  assert.strictEqual(typeMismatchResult.decision, 'BLOCK');
  assert.strictEqual(typeMismatchResult.detectedIdType, 'Passport');
  assert.ok(typeMismatchResult.reviewFlags.includes('TYPE_MISMATCH'));

  const idMismatchResult = analyzeIdScreeningFromOcr({
    enteredIdType: 'Passport',
    enteredIdNumber: 'P1234567',
    frontText: 'PASSPORT REPUBLIC OF THE PHILIPPINES P7654321',
    backText: 'DEPARTMENT OF FOREIGN AFFAIRS',
    frontOcrConfidence: 0.91,
    backOcrConfidence: 0.64,
    frontWidth: 1280,
    frontHeight: 820,
    backWidth: 1280,
    backHeight: 820,
  });
  assert.strictEqual(idMismatchResult.decision, 'BLOCK');
  assert.strictEqual(idMismatchResult.idNumberMatch, false);
  assert.ok(idMismatchResult.reviewFlags.includes('ID_NUMBER_MISMATCH'));

  const reviewResult = analyzeIdScreeningFromOcr({
    enteredIdType: 'PhilHealth ID',
    enteredIdNumber: '1234-5678-9012',
    frontText: 'CARD HOLDER NAME',
    backText: 'USE FOR BENEFITS',
    frontOcrConfidence: 0.12,
    backOcrConfidence: 0.1,
    frontWidth: 640,
    frontHeight: 420,
    backWidth: 640,
    backHeight: 420,
  });
  assert.strictEqual(reviewResult.decision, 'REVIEW');
  assert.strictEqual(reviewResult.idNumberMatch, null);
  assert.ok(reviewResult.reviewFlags.includes('OCR_ID_NUMBER_UNREADABLE'));
}

run();
console.log('idScreening.unit.ts passed');
