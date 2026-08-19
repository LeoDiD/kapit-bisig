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

async function runNewmanTests() {
  console.log('Starting MongoMemoryServer...');
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Set ENV for server process
  const env = {
    ...process.env,
    MONGODB_URI: uri,
    JWT_SECRET: 'test-secret-123456789012345678901234567890',
    SUPERADMIN_EMAIL: 'superadmin@kapitbisig.local',
    SUPERADMIN_PASSWORD_HASH: '$2b$12$V5PHd.zJhzX0b5LaT7VimeKQMO9wvY9Re1dA9kzv.UzeL7jzWOdWO',
    PORT: '3001',
    NODE_ENV: 'test',
  };

  console.log('Connecting mongoose to seed data...');
  await mongoose.connect(uri, { dbName: 'kapit-bisig' });

  // Seed Resident for Household Auth test
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
    status: 'Approved' // Household auth requires an approved resident
  });
  
  await mongoose.disconnect();

  console.log('Spawning express server...');
  const serverPath = path.resolve(__dirname, '../index.ts');
  const serverProcess = spawn('npx', ['tsx', serverPath], { env, stdio: 'inherit', shell: true });

  try {
    console.log('Waiting for server to be ready...');
    await waitForServer('http://localhost:3001/api/health');
    console.log('Server is ready! Running Newman tests...');

    const newmanArgs = [
      'newman', 'run',
      path.resolve(__dirname, '../../../../../docs/postman/KapitBisig_Auth_Security.postman_collection.json'),
      '-e', path.resolve(__dirname, '../../../../../docs/postman/KapitBisig_Local.postman_environment.json'),
      '--env-var', 'unifiedUsername=superadmin@kapitbisig.local',
      '--env-var', 'unifiedPassword=KapitBisig@LGU2026!Xyz',
      '--reporters', 'cli'
    ];
    
    const newmanProcess = spawn('npx', newmanArgs, { stdio: 'inherit', shell: true });
    
    newmanProcess.on('close', async (code) => {
      console.log(`Newman tests completed with code ${code}`);
      serverProcess.kill();
      await mongoServer.stop();
      process.exit(code ?? 0);
    });

  } catch (err) {
    console.error(err);
    serverProcess.kill();
    await mongoServer.stop();
    process.exit(1);
  }
}

runNewmanTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
