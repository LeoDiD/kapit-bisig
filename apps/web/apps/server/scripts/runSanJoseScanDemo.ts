import assert from 'assert';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import BeneficiaryEligibility from '../models/BeneficiaryEligibility';
import Claim from '../models/Claim';
import Distribution from '../models/Distribution';
import DistributionClaim from '../models/DistributionClaim';
import Resident from '../models/Resident';
import StaffUser from '../models/StaffUser';
import distributionRoutes from '../routes/distributionRoutes';
import householdRoutes from '../routes/householdRoutes';
import { buildResidentQrToken } from '../services/residentQrService';

const DEMO_EMAIL = 'san-jose.scan-demo@kapitbisig.test';
const DEMO_RESIDENT_CODE = 'SJ-DEMO-SCAN-001';
const DEMO_DISTRIBUTION_NOTE = '[DEMO] San Jose household modal QR scan';

async function upsertDemoResident() {
  const existing = await Resident.findOne({ emailLower: DEMO_EMAIL });
  if (existing) {
    existing.firstName = 'San Jose';
    existing.lastName = 'Scan Demo';
    existing.fullName = 'San Jose Scan Demo';
    existing.city = 'Lingayen';
    existing.barangay = 'San Jose';
    existing.streetAddress = 'Demo Household';
    existing.status = 'Approved';
    existing.qrStatus = 'ACTIVE';
    existing.qrVersion = Math.max(existing.qrVersion || 1, 1);
    existing.qrIssuedAt = new Date();
    await existing.save();
    return existing;
  }

  return Resident.create({
    residentCode: DEMO_RESIDENT_CODE,
    firstName: 'San Jose',
    lastName: 'Scan Demo',
    fullName: 'San Jose Scan Demo',
    dateOfBirth: '1990-01-01',
    gender: 'Female',
    mobileNumber: '09999990001',
    email: DEMO_EMAIL,
    emailLower: DEMO_EMAIL,
    password: 'DemoPassword123!',
    city: 'Lingayen',
    barangay: 'San Jose',
    streetAddress: 'Demo Household',
    householdSize: 4,
    vulnerableMembers: [],
    vulnerableCounts: {},
    idType: 'Demo ID',
    idNumber: 'DEMO-SAN-JOSE-SCAN-001',
    frontIdImage: 'demo://front-id',
    backIdImage: 'demo://back-id',
    faceImage: 'demo://face',
    verification: {
      overallConfidence: 100,
      idConfidence: 100,
      faceMatchConfidence: 100,
      livenessConfidence: 100,
      dataMatchScore: 100,
      riskScore: 0,
      isVerified: true,
      aiVerificationStatus: 'High Match',
      warnings: [],
      riskFactors: [],
    },
    status: 'Approved',
    qrVersion: 1,
    qrIssuedAt: new Date(),
    qrStatus: 'ACTIVE',
  });
}

async function getSanJoseScanner() {
  const existing = await StaffUser.findOne({
    role: 'LGU_STAFF',
    isActive: true,
    assignedBarangays: 'San Jose',
  }).sort({ createdAt: 1 });
  if (existing) return existing;

  return StaffUser.create({
    email: 'staff.scan-demo.sanjose@kapitbisig.gov.ph',
    firstName: 'San Jose',
    lastName: 'Demo Scanner',
    role: 'LGU_STAFF',
    assignedBarangays: ['San Jose'],
    isActive: true,
  });
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kapit-bisig';
  const jwtSecret = process.env.JWT_SECRET || '';
  assert.ok(jwtSecret.length >= 32, 'JWT_SECRET must be configured with at least 32 characters.');
  await mongoose.connect(mongoUri);

  try {
    const [resident, scanner] = await Promise.all([
      upsertDemoResident(),
      getSanJoseScanner(),
    ]);
    const now = Date.now();
    const scheduled = new Date(now - 5 * 60 * 1000).toISOString();
    const endsAt = new Date(now + 2 * 60 * 60 * 1000);

    const distribution = await Distribution.findOneAndUpdate(
      { notes: DEMO_DISTRIBUTION_NOTE },
      {
        barangay: 'San Jose',
        assignedBarangays: ['San Jose'],
        assignedStaffIds: [scanner._id],
        scheduled,
        endsAt,
        households: 1,
        notes: DEMO_DISTRIBUTION_NOTE,
        requiresBeneficiaryApproval: true,
        status: 'Unclaimed',
        claimedAt: null,
        archivedAt: null,
        archivedBy: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await BeneficiaryEligibility.deleteMany({
      distributionId: distribution._id,
      residentId: { $ne: resident._id },
    });
    await BeneficiaryEligibility.findOneAndUpdate(
      { residentId: resident._id, distributionId: distribution._id },
      {
        residentId: resident._id,
        distributionId: distribution._id,
        status: 'Eligible',
        registrationStatus: 'Approved',
        proofStatus: 'Approved',
        reviewedBy: 'San Jose scan demo',
        reviewedAt: new Date(),
        lastQualifiedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Reset only this tagged demo pair so rerunning the command performs a fresh scan.
    await Promise.all([
      Claim.deleteMany({
        residentId: resident._id.toString(),
        distributionId: distribution._id.toString(),
        claimCategory: 'DISTRIBUTION',
      }),
      DistributionClaim.deleteMany({
        householdId: resident._id,
        distributionId: distribution._id,
      }),
    ]);

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).authUser = {
        role: 'LGU_STAFF',
        userId: scanner._id.toString(),
        sub: 'san-jose-scan-demo',
        assignedBarangays: ['San Jose'],
      };
      next();
    });
    app.use('/api/distributions', distributionRoutes);
    app.use('/api/household', householdRoutes);

    const scannerToken = jwt.sign(
      {
        sub: 'san-jose-scan-demo',
        userId: scanner._id.toString(),
        email: scanner.email,
        role: 'LGU_STAFF',
        assignedBarangays: ['San Jose'],
      },
      jwtSecret,
      { algorithm: 'HS256', expiresIn: '15m' },
    );
    const qrData = buildResidentQrToken(resident.residentCode, resident.qrVersion);

    const resolveResponse = await request(app)
      .post('/api/household/qr/resolve')
      .set('Authorization', `Bearer ${scannerToken}`)
      .send({ qrData, distributionId: distribution._id.toString() });
    assert.strictEqual(resolveResponse.status, 200, resolveResponse.body?.message);
    assert.strictEqual(resolveResponse.body?.data?.residentId, resident._id.toString());
    assert.strictEqual(resolveResponse.body?.data?.alreadyClaimed, false);

    const claimResponse = await request(app)
      .post('/api/household/qr/claim')
      .set('Authorization', `Bearer ${scannerToken}`)
      .send({
        residentId: resident._id.toString(),
        distributionId: distribution._id.toString(),
      });
    assert.strictEqual(claimResponse.status, 201, claimResponse.body?.message);

    const modalResponse = await request(app)
      .get(`/api/distributions/${distribution._id.toString()}/households`);
    assert.strictEqual(modalResponse.status, 200, modalResponse.body?.message);
    assert.deepStrictEqual(modalResponse.body?.data?.totals, {
      registered: 1,
      claimed: 1,
      notYetClaimed: 0,
    });
    const claimedHousehold = modalResponse.body?.data?.claimed?.[0];
    assert.strictEqual(claimedHousehold?.householdCode, resident.residentCode);
    assert.strictEqual(claimedHousehold?.proofMethod, 'QR');
    assert.strictEqual(claimedHousehold?.scanner?.name, scanner.email);

    console.log(JSON.stringify({
      distributionId: distribution._id.toString(),
      barangay: distribution.barangay,
      resident: {
        name: resident.fullName,
        code: resident.residentCode,
      },
      claimId: claimResponse.body?.claimId,
      modal: {
        totals: modalResponse.body?.data?.totals,
        householdName: claimedHousehold?.householdName,
        householdCode: claimedHousehold?.householdCode,
        address: claimedHousehold?.address,
        proofMethod: claimedHousehold?.proofMethod,
        scannedBy: claimedHousehold?.scanner?.name,
        claimedAt: claimedHousehold?.claimedAt,
      },
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

void main().catch(async (error) => {
  console.error('San Jose scan demo failed:', error);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
