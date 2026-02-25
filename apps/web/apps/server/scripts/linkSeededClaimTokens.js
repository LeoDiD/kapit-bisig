/**
 * Link seeded CLM claim tokens to approved household records.
 *
 * Why:
 * - Seeded claim tokens may exist without usedBy.residentId linkage.
 * - Risk #5 flow requires token -> approved resident mapping.
 *
 * What this script does:
 * 1) Finds seeded-style claim tokens (tokenPrefix starts with "CLM")
 * 2) Resolves approved resident by:
 *    a) householdCode + barangay (preferred)
 *    b) headOfHousehold(fullName) + barangay (fallback)
 * 3) Sets token.usedBy.residentId
 * 4) Marks token as USED (if not already) with usedAt timestamp
 *
 * Safe to run multiple times.
 *
 * Usage:
 *   node server/scripts/linkSeededClaimTokens.js
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  console.log('\n[RISK-5 MITIGATION] Linking seeded claim tokens to household records\n');
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected: ${MONGODB_URI}`);

  const tokenSchema = new mongoose.Schema({}, { strict: false, collection: 'householdtokens' });
  const residentSchema = new mongoose.Schema({}, { strict: false, collection: 'residents' });

  const HouseholdToken =
    mongoose.models.LinkSeededClaimToken ||
    mongoose.model('LinkSeededClaimToken', tokenSchema);
  const Resident =
    mongoose.models.LinkSeededClaimResident ||
    mongoose.model('LinkSeededClaimResident', residentSchema);

  const tokenFilter = {
    tokenPrefix: { $regex: '^CLM', $options: 'i' },
  };

  const tokens = await HouseholdToken.find(tokenFilter).lean();
  console.log(`Found claim-style seeded tokens: ${tokens.length}`);

  let alreadyLinked = 0;
  let linkedNow = 0;
  let missingResident = 0;
  let failed = 0;

  for (const token of tokens) {
    const tokenId = String(token._id);
    const barangay = token?.householdInfo?.barangay || '';
    const householdCode = token?.householdCode || '';
    const head = token?.householdInfo?.headOfHousehold || '';
    const existingResidentId = token?.usedBy?.residentId ? String(token.usedBy.residentId) : '';

    if (existingResidentId) {
      const residentExists = await Resident.exists({ _id: existingResidentId, status: 'Approved' });
      if (residentExists) {
        alreadyLinked++;
        console.log(`- ${tokenId}: already linked -> ${existingResidentId}`);
        continue;
      }
    }

    let resident = null;

    if (householdCode && barangay) {
      resident = await Resident.findOne({
        householdCode,
        barangay,
        status: 'Approved',
      })
        .select('_id fullName barangay householdCode status')
        .lean();
    }

    if (!resident && head && barangay) {
      resident = await Resident.findOne({
        barangay,
        status: 'Approved',
        fullName: { $regex: `^${escapeRegex(head)}$`, $options: 'i' },
      })
        .select('_id fullName barangay householdCode status')
        .lean();
    }

    if (!resident) {
      missingResident++;
      console.log(
        `- ${tokenId}: no approved resident match (barangay="${barangay}", householdCode="${householdCode}", head="${head}")`,
      );
      continue;
    }

    try {
      const update = {
        $set: {
          'usedBy.residentId': resident._id,
          status: 'USED',
          usedAt: token.usedAt || new Date(),
        },
      };

      await HouseholdToken.updateOne({ _id: token._id }, update);
      linkedNow++;
      console.log(
        `- ${tokenId}: linked -> resident=${resident._id} (${resident.fullName}) [${resident.barangay}]`,
      );
    } catch (err) {
      failed++;
      console.log(`- ${tokenId}: update failed -> ${err.message}`);
    }
  }

  console.log('\nSummary');
  console.log(`- already linked: ${alreadyLinked}`);
  console.log(`- linked now:     ${linkedNow}`);
  console.log(`- no match:       ${missingResident}`);
  console.log(`- failed:         ${failed}`);

  await mongoose.disconnect();
  console.log('\nDone.\n');
}

main().catch(async (err) => {
  console.error('Fatal:', err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});

