/**
 * CLI Migration Script: Transfer Superadmin Credentials to Database
 *
 * Usage:
 *   npx ts-node --project tsconfig.server.json server/scripts/transferSuperadminToDb.ts
 *   or: npm run migrate:superadmin (from apps/web/apps)
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.local') });

import mongoose from 'mongoose';
import { ensureSuperadminExists } from '../services/superadminSeedService';

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is required in environment.');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  try {
    console.log('🚀 Running Superadmin DB transfer/migration...');
    const result = await ensureSuperadminExists();
    const { user, created, updated } = result;

    console.log('\n==================================================');
    console.log('  SUPERADMIN DATABASE RECORD');
    console.log('==================================================');
    console.log(`  Status:      ${created ? 'CREATED NEW' : updated ? 'UPDATED / SYNCED' : 'ALREADY PRESENT'}`);
    console.log(`  ID:          ${user._id.toString()}`);
    console.log(`  Email:       ${user.email}`);
    console.log(`  Role:        ${user.role}`);
    console.log(`  Active:      ${user.isActive}`);
    console.log(`  PW Hash Set: ${!!user.passwordHash}`);
    console.log('==================================================\n');
    console.log('🎉 Superadmin credentials successfully stored in database!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB.');
  }
}

main();
