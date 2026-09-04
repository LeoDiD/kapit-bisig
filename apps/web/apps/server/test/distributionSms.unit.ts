import assert from 'assert';
import { broadcastDistributionSms } from '../utils/distributionSms';

export async function runDistributionSmsUnitTests(): Promise<void> {
  const sentTo: string[] = [];
  const summary = await broadcastDistributionSms({
    targetBarangays: ['Bolo', 'Bolo'],
    scheduled: '2026-08-25T01:00:00.000Z',
  }, {
    configured: true,
    recipients: [
      { mobileNumber: '09171234567' },
      { mobileNumber: '+63 917 123 4567' },
      { mobileNumber: '09181234567' },
      { mobileNumber: '' },
      { mobileNumber: 'not-a-number' },
    ],
    send: async (to, message) => {
      assert.match(message, /Bolo/);
      assert.match(message, /submit your proof\/application/i);
      sentTo.push(to);
      if (to === '09181234567') throw new Error('provider rejected');
    },
  });

  assert.deepStrictEqual(sentTo.sort(), ['09171234567', '09181234567']);
  assert.deepStrictEqual(summary, { status: 'partially_delivered', attempted: 2, sent: 1, skipped: 3, failed: 1 });

  const unavailable = await broadcastDistributionSms({
    targetBarangays: ['Bolo'],    scheduled: '2026-08-25T01:00:00.000Z',
  }, {
    configured: false,
    recipients: [{ mobileNumber: '09171234567' }],
  });
  assert.deepStrictEqual(unavailable, { status: 'provider_not_configured', attempted: 1, sent: 0, skipped: 0, failed: 1 });
  const noRecipients = await broadcastDistributionSms({
    targetBarangays: ['San Jose'],
    scheduled: '2026-08-25T01:00:00.000Z',
  }, {
    configured: true,
    recipients: [{ mobileNumber: '' }, { mobileNumber: 'invalid' }],
  });
  assert.deepStrictEqual(noRecipients, { status: 'no_eligible_recipients', attempted: 0, sent: 0, skipped: 2, failed: 0 });
}
