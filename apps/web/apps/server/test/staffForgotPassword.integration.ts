import assert from 'assert';
import bcrypt from 'bcrypt';
import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

export async function runStaffForgotPasswordIntegrationTests(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-123456789012345678901234567890';
  process.env.SMTP_HOST = 'smtp.test.local';
  process.env.SMTP_USER = 'test@example.com';
  process.env.SMTP_PASS = 'test-password';

  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  try {
    const { default: StaffUser } = await import('../models/StaffUser');
    const { default: forgotPasswordRoutes } = await import('../routes/forgotPasswordRoutes');
    const { default: authRoutes } = await import('../routes/authRoutes');
    const { setResetOtpSenderForTests } = await import('../utils/mailer');
    const {
      getLoginLockout,
      loginAttempts,
    } = await import('../services/loginAttemptService');

    const establishedEmail = 'legacy.staff@example.com';
    const established = await StaffUser.create({
      email: establishedEmail,
      emailLower: establishedEmail,
      passwordHash: await bcrypt.hash('OldPassw0rd!', 12),
      forcePasswordReset: true,
      firstName: 'Legacy',
      lastName: 'Staff',
      role: 'LGU_STAFF',
      assignedBarangays: ['San Jose'],
      isActive: true,
      emailVerified: true,
      lastLoginAt: null,
    });

    await StaffUser.create({
      email: 'pending.staff@example.com',
      emailLower: 'pending.staff@example.com',
      forcePasswordReset: true,
      firstName: 'Pending',
      lastName: 'Staff',
      role: 'LGU_STAFF',
      assignedBarangays: ['San Jose'],
      isActive: true,
      emailVerified: false,
      lastLoginAt: null,
    });

    loginAttempts.set(establishedEmail, {
      attempts: 5,
      lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      lastAttempt: new Date(),
    });

    let deliveredOtp = '';
    let deliveredTo = '';
    setResetOtpSenderForTests(async (to, otp) => {
      deliveredTo = to;
      deliveredOtp = otp;
    });

    const app = express();
    app.use(express.json());
    app.use('/api/auth/forgot-password', forgotPasswordRoutes);
    app.use('/api/mobile-auth', authRoutes);

    const sent = await request(app)
      .post('/api/auth/forgot-password/send-otp')
      .send({ email: establishedEmail });
    assert.strictEqual(sent.status, 200);
    assert.strictEqual(deliveredTo, establishedEmail);
    assert.match(deliveredOtp, /^\d{6}$/);

    const verified = await request(app)
      .post('/api/auth/forgot-password/verify-otp')
      .send({ email: establishedEmail, otp: deliveredOtp });
    assert.strictEqual(verified.status, 200);
    assert.ok(verified.body.resetToken);

    const reset = await request(app)
      .post('/api/auth/forgot-password/reset')
      .send({ resetToken: verified.body.resetToken, newPassword: 'R7!vQ2#kL9@mT4' });
    assert.strictEqual(reset.status, 200, JSON.stringify(reset.body));

    const reloaded = await StaffUser.findById(established._id).select('+passwordHash');
    assert.ok(reloaded?.passwordHash);
    assert.strictEqual(await bcrypt.compare('R7!vQ2#kL9@mT4', reloaded!.passwordHash!), true);
    assert.strictEqual(reloaded?.forcePasswordReset, false);
    assert.strictEqual(getLoginLockout(establishedEmail).locked, false);

    const login = await request(app)
      .post('/api/mobile-auth/login')
      .send({ email: establishedEmail, password: 'R7!vQ2#kL9@mT4' });
    assert.strictEqual(login.status, 200, JSON.stringify(login.body));
    assert.strictEqual(login.body.otpRequired, true);
    assert.ok(login.body.otpToken);

    deliveredOtp = '';
    const pending = await request(app)
      .post('/api/auth/forgot-password/send-otp')
      .send({ email: 'pending.staff@example.com' });
    assert.strictEqual(pending.status, 200);
    assert.strictEqual(deliveredOtp, '');

    setResetOtpSenderForTests(null);
    loginAttempts.clear();
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}
