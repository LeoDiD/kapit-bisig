import assert from 'assert';
import {
  buildResidentQrToken,
  deriveEligibilityStatus,
  parseResidentCodeFromQrData,
} from '../services/beneficiaryService';

export function runBeneficiaryFlowUnitTests(): void {
  assert.strictEqual(deriveEligibilityStatus('Approved', 'Approved'), 'Eligible');
  assert.strictEqual(deriveEligibilityStatus('Approved', 'Pending Verification'), 'Not Eligible');
  assert.strictEqual(deriveEligibilityStatus('Pending', 'Approved'), 'Not Eligible');
  assert.strictEqual(deriveEligibilityStatus('Needs Revision', 'Approved'), 'Not Eligible');
  assert.strictEqual(deriveEligibilityStatus('Rejected', 'Rejected'), 'Not Eligible');

  const residentCode = 'BO-2026-000123';
  const qrToken = buildResidentQrToken(residentCode);
  assert.strictEqual(parseResidentCodeFromQrData(qrToken), residentCode);
  assert.strictEqual(parseResidentCodeFromQrData(residentCode), residentCode);
  assert.strictEqual(parseResidentCodeFromQrData('KBQR1.invalid-payload'), null);
  assert.strictEqual(parseResidentCodeFromQrData('not-a-qr'), null);
}
