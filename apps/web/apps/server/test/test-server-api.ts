import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { spawn } from 'child_process';
import path from 'path';
import bcrypt from 'bcrypt';
import Resident from '../models/Resident';
import http from 'http';

function waitForServer(url: string, timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error('Server did not start in time'));
      }
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve();
        }
      }).on('error', () => {
        // Ignore error, keep trying
      });
    }, 1000);
  });
}

async function request(path: string, body: any) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
      }
    );
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('Starting MongoMemoryServer...');
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  const env = {
    ...process.env,
    MONGODB_URI: uri,
    JWT_SECRET: 'test-secret-123456789012345678901234567890',
    SUPERADMIN_EMAIL: 'superadmin@kapitbisig.local',
    SUPERADMIN_PASSWORD_HASH: '$2b$12$V5PHd.zJhzX0b5LaT7VimeKQMO9wvY9Re1dA9kzv.UzeL7jzWOdWO',
    PORT: '3001',
    NODE_ENV: 'test',
  };

  await mongoose.connect(uri, { dbName: 'kapit-bisig' });

  await Resident.create({
    firstName: 'Household',
    lastName: 'Resident',
    fullName: 'Household Resident',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    mobileNumber: '+639099728765',
    password: 'Resident@123',
    city: 'Sample City',
    barangay: 'Sample Barangay',
    streetAddress: '123 Street',
    idType: 'National ID',
    idNumber: 'ID-001',
    frontIdImage: 'base64',
    backIdImage: 'base64',
    faceImage: 'base64',
    verification: {
      overallConfidence: 99
    },
    status: 'Approved'
  });

  console.log('Spawning express server...');
  const serverPath = path.resolve(__dirname, '../index.ts');
  const serverProcess = spawn('npx', ['tsx', serverPath], { env, stdio: 'inherit', shell: true });

  try {
    console.log('Waiting for server to be ready...');
    await waitForServer('http://localhost:3001/api/health');
    console.log('Server is ready! Running tests...');

    const foundResident = await mongoose.connection.collection('residents').findOne({ mobileNumber: '+639099728765' });
    console.log('Found Resident in DB directly:', foundResident);

    console.log('\n--- Testing Health ---');
    const health = await new Promise((resolve) => {
      http.get('http://localhost:3001/api/health', (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
      });
    });
    console.log(health);

    console.log('\n--- Testing Debug DB ---');
    const debugDb = await new Promise((resolve) => {
      http.get('http://localhost:3001/api/debug-db', (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
      });
    });
    console.log(JSON.stringify(debugDb, null, 2));

    console.log('\n--- Testing Unified Login ---');
    const res1 = await request('/api/auth/login', {
      email: 'superadmin@kapitbisig.local',
      password: 'KapitBisig@LGU2026!Xyz',
      rememberMe: false
    });
    console.log(res1);

    console.log('\n--- Testing Household Login ---');
    const res2 = await request('/api/household/auth/login', {
      mobileNumber: '09099728765',
      password: 'Resident@123'
    });
    console.log(res2);

    serverProcess.kill();
    await mongoServer.stop();
  } catch (err) {
    console.error(err);
    serverProcess.kill();
    await mongoServer.stop();
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

run().catch(console.error);
