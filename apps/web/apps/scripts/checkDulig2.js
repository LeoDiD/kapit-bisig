const mongoose = require('mongoose');
async function main() {
  await mongoose.connect('mongodb://localhost:27017/kapit-bisig');
  
  // Check the Bongalon claim that references Dulig distribution
  const claims = await mongoose.connection.db.collection('claims').find({}).toArray();
  console.log('All claims with distributionId:');
  for (const c of claims) {
    const dist = await mongoose.connection.db.collection('distributions').findOne({ _id: c.distributionId });
    console.log(`  ${c.barangay} | ${c.householdCode} | dist=${dist?.barangay} (${String(c.distributionId)}) | residentId=${c.residentId}`);
  }
  
  // Check the Bongalon claim that has HH-BO-0F36
  const bo36 = await mongoose.connection.db.collection('claims').findOne({ householdCode: 'HH-BO-0F36' });
  console.log('\nHH-BO-0F36 claim detail:');
  console.log('  barangay:', bo36.barangay);
  console.log('  distributionId:', String(bo36.distributionId));
  console.log('  residentId:', bo36.residentId);
  
  // Check resident for this claim
  if (bo36.residentId) {
    const res = await mongoose.connection.db.collection('residents').findOne({ _id: new mongoose.Types.ObjectId(bo36.residentId) });
    console.log('  resident barangay:', res?.barangay, '| name:', res?.familyHeadName);
  }
  
  // The Dulig DistributionClaim householdId
  const duligHouseholdId = new mongoose.Types.ObjectId('698c0a877846e6a0f3730f36');
  const householdToken = await mongoose.connection.db.collection('householdtokens').findOne({ _id: duligHouseholdId });
  console.log('\nHouseholdToken 698c0a877846e6a0f3730f36:');
  if (householdToken) {
    console.log('  barangay:', householdToken.barangay);
    console.log('  householdCode:', householdToken.householdCode);
    const resident = await mongoose.connection.db.collection('residents').findOne({ _id: householdToken.residentId });
    console.log('  linked resident:', resident?.barangay, '|', String(householdToken.residentId));
  } else {
    console.log('  NOT FOUND');
    // Try as a resident
    const res2 = await mongoose.connection.db.collection('residents').findOne({ _id: duligHouseholdId });
    if (res2) console.log('  Found as resident:', res2.barangay, '|', res2.familyHeadName);
  }
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
