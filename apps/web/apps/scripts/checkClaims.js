const mongoose = require('mongoose');
async function main() {
  await mongoose.connect('mongodb://localhost:27017/kapit-bisig');
  const claims = await mongoose.connection.db.collection('claims')
    .find({}, { projection: { barangay: 1, householdCode: 1, status: 1, distributionId: 1 } })
    .toArray();
  console.log('Total claims:', claims.length);
  claims.forEach(c => console.log(c.barangay, '|', c.householdCode, '|', c.status, '|', String(c.distributionId)));
  
  // Also check DistributionClaims
  const distClaims = await mongoose.connection.db.collection('distributionclaims').find({}).toArray();
  console.log('\nDistributionClaims:', distClaims.length);
  
  // Check distributions
  const dists = await mongoose.connection.db.collection('distributions').find({}, { projection: { barangay: 1, status: 1 } }).toArray();
  console.log('\nDistributions:');
  dists.forEach(d => console.log(d.barangay, '|', d.status, '|', String(d._id)));
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
