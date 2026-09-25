import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

export async function runCodeGenerationTests() {
  console.log('--- Starting Code Generation Tests ---');
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);

  const results: Array<{ test: string; expected: string; actual: string; result: 'Pass' | 'Fail' }> = [];

  try {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-very-long-secret-key-that-is-at-least-32-chars-long';
    const { default: residentRoutes } = await import('../routes/residentRoutes');
    const { householdTokenService } = await import('../services/householdTokenService');

    const app = express();
    app.use(express.json());
    app.use('/api/residents', residentRoutes);

    const authToken = jwt.sign(
      {
        sub: 'superadmin-test',
        role: 'SUPERADMIN',
        userId: '507f1f77bcf86cd799439099',
        assignedBarangays: [],
      },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // Test 1: Stats endpoint on empty barangay
    {
      const res = await request(app)
        .get('/api/residents/codes/stats?barangayId=Bolo')
        .set('Authorization', `Bearer ${authToken}`);

      const pass = res.status === 200 && res.body.success === true && res.body.activeUnused === 0;
      results.push({
        test: 'GET /api/residents/codes/stats returns real-time stats',
        expected: 'Status 200, success: true, activeUnused: 0',
        actual: `Status ${res.status}, success: ${res.body.success}, activeUnused: ${res.body.activeUnused}`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 2: Bulk generate 100 codes in single batch
    let batchId = '';
    let samplePlainToken = '';
    {
      const startTime = Date.now();
      const res = await request(app)
        .post('/api/residents/codes/generate-batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          barangay: 'Bolo',
          quantity: 100,
        });
      const durationMs = Date.now() - startTime;

      const pass =
        res.status === 201 &&
        res.body.success === true &&
        res.body.data.tokens.length === 100 &&
        Boolean(res.body.data.batchId) &&
        durationMs < 6000;

      batchId = res.body.data?.batchId || '';
      samplePlainToken = res.body.data?.tokens?.[0]?.code || '';

      results.push({
        test: 'POST /api/residents/codes/generate-batch generates 100 tokens rapidly',
        expected: 'Status 201, 100 tokens, batchId present, duration < 6000ms',
        actual: `Status ${res.status}, ${res.body.data?.tokens?.length} tokens, batchId: ${batchId}, completed in ${durationMs}ms`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 3: Stats endpoint reflects newly created 100 active unused tokens
    {
      const res = await request(app)
        .get('/api/residents/codes/stats?barangayId=Bolo')
        .set('Authorization', `Bearer ${authToken}`);

      const pass = res.status === 200 && res.body.activeUnused === 100 && res.body.total === 100;
      results.push({
        test: 'GET /api/residents/codes/stats reflects newly generated tokens',
        expected: 'activeUnused: 100, total: 100',
        actual: `activeUnused: ${res.body.activeUnused}, total: ${res.body.total}`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 4: List batches endpoint returns the generated batch
    {
      const res = await request(app)
        .get('/api/residents/codes/batches?barangay=Bolo')
        .set('Authorization', `Bearer ${authToken}`);

      const batches = res.body.batches || [];
      const matched = batches.find((b: any) => b.batchId === batchId);
      const pass = res.status === 200 && Boolean(matched) && matched.quantity === 100 && matched.summary.unused === 100;
      results.push({
        test: 'GET /api/residents/codes/batches lists persistent batch with summary',
        expected: 'Batch listed with quantity: 100, unused: 100',
        actual: `Status ${res.status}, matched batch quantity: ${matched?.quantity}, unused: ${matched?.summary?.unused}`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 5: Get batch details endpoint returns masked tokens
    {
      const res = await request(app)
        .get(`/api/residents/codes/batch/${batchId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const tokens = res.body.tokens || [];
      const pass = res.status === 200 && tokens.length === 100 && tokens[0].code.includes('****');
      results.push({
        test: 'GET /api/residents/codes/batch/:batchId returns masked tokens for audit',
        expected: 'Status 200, 100 tokens, code masked with ****',
        actual: `Status ${res.status}, count: ${tokens.length}, sample: ${tokens[0]?.code}`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 6: List tokens registry with status filter
    {
      const res = await request(app)
        .get('/api/residents/codes/list?barangay=Bolo&status=UNUSED&limit=50')
        .set('Authorization', `Bearer ${authToken}`);

      const pass = res.status === 200 && res.body.tokens.length === 50 && res.body.total === 100;
      results.push({
        test: 'GET /api/residents/codes/list queries tokens by status with pagination',
        expected: 'Status 200, 50 tokens returned, total 100',
        actual: `Status ${res.status}, returned: ${res.body.tokens?.length}, total: ${res.body.total}`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 7: Verify generated token is valid for resident registration
    {
      const validation = await householdTokenService.validateToken(
        samplePlainToken,
        '127.0.0.1',
        'test-agent',
        'req-test-1',
        'Bolo'
      );
      const pass = validation.success === true && validation.valid === true;
      results.push({
        test: 'householdTokenService.validateToken validates generated token',
        expected: 'success: true, valid: true',
        actual: `success: ${validation.success}, valid: ${validation.valid}`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

  } catch (error) {
    console.error('Error during test execution:', error);
    results.push({
      test: 'Test Execution Pipeline',
      expected: 'All tests execute without throwing',
      actual: `Error thrown: ${(error as Error).message}`,
      result: 'Fail',
    });
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }

  console.log('\n=== TEST RESULTS ===');
  console.table(results);
  return results;
}

if (require.main === module) {
  runCodeGenerationTests()
    .then((r) => {
      const allPassed = r.every((t) => t.result === 'Pass');
      process.exit(allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
