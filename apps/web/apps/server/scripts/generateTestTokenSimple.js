/**
 * Simple Test Token Generator
 * 
 * Run: node server/scripts/generateTestTokenSimple.js
 * 
 * This creates test tokens directly in MongoDB without complex dependencies.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// MongoDB connection - uses Atlas from .env.local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';
const SALT_ROUNDS = 12;

// Generate secure random token
function generateSecureToken() {
  const randomBytes = crypto.randomBytes(16);
  let token = '';
  for (let i = 0; i < randomBytes.length && token.length < 12; i++) {
    const byte = randomBytes[i];
    const charCode = byte % 36;
    if (charCode < 10) {
      token += charCode.toString();
    } else {
      token += String.fromCharCode(55 + charCode);
    }
  }
  while (token.length < 12) {
    token += Math.floor(Math.random() * 10).toString();
  }
  return `${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
}

// Token schema
const HouseholdTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  tokenPrefix: { type: String, required: true },
  status: { type: String, enum: ['UNUSED', 'LOCKED', 'USED', 'EXPIRED'], default: 'UNUSED' },
  lockedAt: { type: Date, default: null },
  lockedBy: { type: String, default: null },
  lockExpiresAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  usedBy: {
    residentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  householdInfo: {
    headOfHousehold: { type: String, required: true },
    address: { type: String, required: true },
    barangay: { type: String, required: true },
    expectedMembers: { type: Number, default: 1 },
    notes: { type: String, default: '' },
  },
  issuedBy: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 0 },
}, { timestamps: true });

async function main() {
  console.log('\n🎫 Household Token Generator\n');
  console.log('='.repeat(60));
  
  try {
    // Connect to MongoDB
    console.log(`\n📡 Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const HouseholdToken = mongoose.model('HouseholdToken', HouseholdTokenSchema);
    
    // 10 Official Barangays
    const barangays = [
      'Bolo',
      'Bongalon',
      'Dulig',
      'Laois',
      'Magsaysay',
      'Poblacion',
      'San Gonzalo',
      'San Jose',
      'Tobuan',
      'Uyong'
    ];
    
    // Command line args: [count] [barangay]
    // Example: node generateTestTokenSimple.js 5 "San Jose"
    const TOKEN_COUNT = parseInt(process.argv[2]) || 10;
    const SPECIFIC_BARANGAY = process.argv[3] || null;
    
    // Validate barangay if specified
    if (SPECIFIC_BARANGAY && !barangays.includes(SPECIFIC_BARANGAY)) {
      console.log('❌ Invalid barangay. Available options:');
      barangays.forEach((b, i) => console.log(`   ${i + 1}. ${b}`));
      await mongoose.disconnect();
      return;
    }
    
    console.log('📋 Generated Household Registration Tokens:\n');
    if (SPECIFIC_BARANGAY) {
      console.log(`   🏘️  Generating ${TOKEN_COUNT} tokens for Barangay ${SPECIFIC_BARANGAY}\n`);
    } else {
      console.log('   (Distributing across all barangays)\n');
    }
    console.log('-'.repeat(60));
    
    const generatedTokens = [];
    const tokensByBarangay = {};
    
    for (let i = 1; i <= TOKEN_COUNT; i++) {
      const plainToken = generateSecureToken();
      const tokenHash = await bcrypt.hash(plainToken, SALT_ROUNDS);
      const tokenPrefix = plainToken.replace(/-/g, '').slice(0, 4);
      // Use specific barangay or distribute evenly
      const barangay = SPECIFIC_BARANGAY || barangays[(i - 1) % barangays.length];
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity
      
      const token = new HouseholdToken({
        tokenHash,
        tokenPrefix,
        status: 'UNUSED',
        expiresAt,
        householdInfo: {
          headOfHousehold: 'TBD - Unassigned',  // Will be filled during registration
          address: 'TBD - Unassigned',           // Will be filled during registration
          barangay: barangay,
          expectedMembers: 5,                    // Default max members
          notes: 'Token for household registration',
        },
        issuedBy: 'admin',
        issuedAt: new Date(),
      });
      
      await token.save();
      
      // Track by barangay
      if (!tokensByBarangay[barangay]) {
        tokensByBarangay[barangay] = [];
      }
      tokensByBarangay[barangay].push(plainToken);
      
      generatedTokens.push({
        number: i,
        token: plainToken,
        barangay: barangay,
        expires: expiresAt.toLocaleDateString()
      });
      
      console.log(`\n   Token #${i}`);
      console.log(`   🎫 CODE: ${plainToken}`);
      console.log(`   📍 Barangay: ${barangay}`);
      console.log(`   📅 Expires: ${expiresAt.toLocaleDateString()}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📝 TOKENS BY BARANGAY:\n');
    
    Object.keys(tokensByBarangay).sort().forEach(brgy => {
      console.log(`   📍 ${brgy}:`);
      tokensByBarangay[brgy].forEach(t => {
        console.log(`      • ${t}`);
      });
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('\n✅ Give these codes to households for registration!');
    console.log('💡 Each code is ONE-TIME USE only - first to register wins.');
    console.log('⚠️  Tokens must match the selected barangay during registration.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

main();
