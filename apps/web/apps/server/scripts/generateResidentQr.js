/**
 * Generate Resident QR Payload (No Signature)
 *
 * Usage:
 *   node server/scripts/generateResidentQr.js
 *   node server/scripts/generateResidentQr.js --mobile 09123456789
 *   node server/scripts/generateResidentQr.js --code SJ-2026-000001
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';

const ResidentSchema = new mongoose.Schema(
  {
    residentCode: { type: String, default: null },
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    barangay: { type: String, required: true },
    city: { type: String, default: '' },
    streetAddress: { type: String, required: true },
    status: { type: String, required: true },
  },
  {
    strict: false,
    timestamps: true,
  }
);

const CounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { strict: false }
);

const Resident = mongoose.models.Resident || mongoose.model('Resident', ResidentSchema);
const ResidentCounter = mongoose.models.ResidentCounter || mongoose.model('ResidentCounter', CounterSchema);

function normalizeMobile(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('63') && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.startsWith('09') && digits.length === 11) return digits;
  return digits;
}

function getBarangayCode(barangay) {
  const cleaned = String(barangay || '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .trim();

  if (!cleaned) return 'KB';

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`;
  if (words[0].length >= 2) return words[0].slice(0, 2);
  return `${words[0][0] || 'K'}B`;
}

async function ensureResidentCode(resident) {
  if (resident.residentCode) {
    return resident.residentCode;
  }

  const year = new Date().getFullYear();
  const counter = await ResidentCounter.findOneAndUpdate(
    { key: `resident:${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const code = `${getBarangayCode(resident.barangay)}-${year}-${String(counter.seq).padStart(6, '0')}`;
  resident.residentCode = code;
  await resident.save();
  return code;
}

function buildQrPayload(residentCode) {
  const payload = {
    v: 1,
    t: 'resident',
    rid: residentCode,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `KBQR1.${encoded}`;
}

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function main() {
  await mongoose.connect(MONGODB_URI);

  const codeArg = getArg('--code');
  const mobileArg = normalizeMobile(getArg('--mobile'));

  const query = {};
  if (codeArg) query.residentCode = codeArg.toUpperCase();
  if (mobileArg) query.mobileNumber = mobileArg;

  const resident = await Resident.findOne(
    Object.keys(query).length > 0 ? query : { status: 'Approved' }
  ).sort({ createdAt: -1 });

  if (!resident) {
    console.log('No resident found for the provided filters.');
    return;
  }

  const residentCode = await ensureResidentCode(resident);
  const qrData = buildQrPayload(residentCode);

  console.log('\nResident QR Generated\n');
  console.log(`Resident Name : ${resident.fullName}`);
  console.log(`Resident Code : ${residentCode}`);
  console.log(`Mobile Number : ${resident.mobileNumber}`);
  console.log(`Barangay      : ${resident.barangay}`);
  console.log(`Status        : ${resident.status}`);
  console.log('\nQR Payload:\n');
  console.log(qrData);
  console.log('\nUse this value in scanner endpoint POST /api/household/qr/resolve');
}

main()
  .catch((error) => {
    console.error('Failed to generate resident QR:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
