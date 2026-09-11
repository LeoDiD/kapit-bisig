import assert from 'assert';
import {
  sendRegistrationOtpSms,
  sendRegistrationSuccessSms,
  sendAccountApprovedSms,
  sendAccountStatusUpdateSms,
  sendPasswordResetOtpSms,
} from '../utils/smsService';

export async function runSmsServiceUnitTests(): Promise<void> {
  const originalEnv = { ...process.env };

  try {
    // 1. Dry run test (no API key)
    delete process.env.SMS_API_KEY;
    // Calling SMS helpers should not throw in dry-run mode
    await sendRegistrationOtpSms('09171234567', '123456');
    await sendRegistrationSuccessSms('09171234567', 'Juan Dela Cruz');
    await sendAccountApprovedSms('09171234567', 'Juan Dela Cruz');
    await sendAccountStatusUpdateSms('09171234567', 'Juan Dela Cruz', 'Needs Revision', 'ID image unclear');
    await sendAccountStatusUpdateSms('09171234567', 'Juan Dela Cruz', 'Rejected', 'Duplicate household');
    await sendPasswordResetOtpSms('09171234567', '654321');

    console.log('✅ SMS service unit tests passed');
  } finally {
    process.env = originalEnv;
  }
}

if (require.main === module) {
  runSmsServiceUnitTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

