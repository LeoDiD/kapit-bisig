import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import Resident, { IResident } from '../models/Resident';
import DisasterEvent, { IDisasterEvent } from '../models/DisasterEvent';
import ProofSubmission from '../models/ProofSubmission';
import { submitResidentProof } from '../services/beneficiaryService';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';
const DEMO_BARANGAY = 'Bolo';
const DEMO_EVENT_BARANGAYS = ['Bolo', 'Bongalon', 'Dulig', 'San Jose'];
const DEMO_EVENT_NAME = 'Target Beneficiary UI Demo Event';
const DEMO_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnPZXcAAAAASUVORK5CYII=';
const DEMO_IMAGE_SET = [DEMO_IMAGE, DEMO_IMAGE, DEMO_IMAGE];

function buildDemoMobile(seed: number): string {
  return `09${String(seed).slice(-9)}`;
}

async function ensureDemoEvent(): Promise<IDisasterEvent> {
  const existing = await DisasterEvent.findOne({ name: DEMO_EVENT_NAME });
  if (existing) {
    existing.barangays = [...DEMO_EVENT_BARANGAYS];
    if (existing.status !== 'Active') {
      existing.status = 'Active';
      existing.submissionDeadline = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
    }
    await existing.save();
    return existing;
  }

  const event = new DisasterEvent({
    name: DEMO_EVENT_NAME,
    disasterType: 'Typhoon',
    description: 'Demo event seeded for Target Beneficiaries UI review.',
    barangays: [...DEMO_EVENT_BARANGAYS],
    eventDate: new Date(),
    submissionDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    status: 'Active',
    createdBy: 'demo-seeder',
    updatedBy: 'demo-seeder',
  });

  await event.save();
  return event;
}

async function createDemoResident(seed: number): Promise<IResident> {
  const suffix = String(seed).slice(-6);
  const resident = new Resident({
    firstName: 'Demo',
    lastName: `Resident ${suffix}`,
    fullName: `Demo Resident ${suffix}`,
    dateOfBirth: '1995-04-18',
    gender: 'Male',
    mobileNumber: buildDemoMobile(seed),
    email: `targetbeneficiary.demo.${suffix}@example.com`,
    password: 'DemoPass123!',
    city: 'Bolinao',
    barangay: DEMO_BARANGAY,
    streetAddress: `Purok ${suffix}, ${DEMO_BARANGAY}`,
    householdSize: 4,
    vulnerableMembers: ['Senior Citizen'],
    vulnerableCounts: { 'Senior Citizen': 1 },
    idType: 'National ID',
    idNumber: `TB-DEMO-${suffix}`,
    frontIdImage: DEMO_IMAGE,
    backIdImage: DEMO_IMAGE,
    faceImage: DEMO_IMAGE,
    verification: {
      overallConfidence: 98,
      idConfidence: 97,
      faceMatchConfidence: 98,
      livenessConfidence: 99,
      dataMatchScore: 97,
      riskScore: 3,
      isVerified: true,
      aiVerificationStatus: 'High Match',
      warnings: [],
      riskFactors: [],
    },
    status: 'Approved',
    verifiedBy: 'demo-seeder',
    verifiedAt: new Date(),
    qrStatus: 'ACTIVE',
    qrIssuedAt: new Date(),
  });

  await resident.save();
  return resident;
}

async function seedDemo(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to MongoDB (${MONGODB_URI})`);

  try {
    const event = await ensureDemoEvent();
    const seed = Date.now();
    const resident = await createDemoResident(seed);

    const existing = await ProofSubmission.findOne({
      residentId: resident._id,
      disasterEventId: event._id,
    });

    if (!existing) {
      await submitResidentProof({
        residentId: resident._id.toString(),
        disasterEventId: event._id.toString(),
        damageType: 'Flood',
        description: 'Flood water entered the house up to knee level and damaged appliances.',
        supportingInfo: 'Demo request created to preview the Target Beneficiaries review UI.',
        dateSubmitted: new Date(),
        photoProofs: DEMO_IMAGE_SET,
        syncSource: 'ONLINE',
        clientGeneratedId: `target-beneficiary-ui-demo-${seed}`,
        deviceId: 'demo-web-seeder',
      });
    }

    const submission = await ProofSubmission.findOne({
      residentId: resident._id,
      disasterEventId: event._id,
    }).lean();

    console.log('');
    console.log('Demo target beneficiary request created.');
    console.log(`Resident: ${resident.fullName}`);
    console.log(`Resident Code: ${resident.residentCode}`);
    console.log(`Barangay: ${resident.barangay}`);
    console.log(`Event: ${event.name}`);
    console.log(`Submission Status: ${submission?.status || 'Pending Verification'}`);
    console.log('');
  } finally {
    await mongoose.disconnect();
  }
}

seedDemo().catch((error) => {
  console.error('Failed to seed target beneficiary demo:', error);
  process.exit(1);
});
