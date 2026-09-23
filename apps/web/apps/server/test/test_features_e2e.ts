import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

export async function runFeaturesE2ETests(): Promise<Array<{ test: string; expected: string; actual: string; result: 'Pass' | 'Fail' }>> {
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);

  const results: Array<{ test: string; expected: string; actual: string; result: 'Pass' | 'Fail' }> = [];

  try {
    const { default: adminStaffRoutes } = await import('../routes/adminStaffRoutes');
    const { default: distributionRoutes } = await import('../routes/distributionRoutes');
    const { default: StaffUser } = await import('../models/StaffUser');
    const { default: Distribution } = await import('../models/Distribution');
    const { default: AuditLog } = await import('../models/AuditLog');

    // Seed test staff users
    const staff1 = await StaffUser.create({
      email: 'staff1@lingayen.gov.ph',
      emailLower: 'staff1@lingayen.gov.ph',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      role: 'LGU_STAFF',
      assignedBarangays: ['Bolo'],
      isActive: true,
    });

    const staff2 = await StaffUser.create({
      email: 'staff2@lingayen.gov.ph',
      emailLower: 'staff2@lingayen.gov.ph',
      firstName: 'Maria',
      lastName: 'Santos',
      role: 'LGU_STAFF',
      assignedBarangays: ['Bolo', 'San Jose'],
      isActive: true,
    });

    const staffOutsideScope = await StaffUser.create({
      email: 'staff3@lingayen.gov.ph',
      emailLower: 'staff3@lingayen.gov.ph',
      firstName: 'Pedro',
      lastName: 'Penduko',
      role: 'LGU_STAFF',
      assignedBarangays: ['Uyong'], // No coverage in Bolo
      isActive: true,
    });

    // Setup Express App
    const app = express();
    app.use(express.json());

    process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-very-long-secret-key-that-is-at-least-32-chars-long';
    const jwt = await import('jsonwebtoken');
    const token = jwt.sign(
      {
        sub: 'superadmin-test',
        role: 'SUPERADMIN',
        userId: '507f1f77bcf86cd799439099',
        assignedBarangays: [],
      },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // Superadmin mock middleware for testing
    app.use((req, _res, next) => {
      (req as any).authUser = {
        role: 'SUPERADMIN',
        sub: 'superadmin-test',
        userId: '507f1f77bcf86cd799439099',
        assignedBarangays: [],
      };
      next();
    });

    app.use('/api/admin/users', adminStaffRoutes);
    app.use('/api/distributions', distributionRoutes);

    /* ==========================================================================
       FEATURE 1: EDIT ASSIGNED BARANGAYS (MANAGE USERS)
       ========================================================================== */

    // Test 1.1: Superadmin updates staff assigned barangays to ['Bolo', 'Bongalon', 'Dulig']
    {
      const res = await request(app)
        .patch(`/api/admin/users/${staff1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ assignedBarangays: ['Bolo', 'Bongalon', 'Dulig'] });

      const updatedUser = await StaffUser.findById(staff1._id).lean();
      const dbBarangays = updatedUser?.assignedBarangays || [];

      const pass = res.status === 200 &&
        res.body.success === true &&
        dbBarangays.length === 3 &&
        dbBarangays.includes('Bolo') &&
        dbBarangays.includes('Bongalon') &&
        dbBarangays.includes('Dulig');

      results.push({
        test: "Manage Users: Edit assigned barangays (Valid update)",
        expected: "HTTP 200, success: true, DB updated with ['Bolo', 'Bongalon', 'Dulig']",
        actual: `HTTP ${res.status}, success: ${res.body.success}, DB has [${dbBarangays.join(', ')}]`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 1.2: Audit trail records the assignedBarangays change
    {
      const audit = await AuditLog.findOne({
        action: 'STAFF_UPDATED',
        entityId: staff1._id.toString(),
      }).lean();

      const pass = Boolean(audit && (audit.metadata as any)?.changes?.assignedBarangays);

      results.push({
        test: "Manage Users: Audit logging on assigned barangays update",
        expected: "AuditLog entry with action STAFF_UPDATED containing changes.assignedBarangays",
        actual: audit ? `Found AuditLog entry action=${audit.action} with changes recorded` : 'No AuditLog entry found',
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 1.3: Reject empty assigned barangays array
    {
      const res = await request(app)
        .patch(`/api/admin/users/${staff1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ assignedBarangays: [] });

      const pass = res.status === 400 && res.body.success === false;

      results.push({
        test: "Manage Users: Reject empty assignedBarangays array",
        expected: "HTTP 400 Bad Request, rejection of empty assignedBarangays array",
        actual: `HTTP ${res.status}, success: ${res.body.success}`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 1.4: Reject invalid barangay name
    {
      const res = await request(app)
        .patch(`/api/admin/users/${staff1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ assignedBarangays: ['NonExistentBarangay'] });

      const pass = res.status === 400 && res.body.success === false;

      results.push({
        test: "Manage Users: Reject invalid barangay name not in canonical list",
        expected: "HTTP 400 Bad Request, schema validation failure",
        actual: `HTTP ${res.status}, success: ${res.body.success}`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    /* ==========================================================================
       FEATURE 2: EDIT ASSIGNED STAFF (DISTRIBUTIONS)
       ========================================================================== */

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create an upcoming distribution
    const dist1 = await Distribution.create({
      barangay: 'Bolo',
      assignedBarangays: [],
      assignedStaffIds: [staff1._id],
      scheduled: tomorrow,
      households: 5,
      status: 'Unclaimed',
    });

    // Test 2.1: Update assigned staff on active/upcoming distribution to [staff1, staff2]
    {
      const res = await request(app)
        .patch(`/api/distributions/${dist1._id}/staff`)
        .send({ assignedStaffIds: [staff1._id.toString(), staff2._id.toString()] });

      const updatedDist = await Distribution.findById(dist1._id).lean();
      const updatedIds = (updatedDist?.assignedStaffIds || []).map((id) => id.toString());

      const pass = res.status === 200 &&
        res.body.success === true &&
        updatedIds.length === 2 &&
        updatedIds.includes(staff1._id.toString()) &&
        updatedIds.includes(staff2._id.toString());

      results.push({
        test: "Distributions: Edit assigned staff (Valid re-allocation)",
        expected: "HTTP 200, success: true, distribution.assignedStaffIds updated in DB",
        actual: `HTTP ${res.status}, success: ${res.body.success}, DB has 2 staff assigned [${updatedIds.join(', ')}]`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 2.2: Verify assigned staff audit trail
    {
      const audit = await AuditLog.findOne({
        action: 'DISTRIBUTION_STAFF_UPDATED',
        entityId: dist1._id.toString(),
      }).lean();

      const pass = Boolean(audit && (audit.metadata as any)?.newStaffIds?.length === 2);

      results.push({
        test: "Distributions: Audit logging on distribution staff update",
        expected: "AuditLog entry with action DISTRIBUTION_STAFF_UPDATED and newStaffIds",
        actual: audit ? `Found AuditLog entry action=${audit.action} with previousStaffIds and newStaffIds` : 'No AuditLog entry found',
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 2.3: Reject assigning out-of-scope staff (Pedro has no coverage in Bolo)
    {
      const res = await request(app)
        .patch(`/api/distributions/${dist1._id}/staff`)
        .send({ assignedStaffIds: [staffOutsideScope._id.toString()] });

      const pass = res.status === 403 && res.body.code === 'OUT_OF_SCOPE_STAFF';

      results.push({
        test: "Distributions: Reject staff member outside distribution barangay scope",
        expected: "HTTP 403, code: OUT_OF_SCOPE_STAFF",
        actual: `HTTP ${res.status}, code: ${res.body.code}`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 2.4: Reject empty staff list
    {
      const res = await request(app)
        .patch(`/api/distributions/${dist1._id}/staff`)
        .send({ assignedStaffIds: [] });

      const pass = res.status === 400;

      results.push({
        test: "Distributions: Reject empty assignedStaffIds array",
        expected: "HTTP 400 Bad Request, minimum 1 staff required",
        actual: `HTTP ${res.status}`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 2.5: Reject modifying staff on completed (Claimed) distribution
    {
      const completedDist = await Distribution.create({
        barangay: 'Bolo',
        assignedBarangays: [],
        assignedStaffIds: [staff1._id],
        scheduled: tomorrow,
        households: 5,
        status: 'Claimed',
        claimedAt: new Date(),
      });

      const res = await request(app)
        .patch(`/api/distributions/${completedDist._id}/staff`)
        .send({ assignedStaffIds: [staff2._id.toString()] });

      const pass = res.status === 400 && res.body.code === 'DISTRIBUTION_COMPLETED';

      results.push({
        test: "Distributions: Prevent modifying staff on completed distribution (Audit guard)",
        expected: "HTTP 400, code: DISTRIBUTION_COMPLETED",
        actual: `HTTP ${res.status}, code: ${res.body.code}`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    // Test 2.6: Prevent same-day schedule conflict
    {
      await Distribution.create({
        barangay: 'San Jose',
        assignedBarangays: [],
        assignedStaffIds: [staff2._id],
        scheduled: tomorrow,
        households: 10,
        status: 'Unclaimed',
      });

      const dist3 = await Distribution.create({
        barangay: 'Bolo',
        assignedBarangays: [],
        assignedStaffIds: [staff1._id],
        scheduled: tomorrow,
        households: 5,
        status: 'Unclaimed',
      });

      const res = await request(app)
        .patch(`/api/distributions/${dist3._id}/staff`)
        .send({ assignedStaffIds: [staff1._id.toString(), staff2._id.toString()] });

      const pass = res.status === 409 && res.body.code === 'STAFF_SCHEDULE_CONFLICT';

      results.push({
        test: "Distributions: Prevent same-day schedule conflict",
        expected: "HTTP 409 Conflict, code: STAFF_SCHEDULE_CONFLICT",
        actual: `HTTP ${res.status}, code: ${res.body.code}`,
        result: pass ? 'Pass' : 'Fail',
      });
    }

    return results;

  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}

if (require.main === module) {
  runFeaturesE2ETests().then((res) => {
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.some((r) => r.result === 'Fail') ? 1 : 0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
