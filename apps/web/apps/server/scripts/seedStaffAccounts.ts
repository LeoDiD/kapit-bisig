/**
 * seedStaffAccounts.ts
 *
 * Seeds 30 staff accounts (3 staff members per barangay for all 10 Lingayen barangays).
 *
 * Usage:
 *   npx ts-node --project tsconfig.server.json server/scripts/seedStaffAccounts.ts
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import StaffUser from '../models/StaffUser';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';
const DEFAULT_PASSWORD = 'Password123!';
const SALT_ROUNDS = 12;

const BARANGAYS = [
  'Bolo',
  'Bongalon',
  'Dulig',
  'Laois',
  'Magsaysay',
  'Poblacion',
  'San Gonzalo',
  'San Jose',
  'Tobuan',
  'Uyong',
];

const FIRST_NAMES = [
  // Bolo
  ['Juan', 'Maria', 'Arnel'],
  // Bongalon
  ['Christian', 'Elena', 'Ricardo'],
  // Dulig
  ['Gabriel', 'Jasmine', 'Mark'],
  // Laois
  ['Paolo', 'Camille', 'Dennis'],
  // Magsaysay
  ['Rafael', 'Angelica', 'Ramon'],
  // Poblacion
  ['Alexander', 'Bea', 'Carlos'],
  // San Gonzalo
  ['Danilo', 'Grace', 'Jerome'],
  // San Jose
  ['Kenneth', 'Lorna', 'Manuel'],
  // Tobuan
  ['Nestor', 'Patricia', 'Rowel'],
  // Uyong
  ['Victor', 'Stephanie', 'Zaldy'],
];

const LAST_NAMES = [
  // Bolo
  ['Santos', 'Reyes', 'Cruz'],
  // Bongalon
  ['Mendoza', 'Aquino', 'Fernandez'],
  // Dulig
  ['Del Rosario', 'Bautista', 'Soriano'],
  // Laois
  ['Manalo', 'Tolentino', 'Villanueva'],
  // Magsaysay
  ['Castillo', 'Ocampo', 'Navarro'],
  // Poblacion
  ['Rivera', 'Valdez', 'Morales'],
  // San Gonzalo
  ['Corpuz', 'Padilla', 'Estrada'],
  // San Jose
  ['Salazar', 'Domingo', 'Guerrero'],
  // Tobuan
  ['Pascual', 'Flores', 'Bernardo'],
  // Uyong
  ['Mercado', 'Ramos', 'De Guzman'],
];

async function main() {
  console.log('\n================ SEEDING 30 STAFF ACCOUNTS ================');
  console.log(`Connecting to database at ${MONGODB_URI}...\n`);

  await mongoose.connect(MONGODB_URI);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  let createdCount = 0;
  let updatedCount = 0;
  const staffList: Array<{ name: string; email: string; barangay: string }> = [];

  for (let bIndex = 0; bIndex < BARANGAYS.length; bIndex++) {
    const barangay = BARANGAYS[bIndex];
    const bSlug = barangay.toLowerCase().replace(/\s+/g, '');

    for (let slot = 1; slot <= 3; slot++) {
      const firstName = FIRST_NAMES[bIndex][slot - 1] || `Staff${slot}`;
      const lastName = LAST_NAMES[bIndex][slot - 1] || barangay;
      const email = `staff.${bSlug}${slot}@kapitbisig.gov.ph`;
      const emailLower = email.toLowerCase();

      const existing = await StaffUser.findOne({ emailLower });

      if (existing) {
        existing.firstName = firstName;
        existing.lastName = lastName;
        existing.role = 'LGU_STAFF';
        existing.assignedBarangays = [barangay];
        existing.isActive = true;
        existing.emailVerified = true;
        existing.passwordHash = passwordHash;
        existing.forcePasswordReset = false;
        await existing.save();
        updatedCount++;
      } else {
        await StaffUser.create({
          firstName,
          lastName,
          email,
          emailLower,
          passwordHash,
          role: 'LGU_STAFF',
          assignedBarangays: [barangay],
          isActive: true,
          emailVerified: true,
          forcePasswordReset: false,
        });
        createdCount++;
      }

      staffList.push({
        name: `${firstName} ${lastName}`,
        email,
        barangay,
      });
    }
  }

  console.log(`Staff Seeding Completed:`);
  console.log(`- Created: ${createdCount}`);
  console.log(`- Updated: ${updatedCount}`);
  console.log(`- Total staff in batch: ${staffList.length}`);
  console.log(`- Default Password: ${DEFAULT_PASSWORD}\n`);

  console.log('Seeded Accounts Summary:');
  BARANGAYS.forEach((brgy) => {
    const brgyStaff = staffList.filter((s) => s.barangay === brgy);
    console.log(`\n📌 ${brgy} (3 staff):`);
    brgyStaff.forEach((s) => console.log(`   • ${s.name} <${s.email}>`));
  });

  await mongoose.disconnect();
  console.log('\n===========================================================\n');
}

main().catch(async (err) => {
  console.error('Staff seeding failed:', err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
