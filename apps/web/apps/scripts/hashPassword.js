#!/usr/bin/env node

/**
 * Password Hash Generator for SUPERADMIN
 *
 * Usage:
 *   node scripts/hashPassword.js "YourSuperStr0ng!Password"
 *
 * Enforces IAS-compliant strong-password rules BEFORE hashing:
 *  - length >= 16 (prefer 20+)
 *  - at least 1 uppercase, 1 lowercase, 1 digit, 1 symbol
 *  - rejects common/guessable patterns
 *
 * Output:
 *  - bcrypt hash (paste into SUPERADMIN_PASSWORD_HASH in .env.local)
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const COMMON_PATTERNS = [
  'password', 'admin', '123456', 'qwerty', 'letmein', 'welcome',
  'monkey', 'dragon', 'master', 'login', 'superadmin', 'super',
  'abc123', 'trustno1', 'iloveyou', 'sunshine', 'princess',
  'football', 'shadow', 'passw0rd', 'kapitbisig',
];

function validatePassword(pw) {
  const errors = [];

  if (pw.length < 16) {
    errors.push(`Too short (${pw.length} chars). Minimum is 16.`);
  }
  if (/\s/.test(pw)) {
    errors.push('Must not contain spaces or whitespace.');
  }
  if (!/[A-Z]/.test(pw)) {
    errors.push('Missing uppercase letter.');
  }
  if (!/[a-z]/.test(pw)) {
    errors.push('Missing lowercase letter.');
  }
  if (!/[0-9]/.test(pw)) {
    errors.push('Missing digit.');
  }
  if (!/[^A-Za-z0-9]/.test(pw)) {
    errors.push('Missing symbol (e.g. !@#$%^&*).');
  }

  // Check for common patterns (case-insensitive)
  const lower = pw.toLowerCase();
  for (const pattern of COMMON_PATTERNS) {
    if (lower.includes(pattern)) {
      errors.push(`Contains guessable pattern: "${pattern}".`);
    }
  }

  // Check for character repetition (4+ same char in a row)
  if (/(.)\1{3,}/.test(pw)) {
    errors.push('Contains 4+ repeated characters in a row.');
  }

  // Check for sequential chars (e.g. abcd, 1234)
  let sequential = 0;
  for (let i = 1; i < pw.length; i++) {
    if (pw.charCodeAt(i) - pw.charCodeAt(i - 1) === 1) {
      sequential++;
      if (sequential >= 3) {
        errors.push('Contains 4+ sequential characters (e.g. abcd, 1234).');
        break;
      }
    } else {
      sequential = 0;
    }
  }

  return errors;
}

async function main() {
  const pw = process.argv[2];

  if (!pw) {
    console.error('\n❌ Usage: node scripts/hashPassword.js "YourPassword"\n');
    process.exit(1);
  }

  console.log('\n🔐 Password Strength Check');
  console.log('─'.repeat(40));

  const errors = validatePassword(pw);

  if (errors.length > 0) {
    console.log('❌ FAIL — Password does not meet requirements:\n');
    errors.forEach((e) => console.log(`  • ${e}`));
    console.log('\nRequirements:');
    console.log('  • Minimum 16 characters (20+ recommended)');
    console.log('  • At least 1 uppercase, 1 lowercase, 1 digit, 1 symbol');
    console.log('  • No common words/patterns');
    console.log('  • No 4+ repeated or sequential characters\n');
    process.exit(1);
  }

  console.log('✅ PASS — Password meets all strength requirements.');
  if (pw.length >= 20) {
    console.log('🏆 Excellent length (20+ characters).');
  }

  console.log('\nGenerating bcrypt hash (this takes a moment)...');
  const hash = await bcrypt.hash(pw, SALT_ROUNDS);

  console.log('\n─'.repeat(40));
  console.log('📋 Copy the hash below into your .env.local:\n');
  console.log(`SUPERADMIN_PASSWORD_HASH=${hash}`);
  console.log('');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
