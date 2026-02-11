const mongoose = require('mongoose');
async function main() {
  await mongoose.connect('mongodb://localhost:27017/kapit-bisig');
  
  // Get Dulig distribution ID
  const duligDist = await mongoose.connection.db.collection('distributions')
    .findOne({ barangay: 'Dulig' });
  console.log('Dulig distribution:', String(duligDist._id));
  
  // Get DistributionClaims for Dulig
  const duligClaims = await mongoose.connection.db.collection('distributionclaims')
    .find({ distributionId: duligDist._id })
    .toArray();
  console.log('Dulig DistributionClaims:', duligClaims.length);
  duligClaims.forEach(c => console.log('  householdId:', String(c.householdId), '| claimedAt:', c.claimedAt));
  
  // Get Dulig residents
  const duligResidents = await mongoose.connection.db.collection('residents')
    .find({ barangay: 'Dulig' }, { projection: { familyHeadName: 1, barangay: 1 } })
    .toArray();
  console.log('\nDulig residents:', duligResidents.length);
  duligResidents.forEach(r => console.log('  ', String(r._id), '|', r.familyHeadName));
  
  // All DistributionClaims with their distribution barangay
  const allDC = await mongoose.connection.db.collection('distributionclaims').find({}).toArray();
  console.log('\nAll DistributionClaims:');
  for (const dc of allDC) {
    const dist = await mongoose.connection.db.collection('distributions').findOne({ _id: dc.distributionId });
    console.log('  distBarangay:', dist?.barangay, '| householdId:', String(dc.householdId));
  }
  
  // Check claims for Bongalon distribution (698c0a887846e6a0f3730f51) - the one Dulig uses
  const bongalonDistId = new mongoose.Types.ObjectId('698c0a887846e6a0f3730f51');
  const bongalonClaims = await mongoose.connection.db.collection('claims')
    .find({ distributionId: bongalonDistId })
    .toArray();
  console.log('\nClaims with distributionId of Bongalon (698c0a887846e6a0f3730f51):');
  bongalonClaims.forEach(c => console.log('  ', c.barangay, '|', c.householdCode));
  
  // Claims for Dulig distribution
  const duligDistId = new mongoose.Types.ObjectId('698c0a887846e6a0f3730f54');
  const duligClaimsFromDist = await mongoose.connection.db.collection('claims')
    .find({ distributionId: duligDistId })
    .toArray();
  console.log('\nClaims with distributionId of Dulig (698c0a887846e6a0f3730f54):');
  duligClaimsFromDist.forEach(c => console.log('  ', c.barangay, '|', c.householdCode));
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
