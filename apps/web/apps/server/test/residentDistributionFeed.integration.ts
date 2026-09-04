import assert from 'assert';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

const TEST_SECRET = 'resident-feed-test-secret-12345678901234567890';

function residentPayload(seed: number, barangay: string) {
  return {
    residentCode: `RES-FEED-${seed}`,
    firstName: `Resident${seed}`,
    lastName: 'Feed',
    fullName: `Resident${seed} Feed`,
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    mobileNumber: `0917111111${seed}`,
    email: `resident-feed-${seed}@example.com`,
    emailLower: `resident-feed-${seed}@example.com`,
    password: 'Password123!',
    city: 'Lingayen',
    barangay,
    streetAddress: `${seed} Feed Street`,
    householdSize: 2,
    vulnerableMembers: [],
    vulnerableCounts: {},
    idType: 'UMID',
    idNumber: `FEED-ID-${seed}`,
    frontIdImage: 'https://example.com/front.jpg',
    backIdImage: 'https://example.com/back.jpg',
    faceImage: 'https://example.com/face.jpg',
    verification: {
      overallConfidence: 95,
      idConfidence: 95,
      faceMatchConfidence: 95,
      livenessConfidence: 95,
      dataMatchScore: 95,
      riskScore: 5,
      isFlagged: false,
    },
    status: 'Approved',
    qrVersion: 1,
    qrStatus: 'ACTIVE',
  };
}

function bearerToken(resident: { _id: mongoose.Types.ObjectId; email?: string | null }, suffix: string): string {
  return jwt.sign(
    {
      userId: String(resident._id),
      email: resident.email || '',
      role: 'Resident',
      jti: `resident-feed-${suffix}`,
    },
    TEST_SECRET,
    { algorithm: 'HS256', expiresIn: '1h' },
  );
}

export async function runResidentDistributionFeedIntegrationTests(): Promise<void> {
  process.env.NODE_ENV = 'production';
  process.env.JWT_SECRET = TEST_SECRET;

  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  try {
    const { default: householdRoutes } = await import('../routes/householdRoutes');
    const { default: Resident } = await import('../models/Resident');
    const { default: Distribution } = await import('../models/Distribution');

    const app = express();
    app.use(express.json());
    app.use('/api/household', householdRoutes);

    const boloResident = await Resident.create(residentPayload(1, 'Bolo'));
    const uyongResident = await Resident.create(residentPayload(2, 'Uyong'));
    const common = {
      assignedStaffIds: [],
      households: 1,
      requiresBeneficiaryApproval: false,
      status: 'Unclaimed',
    } as const;

    const visible = await Distribution.create({
      ...common,
      barangay: 'Bolo',
      assignedBarangays: [],
      scheduled: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
      notes: 'visible direct coverage',
    });
    const visibleAssigned = await Distribution.create({
      ...common,
      barangay: 'Dulig',
      assignedBarangays: ['Bolo'],
      scheduled: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      notes: 'visible assigned coverage',
    });
    const expired = await Distribution.create({
      ...common,
      barangay: 'Bolo',
      assignedBarangays: [],
      scheduled: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() - 60 * 60 * 1000),
      notes: 'expired',
    });
    const archived = await Distribution.create({
      ...common,
      barangay: 'Bolo',
      assignedBarangays: [],
      scheduled: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
      archivedAt: new Date(),
      archivedBy: 'integration-test',
      notes: 'archived',
    });

    const boloToken = bearerToken(boloResident, 'bolo');
    const firstResponse = await request(app)
      .get('/api/household/distributions')
      .set('Authorization', `Bearer ${boloToken}`);
    assert.strictEqual(firstResponse.status, 200);
    assert.strictEqual(firstResponse.body?.meta?.cacheTtlSeconds, 60);
    const ids = new Set((firstResponse.body?.data || []).map((item: any) => String(item.id)));
    assert.strictEqual(ids.has(String(visible._id)), true);
    assert.strictEqual(ids.has(String(visibleAssigned._id)), true);
    assert.strictEqual(ids.has(String(expired._id)), false);
    assert.strictEqual(ids.has(String(archived._id)), false);
    for (const item of firstResponse.body?.data || []) {
      assert.ok(item.endsAt);
      assert.ok(item.lifecycleStatus === 'Active' || item.lifecycleStatus === 'Upcoming');
    }

    // The first response already consumed one request; the next 119 remain allowed.
    for (let attempt = 0; attempt < 119; attempt += 1) {
      const response = await request(app)
        .get('/api/household/distributions')
        .set('Authorization', `Bearer ${boloToken}`);
      assert.strictEqual(response.status, 200);
    }
    const limitedResponse = await request(app)
      .get('/api/household/distributions')
      .set('Authorization', `Bearer ${boloToken}`);
    assert.strictEqual(limitedResponse.status, 429);
    assert.strictEqual(limitedResponse.body?.code, 'RATE_LIMITED');
    assert.ok(Number(limitedResponse.body?.retryAfterSeconds) > 0);

    // A different authenticated resident on the same IP receives an independent bucket.
    const otherResidentResponse = await request(app)
      .get('/api/household/distributions')
      .set('Authorization', `Bearer ${bearerToken(uyongResident, 'uyong')}`);
    assert.strictEqual(otherResidentResponse.status, 200);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}

if (require.main === module) {
  void runResidentDistributionFeedIntegrationTests()
    .then(() => console.log('resident distribution feed integration tests passed'))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
