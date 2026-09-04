import assert from 'assert';
import { sendBeneficiaryReviewSms } from '../utils/beneficiaryReviewSms';

export async function runBeneficiaryReviewSmsUnitTests(): Promise<void> {
  const missingMobile = await sendBeneficiaryReviewSms({
    mobileNumber: '',
    decision: 'Approved',
    scopeName: 'San Jose Distribution',
  }, { configured: true, send: async () => undefined });
  assert.strictEqual(missingMobile.status, 'no_eligible_recipient');
  assert.strictEqual(missingMobile.attempted, 0);

  const unconfigured = await sendBeneficiaryReviewSms({
    mobileNumber: '09171234567',
    decision: 'Approved',
    scopeName: 'San Jose Distribution',
  }, { configured: false });
  assert.strictEqual(unconfigured.status, 'provider_not_configured');
  assert.strictEqual(unconfigured.failed, 1);

  let deliveredTo = '';
  let deliveredMessage = '';
  const delivered = await sendBeneficiaryReviewSms({
    mobileNumber: '+63 917 123 4567',
    decision: 'Approved',
    scopeName: 'San Jose Distribution',
  }, {
    configured: true,
    send: async (to, message) => {
      deliveredTo = to;
      deliveredMessage = message;
    },
  });
  assert.strictEqual(delivered.status, 'sent_successfully');
  assert.strictEqual(deliveredTo, '09171234567');
  assert.match(deliveredMessage, /approved/i);
  assert.match(deliveredMessage, /eligible/i);

  let rejectionMessage = '';
  const rejected = await sendBeneficiaryReviewSms({
    mobileNumber: '639171234567',
    decision: 'Rejected',
    scopeName: 'Flood Assistance',
    rejectionReason: 'Please upload a clearer barangay certificate',
  }, {
    configured: true,
    send: async (_to, message) => { rejectionMessage = message; },
  });
  assert.strictEqual(rejected.status, 'sent_successfully');
  assert.match(rejectionMessage, /needs an update/i);
  assert.match(rejectionMessage, /clearer barangay certificate/i);

  const failed = await sendBeneficiaryReviewSms({
    mobileNumber: '09171234567',
    decision: 'Approved',
    scopeName: 'San Jose Distribution',
  }, {
    configured: true,
    send: async () => { throw new Error('provider unavailable'); },
  });
  assert.strictEqual(failed.status, 'provider_request_failed');
  assert.strictEqual(failed.failed, 1);
}

if (require.main === module) {
  runBeneficiaryReviewSmsUnitTests()
    .then(() => console.log('beneficiary review SMS unit tests passed'))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
