import assert from 'assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createNotification, broadcastScopedNotification, broadcastResidentNotification } from '../utils/createNotification';
import Notification from '../models/Notification';
import StaffUser from '../models/StaffUser';
import Resident from '../models/Resident';

export async function runNotificationFlowUnitTests(): Promise<void> {
  console.log('Running Notification Flow Unit Tests...');

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // 1. Basic Notification Creation
  await createNotification({
    title: 'Test',
    message: 'Test Message',
    type: 'system',
    userId: null
  });

  let notifs = await Notification.find({});
  assert.strictEqual(notifs.length, 1);
  assert.strictEqual(notifs[0].title, 'Test');

  await Notification.deleteMany({});

  // 2. Broadcast Scoped Notification
  const staff1 = await StaffUser.create({
    email: 'staff1@test.com',
    passwordHash: 'hash',
    firstName: 'Staff',
    lastName: 'One',
    role: 'LGU_STAFF',
    assignedBarangays: ['Bolo'],
    isActive: true
  });

  const staff2 = await StaffUser.create({
    email: 'staff2@test.com',
    passwordHash: 'hash',
    firstName: 'Staff',
    lastName: 'Two',
    role: 'LGU_STAFF',
    assignedBarangays: ['Bongalon'],
    isActive: true
  });

  await broadcastScopedNotification({
    title: 'Scoped',
    message: 'To Bolo',
    type: 'dispatch',
    targetBarangays: ['Bolo'],
    includeSuperadmin: true
  });

  // Should create one for staff1 and one for superadmin (userId = null)
  notifs = await Notification.find({});
  assert.strictEqual(notifs.length, 2);
  const staffNotif = notifs.find(n => n.userId?.toString() === staff1._id.toString());
  assert.ok(staffNotif);
  
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('Notification Flow Unit Tests Passed!');
}
