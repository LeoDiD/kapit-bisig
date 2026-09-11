const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';
const SALT_ROUNDS = 12;

const ResidentSchema = new mongoose.Schema(
  {
    residentCode: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String, default: null },
    qrVersion: { type: Number, default: 1 },
    qrIssuedAt: { type: Date, default: null },
    qrStatus: { type: String, enum: ['ACTIVE', 'REVOKED'], default: 'ACTIVE' },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    mobileNumber: { type: String, required: true, unique: true },
    email: { type: String },
    emailLower: { type: String },
    password: { type: String, required: true },
    city: { type: String, required: true },
    barangay: { type: String, required: true },
    streetAddress: { type: String, required: true },
    householdSize: { type: Number, required: true, default: 1 },
    vulnerableMembers: { type: [String], default: [] },
    vulnerableCounts: { type: Map, of: Number, default: {} },
    idType: { type: String, required: true },
    idNumber: { type: String, required: true },
    frontIdImage: { type: String, required: true },
    backIdImage: { type: String, required: true },
    faceImage: { type: String, required: true },
    verification: { type: SchemaTypeVerification(), default: {} },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Needs Revision', 'Rejected'],
      default: 'Approved',
    },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
  },
  { timestamps: true, strict: false }
);

function SchemaTypeVerification() {
  return new mongoose.Schema(
    {
      overallConfidence: { type: Number, default: 98 },
      idConfidence: { type: Number, default: 97 },
      faceMatchConfidence: { type: Number, default: 98 },
      livenessConfidence: { type: Number, default: 99 },
      dataMatchScore: { type: Number, default: 98 },
      riskScore: { type: Number, default: 2 },
      isVerified: { type: Boolean, default: true },
      aiVerificationStatus: { type: String, default: 'High Match' },
      warnings: { type: [String], default: [] },
      riskFactors: { type: [String], default: [] },
      idCheckDecision: { type: String, default: 'PASS' },
      idCheckRequiresManualReview: { type: Boolean, default: false },
      screeningConfidence: { type: Number, default: 98 },
      detectedIdType: { type: String, default: 'National ID' },
      typeMatch: { type: Boolean, default: true },
      typeConfidence: { type: Number, default: 98 },
      idNumberMatch: { type: Boolean, default: true },
      ocrConfidence: { type: Number, default: 97 },
      qualityScore: { type: Number, default: 98 },
    },
    { _id: false }
  );
}

const CounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { strict: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Staff', 'Volunteer'], default: 'Staff' },
    status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
    barangay: { type: String },
    phoneNumber: { type: String },
  },
  { timestamps: true, strict: false }
);

const StaffUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    emailLower: { type: String, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, default: 'LGU_STAFF' },
    assignedBarangays: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: true },
    forcePasswordReset: { type: Boolean, default: false },
  },
  { timestamps: true, strict: false }
);

const Resident = mongoose.models.Resident || mongoose.model('Resident', ResidentSchema);
const ResidentCounter = mongoose.models.ResidentCounter || mongoose.model('ResidentCounter', CounterSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const StaffUser = mongoose.models.StaffUser || mongoose.model('StaffUser', StaffUserSchema);

async function main() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);

  const PLACEHOLDER_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIABQABNjN9GQAAAABJRwEBAAA=';

  // 1. Resident
  const residentPassHash = await bcrypt.hash('Resident123!', SALT_ROUNDS);
  const residentMobile = '09171234567';

  let resident = await Resident.findOne({ mobileNumber: residentMobile });

  if (!resident) {
    const year = new Date().getFullYear();
    const counter = await ResidentCounter.findOneAndUpdate(
      { key: `resident:${year}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const code = `PO-${year}-${String(counter.seq).padStart(6, '0')}`;

    resident = await Resident.create({
      residentCode: code,
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      fullName: 'Juan Dela Cruz',
      dateOfBirth: '1990-01-15',
      gender: 'Male',
      mobileNumber: residentMobile,
      email: 'resident.test@kapitbisig.gov.ph',
      emailLower: 'resident.test@kapitbisig.gov.ph',
      password: residentPassHash,
      city: 'Labrador',
      barangay: 'Poblacion',
      streetAddress: '123 Rizal Street, Barangay Poblacion',
      householdSize: 4,
      vulnerableMembers: ['Senior Citizen', 'PWD'],
      vulnerableCounts: { 'Senior Citizen': 1, PWD: 1 },
      idType: 'National ID',
      idNumber: 'PH-ID-1234-5678-9012',
      frontIdImage: PLACEHOLDER_IMG,
      backIdImage: PLACEHOLDER_IMG,
      faceImage: PLACEHOLDER_IMG,
      verification: {
        overallConfidence: 98,
        idConfidence: 97,
        faceMatchConfidence: 98,
        livenessConfidence: 99,
        dataMatchScore: 98,
        riskScore: 2,
        isVerified: true,
        aiVerificationStatus: 'High Match',
        warnings: [],
        riskFactors: [],
        idCheckDecision: 'PASS',
        idCheckRequiresManualReview: false,
        screeningConfidence: 98,
        detectedIdType: 'National ID',
        typeMatch: true,
        typeConfidence: 98,
        idNumberMatch: true,
        ocrConfidence: 97,
        qualityScore: 98,
      },
      status: 'Approved',
      qrStatus: 'ACTIVE',
      qrVersion: 1,
      qrIssuedAt: new Date(),
      verifiedBy: 'System AI Automated Verifier',
      verifiedAt: new Date(),
    });
    console.log(`Created Resident: ${resident.fullName} (${resident.residentCode})`);
  } else {
    resident.firstName = 'Juan';
    resident.lastName = 'Dela Cruz';
    resident.fullName = 'Juan Dela Cruz';
    resident.city = 'Labrador';
    resident.barangay = 'Poblacion';
    resident.streetAddress = '123 Rizal Street, Barangay Poblacion';
    resident.password = residentPassHash;
    resident.status = 'Approved';
    resident.qrStatus = 'ACTIVE';
    resident.qrVersion = 1;
    resident.qrIssuedAt = new Date();
    resident.verifiedBy = 'System AI Automated Verifier';
    resident.verifiedAt = new Date();
    if (!resident.residentCode) {
      const year = new Date().getFullYear();
      const counter = await ResidentCounter.findOneAndUpdate(
        { key: `resident:${year}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      resident.residentCode = `PO-${year}-${String(counter.seq).padStart(6, '0')}`;
    }
    await resident.save();
    console.log(`Updated Resident: ${resident.fullName} (${resident.residentCode})`);
  }

  console.log('\n--- SUCCESS ---');
  console.log('Resident:');
  console.log('  Mobile:', resident.mobileNumber);
  console.log('  Password: Resident123!');
  console.log('  Resident Code:', resident.residentCode);
  console.log('  Status:', resident.status);
  console.log('  City:', resident.city);
  console.log('  Barangay:', resident.barangay);

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
