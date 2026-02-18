const mongoose = require('mongoose');
async function main() {
  await mongoose.connect('mongodb://localhost:27017/kapit-bisig');
  const db = mongoose.connection.db;

  const residents = await db.collection('residents').aggregate([
    { $group: { _id: '$barangay', count: { $sum: 1 } } }
  ]).toArray();
  console.log('Residents per barangay:');
  residents.sort((a, b) => (a._id || '').localeCompare(b._id || '')).forEach(x => console.log(' ', x._id, ':', x.count));

  const tokens = await db.collection('householdtokens').aggregate([
    { $group: { _id: '$householdInfo.barangay', count: { $sum: 1 } } }
  ]).toArray();
  console.log('\nHouseholdTokens per barangay:');
  tokens.sort((a, b) => (a._id || '').localeCompare(b._id || '')).forEach(x => console.log(' ', x._id, ':', x.count));

  const dists = await db.collection('distributions').find({}, { projection: { barangay: 1, status: 1 } }).toArray();
  console.log('\nDistributions:');
  dists.forEach(x => console.log(' ', x.barangay, '-', x.status));

  const allBarangays = ['Bolo','Bongalon','Dulig','Laois','Magsaysay','Poblacion','San Gonzalo','San Jose','Tobuan','Uyong'];
  const existingBarangays = new Set(residents.map(r => r._id));
  const missing = allBarangays.filter(b => !existingBarangays.has(b));
  console.log('\nBarangays WITHOUT residents:', missing.length ? missing.join(', ') : 'none');

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
