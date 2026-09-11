/**
 * seedTestMobileAccounts.ts
 *
 * Seeds two verified accounts for Mobile testing:
 * 1. Verified Resident account (sign in with Mobile Number + Password)
 * 2. Verified Staff / Volunteer account (sign in with Email + Password)
 *
 * Run:
 *   npx ts-node --project tsconfig.server.json server/scripts/seedTestMobileAccounts.ts
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Resident from '../models/Resident';
import User from '../models/User';
import StaffUser from '../models/StaffUser';
import { getNextResidentSequence } from '../models/ResidentCounter';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';
const SALT_ROUNDS = 12;

const TEST_RESIDENT = {
  firstName: 'Juan',
  lastName: 'Dela Cruz',
  fullName: 'Juan Dela Cruz',
  dateOfBirth: '1990-01-15',
  gender: 'Male' as const,
  mobileNumber: '09171234567',
  email: 'resident.test@kapitbisig.gov.ph',
  emailLower: 'resident.test@kapitbisig.gov.ph',
  password: 'Resident123!',
  city: 'Labrador',
  barangay: 'Poblacion',
  streetAddress: '123 Rizal Street, Barangay Poblacion',
  householdSize: 4,
  vulnerableMembers: ['Senior Citizen', 'PWD'],
  vulnerableCounts: { 'Senior Citizen': 1, PWD: 1 },
  idType: 'National ID',
  idNumber: 'PH-ID-1234-5678-9012',
  frontIdImage:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIABQABNjN9GQAAAABJRwEBAAA=',
  backIdImage:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIABQABNjN9GQAAAABJRwEBAAA=',
  faceImage:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIABQABNjN9GQAAAABJRwEBAAA=',
  verification: {
    overallConfidence: 98,
    idConfidence: 97,
    faceMatchConfidence: 98,
    livenessConfidence: 99,
    dataMatchScore: 98,
    riskScore: 2,
    isVerified: true,
    aiVerificationStatus: 'High Match' as const,
    warnings: [],
    riskFactors: [],
    idCheckDecision: 'PASS' as const,
    idCheckRequiresManualReview: false,
    idCheckReasons: [],
    idCheckWarnings: [],
    reviewFlags: [],
    screeningConfidence: 98,
    detectedIdType: 'National ID',
    typeMatch: true,
    typeConfidence: 98,
    idNumberMatch: true,
    ocrConfidence: 97,
    qualityScore: 98,
  },
  status: 'Approved' as const,
  qrStatus: 'ACTIVE' as const,
  qrVersion: 1,
  qrIssuedAt: new Date(),
  verifiedBy: 'System AI Automated Verifier',
  verifiedAt: new Date(),
};

const TEST_STAFF = {
  firstName: 'Maria',
  lastName: 'Santos',
  email: 'staff.test@kapitbisig.gov.ph',
  emailLower: 'staff.test@kapitbisig.gov.ph',
  password: 'Staff123!',
  role: 'Staff' as const,
  status: 'Active' as const,
  barangay: 'Poblacion',
  assignedBarangays: [
    'Poblacion',
    'San Jose',
    'Bolo',
    'Dulig',
    'Laois',
    'Magsaysay',
    'Bongalon',
    'San Gonzalo',
    'Tobuan',
    'Uyong',
  ],
  phoneNumber: '09181234567',
};

async function seed() {
  console.log('Connecting to MongoDB at:', MONGODB_URI.substring(0, 30) + '...');
  await mongoose.connect(MONGODB_URI);

  // 1. Seed / Upsert Verified Resident
  console.log('\n--- Seeding Verified Resident Account ---');
  let resident = await Resident.findOne({ mobileNumber: TEST_RESIDENT.mobileNumber }).select('+password');

  const hashedResidentPassword = await bcrypt.hash(TEST_RESIDENT.password, SALT_ROUNDS);

  if (resident) {
    console.log(`Found existing resident (${resident.mobileNumber}). Updating to Approved status...`);
    resident.firstName = TEST_RESIDENT.firstName;
    resident.lastName = TEST_RESIDENT.lastName;
    resident.fullName = TEST_RESIDENT.fullName;
    resident.dateOfBirth = TEST_RESIDENT.dateOfBirth;
    resident.gender = TEST_RESIDENT.gender;
    resident.email = TEST_RESIDENT.email;
    resident.emailLower = TEST_RESIDENT.emailLower;
    resident.city = TEST_RESIDENT.city;
    resident.barangay = TEST_RESIDENT.barangay;
    resident.streetAddress = TEST_RESIDENT.streetAddress;
    resident.householdSize = TEST_RESIDENT.householdSize;
    resident.vulnerableMembers = TEST_RESIDENT.vulnerableMembers;
    resident.vulnerableCounts = TEST_RESIDENT.vulnerableCounts;
    resident.idType = TEST_RESIDENT.idType;
    resident.idNumber = TEST_RESIDENT.idNumber;
    resident.verification = TEST_RESIDENT.verification;
    resident.status = 'Approved';
    resident.qrStatus = 'ACTIVE';
    resident.qrVersion = 1;
    resident.qrIssuedAt = new Date();
    resident.verifiedBy = TEST_RESIDENT.verifiedBy;
    resident.verifiedAt = new Date();
    resident.password = hashedResidentPassword;
    if (!resident.residentCode) {
      const year = new Date().getFullYear();
      const sequence = await getNextResidentSequence(`resident:${year}`);
      resident.residentCode = `PO-${year}-${String(sequence).padStart(6, '0')}`;
    }
    await resident.save();
    console.log(`Updated resident: ${resident.fullName} (${resident.residentCode})`);
  } else {
    console.log('Creating new verified resident...');
    const year = new Date().getFullYear();
    const sequence = await getNextResidentSequence(`resident:${year}`);
    const residentCode = `PO-${year}-${String(sequence).padStart(6, '0')}`;

    resident = await Resident.create({
      ...TEST_RESIDENT,
      residentCode,
      password: hashedResidentPassword,
    });
    console.log(`Created resident: ${resident.fullName} (${resident.residentCode})`);
  }

  console.log('\n======================================================');
  console.log('           TEST ACCOUNT SEEDED SUCCESSFULLY           ');
  console.log('======================================================');
  console.log('\n📱 RESIDENT LOGIN CREDENTIALS (Mobile App):');
  console.log(`   - Mobile Number : ${TEST_RESIDENT.mobileNumber}`);
  console.log(`   - Password      : ${TEST_RESIDENT.password}`);
  console.log(`   - Full Name     : ${resident.fullName}`);
  console.log(`   - Resident Code : ${resident.residentCode}`);
  console.log(`   - Status        : ${resident.status}`);
  console.log(`   - Barangay      : ${resident.barangay}`);
  console.log('======================================================\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});

