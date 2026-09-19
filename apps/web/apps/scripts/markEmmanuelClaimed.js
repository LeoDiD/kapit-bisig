const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

async function run() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { dbName: 'kapit-bisig' });
  console.log('Connected!');

  const db = mongoose.connection.db;

  // 1. Find Emmanuel De Vera
  const resident = await db.collection('residents').findOne({
    $or: [
      { fullName: { $regex: 'Emmanuel.*De.*Vera', $options: 'i' } },
      { residentCode: 'PO-2026-000004' },
      { _id: new mongoose.Types.ObjectId('6aa15d7681dfd3943cd2f1e8') }
    ]
  });

  if (!resident) {
    console.error('Resident Emmanuel De Vera not found!');
    process.exit(1);
  }

  console.log('Found Resident:', {
    id: resident._id.toString(),
    name: resident.fullName || `${resident.firstName} ${resident.lastName}`,
    barangay: resident.barangay,
    residentCode: resident.residentCode,
    status: resident.status
  });

  // 2. Find Poblacion distribution for today
  let distribution = await db.collection('distributions').findOne({
    _id: new mongoose.Types.ObjectId('6aaca39724ebb86a090feea0')
  });

  if (!distribution) {
    distribution = await db.collection('distributions').findOne({
      barangay: 'Poblacion',
      status: { $ne: 'Archived' }
    });
  }

  if (!distribution) {
    console.error('No distribution found for Poblacion!');
    process.exit(1);
  }

  console.log('Found Distribution:', {
    id: distribution._id.toString(),
    barangay: distribution.barangay,
    scheduled: distribution.scheduled,
    endsAt: distribution.endsAt,
    status: distribution.status
  });

  const distId = distribution._id;
  const distIdStr = distId.toString();
  const residentId = resident._id;
  const residentIdStr = residentId.toString();
  const householdCode = resident.residentCode || 'PO-2026-000004';
  const staffUserId = (distribution.assignedStaffIds && distribution.assignedStaffIds[0])
    ? distribution.assignedStaffIds[0].toString()
    : '6a9ab45548bd31e231372ab1';

  const now = new Date();

  // Make sure distribution scheduled time is Active right now (e.g. started 30 mins ago, ends in 2 hours)
  const scheduledDate = new Date(now.getTime() - 30 * 60 * 1000);
  const endsAtDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // 3. Upsert DistributionClaim
  const dcResult = await db.collection('distributionclaims').updateOne(
    {
      distributionId: distId,
      householdId: residentId
    },
    {
      $set: {
        distributionId: distId,
        householdId: residentId,
        claimedAt: now,
        claimedBy: {
          id: staffUserId,
          name: 'Staff Scanner'
        },
        proofMethod: 'QR',
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );

  console.log('DistributionClaim upserted:', dcResult);

  // 4. Upsert Claim record
  const claimId = `CLM-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const claimResult = await db.collection('claims').updateOne(
    {
      householdId: residentIdStr,
      distributionId: distIdStr,
      claimCategory: 'DISTRIBUTION'
    },
    {
      $set: {
        householdId: residentIdStr,
        residentId: residentIdStr,
        householdCode: householdCode,
        barangay: resident.barangay,
        distributionId: distIdStr,
        distributionSite: `${distribution.barangay} Barangay Hall`,
        staffUserId: staffUserId,
        staffName: 'Staff Scanner',
        claimCategory: 'DISTRIBUTION',
        claimStatus: 'Claimed',
        scannedBy: staffUserId,
        scannedAt: now,
        source: 'ONLINE',
        status: 'CONFIRMED',
        errorMessage: '',
        updatedAt: now
      },
      $setOnInsert: {
        claimId: claimId,
        createdAt: now
      }
    },
    { upsert: true }
  );

  console.log('Claim upserted:', claimResult);

  // 5. Update Distribution with Active schedule and Partial Claim status
  const distUpdate = await db.collection('distributions').updateOne(
    { _id: distId },
    {
      $set: {
        scheduled: scheduledDate.toISOString(),
        endsAt: endsAtDate,
        status: 'Partially Claimed',
        claimedAt: now,
        updatedAt: now
      }
    }
  );

  console.log('Distribution updated to Active & Partially Claimed:', distUpdate);

  // 6. Verify by fetching counts
  const totalClaimsForDist = await db.collection('distributionclaims').countDocuments({ distributionId: distId });
  console.log('\nVerification:');
  console.log(`Total claims for distribution ${distIdStr}: ${totalClaimsForDist}`);
  
  const emmanuelClaim = await db.collection('claims').findOne({ householdId: residentIdStr, distributionId: distIdStr });
  console.log('Emmanuel De Vera Claim:', {
    claimId: emmanuelClaim.claimId,
    householdCode: emmanuelClaim.householdCode,
    scannedAt: emmanuelClaim.scannedAt,
    status: emmanuelClaim.status
  });

  await mongoose.disconnect();
}

run().catch(console.error);
