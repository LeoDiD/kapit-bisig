import assert from 'assert';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';

function setTestEnv(): void {
  process.env.NODE_ENV = 'test';
  process.env.PORT = process.env.PORT || '3001';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig-test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-123456789012345678901234567890';
  process.env.SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'kapitbisig2026@gmail.com';
  process.env.SUPERADMIN_PASSWORD_HASH = process.env.SUPERADMIN_PASSWORD_HASH || 'hash';
  process.env.BLOCKCHAIN_ENABLED = 'false';
}

async function waitFor<T>(
  label: string,
  fn: () => Promise<T>,
  isDone: (value: T) => boolean,
  timeoutMs = 10000,
): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await fn();
    if (isDone(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function buildResidentPayload(index: number, barangay: string): Record<string, unknown> {
  return {
    firstName: `Resident${index}`,
    lastName: 'Test',
    fullName: `Resident${index} Test`,
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    mobileNumber: `0917${String(1000000 + index).padStart(7, '0')}`,
    password: 'StrongPass123!',
    city: 'Lingayen',
    barangay,
    streetAddress: `Street ${index}`,
    householdSize: 3,
    vulnerableMembers: [],
    vulnerableCounts: {},
    idType: 'PhilSys',
    idNumber: `ID-INT-${index}`,
    frontIdImage: 'front',
    backIdImage: 'back',
    faceImage: 'face',
    verification: {
      overallConfidence: 95,
      isVerified: true,
      aiVerificationStatus: 'High Match',
      warnings: [],
      riskFactors: [],
    },
    status: 'Approved',
  };
}

export async function runDistributionFlowIntegrationTests(): Promise<void> {
  setTestEnv();
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  try {
    const { default: distributionRoutes } = await import('../routes/distributionRoutes');
    const { default: claimRoutes } = await import('../routes/claimRoutes');
    const { startClaimChainQueue, stopClaimChainQueue } = await import('../services/claimChainQueue');
    const { default: StaffUser } = await import('../models/StaffUser');
    const { default: Resident } = await import('../models/Resident');
    const { default: HouseholdToken } = await import('../models/HouseholdToken');
    const { default: Distribution } = await import('../models/Distribution');
    const { default: Claim } = await import('../models/Claim');
    const { default: DistributionClaim } = await import('../models/DistributionClaim');

    const staff = await StaffUser.create({
      email: 'staff-int@example.com',
      firstName: 'Integration',
      lastName: 'Staff',
      role: 'LGU_STAFF',
      assignedBarangays: ['Bolo', 'Bongalon', 'Dulig', 'San Jose'],
      isActive: true,
    });

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).authUser = {
        role: 'LGU_STAFF',
        userId: String(staff._id),
        sub: 'integration-staff',
        assignedBarangays: ['Bolo', 'Bongalon', 'Dulig', 'San Jose'],
      };
      next();
    });
    app.use('/api/distributions', distributionRoutes);
    app.use('/api/claims', claimRoutes);

    startClaimChainQueue();

    const resA = await Resident.create(buildResidentPayload(1, 'Bolo'));
    const resB = await Resident.create(buildResidentPayload(2, 'Dulig'));
    const outOfAreaResident = await Resident.create(buildResidentPayload(3, 'Uyong'));

    const createResponse = await request(app)
      .post('/api/distributions')
      .send({
        barangay: 'Bolo',
        assignedBarangays: ['Bongalon', 'Dulig', 'San Jose'],
        scheduled: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        assignedStaffIds: [String(staff._id)],
        notes: 'integration test',
      });
    assert.strictEqual(createResponse.status, 201);
    const distributionId = createResponse.body?.data?.id as string;
    assert.ok(distributionId);

    async function createTokenForResident(plainToken: string, resident: any): Promise<void> {
      await HouseholdToken.create({
        tokenHash: await bcrypt.hash(plainToken, 12),
        tokenPrefix: plainToken.replace(/-/g, '').slice(0, 4).toUpperCase(),
        status: 'USED',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedBy: {
          residentId: resident._id,
          ipAddress: '127.0.0.1',
          userAgent: 'integration-test',
        },
        householdInfo: {
          headOfHousehold: resident.fullName,
          address: resident.streetAddress,
          barangay: resident.barangay,
          expectedMembers: 3,
          notes: '',
        },
        issuedBy: 'integration-test',
      });
    }

    await createTokenForResident('ABCD-EFGH-IJKL', resA);
    await createTokenForResident('MNOP-QRST-UVWX', resB);
    await createTokenForResident('WXYZ-1234-ABCD', outOfAreaResident);

    const outOfAreaClaim = await request(app)
      .post('/api/claims/record-claim')
      .send({
        claimToken: 'WXYZ-1234-ABCD',
        distributionId,
        distributionSite: 'Bolo Covered Court',
      });
    assert.strictEqual(outOfAreaClaim.status, 403);
    assert.match(String(outOfAreaClaim.body?.message || ''), /not assigned/i);

    const claim1 = await request(app)
      .post('/api/claims/record-claim')
      .set('Idempotency-Key', 'integration-claim-1')
      .send({
        claimToken: 'ABCD-EFGH-IJKL',
        distributionId,
        distributionSite: 'Bolo Covered Court',
      });
    assert.strictEqual(claim1.status, 202);

    const claim2 = await request(app)
      .post('/api/claims/record-claim')
      .send({
        claimToken: 'MNOP-QRST-UVWX',
        distributionId,
        distributionSite: 'Bolo Covered Court',
      });
    assert.strictEqual(claim2.status, 202);

    await waitFor(
      'claims confirmation',
      async () => Claim.countDocuments({ distributionId, status: 'CONFIRMED' }),
      (count) => count === 2,
    );

    await waitFor(
      'distribution claim sync',
      async () => DistributionClaim.countDocuments({ distributionId: new mongoose.Types.ObjectId(distributionId) }),
      (count) => count === 2,
    );

    const dist = await waitFor(
      'distribution completed status',
      async () => Distribution.findById(distributionId).lean(),
      (d) => !!d && d.status === 'Claimed',
    );
    assert.ok(dist);
    assert.strictEqual(dist?.status, 'Claimed');

    const duplicateWithSameKey = await request(app)
      .post('/api/claims/record-claim')
      .set('Idempotency-Key', 'integration-claim-1')
      .send({
        claimToken: 'ABCD-EFGH-IJKL',
        distributionId,
        distributionSite: 'Bolo Covered Court',
      });
    assert.strictEqual(duplicateWithSameKey.status, 200);

    stopClaimChainQueue();
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}
