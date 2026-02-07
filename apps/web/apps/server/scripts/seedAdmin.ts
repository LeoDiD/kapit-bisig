/**
 * Seed Script - Create Initial Admin User
 * 
 * Run this script once to create the first admin user.
 * After that, you can log in and manage users through the web app.
 * 
 * Usage: npx ts-node --project tsconfig.server.json server/scripts/seedAdmin.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';

// Default admin credentials - CHANGE THE PASSWORD AFTER FIRST LOGIN!
const DEFAULT_ADMIN = {
  email: 'admin@kapitbisig.gov.ph',
  password: 'Admin@123456',  // Strong password with uppercase, lowercase, number, special char
  firstName: 'System',
  lastName: 'Administrator',
  role: 'Admin' as const,
  status: 'Active' as const,
};

async function seedAdmin() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email: ${DEFAULT_ADMIN.email}`);
      console.log('   No changes made.');
    } else {
      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);

      // Create the admin user
      const admin = new User({
        email: DEFAULT_ADMIN.email,
        password: hashedPassword,
        firstName: DEFAULT_ADMIN.firstName,
        lastName: DEFAULT_ADMIN.lastName,
        role: DEFAULT_ADMIN.role,
        status: DEFAULT_ADMIN.status,
      });

      await admin.save();

      console.log('');
      console.log('✅ Admin user created successfully!');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  LOGIN CREDENTIALS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  Email:    ${DEFAULT_ADMIN.email}`);
      console.log(`  Password: ${DEFAULT_ADMIN.password}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('⚠️  IMPORTANT: Change the password after first login!');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedAdmin();
