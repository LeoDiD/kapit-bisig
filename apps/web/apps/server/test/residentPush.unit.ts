import assert from 'assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import ResidentPushDevice from '../models/ResidentPushDevice';
import { sendResidentPushNotification } from '../utils/residentPush';

async function run(): Promise<void> {
  process.env.NODE_ENV = 'test';
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  try {
    const residentId = new mongoose.Types.ObjectId();
    const token = 'ExpoPushToken[proof_approval_device]';
    await ResidentPushDevice.create({
      residentId,
      expoPushToken: token,
      platform: 'android',
      active: true,
    });

    let deliveredMessages: Array<Record<string, unknown>> = [];
    const delivered = await sendResidentPushNotification({
      residentId: residentId.toString(),
      title: 'Proof Approved',
      body: 'Your proof was approved.',
      data: { screen: 'proof-request', decision: 'Approved' },
    }, {
      configured: true,
      send: async (messages) => {
        deliveredMessages = messages;
        return [{ status: 'ok' }];
      },
    });

    assert.strictEqual(delivered.status, 'sent_successfully');
    assert.strictEqual(delivered.sent, 1);
    assert.strictEqual(deliveredMessages[0]?.to, token);
    assert.strictEqual(deliveredMessages[0]?.title, 'Proof Approved');
    assert.deepStrictEqual(deliveredMessages[0]?.data, {
      screen: 'proof-request',
      decision: 'Approved',
    });

    const unconfigured = await sendResidentPushNotification({
      residentId: residentId.toString(),
      title: 'Proof Approved',
      body: 'Your proof was approved.',
    }, { configured: false });
    assert.strictEqual(unconfigured.status, 'provider_not_configured');

    const failed = await sendResidentPushNotification({
      residentId: residentId.toString(),
      title: 'Proof Approved',
      body: 'Your proof was approved.',
    }, {
      configured: true,
      send: async () => { throw new Error('FCM unavailable'); },
    });
    assert.strictEqual(failed.status, 'provider_request_failed');
    assert.strictEqual(failed.failed, 1);

    const rejected = await sendResidentPushNotification({
      residentId: residentId.toString(),
      title: 'Proof Approved',
      body: 'Your proof was approved.',
    }, {
      configured: true,
      send: async () => [{ status: 'error', details: { error: 'DeviceNotRegistered' } }],
    });
    assert.strictEqual(rejected.status, 'provider_request_failed');
    assert.strictEqual((await ResidentPushDevice.findOne({ expoPushToken: token }))?.active, false);

    const invalidResidentId = new mongoose.Types.ObjectId();
    const invalidToken = 'not-an-expo-token';
    await ResidentPushDevice.create({
      residentId: invalidResidentId,
      expoPushToken: invalidToken,
      platform: 'android',
      active: true,
    });
    const invalid = await sendResidentPushNotification({
      residentId: invalidResidentId.toString(),
      title: 'Proof Approved',
      body: 'Your proof was approved.',
    }, { configured: true, send: async () => [] });
    assert.strictEqual(invalid.status, 'no_eligible_recipients');
    assert.strictEqual((await ResidentPushDevice.findOne({ expoPushToken: invalidToken }))?.active, false);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}

void run()
  .then(() => console.log('resident Firebase push unit tests passed'))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
