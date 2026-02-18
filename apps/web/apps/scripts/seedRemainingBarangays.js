/**
 * seedRemainingBarangays.js — DEV-ONLY
 *
 * Adds 2 households per missing barangay (Laois, Magsaysay, San Gonzalo,
 * Tobuan, Uyong) plus HouseholdTokens and Distributions.
 *
 * Run from apps/web/apps:
 *   node scripts/seedRemainingBarangays.js
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
/*  Inline schemas                                                     */
/* ------------------------------------------------------------------ */

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
/*  Data — 2 households per missing barangay                           */
/* ------------------------------------------------------------------ */

const BRGY_CODE_MAP = {
  Laois: 'LA',
  Magsaysay: 'MG',
  'San Gonzalo': 'SG',
  Tobuan: 'TB',
  Uyong: 'UY',
};

const HOUSEHOLDS = [
  // Laois ×2
  { firstName: 'Ricardo', lastName: 'Tanaka',     barangay: 'Laois',       address: '15 Burgos St, Laois',             members: 4, gender: 'Male',   confidence: 89, matchLevel: 'High Match' },
  { firstName: 'Cristina', lastName: 'Magno',     barangay: 'Laois',       address: '42 Lakandula Ave, Laois',         members: 6, gender: 'Female', confidence: 73, matchLevel: 'Medium Match' },
  // Magsaysay ×2
  { firstName: 'Ernesto', lastName: 'Cruz',       barangay: 'Magsaysay',   address: '8 Magsaysay Rd, Magsaysay',       members: 5, gender: 'Male',   confidence: 91, matchLevel: 'High Match' },
  { firstName: 'Gloria', lastName: 'Salazar',     barangay: 'Magsaysay',   address: '76 Sampaguita St, Magsaysay',     members: 3, gender: 'Female', confidence: 65, matchLevel: 'Medium Match' },
  // San Gonzalo ×2
  { firstName: 'Antonio', lastName: 'Pascual',    barangay: 'San Gonzalo', address: '29 San Gonzalo Blvd, San Gonzalo', members: 7, gender: 'Male',   confidence: 86, matchLevel: 'High Match' },
  { firstName: 'Belen', lastName: 'Flores',       barangay: 'San Gonzalo', address: '63 Jasmin St, San Gonzalo',        members: 4, gender: 'Female', confidence: 58, matchLevel: 'Low Match' },
  // Tobuan ×2
  { firstName: 'Fernando', lastName: 'Dizon',     barangay: 'Tobuan',      address: '51 Narra St, Tobuan',             members: 5, gender: 'Male',   confidence: 94, matchLevel: 'High Match' },
  { firstName: 'Maricel', lastName: 'Lim',        barangay: 'Tobuan',      address: '17 Acacia Rd, Tobuan',            members: 3, gender: 'Female', confidence: 70, matchLevel: 'Medium Match' },
  // Uyong ×2
  { firstName: 'Gabriel', lastName: 'Ocampo',     barangay: 'Uyong',       address: '34 Mahogany Ave, Uyong',          members: 6, gender: 'Male',   confidence: 87, matchLevel: 'High Match' },
  { firstName: 'Teresa', lastName: 'Villareal',   barangay: 'Uyong',       address: '90 Ipil-Ipil St, Uyong',          members: 4, gender: 'Female', confidence: 62, matchLevel: 'Low Match' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeIdNumber(index) {
  return `SEED-ID-${String(index + 11).padStart(4, '0')}`; // start at 0011 to avoid collision
}

function makePlainToken(brgyCode, index) {
  const rand = crypto.randomInt(1000, 9999);
  return `TEST-${brgyCode}-${String(index + 11).padStart(4, '0')}-${rand}`;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

const PLACEHOLDER_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIABQABNjN9GQAAAABJRwEBAAA=';

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  console.log('\n🌱  seedRemainingBarangays — Seed 5 missing barangays\n');
  console.log('='.repeat(70));

  await mongoose.connect(MONGODB_URI);
  console.log(`✅ Connected to MongoDB  (${MONGODB_URI})\n`);

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
  const summaryRows = [];

  const seededPassword = await bcrypt.hash('SeedTest123!', SALT_ROUNDS);

  for (let i = 0; i < HOUSEHOLDS.length; i++) {
    const h = HOUSEHOLDS[i];
    const brgyCode = BRGY_CODE_MAP[h.barangay];
    const fullName = `${h.firstName} ${h.lastName}`;
    const idNumber = makeIdNumber(i);
    const mobileNumber = `09${String(180000000 + i)}`;

    // ── Resident upsert ──
    const existing = await Resident.findOne({ idNumber, seeded: true });
    let residentDoc;

    if (existing) {
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
        dateOfBirth: '1988-06-20',
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
    const existingToken = await HouseholdToken.findOne({
      'householdInfo.headOfHousehold': fullName,
      seeded: true,
    });

    if (existingToken) {
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
      existingToken.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
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

    const resId = residentDoc._id.toString();
    const hhCode = `HH-${h.barangay.slice(0, 2).toUpperCase()}-${resId.slice(-4).toUpperCase()}`;

    summaryRows.push({
      hhCode,
      name: fullName,
      barangay: h.barangay,
      members: h.members,
      token: plainToken,
      match: h.matchLevel,
    });
  }

  // ── Distributions (1 per barangay, idempotent) ──
  const barangays = Object.keys(BRGY_CODE_MAP);
  for (const brgy of barangays) {
    const existing = await Distribution.findOne({ barangay: brgy });
    if (existing) {
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

  // ── Summary ──
  console.log('\n📋  SEEDED HOUSEHOLDS\n');
  console.log(
    '  ' +
      'Code'.padEnd(18) +
      'Name'.padEnd(25) +
      'Barangay'.padEnd(16) +
      'Members'.padEnd(10) +
      'Match'.padEnd(16) +
      'Token (paste into Record Claim)'
  );
  console.log('  ' + '-'.repeat(130));
  for (const r of summaryRows) {
    console.log(
      '  ' +
        r.hhCode.padEnd(18) +
        r.name.padEnd(25) +
        r.barangay.padEnd(16) +
        String(r.members).padEnd(10) +
        r.match.padEnd(16) +
        r.token
    );
  }

  console.log('\n📊  SUMMARY');
  console.log(`  Residents    : ${residentsCreated} created, ${residentsUpdated} updated`);
  console.log(`  Tokens       : ${tokensCreated} created, ${tokensUpdated} updated`);
  console.log(`  Distributions: ${distsCreated} created, ${distsSkipped} already existed`);

  console.log('\n✅  Seed complete! All 10 barangays now have households.\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
