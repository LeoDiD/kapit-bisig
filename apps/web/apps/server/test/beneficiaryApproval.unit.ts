import assert from 'assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Resident from '../models/Resident';
import DisasterEvent from '../models/DisasterEvent';
import ProofSubmission from '../models/ProofSubmission';
import { reviewResidentProof } from '../services/beneficiaryService';
import Notification from '../models/Notification';

async function run(): Promise<void> {
  process.env.NODE_ENV = 'test';
  const mongoServer = await MongoMemoryServer.create();

  try {
    await mongoose.connect(mongoServer.getUri());

    const resident = await Resident.create({
      residentCode: 'KB-APPROVAL-001',
      firstName: 'Approval',
      lastName: 'Test',
      fullName: 'Approval Test',
      password: 'password123',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      streetAddress: '123 Main St',
      barangay: 'Bolo',
      mobileNumber: '09123456789',
      idType: 'National ID',
      idNumber: 'approval-test-id',
      frontIdImage: 'front.jpg',
      backIdImage: 'back.jpg',
      faceImage: 'face.jpg',
      status: 'Approved',
      qrStatus: 'ACTIVE',
      verification: { overallConfidence: 95 },
    });

    const event = await DisasterEvent.create({
      name: 'Approval Regression Event',
      disasterType: 'Flood',
      description: 'Verifies the target-beneficiary admin review.',
      barangays: ['Bolo'],
      eventDate: new Date(),
      submissionDeadline: new Date(Date.now() + 60_000),
      status: 'Active',
      createdBy: 'test',
      updatedBy: 'test',
    });

    const proof = await ProofSubmission.create({
      residentId: resident._id,
      disasterEventId: event._id,
      damageType: 'Flood',
      description: 'Flood damage proof pending admin review.',
      dateSubmitted: new Date(),
      photoProofUrl: '/uploads/test-proof.jpg',
      photoProofUrls: ['/uploads/test-proof.jpg'],
      status: 'Pending Verification',
      syncSource: 'ONLINE',
    });

    const review = await reviewResidentProof({
      proofSubmissionId: proof._id.toString(),
      decision: 'Approved',
      reviewerId: 'approval-regression-test',
    });

    assert.strictEqual(review.submission.status, 'Approved');
    assert.strictEqual(review.eligibility.status, 'Eligible');
    assert.strictEqual(review.eligibility.proofStatus, 'Approved');
    assert.strictEqual(review.eligibility.reviewedBy, 'approval-regression-test');
    assert.ok(review.submission.reviewedAt);
    assert.strictEqual(review.notificationDelivery.sms.status, 'provider_not_configured');
    assert.strictEqual(review.notificationDelivery.push.status, 'no_eligible_recipients');

    const notifications = await Notification.find({ userId: resident._id }).lean();
    assert.strictEqual(notifications.length, 1);
    assert.strictEqual(notifications[0]?.title, 'Proof Approved');
    assert.match(notifications[0]?.message || '', /eligible/i);
    console.log('beneficiary approval regression test passed');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

void run();
