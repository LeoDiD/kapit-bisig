/**
 * seedClaimDistributions10x10.js
 *
 * Seeds one distribution per barangay based on seeded residents.
 * Run this AFTER seedClaimHouseholds10x10.js.
 *
 * Run from apps/web/apps:
 *   node server/scripts/seedClaimDistributions10x10.js
 *
 * Optional env:
 *   SEED_TAG=CLAIM10X10_V2
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';
const SEED_TAG = String(process.env.SEED_TAG || 'CLAIM10X10_V2').trim();

const BRGYS = [
  'Bolo',
  'Bongalon',
  'Dulig',
  'Laois',
  'Magsaysay',
  'Poblacion',
  'San Gonzalo',
  'San Jose',
  'Tobuan',
  'Uyong',
];

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

async function main() {
  console.log(`\nseedClaimDistributions10x10 - seedTag=${SEED_TAG}\n`);

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  let created = 0;
  let updated = 0;

  for (const barangay of BRGYS) {
    const householdCount = await db.collection('residents').countDocuments({
      seedTag: SEED_TAG,
      seeded: true,
      barangay,
      status: 'Approved',
    });

    if (householdCount < 1) {
      console.log(`- skip ${barangay}: no seeded approved households for ${SEED_TAG}`);
      continue;
    }

    const existing = await db.collection('distributions').findOne({
      seedTag: SEED_TAG,
      barangay,
    });

    const payload = {
      barangay,
      scheduled: todayISO(),
      households: householdCount,
      notes: `Seeded distribution (${SEED_TAG})`,
      status: 'Unclaimed',
      claimedAt: null,
      seeded: true,
      seedTag: SEED_TAG,
      assignedBarangays: [],
      assignedStaffIds: [],
      updatedAt: new Date(),
    };

    if (existing) {
      await db.collection('distributions').updateOne(
        { _id: existing._id },
        { $set: payload },
      );
      updated += 1;
    } else {
      await db.collection('distributions').insertOne({
        ...payload,
        createdAt: new Date(),
      });
      created += 1;
    }
  }

  const distCount = await db.collection('distributions').countDocuments({
    seedTag: SEED_TAG,
    seeded: true,
  });

  console.log('\nSummary:');
  console.log(`- distributions created: ${created}`);
  console.log(`- distributions updated: ${updated}`);
  console.log(`- distributions total (seedTag): ${distCount}`);

  console.log('\nPer-barangay distribution counts:');
  for (const barangay of BRGYS) {
    const count = await db.collection('distributions').countDocuments({
      seedTag: SEED_TAG,
      seeded: true,
      barangay,
    });
    console.log(`- ${barangay}: ${count}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.\n');
}

main().catch(async (err) => {
  console.error('seedClaimDistributions10x10 failed:', err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});

