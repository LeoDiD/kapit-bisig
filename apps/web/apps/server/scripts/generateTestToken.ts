/**
 * Test Token Generator Script
 * 
 * Run this script to generate test tokens for development/testing.
 * 
 * Usage:
 *   npx ts-node scripts/generateTestToken.ts
 * 
 * Or add to package.json scripts:
 *   "generate-token": "ts-node scripts/generateTestToken.ts"
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database';
import { householdTokenService } from '../services/householdTokenService';

async function generateTestTokens() {
  console.log('\n🎫 Household Token Generator\n');
  console.log('='.repeat(50));
  
  try {
    // Connect to database
    await connectDB();
    
    // Generate test tokens for different households
    const testHouseholds = [
      {
        headOfHousehold: 'Juan Dela Cruz',
        address: '123 Mabini Street',
        barangay: 'San Bakonagkulang',
        expectedMembers: 4,
        notes: 'Test household 1',
      },
      {
        headOfHousehold: 'Maria Santos',
        address: '456 Rizal Avenue',
        barangay: 'Maybago',
        expectedMembers: 3,
        notes: 'Test household 2',
      },
      {
        headOfHousehold: 'Pedro Reyes',
        address: '789 Bonifacio Road',
        barangay: 'Nakaraan',
        expectedMembers: 5,
        notes: 'Test household 3',
      },
    ];
    
    console.log('\n📋 Generated Test Tokens:\n');
    console.log('-'.repeat(50));
    
    for (const household of testHouseholds) {
      const result = await householdTokenService.generateToken({
        ...household,
        validityDays: 30,
        issuedBy: 'test-admin',
      });
      
      if (result.success && result.token) {
        console.log(`\n👤 ${household.headOfHousehold}`);
        console.log(`   📍 ${household.address}, ${household.barangay}`);
        console.log(`   👨‍👩‍👧‍👦 Expected Members: ${household.expectedMembers}`);
        console.log(`   🎫 TOKEN: ${result.token}`);
        console.log(`   📅 Expires: ${result.expiresAt?.toLocaleDateString()}`);
      } else {
        console.log(`\n❌ Failed to generate token for ${household.headOfHousehold}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Copy any token above to test registration!\n');
    console.log('💡 Tokens are one-time use only.\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

generateTestTokens();
