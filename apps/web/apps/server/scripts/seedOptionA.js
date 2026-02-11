/**
 * seedOptionA.js — DEV-ONLY seed script
 *
 * Inserts 10 dummy registered households (Resident docs) across 5 barangays,
 * plus 1 HouseholdToken per household (for claim-flow testing)
 * and 1 Distribution per barangay (5 total).
 *
 * Run from project root (apps/web/apps):
 *   node server/scripts/seedOptionA.js
 *
 * Idempotent: safe to run multiple times — uses upsert logic.
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';
const SALT_ROUNDS = 12;

/* ------------------------------------------------------------------ */
/*  Inline schemas (avoids TS compilation issues)                      */
/* ------------------------------------------------------------------ */

// Resident
const ResidentSchema = new mongoose.Schema({
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
    aiVerificationStatus: { type: String, enum: ['High Match', 'Medium Match', 'Low Match'] },
    warnings: [String],
    riskFactors: [String],
  },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  seeded: { type: Boolean, default: false },
}, { timestamps: true, strict: false });

// HouseholdToken (minimal for seed)
const HouseholdTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  tokenPrefix: String,
  status: { type: String, enum: ['UNUSED', 'LOCKED', 'USED', 'EXPIRED'], default: 'UNUSED' },
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
}, { timestamps: true, strict: false });

// Distribution
const DistributionSchema = new mongoose.Schema({
  barangay: String,
  scheduled: String,
  households: { type: Number, default: 2 },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['Unclaimed', 'Claimed'], default: 'Unclaimed' },
  claimedAt: { type: Date, default: null },
  seeded: { type: Boolean, default: false },
}, { timestamps: true, strict: false });

/* ------------------------------------------------------------------ */
/*  Data definition                                                    */
/* ------------------------------------------------------------------ */

const BRGY_CODE_MAP = {
  Bolo: 'BL',
  'San Jose': 'SJ',
  Poblacion: 'PB',
  Bongalon: 'BN',
  Dulig: 'DL',
};

const HOUSEHOLDS = [
  // Bolo ×2
  { firstName: 'Juan', lastName: 'Dela Cruz', barangay: 'Bolo', address: '123 Rizal St, Bolo', members: 5, gender: 'Male', confidence: 92, matchLevel: 'High Match' },
  { firstName: 'Maria', lastName: 'Santos', barangay: 'Bolo', address: '45 Mabini Ave, Bolo', members: 4, gender: 'Female', confidence: 78, matchLevel: 'Medium Match' },
  // San Jose ×2
  { firstName: 'Pedro', lastName: 'Reyes', barangay: 'San Jose', address: '78 Bonifacio St, San Jose', members: 6, gender: 'Male', confidence: 85, matchLevel: 'High Match' },
  { firstName: 'Ana', lastName: 'Garcia', barangay: 'San Jose', address: '12 Aguinaldo Rd, San Jose', members: 3, gender: 'Female', confidence: 60, matchLevel: 'Low Match' },
  // Poblacion ×2
  { firstName: 'Jose', lastName: 'Mendoza', barangay: 'Poblacion', address: '99 Luna St, Poblacion', members: 7, gender: 'Male', confidence: 88, matchLevel: 'High Match' },
  { firstName: 'Rosa', lastName: 'Bautista', barangay: 'Poblacion', address: '55 Quezon Blvd, Poblacion', members: 4, gender: 'Female', confidence: 72, matchLevel: 'Medium Match' },
  // Bongalon ×2
  { firstName: 'Carlos', lastName: 'Villanueva', barangay: 'Bongalon', address: '33 Magsaysay St, Bongalon', members: 8, gender: 'Male', confidence: 95, matchLevel: 'High Match' },
  { firstName: 'Elena', lastName: 'Ramos', barangay: 'Bongalon', address: '67 Osmena Ave, Bongalon', members: 5, gender: 'Female', confidence: 55, matchLevel: 'Low Match' },
  // Dulig ×2
  { firstName: 'Roberto', lastName: 'Aquino', barangay: 'Dulig', address: '21 Marcos St, Dulig', members: 6, gender: 'Male', confidence: 82, matchLevel: 'Medium Match' },
  { firstName: 'Lorna', lastName: 'Fernandez', barangay: 'Dulig', address: '88 Roxas Blvd, Dulig', members: 3, gender: 'Female', confidence: 90, matchLevel: 'High Match' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeIdNumber(index) {
  return `SEED-ID-${String(index + 1).padStart(4, '0')}`;
}

/** Generates a simple, easy-to-paste plain-text token. */
function makePlainToken(brgyCode, index) {
  const rand = crypto.randomInt(1000, 9999);
  return `TEST-${brgyCode}-${String(index + 1).padStart(4, '0')}-${rand}`;
}

function todayISO() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

// 1×1 transparent PNG placeholder (tiny, valid base64 image)
const PLACEHOLDER_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIABQABNjN9GQAAAABJRwEBAAA=';

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  console.log('\n🌱  seedOptionA — DEV household seed\n');
  console.log('='.repeat(70));

  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to MongoDB  (${MONGODB_URI})\n`);

  // Grab (or define) models — use existing if already registered
  const Resident =
    mongoose.models.Resident || mongoose.model('Resident', ResidentSchema);
  const HouseholdToken =
    mongoose.models.HouseholdToken || mongoose.model('HouseholdToken', HouseholdTokenSchema);
  const Distribution =
    mongoose.models.Distribution || mongoose.model('Distribution', DistributionSchema);

  let residentsCreated = 0;
  let residentsUpdated = 0;
  let tokensCreated = 0;
  let tokensUpdated = 0;
  let distsCreated = 0;
  let distsSkipped = 0;

  /** Collect summary rows for final table */
  const summaryRows = [];

  // ── 1) Seed residents + tokens ──
  const seededPassword = await bcrypt.hash('SeedTest123!', SALT_ROUNDS);

  for (let i = 0; i < HOUSEHOLDS.length; i++) {
    const h = HOUSEHOLDS[i];
    const brgyCode = BRGY_CODE_MAP[h.barangay];
    const hhCode = `HH-${brgyCode}-${String(i + 1).padStart(4, '0')}`;
    const fullName = `${h.firstName} ${h.lastName}`;
    const idNumber = makeIdNumber(i);
    const mobileNumber = `09${String(170000000 + i)}`;

    // ── Resident upsert ──
    const existing = await Resident.findOne({ idNumber, seeded: true });

    let residentDoc;
    if (existing) {
      // Update in case fields changed
      existing.fullName = fullName;
      existing.firstName = h.firstName;
      existing.lastName = h.lastName;
      existing.barangay = h.barangay;
      existing.streetAddress = h.address;
      existing.householdSize = h.members;
      existing.gender = h.gender;
      existing.mobileNumber = mobileNumber;
      existing.status = 'Approved';
      existing.verification = {
        overallConfidence: h.confidence,
        idConfidence: h.confidence - 5,
        faceMatchConfidence: h.confidence - 2,
        livenessConfidence: h.confidence,
        dataMatchScore: h.confidence - 3,
        riskScore: 100 - h.confidence,
        isVerified: true,
        aiVerificationStatus: h.matchLevel,
        warnings: [],
        riskFactors: [],
      };
      await existing.save();
      residentDoc = existing;
      residentsUpdated++;
    } else {
      residentDoc = await Resident.create({
        firstName: h.firstName,
        lastName: h.lastName,
        fullName,
        dateOfBirth: '1990-01-15',
        gender: h.gender,
        mobileNumber,
        password: seededPassword,
        city: 'Rosario',
        barangay: h.barangay,
        streetAddress: h.address,
        householdSize: h.members,
        vulnerableMembers: [],
        vulnerableCounts: {},
        idType: 'PhilID',
        idNumber,
        frontIdImage: PLACEHOLDER_IMG,
        backIdImage: PLACEHOLDER_IMG,
        faceImage: PLACEHOLDER_IMG,
        verification: {
          overallConfidence: h.confidence,
          idConfidence: h.confidence - 5,
          faceMatchConfidence: h.confidence - 2,
          livenessConfidence: h.confidence,
          dataMatchScore: h.confidence - 3,
          riskScore: 100 - h.confidence,
          isVerified: true,
          aiVerificationStatus: h.matchLevel,
          warnings: [],
          riskFactors: [],
        },
        status: 'Approved',
        seeded: true,
      });
      residentsCreated++;
    }

    // ── Token upsert ──
    const plainToken = makePlainToken(brgyCode, i);
    const residentId = residentDoc._id.toString();

    // Check if there's already a seeded token for this resident
    const existingToken = await HouseholdToken.findOne({
      'householdInfo.headOfHousehold': fullName,
      seeded: true,
    });

    if (existingToken) {
      // Update the token hash so the printed plain token is accurate
      existingToken.tokenHash = await bcrypt.hash(plainToken, SALT_ROUNDS);
      existingToken.tokenPrefix = plainToken.replace(/-/g, '').slice(0, 4);
      existingToken.status = 'UNUSED';
      existingToken.householdInfo = {
        headOfHousehold: fullName,
        address: h.address,
        barangay: h.barangay,
        expectedMembers: h.members,
        notes: 'Seeded test token',
      };
      existingToken.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
      await existingToken.save();
      tokensUpdated++;
    } else {
      const tokenHash = await bcrypt.hash(plainToken, SALT_ROUNDS);
      await HouseholdToken.create({
        tokenHash,
        tokenPrefix: plainToken.replace(/-/g, '').slice(0, 4),
        status: 'UNUSED',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        householdInfo: {
          headOfHousehold: fullName,
          address: h.address,
          barangay: h.barangay,
          expectedMembers: h.members,
          notes: 'Seeded test token',
        },
        issuedBy: 'seed-script',
        issuedAt: new Date(),
        seeded: true,
      });
      tokensCreated++;
    }

    summaryRows.push({
      hhCode,
      name: fullName,
      barangay: h.barangay,
      members: h.members,
      token: plainToken,
      match: h.matchLevel,
    });
  }

  // ── 2) Seed distributions (1 per barangay, idempotent) ──
  const barangays = Object.keys(BRGY_CODE_MAP);
  for (const brgy of barangays) {
    const existing = await Distribution.findOne({ barangay: brgy, seeded: true });
    if (existing) {
      // Update household count to match seeded residents
      const residentCount = HOUSEHOLDS.filter((h) => h.barangay === brgy).length;
      existing.households = residentCount;
      existing.scheduled = todayISO();
      await existing.save();
      distsSkipped++;
    } else {
      const residentCount = HOUSEHOLDS.filter((h) => h.barangay === brgy).length;
      await Distribution.create({
        barangay: brgy,
        scheduled: todayISO(),
        households: residentCount,
        notes: 'Seeded test distribution',
        status: 'Unclaimed',
        seeded: true,
      });
      distsCreated++;
    }
  }

  // ── 3) Summary ──
  console.log('\n📋  SEEDED HOUSEHOLDS\n');
  console.log(
    '  ' +
      'Code'.padEnd(18) +
      'Name'.padEnd(25) +
      'Barangay'.padEnd(14) +
      'Members'.padEnd(10) +
      'Match'.padEnd(16) +
      'Token (paste into Record Claim)'
  );
  console.log('  ' + '-'.repeat(120));
  for (const r of summaryRows) {
    console.log(
      '  ' +
        r.hhCode.padEnd(18) +
        r.name.padEnd(25) +
        r.barangay.padEnd(14) +
        String(r.members).padEnd(10) +
        r.match.padEnd(16) +
        r.token
    );
  }

  console.log('\n📊  SUMMARY');
  console.log(`  Residents  : ${residentsCreated} created, ${residentsUpdated} updated`);
  console.log(`  Tokens     : ${tokensCreated} created, ${tokensUpdated} updated`);
  console.log(`  Distributions: ${distsCreated} created, ${distsSkipped} already existed (updated)`);

  console.log('\n✅  Seed complete. Open /households to see the data.\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
