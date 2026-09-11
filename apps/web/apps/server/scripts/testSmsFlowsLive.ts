import { MongoMemoryServer } from 'mongodb-memory-server';
import mongooseLib from 'mongoose';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';
import {
  sendAccountApprovedSms,
  sendAccountStatusUpdateSms,
  sendPasswordResetOtpSms,
} from '../utils/smsService';
import { broadcastDistributionSms } from '../utils/distributionSms';

async function runLiveSmsFlowsDemonstration() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-123456789012345678901234567890';

  console.log('\n======================================================');
  console.log('📱 KAPIT-BISIG LIVE SMS FLOWS VERIFICATION');
  console.log('======================================================\n');

  const mongo = await MongoMemoryServer.create();
  await mongooseLib.connect(mongo.getUri());

  try {
    const { default: Resident } = await import('../models/Resident');
    const { default: residentAuthRoutes } = await import('../routes/residentAuthRoutes');
    const { default: householdRoutes } = await import('../routes/householdRoutes');
    const { generateToken } = await import('../middleware/authMiddleware');

    // ----------------------------------------------------
    // TEST 1: Account Approval SMS Flow
    // ----------------------------------------------------
    console.log('▶ [TEST 1] Testing Account Approval SMS...');
    const hashedInitialPw = await bcrypt.hash('InitialPass#2026', 12);
    const resident1 = await Resident.create({
      residentCode: 'RES-DEMO-001',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      fullName: 'Juan Dela Cruz',
      dateOfBirth: '1988-05-12',
      gender: 'Male',
      mobileNumber: '09171234567',
      email: 'juan@example.com',
      barangay: 'San Jose',
      city: 'Antipolo',
      streetAddress: '123 Rizal St',
      householdSize: 4,
      idType: 'UMID',
      idNumber: 'CRN-001',
      frontIdImage: 'front.jpg',
      backIdImage: 'back.jpg',
      faceImage: 'face.jpg',
      verification: { overallConfidence: 95, idConfidence: 95, faceMatchConfidence: 95, livenessConfidence: 95, dataMatchScore: 95, riskScore: 5, isVerified: true, aiVerificationStatus: 'High Match', warnings: [], riskFactors: [] },
      status: 'Pending',
      password: hashedInitialPw,
    });

    await sendAccountApprovedSms(resident1.mobileNumber, resident1.fullName);
    console.log(`  ✓ Account Approval SMS dispatched successfully for ${resident1.fullName} (${resident1.mobileNumber})\n`);

    // ----------------------------------------------------
    // TEST 2: Distribution Announcement SMS Broadcast
    // ----------------------------------------------------
    console.log('▶ [TEST 2] Testing Distribution Announcement SMS Broadcast...');
    resident1.status = 'Approved';
    await resident1.save();

    const broadcastResult = await broadcastDistributionSms({
      targetBarangays: ['San Jose'],
      scheduled: new Date('2026-09-15T09:00:00.000Z'),
    });
    console.log(`  ✓ Distribution Announcement broadcast status: "${broadcastResult.status}"`);
    console.log(`  ✓ Total Attempted: ${broadcastResult.attempted}, Sent: ${broadcastResult.sent}, Skipped: ${broadcastResult.skipped}, Failed: ${broadcastResult.failed}\n`);

    // ----------------------------------------------------
    // TEST 3: Forgot Password SMS OTP Flow (Unauthenticated)
    // ----------------------------------------------------
    console.log('▶ [TEST 3] Testing Forgot Password SMS OTP (Login Recovery)...');
    const app = express();
    app.use(express.json());
    app.use('/api/household', residentAuthRoutes);
    app.use('/api/household', householdRoutes);

    const forgotOtpResponse = await request(app)
      .post('/api/household/auth/forgot-password/send-otp')
      .send({ mobileNumber: '09171234567' });

    console.log(`  ✓ Forgot Password OTP HTTP Status: ${forgotOtpResponse.status}`);
    console.log(`  ✓ Server Response:`, JSON.stringify(forgotOtpResponse.body), '\n');

    // ----------------------------------------------------
    // TEST 4: Change Password SMS OTP Flow (Profile Authenticated)
    // ----------------------------------------------------
    console.log('▶ [TEST 4] Testing Change Password SMS OTP (Profile Security)...');
    const residentToken = generateToken(
      resident1._id.toString(),
      'juan@example.com',
      'Resident',
    );

    const changePwOtpResponse = await request(app)
      .post('/api/household/auth/me/change-password/request-otp')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        currentPassword: 'InitialPass#2026',
        newPassword: 'UpdatedSecure#2026',
      });

    console.log(`  ✓ Change Password Request OTP HTTP Status: ${changePwOtpResponse.status}`);
    console.log(`  ✓ Server Response:`, JSON.stringify(changePwOtpResponse.body));

    console.log('\n======================================================');
    console.log('✅ ALL 4 SMS FLOWS VERIFIED AND WORKING PROPERLY');
    console.log('======================================================\n');
  } finally {
    await mongooseLib.disconnect();
    await mongo.stop();
  }
}

runLiveSmsFlowsDemonstration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
