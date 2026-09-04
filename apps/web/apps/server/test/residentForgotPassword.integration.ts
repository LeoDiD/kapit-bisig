import assert from 'assert';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

export async function runResidentForgotPasswordIntegrationTests(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-123456789012345678901234567890';
  process.env.SMTP_HOST = 'smtp.test.local';
  process.env.SMTP_USER = 'test@example.com';
  process.env.SMTP_PASS = 'test-password';

  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  try {
    const { default: Resident } = await import('../models/Resident');
    const { default: ResidentPasswordResetOtp } = await import('../models/ResidentPasswordResetOtp');
    const { default: householdRoutes } = await import('../routes/householdRoutes');
    const { default: residentAuthRoutes } = await import('../routes/residentAuthRoutes');
    const { setResetOtpSenderForTests } = await import('../utils/mailer');

    let deliveredOtp = '';
    setResetOtpSenderForTests(async (_to, otp) => { deliveredOtp = otp; });

    await Resident.create({
      residentCode: 'RES-PASSWORD-1', firstName: 'Reset', lastName: 'Resident', fullName: 'Reset Resident',
      dateOfBirth: '1990-01-01', gender: 'Male', mobileNumber: '09171234567',
      email: 'reset@example.com', emailLower: 'reset@example.com', password: 'OldPassword1!',
      city: 'Lingayen', barangay: 'Bolo', streetAddress: '1 Main St', householdSize: 1,
      vulnerableMembers: [], vulnerableCounts: {}, idType: 'UMID', idNumber: 'RESET-ID-1',
      frontIdImage: 'front.jpg', backIdImage: 'back.jpg', faceImage: 'face.jpg',
      verification: { overallConfidence: 95, idConfidence: 95, faceMatchConfidence: 95, livenessConfidence: 95, dataMatchScore: 95, riskScore: 5, isVerified: true, aiVerificationStatus: 'High Match', warnings: [], riskFactors: [] },
      status: 'Approved',
    });

    const app = express();
    app.use(express.json());
    app.use('/api/household', residentAuthRoutes);
    app.use('/api/household', householdRoutes);

    const unknown = await request(app).post('/api/household/auth/forgot-password/send-otp').send({ email: 'unknown@example.com' });
    assert.strictEqual(unknown.status, 200);
    assert.match(unknown.body.message, /if the email exists/i);

    const sent = await request(app).post('/api/household/auth/forgot-password/send-otp').send({ email: 'reset@example.com' });
    assert.strictEqual(sent.status, 200);
    assert.match(deliveredOtp, /^\d{6}$/);

    const wrong = await request(app).post('/api/household/auth/forgot-password/verify-otp').send({ email: 'reset@example.com', otp: '999999' });
    assert.strictEqual(wrong.status, 400);
    assert.strictEqual((await ResidentPasswordResetOtp.findOne({ emailLower: 'reset@example.com' }))?.attemptsLeft, 4);

    const verified = await request(app).post('/api/household/auth/forgot-password/verify-otp').send({ email: 'reset@example.com', otp: deliveredOtp });
    assert.strictEqual(verified.status, 200);
    assert.ok(verified.body.resetToken);

    const weak = await request(app).post('/api/household/auth/forgot-password/reset').send({ resetToken: verified.body.resetToken, newPassword: 'weak' });
    assert.strictEqual(weak.status, 400);

    const reset = await request(app).post('/api/household/auth/forgot-password/reset').send({ resetToken: verified.body.resetToken, newPassword: 'Secur3!River' });
    assert.strictEqual(reset.status, 200);

    const login = await request(app).post('/api/household/auth/login').send({ mobileNumber: '09171234567', password: 'Secur3!River' });
    assert.strictEqual(login.status, 200);
    assert.strictEqual(login.body.success, true);

    setResetOtpSenderForTests(async () => { throw new Error('SMTP unavailable'); });
    const failedSend = await request(app).post('/api/household/auth/forgot-password/send-otp').send({ email: 'reset@example.com' });
    assert.strictEqual(failedSend.status, 503);
    assert.strictEqual(await ResidentPasswordResetOtp.countDocuments({ emailLower: 'reset@example.com' }), 0);
    setResetOtpSenderForTests(null);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}
