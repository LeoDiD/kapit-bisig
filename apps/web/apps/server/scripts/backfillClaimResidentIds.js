/**
 * Backfill Script: Populate residentId on existing Claims + create DistributionClaims
 *
 * Existing claims stored HouseholdToken._id as householdId, but the Households
 * and Distribution modules need Resident._id for cross-referencing.
 *
 * This script:
 * 1. Finds all CONFIRMED claims that have no residentId (or empty).
 * 2. For each, looks up the HouseholdToken by _id to get headOfHousehold + barangay.
 * 3. Finds the matching Resident by fullName + barangay.
 * 4. Updates the claim's residentId field.
 * 5. Upserts a DistributionClaim record so the distribution module picks it up.
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage: node server/scripts/backfillClaimResidentIds.js
 */

const mongoose = require('mongoose');
const path = require('path');

// Load .env.local
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/kapit-bisig';

/* ─── Inline schemas (minimal, to avoid ts-node) ─── */

const ClaimSchema = new mongoose.Schema(
  {
    claimId: String,
    householdId: String,
    residentId: { type: String, default: '' },
    householdCode: String,
    barangay: String,
    distributionId: String,
    distributionSite: String,
    staffUserId: String,
    staffName: String,
    status: String,

    errorMessage: String,
  },
  { timestamps: true, collection: 'claims' }
);

const ResidentSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    fullName: String,
    barangay: String,
    streetAddress: String,
    status: String,
  },
  { timestamps: true, collection: 'residents' }
);

const HouseholdTokenSchema = new mongoose.Schema(
  {
    tokenHash: String,
    tokenPrefix: String,
    status: String,
    householdInfo: {
      headOfHousehold: String,
      address: String,
      barangay: String,
      expectedMembers: Number,
    },
  },
  { timestamps: true, collection: 'householdtokens' }
);

const DistributionClaimSchema = new mongoose.Schema(
  {
    distributionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribution' },
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
    claimedAt: { type: Date, default: () => new Date() },
    claimedBy: {
      id: { type: String, default: null },
      name: { type: String, default: null },
    },
    proofMethod: { type: String, default: null },
  },
  { timestamps: true, collection: 'distributionclaims' }
);
DistributionClaimSchema.index(
  { distributionId: 1, householdId: 1 },
  { unique: true }
);

async function main() {
  console.log('🔧 Backfill: Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  const Claim = mongoose.model('Claim', ClaimSchema);
  const Resident = mongoose.model('Resident', ResidentSchema);
  const HouseholdToken = mongoose.model('HouseholdToken', HouseholdTokenSchema);
  const DistributionClaim = mongoose.model('DistributionClaim', DistributionClaimSchema);

  // Find CONFIRMED claims with no residentId
  const claims = await Claim.find({
    status: 'CONFIRMED',
    $or: [{ residentId: '' }, { residentId: null }, { residentId: { $exists: false } }],
  });

  console.log(`Found ${claims.length} CONFIRMED claim(s) missing residentId.\n`);

  let updated = 0;
  let dcCreated = 0;

  for (const claim of claims) {
    const tokenId = claim.householdId;

    // 1) Look up the HouseholdToken to get headOfHousehold + barangay
    const token = await HouseholdToken.findById(tokenId).lean();
    if (!token) {
      console.log(`  ⚠ Claim ${claim.claimId}: HouseholdToken ${tokenId} not found, skipping.`);
      continue;
    }

    const headName = token.householdInfo?.headOfHousehold;
    const barangay = token.householdInfo?.barangay;
    if (!headName || !barangay) {
      console.log(`  ⚠ Claim ${claim.claimId}: Token missing headOfHousehold or barangay, skipping.`);
      continue;
    }

    // 2) Find the matching Resident
    const resident = await Resident.findOne({
      barangay,
      $or: [
        { fullName: headName },
        { fullName: new RegExp(`^${headName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
      status: 'Approved',
    })
      .select('_id fullName')
      .lean();

    if (!resident) {
      console.log(`  ⚠ Claim ${claim.claimId}: No Resident found for "${headName}" in ${barangay}, skipping.`);
      continue;
    }

    const residentId = resident._id.toString();

    // 3) Update the claim's residentId
    await Claim.updateOne(
      { _id: claim._id },
      { $set: { residentId } }
    );
    console.log(`  ✅ Claim ${claim.claimId} → residentId=${residentId} (${resident.fullName})`);
    updated++;

    // 4) Upsert DistributionClaim
    try {
      await DistributionClaim.findOneAndUpdate(
        { distributionId: claim.distributionId, householdId: residentId },
        {
          distributionId: claim.distributionId,
          householdId: residentId,
          claimedAt: claim.createdAt || new Date(),
          claimedBy: { id: claim.staffUserId, name: claim.staffName },
          proofMethod: 'QR',
        },
        { upsert: true, new: true }
      );
      dcCreated++;
      console.log(`     ↳ DistributionClaim upserted for dist=${claim.distributionId}`);
    } catch (err) {
      console.log(`     ⚠ DistributionClaim upsert failed: ${err.message}`);
    }
  }

  console.log(`\n🏁 Done. Updated ${updated} claim(s), upserted ${dcCreated} DistributionClaim(s).`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
