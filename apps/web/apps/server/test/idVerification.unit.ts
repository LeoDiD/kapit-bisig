import assert from 'assert';
import {
  normalizeIdNumber,
  validateIdNumberFormat,
  validateIdType,
} from '../utils/idVerification';

function run(): void {
  assert.strictEqual(validateIdType('Passport'), true);
  assert.strictEqual(validateIdType('Unknown ID'), false);

  assert.strictEqual(
    normalizeIdNumber('PhilSys ID', '1234-5678-9012'),
    '123456789012',
  );
  assert.strictEqual(
    normalizeIdNumber("Driver's License", ' n01-23-456789 '),
    'N0123456789',
  );
  assert.strictEqual(
    normalizeIdNumber('Passport', ' p1234567 '),
    'P1234567',
  );

  assert.strictEqual(validateIdNumberFormat('Passport', 'P1234567'), true);
  assert.strictEqual(validateIdNumberFormat('Passport', 'P12345678'), false);
  assert.strictEqual(validateIdNumberFormat('Passport', '12345678'), false);
  assert.strictEqual(validateIdNumberFormat('PhilSys ID', '1234-5678-9012'), true);
  assert.strictEqual(validateIdNumberFormat('PhilSys ID', '1234-5678-9012-3456'), false);
  assert.strictEqual(validateIdNumberFormat("Driver's License", 'N01-23-456789'), true);
  assert.strictEqual(validateIdNumberFormat("Driver's License", 'N0123456789'), true);
  assert.strictEqual(validateIdNumberFormat("Driver's License", 'AB1234567890'), false);
  assert.strictEqual(validateIdNumberFormat('PhilHealth ID', '12-345678901-2'), true);
  assert.strictEqual(validateIdNumberFormat('PhilHealth ID', 'A23456789012'), false);
  assert.strictEqual(validateIdNumberFormat("Voter's ID", 'AB1234'), true);
  assert.strictEqual(validateIdNumberFormat("Voter's ID", 'AB123'), false);
}

run();
console.log('idVerification.unit.ts passed');
