/**
 * Backfill script: Fix distribution statuses and mismatched DistributionClaims
 * 
 * Issues found:
 * 1. Distribution documents still have status='Unclaimed' even though claims exist
 * 2. One DistributionClaim (Juan Dela Cruz/Bolo) points to wrong distribution (Dulig)
 * 
 * This script:
 * - Finds all Claims with status=CONFIRMED
 * - Groups them by distributionId
 * - Updates each Distribution's status to 'Claimed' if it has confirmed claims
 * - Fixes DistributionClaims where the resident's barangay doesn't match the distribution's barangay
 */

const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/kapit-bisig');
  console.log('Connected to MongoDB\n');

  const db = mongoose.connection.db;
  const claimsCol = db.collection('claims');
  const distsCol = db.collection('distributions');
  const dcCol = db.collection('distributionclaims');
  const residentsCol = db.collection('residents');

  // 1. Get all confirmed claims
  const confirmedClaims = await claimsCol.find({ status: 'CONFIRMED' }).toArray();
  console.log(`Found ${confirmedClaims.length} confirmed claims\n`);

  // 2. Build a map of Distribution._id -> barangay
  const allDists = await distsCol.find({}).toArray();
  const distIdToBarangay = {};
  const barangayToDistId = {};
  for (const d of allDists) {
    distIdToBarangay[d._id.toString()] = d.barangay;
    barangayToDistId[d.barangay] = d._id;
  }

  // 3. For each confirmed claim, check if the claim.distributionId matches the claim.barangay
  //    If not, find the correct distribution for that barangay and update the claim + DistributionClaim
  let fixedClaims = 0;
  let fixedDC = 0;
  
  for (const claim of confirmedClaims) {
    const claimDistBarangay = distIdToBarangay[claim.distributionId];
    const claimBarangay = claim.barangay;
    
    if (claimDistBarangay && claimDistBarangay !== claimBarangay) {
      console.log(`MISMATCH: Claim ${claim.claimId} (barangay=${claimBarangay}) -> Distribution ${claimDistBarangay} (${claim.distributionId})`);
      
      // Find the correct distribution for this barangay
      const correctDistId = barangayToDistId[claimBarangay];
      if (correctDistId) {
        console.log(`  Fixing: ${claim.distributionId} -> ${correctDistId} (${claimBarangay})`);
        
        // Update the claim
        await claimsCol.updateOne(
          { _id: claim._id },
          { $set: { distributionId: correctDistId.toString() } }
        );
        fixedClaims++;
        
        // Update the DistributionClaim (or create if missing)
        // First delete the wrong one
        const residentId = claim.residentId;
        if (residentId) {
          const delResult = await dcCol.deleteOne({
            distributionId: new mongoose.Types.ObjectId(claim.distributionId),
            householdId: new mongoose.Types.ObjectId(residentId),
          });
          if (delResult.deletedCount > 0) {
            console.log(`  Deleted wrong DistributionClaim (distId=${claim.distributionId})`);
          }
          
          // Create the correct one
          await dcCol.updateOne(
            {
              distributionId: correctDistId,
              householdId: new mongoose.Types.ObjectId(residentId),
            },
            {
              $set: {
                distributionId: correctDistId,
                householdId: new mongoose.Types.ObjectId(residentId),
                claimedAt: claim.createdAt || new Date(),
                claimedBy: { id: claim.staffUserId || '', name: claim.staffName || '' },
                proofMethod: 'QR',
              },
              $setOnInsert: {
                createdAt: new Date(),
              },
            },
            { upsert: true }
          );
          fixedDC++;
          console.log(`  Created correct DistributionClaim (distId=${correctDistId})`);
        }
      }
    }
  }
  
  console.log(`\nFixed ${fixedClaims} claims and ${fixedDC} DistributionClaims\n`);

  // 4. Update Distribution statuses based on DistributionClaims
  let statusUpdates = 0;
  for (const dist of allDists) {
    const claimCount = await dcCol.countDocuments({ distributionId: dist._id });
    if (claimCount > 0 && dist.status !== 'Claimed') {
      await distsCol.updateOne(
        { _id: dist._id },
        { $set: { status: 'Claimed', claimedAt: new Date() } }
      );
      console.log(`Updated Distribution ${dist.barangay}: Unclaimed -> Claimed (${claimCount} claims)`);
      statusUpdates++;
    } else if (claimCount > 0) {
      console.log(`Distribution ${dist.barangay}: already Claimed (${claimCount} claims)`);
    } else {
      console.log(`Distribution ${dist.barangay}: no claims, stays Unclaimed`);
    }
  }
  
  console.log(`\nUpdated ${statusUpdates} distribution statuses`);

  // 5. Verify final state
  console.log('\n=== Final State ===');
  const finalDists = await distsCol.find({}).toArray();
  for (const d of finalDists) {
    const claimCount = await dcCol.countDocuments({ distributionId: d._id });
    console.log(`  ${d.barangay}: status=${d.status}, claims=${claimCount}`);
  }

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(e => { console.error(e); process.exit(1); });
