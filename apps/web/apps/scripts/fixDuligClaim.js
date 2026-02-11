/**
 * Fix claim HH-BO-0F36: it has distributionId pointing to Dulig distribution
 * but it's a Bongalon household. Need to swap it to Bongalon distribution.
 * Also fix the DistributionClaim entries accordingly.
 */
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/kapit-bisig');
  const db = mongoose.connection.db;

  // Get distributions
  const duligDist = await db.collection('distributions').findOne({ barangay: 'Dulig' });
  const bongalonDist = await db.collection('distributions').findOne({ barangay: 'Bongalon' });
  console.log('Dulig dist:', String(duligDist._id));
  console.log('Bongalon dist:', String(bongalonDist._id));

  // Fix claim HH-BO-0F36: change distributionId from Dulig to Bongalon
  const result1 = await db.collection('claims').updateOne(
    { householdCode: 'HH-BO-0F36' },
    { $set: { distributionId: bongalonDist._id } }
  );
  console.log('\nFixed HH-BO-0F36 claim distributionId -> Bongalon:', result1.modifiedCount, 'modified');

  // Fix claim HH-BO-0F30: verify it points to Bongalon
  const bo30 = await db.collection('claims').findOne({ householdCode: 'HH-BO-0F30' });
  console.log('HH-BO-0F30 current distributionId:', String(bo30.distributionId), '(should be Bongalon:', String(bongalonDist._id), ')');
  if (String(bo30.distributionId) !== String(bongalonDist._id)) {
    const r2 = await db.collection('claims').updateOne(
      { householdCode: 'HH-BO-0F30' },
      { $set: { distributionId: bongalonDist._id } }
    );
    console.log('Fixed HH-BO-0F30 -> Bongalon:', r2.modifiedCount, 'modified');
  } else {
    console.log('HH-BO-0F30 already correct');
  }

  // Fix DistributionClaim: remove the orphan Dulig DistributionClaim 
  // (householdId 698c0a877846e6a0f3730f36 is a Bongalon resident, not Dulig)
  const deleted = await db.collection('distributionclaims').deleteOne({
    distributionId: duligDist._id,
    householdId: new mongoose.Types.ObjectId('698c0a877846e6a0f3730f36')
  });
  console.log('\nRemoved wrong Dulig DistributionClaim:', deleted.deletedCount, 'deleted');

  // Ensure HH-BO-0F36 has a DistributionClaim under Bongalon distribution
  const upsertResult = await db.collection('distributionclaims').updateOne(
    { distributionId: bongalonDist._id, householdId: new mongoose.Types.ObjectId('698c0a877846e6a0f3730f36') },
    { 
      $set: {
        distributionId: bongalonDist._id,
        householdId: new mongoose.Types.ObjectId('698c0a877846e6a0f3730f36'),
        claimedAt: new Date(),
        proofMethod: 'QR'
      }
    },
    { upsert: true }
  );
  console.log('Upserted Bongalon DistributionClaim for HH-BO-0F36:', upsertResult.upsertedCount || upsertResult.modifiedCount, 'affected');

  // Reset Dulig distribution status back to Unclaimed (it has 0 real claims now)
  await db.collection('distributions').updateOne(
    { _id: duligDist._id },
    { $set: { status: 'Unclaimed' }, $unset: { claimedAt: '' } }
  );
  console.log('Reset Dulig distribution status to Unclaimed');

  // Verify final state
  console.log('\n--- Final State ---');
  const allClaims = await db.collection('claims').find({}).toArray();
  for (const c of allClaims) {
    const dist = await db.collection('distributions').findOne({ _id: c.distributionId });
    console.log(`  ${c.householdCode} | claim.barangay=${c.barangay} | dist.barangay=${dist?.barangay}`);
  }

  const allDC = await db.collection('distributionclaims').find({}).toArray();
  console.log('\nDistributionClaims:');
  for (const dc of allDC) {
    const dist = await db.collection('distributions').findOne({ _id: dc.distributionId });
    console.log(`  dist=${dist?.barangay} | householdId=${String(dc.householdId)}`);
  }

  const allDists = await db.collection('distributions').find({}).toArray();
  console.log('\nDistributions:');
  allDists.forEach(d => console.log(`  ${d.barangay} | status=${d.status}`));

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
