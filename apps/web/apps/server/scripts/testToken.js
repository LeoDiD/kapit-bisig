const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const TOKEN_TO_TEST = 'S3HQ-HQX2-XA1D';

async function test() {
  await mongoose.connect('mongodb://localhost:27017/kapit-bisig');
  console.log('Connected to MongoDB\n');
  
  // Find the token by prefix
  const prefix = TOKEN_TO_TEST.replace(/-/g, '').slice(0, 4);
  const token = await mongoose.connection.db.collection('householdtokens').findOne({ tokenPrefix: prefix });
  
  console.log('Looking for token with prefix:', prefix);
  console.log('Token found:', !!token);
  
  if (token) {
    console.log('\nToken details:');
    console.log('  Status:', token.status);
    console.log('  Expires:', token.expiresAt);
    console.log('  Now:', new Date());
    console.log('  Not expired:', new Date(token.expiresAt) > new Date());
    
    console.log('\nBcrypt test:');
    console.log('  Testing token:', TOKEN_TO_TEST);
    console.log('  Hash (first 30 chars):', token.tokenHash.substring(0, 30) + '...');
    
    const match = await bcrypt.compare(TOKEN_TO_TEST, token.tokenHash);
    console.log('  BCrypt match:', match);
    
    if (!match) {
      // Try with different cases
      const upperMatch = await bcrypt.compare(TOKEN_TO_TEST.toUpperCase(), token.tokenHash);
      console.log('  BCrypt match (uppercase):', upperMatch);
      
      const lowerMatch = await bcrypt.compare(TOKEN_TO_TEST.toLowerCase(), token.tokenHash);
      console.log('  BCrypt match (lowercase):', lowerMatch);
    }
  }
  
  // Also count all tokens
  const allTokens = await mongoose.connection.db.collection('householdtokens').find({}).toArray();
  console.log('\nTotal tokens in DB:', allTokens.length);
  
  // Check valid tokens
  const now = new Date();
  const validTokens = allTokens.filter(t => 
    ['UNUSED', 'LOCKED'].includes(t.status) && 
    new Date(t.expiresAt) > now
  );
  console.log('Valid (UNUSED/LOCKED, not expired):', validTokens.length);
  console.log('Prefixes:', validTokens.map(t => t.tokenPrefix).join(', '));
  
  await mongoose.disconnect();
  console.log('\nDone!');
}

test().catch(console.error);
