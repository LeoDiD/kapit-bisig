/**
 * testSms.ts
 *
 * Direct CLI test utility to verify SMS API configuration and delivery.
 *
 * Usage:
 *   npx ts-node --project tsconfig.server.json server/scripts/testSms.ts 09171234567
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { sendRegistrationOtpSms, sendSms, isSmsConfigured } from '../utils/smsService';

async function main() {
  const args = process.argv.slice(2);
  const targetNumber = args[0] || '09171234567';

  console.log('======================================================');
  console.log(' KapitBisig SMS Gateway Configuration Test');
  console.log('======================================================');
  console.log(`Provider:    ${process.env.SMS_PROVIDER || 'unisms (default)'}`);
  console.log(`Sender Name: ${process.env.SMS_SENDER_NAME || 'UniSMS (default)'}`);
  console.log(`Configured:  ${isSmsConfigured() ? 'YES (Live API Key found)' : 'NO (Dry-run mode)'}`);
  console.log(`Target Phone:${targetNumber}`);
  console.log('------------------------------------------------------');

  if (!isSmsConfigured()) {
    console.warn('⚠️  WARNING: No SMS_API_KEY was found in .env.local.');
    console.warn('   The SMS service will run in DRY-RUN mode (logged to console only).');
    console.log('------------------------------------------------------');
  }

  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Sending sample registration OTP (${testOtp}) to ${targetNumber}...`);

  try {
    const startTime = Date.now();
    await sendRegistrationOtpSms(targetNumber, testOtp);
    const elapsedMs = Date.now() - startTime;

    console.log('------------------------------------------------------');
    console.log(`✅ SUCCESS: SMS request processed in ${elapsedMs}ms.`);
    if (isSmsConfigured()) {
      console.log(`📲 Check phone ${targetNumber} for the incoming message.`);
    } else {
      console.log('ℹ️  In dry-run mode, the message was printed above.');
    }
    console.log('======================================================');
  } catch (error: any) {
    console.error('------------------------------------------------------');
    console.error(`❌ FAILED: Unable to send SMS.`);
    console.error(`Error details: ${error?.message || error}`);
    console.error('======================================================');
    process.exit(1);
  }
}

main();
