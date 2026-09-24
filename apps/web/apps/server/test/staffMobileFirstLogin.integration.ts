import assert from 'assert';
import bcrypt from 'bcrypt';
import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

export async function runStaffMobileFirstLoginIntegrationTests(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-123456789012345678901234567890';
  process.env.SMTP_HOST = 'smtp.test.local';
  process.env.SMTP_USER = 'test@example.com';
  process.env.SMTP_PASS = 'test-password';

  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  try {
    const { default: StaffUser } = await import('../models/StaffUser');
    const { default: LoginVerifyOtp } = await import('../models/LoginVerifyOtp');
    const { default: staffMobileAuthRoutes } = await import('../routes/staffMobileAuthRoutes');
    const { default: authRoutes } = await import('../routes/authRoutes');

    const app = express();
    app.use(express.json());
    app.use('/api/mobile-auth', staffMobileAuthRoutes);
    app.use('/api/mobile-auth', authRoutes);

    const email = 'new.staff@example.com';
    const emailLower = email.toLowerCase();

    // Create newly provisioned staff account (no password, forcePasswordReset = true)
    const staff = await StaffUser.create({
      email,
      emailLower,
      forcePasswordReset: true,
      firstName: 'New',
      lastName: 'Staff',
      role: 'LGU_STAFF',
      assignedBarangays: ['San Jose'],
      isActive: true,
      emailVerified: true,
      lastLoginAt: null,
    });

    const testOtp = '123456';
    const otpHash = await bcrypt.hash(testOtp, 12);
    await LoginVerifyOtp.create({
      userId: staff._id,
      emailLower,
      purpose: 'FIRST_LOGIN',
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attemptsLeft: 5,
      lastSentAt: new Date(),
    });

    // 1. Trying to login with password before setting one should fail with FIRST_LOGIN_REQUIRED
    const preLogin = await request(app)
      .post('/api/mobile-auth/login')
      .send({ email, password: 'AnyPassword123!' });
    assert.strictEqual(preLogin.status, 401);
    assert.strictEqual(preLogin.body.code, 'FIRST_LOGIN_REQUIRED');

    // 2. Wrong OTP fails verification
    const wrongOtpRes = await request(app)
      .post('/api/mobile-auth/first-login/verify-otp')
      .send({ email, otp: '654321' });
    assert.strictEqual(wrongOtpRes.status, 400);
    assert.strictEqual(wrongOtpRes.body.success, false);

    // 3. Correct OTP returns activation token
    const correctOtpRes = await request(app)
      .post('/api/mobile-auth/first-login/verify-otp')
      .send({ email, otp: testOtp });
    assert.strictEqual(correctOtpRes.status, 200, JSON.stringify(correctOtpRes.body));
    assert.strictEqual(correctOtpRes.body.success, true);
    assert.ok(correctOtpRes.body.activationToken);

    const activationToken = correctOtpRes.body.activationToken;

    // 4. Setting a weak password should be rejected
    const weakPassRes = await request(app)
      .post('/api/mobile-auth/first-login/set-password')
      .send({ activationToken, newPassword: 'weak' });
    assert.strictEqual(weakPassRes.status, 400);
    assert.strictEqual(weakPassRes.body.success, false);

    // 5. Setting a strong password should succeed and return auth data
    const strongPassword = 'StrongPass123!@#';
    const setPassRes = await request(app)
      .post('/api/mobile-auth/first-login/set-password')
      .send({ activationToken, newPassword: strongPassword });
    assert.strictEqual(setPassRes.status, 200, JSON.stringify(setPassRes.body));
    assert.strictEqual(setPassRes.body.success, true);
    assert.ok(setPassRes.body.data?.token);
    assert.strictEqual(setPassRes.body.data?.user?.email, email);

    // Verify staff account in DB now has password and forcePasswordReset is false
    const updatedStaff = await StaffUser.findById(staff._id).select('+passwordHash');
    assert.strictEqual(updatedStaff?.forcePasswordReset, false);
    assert.ok(updatedStaff?.passwordHash);

    // 6. Subsequent login on mobile is PASSWORD-ONLY (no OTP requested)
    const postLogin = await request(app)
      .post('/api/mobile-auth/login')
      .send({ email, password: strongPassword });
    assert.strictEqual(postLogin.status, 200, JSON.stringify(postLogin.body));
    assert.strictEqual(postLogin.body.success, true);
    assert.strictEqual(postLogin.body.otpRequired, undefined);
    assert.ok(postLogin.body.data?.token);
    assert.strictEqual(postLogin.body.data?.user?.email, email);

    // 7. Resend first-login OTP returns success
    const resendRes = await request(app)
      .post('/api/mobile-auth/first-login/resend-otp')
      .send({ email });
    assert.strictEqual(resendRes.status, 200);
    assert.strictEqual(resendRes.body.success, true);

    console.log('[TEST PASS] Staff Mobile First Login Integration Tests passed successfully.');
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}

if (require.main === module) {
  runStaffMobileFirstLoginIntegrationTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
