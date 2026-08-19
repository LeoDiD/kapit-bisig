/**
 * removeSeededDistributions.js
 *
 * Deletes seeded distribution records and their linked claims.
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';

async function main() {
  console.log('\nRemoving seeded distributions from database...\n');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const filter = {
    $or: [
      { seeded: true },
      { seedTag: { $exists: true, $ne: '' } },
      { notes: { $regex: /Seeded/i } },
    ],
  };

  const seededDists = await db.collection('distributions').find(filter).toArray();
  const distIds = seededDists.map((d) => d._id);
  const distIdStrings = distIds.map((id) => String(id));

  console.log(`Found ${distIds.length} seeded distributions.`);

  if (distIds.length > 0) {
    const dcRes = await db.collection('distributionclaims').deleteMany({
      $or: [
        { distributionId: { $in: distIds } },
        { distributionId: { $in: distIdStrings } },
      ],
    });

    const cRes = await db.collection('claims').deleteMany({
      distributionId: { $in: distIdStrings },
    });

    const dRes = await db.collection('distributions').deleteMany({
      _id: { $in: distIds },
    });

    console.log(`- Deleted distributions:      ${dRes.deletedCount}`);
    console.log(`- Deleted distributionclaims: ${dcRes.deletedCount}`);
    console.log(`- Deleted claims:             ${cRes.deletedCount}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.\n');
}

main().catch((err) => {
  console.error('Failed to remove seeded distributions:', err);
  process.exit(1);
});
