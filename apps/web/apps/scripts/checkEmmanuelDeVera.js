const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

async function run() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { dbName: 'kapit-bisig' });
  console.log('Connected!');

  const db = mongoose.connection.db;
  const residents = await db.collection('residents').find({
    $or: [
      { fullName: { $regex: 'Emmanuel', $options: 'i' } },
      { firstName: { $regex: 'Emmanuel', $options: 'i' } },
      { lastName: { $regex: 'Vera', $options: 'i' } },
    ]
  }).toArray();

  console.log('Residents found:', residents.length);
  for (const r of residents) {
    console.log({
      id: r._id.toString(),
      fullName: r.fullName,
      firstName: r.firstName,
      lastName: r.lastName,
      barangay: r.barangay,
      residentCode: r.residentCode,
      status: r.status,
    });
  }

  const distributions = await db.collection('distributions').find({}).toArray();
  console.log('\nDistributions:', distributions.length);
  for (const d of distributions) {
    console.log({
      id: d._id.toString(),
      barangay: d.barangay,
      assignedBarangays: d.assignedBarangays,
      status: d.status,
      scheduled: d.scheduled,
      endsAt: d.endsAt,
    });
  }

  const claims = await db.collection('claims').find({}).toArray();
  console.log('\nTotal Claims:', claims.length);
  const userClaims = claims.filter(c => 
    residents.some(r => r._id.toString() === String(c.residentId) || r._id.toString() === String(c.householdId))
  );
  console.log('Claims for matched residents:', userClaims);

  const distClaims = await db.collection('distributionclaims').find({}).toArray();
  console.log('\nTotal DistributionClaims:', distClaims.length);
  const userDistClaims = distClaims.filter(c =>
    residents.some(r => r._id.toString() === String(c.householdId))
  );
  console.log('DistributionClaims for matched residents:', userDistClaims);

  await mongoose.disconnect();
}

run().catch(console.error);
