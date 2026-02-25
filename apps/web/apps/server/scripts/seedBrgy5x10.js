/**
 * seedBrgy5x10.js - DEV-ONLY seed script
 *
 * Seeds:
 * - 5 households per barangay across 10 barangays (50 residents total)
 * - 1 claim token per seeded household
 * - 1 seeded distribution per barangay
 *
 * Barangays:
 *   Bolo, Bongalon, Dulig, Laois, Magsaysay,
 *   Poblacion, San Gonzalo, San Jose, Tobuan, Uyong
 *
 * Run from apps/web/apps:
 *   node server/scripts/seedBrgy5x10.js
 *
 * Idempotent for this seed set via SEED_TAG.
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';
const SALT_ROUNDS = 12;
const SEED_TAG = 'BRGY5X10_SEPOLIA';

const ResidentSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    fullName: String,
    dateOfBirth: String,
    gender: { type: String, enum: ['Male', 'Female'] },
    mobileNumber: String,
    password: { type: String, select: false },
    city: { type: String, default: '' },
    barangay: String,
    streetAddress: String,
    householdSize: { type: Number, default: 1 },
    vulnerableMembers: [String],
    vulnerableCounts: { type: Map, of: Number, default: {} },
    idType: String,
    idNumber: String,
    frontIdImage: String,
    backIdImage: String,
    faceImage: String,
    faceDescriptor: [Number],
    verification: {
      overallConfidence: Number,
      idConfidence: Number,
      faceMatchConfidence: Number,
      livenessConfidence: Number,
      dataMatchScore: Number,
      riskScore: Number,
      isVerified: Boolean,
      aiVerificationStatus: {
        type: String,
        enum: ['High Match', 'Medium Match', 'Low Match'],
      },
      warnings: [String],
      riskFactors: [String],
    },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    seeded: { type: Boolean, default: false },
    seedTag: { type: String, default: '' },
    householdCode: { type: String, default: '' },
  },
  { timestamps: true, strict: false },
);

const HouseholdTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    tokenPrefix: String,
    status: {
      type: String,
      enum: ['UNUSED', 'LOCKED', 'USED', 'EXPIRED'],
      default: 'UNUSED',
    },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: String, default: null },
    lockExpiresAt: { type: Date, default: null },
    expiresAt: Date,
    usedAt: { type: Date, default: null },
    usedBy: {
      residentId: { type: mongoose.Schema.Types.ObjectId, default: null },
      ipAddress: { type: String, default: null },
      userAgent: { type: String, default: null },
    },
    householdInfo: {
      headOfHousehold: String,
      address: String,
      barangay: String,
      expectedMembers: { type: Number, default: 1 },
      notes: { type: String, default: '' },
    },
    issuedBy: String,
    issuedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 0 },
    seeded: { type: Boolean, default: false },
    seedTag: { type: String, default: '' },
    householdCode: { type: String, default: '' },
  },
  { timestamps: true, strict: false },
);

const DistributionSchema = new mongoose.Schema(
  {
    barangay: String,
    scheduled: String,
    households: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['Unclaimed', 'Claimed'], default: 'Unclaimed' },
    claimedAt: { type: Date, default: null },
    seeded: { type: Boolean, default: false },
    seedTag: { type: String, default: '' },
  },
  { timestamps: true, strict: false },
);

const BRGYS = [
  { name: 'Bolo', code: 'BL' },
  { name: 'Bongalon', code: 'BN' },
  { name: 'Dulig', code: 'DL' },
  { name: 'Laois', code: 'LA' },
  { name: 'Magsaysay', code: 'MG' },
  { name: 'Poblacion', code: 'PB' },
  { name: 'San Gonzalo', code: 'SG' },
  { name: 'San Jose', code: 'SJ' },
  { name: 'Tobuan', code: 'TB' },
  { name: 'Uyong', code: 'UY' },
];

const FIRST_NAMES = [
  'Juan', 'Maria', 'Pedro', 'Ana', 'Jose',
  'Rosa', 'Carlos', 'Elena', 'Roberto', 'Lorna',
  'Miguel', 'Teresa', 'Paolo', 'Irene', 'Mark',
  'Liza', 'Ramon', 'Cecilia', 'Noel', 'Grace',
  'Leo', 'Mila', 'Oscar', 'Jenny', 'Daniel',
  'Rina', 'Victor', 'Nora', 'Ryan', 'Ella',
  'Adrian', 'Sheila', 'Arvin', 'Mona', 'Niko',
  'Daisy', 'Edgar', 'Mara', 'Felix', 'Tina',
  'Gino', 'Nina', 'Harold', 'Aiza', 'Ivan',
  'Kaye', 'Jasper', 'Luna', 'Kevin', 'Maya',
];

const LAST_NAMES = [
  'Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza',
  'Bautista', 'Villanueva', 'Ramos', 'Aquino', 'Fernandez',
  'Torres', 'Castro', 'Navarro', 'Flores', 'Domingo',
  'Gutierrez', 'Lopez', 'Rivera', 'Hernandez', 'Valdez',
];

const PLACEHOLDER_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIABQABNjN9GQAAAABJRwEBAAA=';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function matchLevelForIndex(globalIndex) {
  if (globalIndex % 3 === 0) return 'High Match';
  if (globalIndex % 3 === 1) return 'Medium Match';
  return 'Low Match';
}

function confidenceForIndex(globalIndex) {
  return 74 + (globalIndex % 20);
}

async function main() {
  console.log('\nseedBrgy5x10 - seeding 10 barangays x 5 households\n');

  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to MongoDB (${MONGODB_URI})`);

  const Resident =
    mongoose.models.Resident || mongoose.model('Resident', ResidentSchema);
  const HouseholdToken =
    mongoose.models.HouseholdToken || mongoose.model('HouseholdToken', HouseholdTokenSchema);
  const Distribution =
    mongoose.models.Distribution || mongoose.model('Distribution', DistributionSchema);

  const seededPassword = await bcrypt.hash('SeedTest123!', SALT_ROUNDS);
  const summaryRows = [];

  let residentsCreated = 0;
  let residentsUpdated = 0;
  let tokensCreated = 0;
  let tokensUpdated = 0;
  let distsCreated = 0;
  let distsUpdated = 0;

  let globalIndex = 0;
  for (const brgy of BRGYS) {
    for (let i = 1; i <= 5; i++) {
      globalIndex += 1;

      const firstName = FIRST_NAMES[(globalIndex - 1) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[((globalIndex - 1) * 3) % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;
      const householdCode = `HH-${brgy.code}-${String(i).padStart(4, '0')}`;
      const idNumber = `SEED-${SEED_TAG}-${brgy.code}-${String(i).padStart(2, '0')}`;
      const mobileNumber = `09${String(810000000 + globalIndex)}`;
      const members = 2 + (globalIndex % 6);
      const gender = globalIndex % 2 === 0 ? 'Female' : 'Male';
      const confidence = confidenceForIndex(globalIndex);
      const aiVerificationStatus = matchLevelForIndex(globalIndex);
      const address = `${100 + i} Seed Street, ${brgy.name}`;
      const token = `CLM-${brgy.code}-${String(i).padStart(4, '0')}-${String(7000 + globalIndex)}`;

      const existingResident = await Resident.findOne({ idNumber, seedTag: SEED_TAG });
      let residentDoc = existingResident;
      if (!residentDoc) {
        residentDoc = await Resident.create({
          firstName,
          lastName,
          fullName,
          dateOfBirth: '1990-01-15',
          gender,
          mobileNumber,
          password: seededPassword,
          city: 'Rosario',
          barangay: brgy.name,
          streetAddress: address,
          householdSize: members,
          vulnerableMembers: [],
          vulnerableCounts: {},
          idType: 'PhilID',
          idNumber,
          frontIdImage: PLACEHOLDER_IMG,
          backIdImage: PLACEHOLDER_IMG,
          faceImage: PLACEHOLDER_IMG,
          verification: {
            overallConfidence: confidence,
            idConfidence: confidence - 4,
            faceMatchConfidence: confidence - 2,
            livenessConfidence: confidence - 1,
            dataMatchScore: confidence - 3,
            riskScore: 100 - confidence,
            isVerified: true,
            aiVerificationStatus,
            warnings: [],
            riskFactors: [],
          },
          status: 'Approved',
          seeded: true,
          seedTag: SEED_TAG,
          householdCode,
        });
        residentsCreated += 1;
      } else {
        residentDoc.firstName = firstName;
        residentDoc.lastName = lastName;
        residentDoc.fullName = fullName;
        residentDoc.gender = gender;
        residentDoc.mobileNumber = mobileNumber;
        residentDoc.barangay = brgy.name;
        residentDoc.streetAddress = address;
        residentDoc.householdSize = members;
        residentDoc.status = 'Approved';
        residentDoc.seeded = true;
        residentDoc.seedTag = SEED_TAG;
        residentDoc.householdCode = householdCode;
        residentDoc.verification = {
          overallConfidence: confidence,
          idConfidence: confidence - 4,
          faceMatchConfidence: confidence - 2,
          livenessConfidence: confidence - 1,
          dataMatchScore: confidence - 3,
          riskScore: 100 - confidence,
          isVerified: true,
          aiVerificationStatus,
          warnings: [],
          riskFactors: [],
        };
        await residentDoc.save();
        residentsUpdated += 1;
      }

      const existingToken = await HouseholdToken.findOne({
        seedTag: SEED_TAG,
        householdCode,
      });
      const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);
      if (!existingToken) {
        await HouseholdToken.create({
          tokenHash,
          tokenPrefix: token.replace(/-/g, '').slice(0, 4),
          status: 'UNUSED',
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          householdInfo: {
            headOfHousehold: fullName,
            address,
            barangay: brgy.name,
            expectedMembers: members,
            notes: `Seeded test token (${SEED_TAG})`,
          },
          issuedBy: 'seed-script',
          issuedAt: new Date(),
          seeded: true,
          seedTag: SEED_TAG,
          householdCode,
        });
        tokensCreated += 1;
      } else {
        existingToken.tokenHash = tokenHash;
        existingToken.tokenPrefix = token.replace(/-/g, '').slice(0, 4);
        existingToken.status = 'UNUSED';
        existingToken.expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
        existingToken.householdInfo = {
          headOfHousehold: fullName,
          address,
          barangay: brgy.name,
          expectedMembers: members,
          notes: `Seeded test token (${SEED_TAG})`,
        };
        existingToken.seeded = true;
        existingToken.seedTag = SEED_TAG;
        existingToken.householdCode = householdCode;
        await existingToken.save();
        tokensUpdated += 1;
      }

      summaryRows.push({
        householdCode,
        barangay: brgy.name,
        name: fullName,
        members,
        token,
      });
    }
  }

  for (const brgy of BRGYS) {
    const existingDist = await Distribution.findOne({ barangay: brgy.name, seedTag: SEED_TAG });
    if (!existingDist) {
      await Distribution.create({
        barangay: brgy.name,
        scheduled: todayISO(),
        households: 5,
        notes: `Seeded distribution (${SEED_TAG})`,
        status: 'Unclaimed',
        seeded: true,
        seedTag: SEED_TAG,
      });
      distsCreated += 1;
    } else {
      existingDist.scheduled = todayISO();
      existingDist.households = 5;
      existingDist.status = 'Unclaimed';
      existingDist.seeded = true;
      existingDist.seedTag = SEED_TAG;
      existingDist.notes = `Seeded distribution (${SEED_TAG})`;
      await existingDist.save();
      distsUpdated += 1;
    }
  }

  console.log('\nSeeded households with claim tokens:\n');
  console.log(
    'Code'.padEnd(14) +
      'Barangay'.padEnd(15) +
      'Head of Household'.padEnd(26) +
      'Members'.padEnd(9) +
      'Claim Token'
  );
  console.log('-'.repeat(90));
  for (const row of summaryRows) {
    console.log(
      row.householdCode.padEnd(14) +
        row.barangay.padEnd(15) +
        row.name.padEnd(26) +
        String(row.members).padEnd(9) +
        row.token
    );
  }

  const residentCount = await Resident.countDocuments({ seedTag: SEED_TAG });
  const tokenCount = await HouseholdToken.countDocuments({ seedTag: SEED_TAG });
  const distCount = await Distribution.countDocuments({ seedTag: SEED_TAG });

  console.log('\nSummary:');
  console.log(`Residents: ${residentsCreated} created, ${residentsUpdated} updated (total ${residentCount})`);
  console.log(`Tokens: ${tokensCreated} created, ${tokensUpdated} updated (total ${tokenCount})`);
  console.log(`Distributions: ${distsCreated} created, ${distsUpdated} updated (total ${distCount})`);

  console.log('\nPer-barangay checks (seed set only):');
  for (const brgy of BRGYS) {
    const count = await Resident.countDocuments({ seedTag: SEED_TAG, barangay: brgy.name });
    console.log(`- ${brgy.name}: ${count} households`);
  }

  await mongoose.disconnect();
  console.log('\nDone.\n');
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
