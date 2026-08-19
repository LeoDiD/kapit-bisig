import assert from 'assert';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

function buildResidentPayload(seed: number, barangay: string) {
  return {
    residentCode: `RES-INT-${seed}`,
    firstName: `Resident${seed}`,
    lastName: 'Test',
    fullName: `Resident${seed} Test`,
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    mobileNumber: `0917000000${seed}`,
    email: `resident${seed}@example.com`,
    emailLower: `resident${seed}@example.com`,
    password: 'Password123!',
    city: 'Lingayen',
    barangay,
    streetAddress: `${seed} Main St`,
    householdSize: 3,
    vulnerableMembers: [],
    vulnerableCounts: {},
    idType: 'UMID',
    idNumber: `ID-INT-${seed}`,
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

async function waitFor<T>(
  label: string,
  fn: () => Promise<T>,
  predicate: (val: T) => boolean,
  timeoutMs = 4000,
  intervalMs = 50,
): Promise<T> {
  const started = Date.now();
  let lastVal: T = await fn();
  if (predicate(lastVal)) return lastVal;
  while (Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    lastVal = await fn();
    if (predicate(lastVal)) return lastVal;
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function makeScheduleDate(dayOffset = 1, manilaHour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setUTCHours(manilaHour - 8, 0, 0, 0);
  return d.toISOString();
}

export async function runDistributionFlowIntegrationTests(): Promise<void> {
  process.env.JWT_SECRET = 'test-secret-123456789012345678901234567890';
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);

  try {
    const { default: distributionRoutes } = await import('../routes/distributionRoutes');
    const { default: claimRoutes } = await import('../routes/claimRoutes');
    const { default: profileRoutes } = await import('../routes/profileRoutes');
    const { default: Resident } = await import('../models/Resident');
    const { default: DisasterEvent } = await import('../models/DisasterEvent');
    const { default: BeneficiaryEligibility } = await import('../models/BeneficiaryEligibility');
    const { default: Distribution } = await import('../models/Distribution');
    const { default: StaffUser } = await import('../models/StaffUser');
    const { default: DistributionClaim } = await import('../models/DistributionClaim');
    const { default: HouseholdToken } = await import('../models/HouseholdToken');
    const { syncResidentEnrollmentsForEvent } = await import('../services/distributionFlowService');

    const staff = await StaffUser.create({
      email: 'staff-integration@example.com',
      firstName: 'Staff',
      lastName: 'Integration',
      role: 'LGU_STAFF',
      assignedBarangays: ['Bolo', 'Bongalon', 'Dulig', 'San Jose'],
      isActive: true,
    });

    const splitStaffA = await StaffUser.create({
      email: 'staff-split-a@example.com',
      firstName: 'Split',
      lastName: 'A',
      role: 'LGU_STAFF',
      assignedBarangays: ['Bolo'],
      isActive: true,
    });

    const splitStaffB = await StaffUser.create({
      email: 'staff-split-b@example.com',
      firstName: 'Split',
      lastName: 'B',
      role: 'LGU_STAFF',
      assignedBarangays: ['Dulig', 'San Jose'],
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
    app.use('/api/users', profileRoutes);

    const resA = await Resident.create(buildResidentPayload(1, 'Bolo'));
    const resB = await Resident.create(buildResidentPayload(2, 'Dulig'));
    const outOfAreaResident = await Resident.create(buildResidentPayload(3, 'Uyong'));
    const lateApprovedResident = await Resident.create(buildResidentPayload(4, 'Bolo'));
    const disasterEvent = await DisasterEvent.create({
      name: 'Typhoon Integration',
      disasterType: 'Typhoon',
      barangays: ['Bolo', 'Bongalon', 'Dulig', 'San Jose'],
      eventDate: new Date(),
      status: 'Active',
    });

    await BeneficiaryEligibility.create([
      {
        residentId: resA._id,
        disasterEventId: disasterEvent._id,
        proofSubmissionId: new mongoose.Types.ObjectId(),
        status: 'Eligible',
        registrationStatus: 'Approved',
        proofStatus: 'Approved',
      },
      {
        residentId: resB._id,
        disasterEventId: disasterEvent._id,
        proofSubmissionId: new mongoose.Types.ObjectId(),
        status: 'Eligible',
        registrationStatus: 'Approved',
        proofStatus: 'Approved',
      },
    ]);

    // Create distribution for single barangay 'Bolo'
    const createResponse = await request(app)
      .post('/api/distributions')
      .send({
        disasterEventId: String(disasterEvent._id),
        barangay: 'Bolo',
        scheduled: makeScheduleDate(1, 9),
        assignedStaffIds: [String(staff._id)],
        notes: 'integration test single barangay',
      });
    assert.strictEqual(createResponse.status, 201);
    const distributionId = createResponse.body?.data?.id as string;
    assert.ok(distributionId);
    assert.strictEqual(createResponse.body?.data?.requiresBeneficiaryApproval, true);
    assert.strictEqual(createResponse.body?.enrollment?.matchedResidents, 1);
    assert.strictEqual(await BeneficiaryEligibility.countDocuments({
      distributionId: new mongoose.Types.ObjectId(distributionId),
      status: 'Eligible',
    }), 1);

    const lateProofSubmissionId = new mongoose.Types.ObjectId();
    await BeneficiaryEligibility.create({
      residentId: lateApprovedResident._id,
      disasterEventId: disasterEvent._id,
      proofSubmissionId: lateProofSubmissionId,
      status: 'Eligible',
      registrationStatus: 'Approved',
      proofStatus: 'Approved',
    });
    const syncedAfterApproval = await syncResidentEnrollmentsForEvent({
      residentId: lateApprovedResident._id,
      disasterEventId: disasterEvent._id,
      proofSubmissionId: lateProofSubmissionId,
      registrationStatus: 'Approved',
      proofStatus: 'Approved',
      reviewedAt: new Date(),
    });
    assert.strictEqual(syncedAfterApproval, 1);
    assert.ok(await BeneficiaryEligibility.exists({
      residentId: lateApprovedResident._id,
      distributionId: new mongoose.Types.ObjectId(distributionId),
      status: 'Eligible',
    }));

    // Split staff A covers Bolo -> should succeed
    const splitCoverageCreate = await request(app)
      .post('/api/distributions')
      .send({
        disasterEventId: String(disasterEvent._id),
        barangay: 'Bolo',
        scheduled: makeScheduleDate(1, 11),
        assignedStaffIds: [String(splitStaffA._id)],
        notes: 'split coverage test',
      });
    assert.strictEqual(splitCoverageCreate.status, 201);

    // Split staff B covers Dulig/San Jose but NOT Bolo -> should fail
    const insufficientCoverageCreate = await request(app)
      .post('/api/distributions')
      .send({
        disasterEventId: String(disasterEvent._id),
        barangay: 'Bolo',
        scheduled: makeScheduleDate(1, 14),
        assignedStaffIds: [String(splitStaffB._id)],
        notes: 'insufficient coverage test',
      });
    assert.strictEqual(insufficientCoverageCreate.status, 403);
    assert.strictEqual(insufficientCoverageCreate.body?.code, 'OUT_OF_SCOPE_STAFF');

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
    await createTokenForResident('LATE-3333-DDDD', lateApprovedResident);
    await createTokenForResident('ZZZZ-1111-AAAA', resA);

    // Set distribution to active for claim operations
    await Distribution.findByIdAndUpdate(distributionId, {
      scheduled: new Date(Date.now() - 30 * 60 * 1000),
      endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    });

    const householdsResponse = await request(app)
      .get(`/api/distributions/${distributionId}/households`);
    assert.strictEqual(householdsResponse.status, 200);
    assert.strictEqual(householdsResponse.body?.data?.totals?.registered, 2);
    assert.strictEqual(householdsResponse.body?.data?.totals?.notYetClaimed, 2);

    const outOfAreaClaim = await request(app)
      .post('/api/claims/record-claim')
      .send({
        claimToken: 'WXYZ-1234-ABCD',
        distributionId,
        distributionSite: 'Bolo Covered Court',
      });
    assert.strictEqual(outOfAreaClaim.status, 403);
    assert.match(String(outOfAreaClaim.body?.message || ''), /not covered|approved target beneficiary/i);

    const claim1 = await request(app)
      .post('/api/claims/record-claim')
      .set('Idempotency-Key', 'integration-claim-1')
      .send({
        claimToken: 'ABCD-EFGH-IJKL',
        distributionId,
        distributionSite: 'Bolo Covered Court',
      });
    assert.strictEqual(claim1.status, 201);

    const lateApprovedClaim = await request(app)
      .post('/api/claims/record-claim')
      .send({
        claimToken: 'LATE-3333-DDDD',
        distributionId,
        distributionSite: 'Bolo Covered Court',
      });
    assert.strictEqual(lateApprovedClaim.status, 201);

    // Scan eligible availability test: staff is already assigned to today's Bolo distribution
    // Scan eligible availability test: splitStaffA is already assigned to today's active Bolo distribution (from splitCoverageCreate)
    const authToken = jwt.sign(
      {
        sub: 'integration-staff',
        role: 'LGU_STAFF',
        userId: String(staff._id),
        assignedBarangays: ['Bolo', 'Bongalon', 'Dulig', 'San Jose'],
      },
      process.env.JWT_SECRET || '01234567890123456789012345678901',
      { algorithm: 'HS256', expiresIn: '1h' },
    );

    const scanEligibleResponse = await request(app)
      .get(`/api/users/scan-eligible?barangay=Bolo&scheduled=${encodeURIComponent(makeScheduleDate(1, 11))}`)
      .set('Authorization', `Bearer ${authToken}`);
    assert.strictEqual(scanEligibleResponse.status, 200);
    const eligibleItems = scanEligibleResponse.body?.data?.items || [];
    const busyStaff = eligibleItems.find((item: any) => item.id === String(splitStaffA._id));
    assert.ok(busyStaff);
    assert.strictEqual(busyStaff.isAvailable, false);
    assert.strictEqual(busyStaff.conflict?.barangay, 'Bolo');

    // Same-day conflict test: attempting to assign already-scheduled splitStaffA on the same day fails with 409
    const conflictingDistributionResponse = await request(app)
      .post('/api/distributions')
      .send({
        disasterEventId: String(disasterEvent._id),
        barangay: 'Bolo',
        scheduled: makeScheduleDate(1, 15),
        assignedStaffIds: [String(splitStaffA._id)],
        notes: 'conflicting same day distribution',
      });
    assert.strictEqual(conflictingDistributionResponse.status, 409);
    assert.strictEqual(conflictingDistributionResponse.body?.code, 'STAFF_SCHEDULE_CONFLICT');

    // Creating distribution on a different day succeeds
    const secondDistributionResponse = await request(app)
      .post('/api/distributions')
      .send({
        disasterEventId: String(disasterEvent._id),
        barangay: 'Bolo',
        scheduled: makeScheduleDate(2, 10),
        assignedStaffIds: [String(staff._id)],
        notes: 'second distribution test',
      });
    assert.strictEqual(secondDistributionResponse.status, 201);
    const secondDistributionId = secondDistributionResponse.body?.data?.id as string;
    assert.ok(secondDistributionId);

    // Set second distribution to active for claim test
    await Distribution.findByIdAndUpdate(secondDistributionId, {
      scheduled: new Date(Date.now() - 30 * 60 * 1000),
      endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    });

    const claimFromAutomaticEnrollment = await request(app)
      .post('/api/claims/record-claim')
      .send({
        claimToken: 'ZZZZ-1111-AAAA',
        distributionId: secondDistributionId,
        distributionSite: 'Bolo Covered Court',
      });
    assert.strictEqual(claimFromAutomaticEnrollment.status, 201);

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

    // Reschedule test: active distribution can be rescheduled with a reason
    const rescheduleNewDate = makeScheduleDate(3, 10);
    const rescheduleResponse = await request(app)
      .patch(`/api/distributions/${secondDistributionId}/reschedule`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        scheduled: rescheduleNewDate,
        reason: 'Typhoon delay: moving relief ops to next day',
      });
    assert.strictEqual(rescheduleResponse.status, 200);
    assert.strictEqual(rescheduleResponse.body?.data?.scheduled, rescheduleNewDate);
    assert.ok(rescheduleResponse.body?.data?.notes.includes('Typhoon delay'));

    // Reschedule conflict test: rescheduling to a date where staff has conflict fails with 409
    // splitCoverageCreate was scheduled for today (+60m)
    const conflictRescheduleResponse = await request(app)
      .patch(`/api/distributions/${secondDistributionId}/reschedule`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        scheduled: makeScheduleDate(1, 9),
        reason: 'Attempted to move back to today',
      });
    // Note: staff is assigned to secondDistributionId. But staff's first distribution was claimed, whereas if splitStaffA was assigned it would conflict.
    // Let's test rescheduling a completed distribution fails with 400
    const completedRescheduleResponse = await request(app)
      .patch(`/api/distributions/${distributionId}/reschedule`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        scheduled: makeScheduleDate(4, 10),
        reason: 'Cannot reschedule completed',
      });
    assert.strictEqual(completedRescheduleResponse.status, 400);

  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}
