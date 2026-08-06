import assert from 'assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Resident from '../models/Resident';
import Distribution from '../models/Distribution';
import Claim from '../models/Claim';
import BeneficiaryEligibility from '../models/BeneficiaryEligibility';
import {
  buildResidentQrToken,
  deriveEligibilityStatus,
  parseResidentCodeFromQrData,
} from '../services/beneficiaryService';
import { isResidentApprovedBeneficiaryForDistribution } from '../services/distributionFlowService';

export async function runBeneficiaryFlowUnitTests(): Promise<void> {
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

  // DB Mock Tests for Eligibility
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const dist = await Distribution.create({
    name: 'Test Dist',
    targetBarangays: ['Bolo'],
    barangay: 'Bolo',
    status: 'Unclaimed',
    households: 100,
    scheduled: new Date().toISOString(),
    requiresBeneficiaryApproval: true,
    totalAllocated: 100,
    perHouseholdAllocation: 1
  });

  const resident = await Resident.create({
    residentCode: 'KB-TEST-001',
    firstName: 'Test',
    lastName: 'Resident',
    fullName: 'Test Resident',
    password: 'password123',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    streetAddress: '123 Main St',
    barangay: 'Bolo',
    mobileNumber: '09123456789',
    idType: 'National ID',
    idNumber: '123456789',
    frontIdImage: 'front.jpg',
    backIdImage: 'back.jpg',
    faceImage: 'face.jpg',
    status: 'Approved',
    qrStatus: 'ACTIVE',
    verification: {
      overallConfidence: 95
    }
  });

  // Should not be eligible initially without BeneficiaryEligibility
  let isEligible = await isResidentApprovedBeneficiaryForDistribution(dist._id as string, resident._id as string);
  assert.strictEqual(isEligible, false);

  // Create BeneficiaryEligibility
  await BeneficiaryEligibility.create({
    residentId: resident._id,
    distributionId: dist._id,
    status: 'Eligible',
    registrationStatus: 'Approved',
    proofStatus: 'Approved'
  });

  isEligible = await isResidentApprovedBeneficiaryForDistribution(dist._id as string, resident._id as string);
  assert.strictEqual(isEligible, true);

  // Should not be eligible if qrStatus is revoked
  await Resident.updateOne({ _id: resident._id }, { qrStatus: 'REVOKED' });
  isEligible = await isResidentApprovedBeneficiaryForDistribution(dist._id as string, resident._id as string);
  assert.strictEqual(isEligible, false);

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('Beneficiary Flow Unit Tests Passed!');}
