/**
 * Seeds five pending resident registrations for registration-review demos.
 *
 * Run from apps/web/apps:
 *   npx ts-node --project tsconfig.server.json server/scripts/seedDemoResidentRegistrations.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import Resident, { IResident } from '../models/Resident';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';
const SEED_TAG = 'DEMO_RESIDENT_REGISTRATIONS_V1';
const DEMO_PASSWORD = 'DemoResident123!';
const PLACEHOLDER_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIABQABNjN9GQAAAABJRwEBAAA=';

type DemoRegistration = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  mobileNumber: string;
  email: string;
  idNumber: string;
  streetAddress: string;
  householdSize: number;
  confidence: number;
};

const DEMO_REGISTRATIONS: DemoRegistration[] = [
  {
    firstName: 'J Leovi',
    lastName: 'Garcia',
    dateOfBirth: '1994-02-14',
    gender: 'Male',
    mobileNumber: '09985550001',
    email: 'j.leovi.garcia.demo@example.com',
    idNumber: 'DEMO-REG-2026-001',
    streetAddress: 'Demo Purok 1, Bolo',
    householdSize: 4,
    confidence: 96,
  },
  {
    firstName: 'Emmanuel',
    lastName: 'De Vera',
    dateOfBirth: '1990-06-18',
    gender: 'Male',
    mobileNumber: '09985550002',
    email: 'emmanuel.devera.demo@example.com',
    idNumber: 'DEMO-REG-2026-002',
    streetAddress: 'Demo Purok 2, Bolo',
    householdSize: 5,
    confidence: 94,
  },
  {
    firstName: 'Angela',
    lastName: 'De Vera',
    dateOfBirth: '1993-09-27',
    gender: 'Female',
    mobileNumber: '09985550003',
    email: 'angela.devera.demo@example.com',
    idNumber: 'DEMO-REG-2026-003',
    streetAddress: 'Demo Purok 3, Bolo',
    householdSize: 3,
    confidence: 91,
  },
  {
    firstName: 'Mary Lorraine',
    lastName: 'Salinas',
    dateOfBirth: '1989-11-05',
    gender: 'Female',
    mobileNumber: '09985550004',
    email: 'mary.lorraine.salinas.demo@example.com',
    idNumber: 'DEMO-REG-2026-004',
    streetAddress: 'Demo Purok 4, Bolo',
    householdSize: 6,
    confidence: 93,
  },
  {
    firstName: 'Renz',
    lastName: 'Soriano',
    dateOfBirth: '1996-04-22',
    gender: 'Male',
    mobileNumber: '09985550006',
    email: 'renz.soriano.demo@example.com',
    idNumber: 'DEMO-REG-2026-005',
    streetAddress: 'Demo Purok 5, Bolo',
    householdSize: 4,
    confidence: 95,
  },
];

function registrationFields(entry: DemoRegistration) {
  const fullName = `${entry.firstName} ${entry.lastName}`;

  return {
    firstName: entry.firstName,
    lastName: entry.lastName,
    fullName,
    dateOfBirth: entry.dateOfBirth,
    gender: entry.gender,
    mobileNumber: entry.mobileNumber,
    email: entry.email,
    city: 'Bolinao',
    barangay: 'Bolo',
    streetAddress: entry.streetAddress,
    householdSize: entry.householdSize,
    vulnerableMembers: [],
    vulnerableCounts: {},
    idType: 'National ID',
    idNumber: entry.idNumber,
    frontIdImage: PLACEHOLDER_IMAGE,
    backIdImage: PLACEHOLDER_IMAGE,
    faceImage: PLACEHOLDER_IMAGE,
    verification: {
      overallConfidence: entry.confidence,
      idConfidence: entry.confidence - 2,
      faceMatchConfidence: entry.confidence - 1,
      livenessConfidence: entry.confidence,
      dataMatchScore: entry.confidence - 2,
      riskScore: 100 - entry.confidence,
      isVerified: true,
      aiVerificationStatus: 'High Match' as const,
      warnings: [],
      riskFactors: [],
      idCheckDecision: 'PASS' as const,
      idCheckRequiresManualReview: false,
      idCheckReasons: [],
      idCheckWarnings: [],
      reviewFlags: [],
      screeningConfidence: entry.confidence,
      detectedIdType: 'National ID',
      typeMatch: true,
      typeConfidence: entry.confidence,
      idNumberMatch: true,
      ocrConfidence: entry.confidence - 2,
      qualityScore: entry.confidence - 1,
    },
    status: 'Pending' as const,
    rejectionReason: undefined,
    verifiedBy: undefined,
    verifiedAt: undefined,
    qrStatus: 'ACTIVE' as const,
  };
}

async function upsertRegistration(entry: DemoRegistration): Promise<{
  resident: IResident;
  action: 'created' | 'updated';
}> {
  const existingRecord = await Resident.collection.findOne({ idNumber: entry.idNumber });

  if (existingRecord && existingRecord.seedTag !== SEED_TAG) {
    throw new Error(
      `ID ${entry.idNumber} already belongs to a record that was not created by this demo seed.`,
    );
  }

  const contactConflictFilter: Record<string, unknown> = {
    $or: [
      { mobileNumber: entry.mobileNumber },
      { emailLower: entry.email.toLowerCase() },
    ],
  };

  if (existingRecord) {
    contactConflictFilter._id = { $ne: existingRecord._id };
  }

  const conflictingAccount = await Resident.findOne(contactConflictFilter).lean();

  if (conflictingAccount) {
    throw new Error(`Synthetic contact details for ${entry.firstName} ${entry.lastName} are already in use.`);
  }

  let resident: IResident;
  let action: 'created' | 'updated';

  if (existingRecord) {
    const existingResident = await Resident.findById(existingRecord._id).select('+password');
    if (!existingResident) {
      throw new Error(`Could not reload demo resident ${entry.idNumber}.`);
    }

    existingResident.set(registrationFields(entry));
    resident = await existingResident.save();
    action = 'updated';
  } else {
    resident = await Resident.create({
      ...registrationFields(entry),
      password: DEMO_PASSWORD,
    });
    action = 'created';
  }

  await Resident.collection.updateOne(
    { _id: resident._id },
    {
      $set: {
        seeded: true,
        seedTag: SEED_TAG,
      },
    },
  );

  return { resident, action };
}

async function seedDemoResidentRegistrations(): Promise<void> {
  await mongoose.connect(MONGODB_URI);

  try {
    let created = 0;
    let updated = 0;

    console.log('Demo resident registrations:');

    for (const entry of DEMO_REGISTRATIONS) {
      const result = await upsertRegistration(entry);
      if (result.action === 'created') created += 1;
      else updated += 1;

      console.log(
        `- ${result.resident.fullName} | ${result.resident.residentCode} | ${result.resident.status} | ${result.action}`,
      );
    }

    const total = await Resident.collection.countDocuments({ seedTag: SEED_TAG });
    console.log(`Summary: ${created} created, ${updated} updated, ${total} demo registrations total.`);
  } finally {
    await mongoose.disconnect();
  }
}

seedDemoResidentRegistrations().catch((error) => {
  console.error('Failed to seed demo resident registrations:', error);
  process.exit(1);
});
