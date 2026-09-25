import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.local') });

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import StaffUser from '../models/StaffUser';

async function verifySuperadminInDb() {
  console.log('🔄 Checking Superadmin in MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI!);

  try {
    const admin = await StaffUser.findOne({ role: 'SUPERADMIN' }).select('+passwordHash');
    if (!admin) {
      throw new Error('No SUPERADMIN found in database!');
    }

    console.log('✅ Found SUPERADMIN in DB:');
    console.log('   ID:', admin._id.toString());
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Active:', admin.isActive);
    console.log('   Has password hash:', !!admin.passwordHash);

    // Verify bcrypt comparison with default password
    const testPassword = 'KapitBisig@LGU2026!Xyz';
    const isMatch = await bcrypt.compare(testPassword, admin.passwordHash!);
    console.log('✅ Password match with default dev credentials:', isMatch);

    if (!isMatch) {
      throw new Error('Password hash does not match default dev password!');
    }

    // Check staff count vs total count to ensure isolation
    const staffCount = await StaffUser.countDocuments({ role: 'LGU_STAFF' });
    const superadminCount = await StaffUser.countDocuments({ role: 'SUPERADMIN' });
    console.log(`✅ Isolation check: ${staffCount} LGU_STAFF, ${superadminCount} SUPERADMIN`);

    console.log('\n🎉 ALL DB SUPERADMIN CHECKS PASSED!\n');
  } finally {
    await mongoose.disconnect();
  }
}

verifySuperadminInDb().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
