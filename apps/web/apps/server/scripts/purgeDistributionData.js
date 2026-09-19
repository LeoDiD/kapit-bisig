/**
 * purgeDistributionData.js
 *
 * Permanently removes all test distribution events, claim records,
 * and related logs/notifications from the database so that
 * Distribution, Reports, and Dashboard modules reflect a clean, empty state.
 *
 * Preserves:
 * - Residents (residents collection)
 * - Users / StaffUsers (users, staffusers collections)
 * - Disaster events (disasterevents collection)
 *
 * Usage from apps/web/apps:
 *   node server/scripts/purgeDistributionData.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('Connected to database successfully.\n');

  console.log('=== BEFORE PURGE: Document Counts ===');
  const collectionsToCheck = [
    'distributions',
    'distributionclaims',
    'claims',
    'residentqrscanlogs',
    'proofsubmissions',
    'beneficiaryeligibilities',
    'offlinesyncqueues',
    'notifications',
    'auditlogs',
    'residents',
    'users',
    'staffusers',
  ];

  for (const col of collectionsToCheck) {
    try {
      const count = await db.collection(col).countDocuments();
      console.log(`- ${col.padEnd(26)}: ${count}`);
    } catch (err) {
      console.log(`- ${col.padEnd(26)}: (table not created or empty)`);
    }
  }

  console.log('\nPurging distribution and claim data...\n');

  // 1. Delete all distributions
  const distRes = await db.collection('distributions').deleteMany({});
  console.log(`✔ Deleted distributions:            ${distRes.deletedCount}`);

  // 2. Delete all distribution claims
  const dcRes = await db.collection('distributionclaims').deleteMany({});
  console.log(`✔ Deleted distributionclaims:       ${dcRes.deletedCount}`);

  // 3. Delete all relief-pack claims (both claimCategory: 'DISTRIBUTION' and any test claim)
  const claimRes = await db.collection('claims').deleteMany({});
  console.log(`✔ Deleted claims:                   ${claimRes.deletedCount}`);

  // 4. Delete beneficiary eligibility records linked to distributions
  const eligRes = await db.collection('beneficiaryeligibilities').deleteMany({
    distributionId: { $exists: true, $ne: null },
  });
  console.log(`✔ Deleted eligibility (dist):       ${eligRes.deletedCount}`);

  // 5. Delete proof submissions linked to distributions
  const proofRes = await db.collection('proofsubmissions').deleteMany({
    distributionId: { $exists: true, $ne: null },
  });
  console.log(`✔ Deleted proofsubmissions (dist):  ${proofRes.deletedCount}`);

  // 6. Delete offline sync queue items for distributions / claims
  const queueRes = await db.collection('offlinesyncqueues').deleteMany({
    $or: [
      { distributionId: { $exists: true, $ne: null } },
      { queueType: 'CLAIM' },
    ],
  });
  console.log(`✔ Deleted offlinesyncqueues:        ${queueRes.deletedCount}`);

  // 7. Delete resident QR scan logs from test verification
  const qrScanRes = await db.collection('residentqrscanlogs').deleteMany({});
  console.log(`✔ Deleted residentqrscanlogs:       ${qrScanRes.deletedCount}`);

  // 8. Delete notifications related to distribution / dispatch
  const notifRes = await db.collection('notifications').deleteMany({
    $or: [
      { type: 'dispatch' },
      { title: { $regex: /distribution/i } },
      { message: { $regex: /distribution/i } },
    ],
  });
  console.log(`✔ Deleted distribution notifications: ${notifRes.deletedCount}`);

  // 9. Delete audit logs related to distribution / claim actions
  const auditRes = await db.collection('auditlogs').deleteMany({
    $or: [
      { entity: { $regex: /distribution/i } },
      { action: { $regex: /distribution/i } },
      { entity: { $regex: /claim/i } },
      { action: { $regex: /claim/i } },
      { category: { $regex: /distribution/i } },
    ],
  });
  console.log(`✔ Deleted audit logs (dist/claim):   ${auditRes.deletedCount}`);

  console.log('\n=== AFTER PURGE: Document Counts ===');
  for (const col of collectionsToCheck) {
    try {
      const count = await db.collection(col).countDocuments();
      console.log(`- ${col.padEnd(26)}: ${count}`);
    } catch (err) {
      console.log(`- ${col.padEnd(26)}: 0`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDatabase purge complete. All distribution and claim history cleared.\n');
}

main().catch(async (err) => {
  console.error('Purge script failed:', err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
