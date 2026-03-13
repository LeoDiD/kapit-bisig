/**
 * resetSeededData.js
 *
 * Removes seeded test data only:
 * - residents
 * - householdtokens
 * - distributions
 * - claims/distributionclaims that reference removed seeded residents/distributions
 *
 * Run from apps/web/apps:
 *   node server/scripts/resetSeededData.js
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';

const SEEDED_FILTER = {
  $or: [{ seeded: true }, { seedTag: { $exists: true, $ne: '' } }],
};

async function main() {
  console.log('\nresetSeededData - removing seeded records\n');

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const seededResidents = await db
    .collection('residents')
    .find(SEEDED_FILTER, { projection: { _id: 1 } })
    .toArray();
  const residentIds = seededResidents.map((r) => r._id);
  const residentIdStrings = residentIds.map((id) => String(id));

  const seededDistributions = await db
    .collection('distributions')
    .find(SEEDED_FILTER, { projection: { _id: 1 } })
    .toArray();
  const distributionIds = seededDistributions.map((d) => d._id);
  const distributionIdStrings = distributionIds.map((id) => String(id));

  const distributionClaimFilter = {
    $or: [
      { householdId: { $in: residentIds } },
      { distributionId: { $in: distributionIds } },
    ],
  };

  const claimFilter = {
    $or: [
      { residentId: { $in: residentIdStrings } },
      { householdId: { $in: residentIdStrings } },
      { distributionId: { $in: distributionIdStrings } },
    ],
  };

  const dcResult = await db.collection('distributionclaims').deleteMany(distributionClaimFilter);
  const claimResult = await db.collection('claims').deleteMany(claimFilter);
  const tokenResult = await db.collection('householdtokens').deleteMany(SEEDED_FILTER);
  const distResult = await db.collection('distributions').deleteMany(SEEDED_FILTER);
  const residentResult = await db.collection('residents').deleteMany(SEEDED_FILTER);

  console.log('Cleanup summary:');
  console.log(`- distributionclaims deleted: ${dcResult.deletedCount}`);
  console.log(`- claims deleted:             ${claimResult.deletedCount}`);
  console.log(`- householdtokens deleted:    ${tokenResult.deletedCount}`);
  console.log(`- distributions deleted:      ${distResult.deletedCount}`);
  console.log(`- residents deleted:          ${residentResult.deletedCount}`);

  await mongoose.disconnect();
  console.log('\nDone.\n');
}

main().catch(async (err) => {
  console.error('resetSeededData failed:', err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});

