/**
 * seedClaimHouseholds10x10.js
 *
 * Seeds households + linked claim tokens only (no distributions).
 * Default: 10 households per barangay across 10 barangays.
 *
 * Run from apps/web/apps:
 *   node server/scripts/seedClaimHouseholds10x10.js
 *
 * Optional env:
 *   SEED_TAG=CLAIM10X10_V2
 *   SEED_HOUSEHOLDS_PER_BARANGAY=10
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';
const SALT_ROUNDS = 12;
const SEED_TAG = String(process.env.SEED_TAG || 'CLAIM10X10_V2').trim();
const HOUSEHOLDS_PER_BARANGAY = Number(process.env.SEED_HOUSEHOLDS_PER_BARANGAY || 10);

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

function makeToken(brgyCode, householdIndex, globalIndex) {
  const partA = String(8000 + householdIndex).padStart(4, '0');
  const partB = String(9000 + globalIndex).padStart(4, '0');
  return `CLM-${brgyCode}-${partA}-${partB}`;
}

function confidenceForIndex(globalIndex) {
  return 76 + (globalIndex % 18);
}

function matchLevelForIndex(globalIndex) {
  if (globalIndex % 3 === 0) return 'High Match';
  if (globalIndex % 3 === 1) return 'Medium Match';
  return 'Low Match';
}

async function buildUniqueMobileNumber(Resident, idNumber, globalIndex, brgyCode) {
  const brgyOffset = BRGYS.findIndex((b) => b.code === brgyCode) + 1;
  let numeric = 940000000 + brgyOffset * 10000 + globalIndex;

  for (let attempt = 0; attempt < 1200; attempt += 1) {
    if (numeric > 999999999) numeric = 940000000 + attempt;
    const candidate = `09${String(numeric).padStart(9, '0')}`;
    const conflict = await Resident.findOne({
      mobileNumber: candidate,
      idNumber: { $ne: idNumber },
    })
      .select('_id')
      .lean();

    if (!conflict) return candidate;
    numeric += 1;
  }

  throw new Error(`Unable to generate unique mobile number for ${idNumber}`);
}

async function main() {
  console.log(
    `\nseedClaimHouseholds10x10 - ${BRGYS.length} barangays x ${HOUSEHOLDS_PER_BARANGAY} households (seedTag=${SEED_TAG})\n`,
  );

  await mongoose.connect(MONGODB_URI);

  const Resident = mongoose.models.Resident || mongoose.model('Resident', ResidentSchema);
  const HouseholdToken =
    mongoose.models.HouseholdToken || mongoose.model('HouseholdToken', HouseholdTokenSchema);

  const seededPassword = await bcrypt.hash('SeedTest123!', SALT_ROUNDS);
  const summaryRows = [];

  let residentsCreated = 0;
  let residentsUpdated = 0;
  let tokensCreated = 0;
  let tokensUpdated = 0;
  let globalIndex = 0;

  for (const brgy of BRGYS) {
    for (let i = 1; i <= HOUSEHOLDS_PER_BARANGAY; i += 1) {
      globalIndex += 1;

      const firstName = FIRST_NAMES[(globalIndex - 1) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[((globalIndex - 1) * 3) % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;
      const householdCode = `HH-${brgy.code}-${String(i).padStart(4, '0')}`;
      const idNumber = `SEED-${SEED_TAG}-${brgy.code}-${String(i).padStart(4, '0')}`;
      const mobileNumber = await buildUniqueMobileNumber(Resident, idNumber, globalIndex, brgy.code);
      const members = 2 + (globalIndex % 6);
      const gender = globalIndex % 2 === 0 ? 'Female' : 'Male';
      const confidence = confidenceForIndex(globalIndex);
      const aiVerificationStatus = matchLevelForIndex(globalIndex);
      const address = `${100 + i} Seed Street, ${brgy.name}`;
      const token = makeToken(brgy.code, i, globalIndex);

      let residentDoc = await Resident.findOne({ idNumber, seedTag: SEED_TAG });
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

      const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);
      const existingToken = await HouseholdToken.findOne({ seedTag: SEED_TAG, householdCode });
      if (!existingToken) {
        await HouseholdToken.create({
          tokenHash,
          tokenPrefix: token.replace(/-/g, '').slice(0, 4),
          status: 'UNUSED',
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          usedAt: null,
          usedBy: {
            // Link token to resident upfront for deterministic claim lookup.
            residentId: residentDoc._id,
            ipAddress: null,
            userAgent: null,
          },
          householdInfo: {
            headOfHousehold: fullName,
            address,
            barangay: brgy.name,
            expectedMembers: members,
            notes: `Seeded claim token (${SEED_TAG})`,
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
        existingToken.usedAt = null;
        existingToken.usedBy = {
          residentId: residentDoc._id,
          ipAddress: null,
          userAgent: null,
        };
        existingToken.householdInfo = {
          headOfHousehold: fullName,
          address,
          barangay: brgy.name,
          expectedMembers: members,
          notes: `Seeded claim token (${SEED_TAG})`,
        };
        existingToken.seeded = true;
        existingToken.seedTag = SEED_TAG;
        existingToken.householdCode = householdCode;
        await existingToken.save();
        tokensUpdated += 1;
      }

      summaryRows.push({
        barangay: brgy.name,
        householdCode,
        token,
      });
    }
  }

  const residentCount = await Resident.countDocuments({ seedTag: SEED_TAG });
  const tokenCount = await HouseholdToken.countDocuments({ seedTag: SEED_TAG });

  console.log('\nSummary:');
  console.log(`- residents: ${residentsCreated} created, ${residentsUpdated} updated (total ${residentCount})`);
  console.log(`- tokens:    ${tokensCreated} created, ${tokensUpdated} updated (total ${tokenCount})`);

  console.log('\nTokens by barangay (paste into Record Claim):');
  for (const brgy of BRGYS) {
    const tokens = summaryRows
      .filter((r) => r.barangay === brgy.name)
      .map((r) => r.token);
    console.log(`\n[${brgy.name}]`);
    console.log(tokens.join(' '));
  }

  await mongoose.disconnect();
  console.log('\nDone.\n');
}

main().catch(async (err) => {
  console.error('seedClaimHouseholds10x10 failed:', err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});

