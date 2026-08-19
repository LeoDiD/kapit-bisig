import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import sharp from 'sharp';
import { MongoMemoryServer } from 'mongodb-memory-server';

function buildResidentPayload(index: number, barangay: string, status = 'Approved'): Record<string, unknown> {
  return {
    firstName: `Offline${index}`,
    lastName: 'Resident',
    fullName: `Offline${index} Resident`,
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    mobileNumber: `0928${String(1000000 + index).padStart(7, '0')}`,
    password: 'StrongPass123!',
    city: 'Lingayen',
    barangay,
    streetAddress: `Offline Street ${index}`,
    householdSize: 3,
    vulnerableMembers: [],
    vulnerableCounts: {},
    idType: 'PhilSys',
    idNumber: `ID-OFFLINE-${index}`,
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
    status,
  };
}

function buildEventPayload(name: string, barangays: string[], status: 'Active' | 'Closed' = 'Active') {
  return {
    name,
    disasterType: 'Flood',
    description: `${name} test event`,
    barangays,
    eventDate: new Date(),
    submissionDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status,
  };
}

function buildSubmission(clientGeneratedId: string, disasterEventId: string, photoProofs: string[]) {
  return {
    clientGeneratedId,
    disasterEventId,
    damageType: 'Flood',
    description: 'Floodwater damaged the resident home and essential belongings.',
    supportingInfo: 'Captured while the phone was offline.',
    dateSubmitted: new Date().toISOString(),
    photoProofs,
  };
}

export async function runOfflineProofSyncIntegrationTests(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'offline-proof-test-secret-12345678901234567890';
  const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kapit-bisig-proof-sync-'));
  process.env.VERIFICATION_IMAGE_UPLOAD_DIR = uploadDir;

  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  try {
    const { default: beneficiaryRoutes } = await import('../routes/beneficiaryRoutes');
    const { generateToken } = await import('../middleware/authMiddleware');
    const { default: Resident } = await import('../models/Resident');
    const { default: DisasterEvent } = await import('../models/DisasterEvent');
    const { default: ProofSubmission } = await import('../models/ProofSubmission');
    const { default: OfflineSyncQueue } = await import('../models/OfflineSyncQueue');

    const app = express();
    app.use(express.json({ limit: '30mb' }));
    app.use('/api/beneficiaries', beneficiaryRoutes);

    const resident = await Resident.create(buildResidentPayload(1, 'Bolo'));
    const unapprovedResident = await Resident.create(buildResidentPayload(2, 'Bolo', 'Pending'));
    const activeEvent = await DisasterEvent.create(buildEventPayload('Offline Flood', ['Bolo']));
    const closedEvent = await DisasterEvent.create(buildEventPayload('Closed Flood', ['Bolo'], 'Closed'));
    const wrongBarangayEvent = await DisasterEvent.create(buildEventPayload('Other Barangay Flood', ['Dulig']));
    const invalidImageEvent = await DisasterEvent.create(buildEventPayload('Invalid Image Flood', ['Bolo']));
    const unapprovedEvent = await DisasterEvent.create(buildEventPayload('Unapproved Resident Flood', ['Bolo']));

    const token = generateToken(String(resident._id), 'offline@example.test', 'Resident');
    const unapprovedToken = generateToken(String(unapprovedResident._id), 'pending@example.test', 'Resident');
    const pngBuffer = await sharp({
      create: { width: 200, height: 200, channels: 3, background: { r: 30, g: 120, b: 200 } },
    }).png().toBuffer();
    const validPhoto = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    const validPhotos = [validPhoto, validPhoto, validPhoto];

    const postSync = (bearer: string, submissions: Record<string, unknown>[]) => request(app)
      .post('/api/beneficiaries/sync/proof-submissions')
      .set('Authorization', `Bearer ${bearer}`)
      .send({ deviceId: 'android-test-device', submissions });

    const submission = buildSubmission('offline-success-1', String(activeEvent._id), validPhotos);
    const success = await postSync(token, [submission]);
    assert.strictEqual(success.status, 200);
    assert.strictEqual(success.body?.data?.synced?.[0]?.clientGeneratedId, 'offline-success-1');
    assert.strictEqual(success.body?.data?.synced?.[0]?.syncStatus, 'Synced');
    assert.strictEqual(success.body?.data?.synced?.[0]?.retryable, false);
    assert.ok(success.body?.data?.synced?.[0]?.proofSubmissionId);

    const stored = await ProofSubmission.findOne({ clientGeneratedId: 'offline-success-1' }).lean();
    assert.ok(stored);
    assert.strictEqual(stored?.syncSource, 'OFFLINE_SYNC');
    assert.strictEqual(await ProofSubmission.countDocuments({ clientGeneratedId: 'offline-success-1' }), 1);

    const duplicate = await postSync(token, [submission]);
    assert.strictEqual(duplicate.status, 200);
    assert.strictEqual(duplicate.body?.data?.synced?.[0]?.syncStatus, 'Synced');
    assert.strictEqual(duplicate.body?.data?.synced?.[0]?.proofSubmissionId, String(stored?._id));
    assert.strictEqual(await ProofSubmission.countDocuments({ clientGeneratedId: 'offline-success-1' }), 1);

    const malformedPhoto = `data:image/png;base64,${Buffer.from('not-an-image'.repeat(20)).toString('base64')}`;
    const invalidPhoto = await postSync(token, [
      buildSubmission('offline-invalid-photo', String(invalidImageEvent._id), [malformedPhoto, malformedPhoto, malformedPhoto]),
    ]);
    assert.strictEqual(invalidPhoto.status, 200);
    assert.strictEqual(invalidPhoto.body?.data?.synced?.[0]?.errorCode, 'INVALID_PROOF_IMAGE');
    assert.strictEqual(invalidPhoto.body?.data?.synced?.[0]?.retryable, false);

    const closed = await postSync(token, [
      buildSubmission('offline-closed-event', String(closedEvent._id), validPhotos),
    ]);
    assert.strictEqual(closed.body?.data?.synced?.[0]?.errorCode, 'EVENT_NOT_ACTIVE');
    assert.strictEqual(closed.body?.data?.synced?.[0]?.retryable, false);

    const wrongBarangay = await postSync(token, [
      buildSubmission('offline-wrong-barangay', String(wrongBarangayEvent._id), validPhotos),
    ]);
    assert.strictEqual(wrongBarangay.body?.data?.synced?.[0]?.errorCode, 'RESIDENT_OUT_OF_SCOPE');
    assert.strictEqual(wrongBarangay.body?.data?.synced?.[0]?.retryable, false);

    const unapproved = await postSync(unapprovedToken, [
      buildSubmission('offline-registration-pending', String(unapprovedEvent._id), validPhotos),
    ]);
    assert.strictEqual(unapproved.body?.data?.synced?.[0]?.errorCode, 'REGISTRATION_NOT_APPROVED');
    assert.strictEqual(unapproved.body?.data?.synced?.[0]?.retryable, false);

    const failedLog = await OfflineSyncQueue.findOne({ clientGeneratedId: 'offline-wrong-barangay' }).lean();
    assert.strictEqual(failedLog?.syncStatus, 'Failed');
    assert.strictEqual(failedLog?.errorCode, 'RESIDENT_OUT_OF_SCOPE');
    assert.strictEqual(failedLog?.retryable, false);

    const expiredToken = jwt.sign(
      { userId: String(resident._id), email: 'offline@example.test', role: 'Resident' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: -1 },
    );
    const expired = await postSync(expiredToken, [
      buildSubmission('offline-expired-auth', String(activeEvent._id), validPhotos),
    ]);
    assert.strictEqual(expired.status, 401);
    assert.strictEqual(expired.body?.code, 'TOKEN_EXPIRED');
    assert.strictEqual(await ProofSubmission.countDocuments({ clientGeneratedId: 'offline-expired-auth' }), 0);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
    fs.rmSync(uploadDir, { recursive: true, force: true });
    delete process.env.VERIFICATION_IMAGE_UPLOAD_DIR;
  }
}
