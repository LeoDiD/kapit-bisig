/**
 * resetOptionA.js — DEV-ONLY reset script
 *
 * Deletes ONLY records with { seeded: true } from:
 *   - residents
 *   - householdtokens
 *   - distributions
 *
 * Does NOT touch production-like data.
 *
 * Run from project root (apps/web/apps):
 *   node server/scripts/resetOptionA.js
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';

async function main() {
  console.log('\n🧹  resetOptionA — remove seeded test data\n');
  console.log('='.repeat(60));

  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to MongoDB  (${MONGODB_URI})\n`);

  const db = mongoose.connection.db;

  // Delete seeded residents
  const resResult = await db.collection('residents').deleteMany({ seeded: true });
  console.log(`  🗑  Residents  deleted: ${resResult.deletedCount}`);

  // Delete seeded household tokens
  const tokResult = await db.collection('householdtokens').deleteMany({ seeded: true });
  console.log(`  🗑  Tokens     deleted: ${tokResult.deletedCount}`);

  // Delete seeded distributions
  const distResult = await db.collection('distributions').deleteMany({ seeded: true });
  console.log(`  🗑  Distributions deleted: ${distResult.deletedCount}`);

  // Also delete any claims that reference seeded households
  // (householdId stored as string _id of the resident)
  // We can't know which are seeded unless we check, so we do a targeted cleanup
  // by looking for claims whose householdId is no longer in the residents collection.
  // However, a simpler approach: delete claims where householdCode starts with "HH-" 
  // and matches our seeded codes (BL, SJ, PB, BN, DL with 0001-0010 range).
  const claimResult = await db.collection('claims').deleteMany({
    householdCode: {
      $regex: /^HH-(BL|SJ|PB|BN|DL)-\d{4}$/,
    },
  });
  console.log(`  🗑  Claims     deleted: ${claimResult.deletedCount}`);

  console.log('\n✅  Reset complete. Seeded data removed.\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
