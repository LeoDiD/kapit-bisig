import assert from 'assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { validatePassword, isCommonPassword } from '../utils/passwordValidator';
import { computeHouseholdHash, computeEventHash } from '../utils/hashHelpers';
import { revokeJWTByValue, isJWTRevoked } from '../services/tokenRevocationService';
import RevokedToken from '../models/RevokedToken';

export async function runAuthFlowUnitTests(): Promise<void> {
  console.log('Running Auth Flow Unit Tests...');

  // 1. Password Validator
  const weak = validatePassword('weak');
  assert.strictEqual(weak.isValid, false);
  const strong = validatePassword('V3ryStr0ng&S3cur3');
  assert.strictEqual(strong.isValid, true);
  assert.strictEqual(isCommonPassword('password123'), true);

  // 2. Hash Helpers
  process.env.HASH_SALT = 'test-salt';
  assert.strictEqual(computeHouseholdHash('test').startsWith('0x'), true);
  assert.strictEqual(computeEventHash('test').startsWith('0x'), true);

  // 3. Token Revocation
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.JWT_SECRET = 'test-secret';

  const token = jwt.sign({ jti: 'test-jti-123', exp: Math.floor(Date.now() / 1000) + 3600 }, process.env.JWT_SECRET);
  
  // Initially not revoked
  let revoked = await isJWTRevoked('test-jti-123');
  assert.strictEqual(revoked, false);

  // Revoke it
  await revokeJWTByValue(token);
  
  // Now it should be revoked
  revoked = await isJWTRevoked('test-jti-123');
  assert.strictEqual(revoked, true);

  // Verify TTL behavior is set up
  const doc = await RevokedToken.findOne({ jti: 'test-jti-123' });
  assert.ok(doc?.expiresAt);

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('Auth Flow Unit Tests Passed!');
}
